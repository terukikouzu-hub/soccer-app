// Supabase Edge Function: sync-live-manager
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  console.log(`🚀 [Manager] Starting scan: ${new Date().toISOString()}`);

  try {
    // ライブ中または開始時間を過ぎた未終了の試合を抽出
    // ステータス: 1H, HT, 2H, ET, BT, P, SUSP, INT, NS(開始予定) など
    const { data: liveFixtures, error: fetchError } = await supabase
      .from("fixtures")
      .select("id, status_short")
      // 終了や中止を除外するのではなく、アクティブなステータスのみを指定
      .in("status_short", ["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"])
      .lte("event_date", new Date().toISOString());

    if (fetchError) throw fetchError;

    // --- 試合後統計取得が必要な試合を抽出 ---
    const { data: finishedFixtures, error: statsFetchError } = await supabase
      .from("fixtures")
      .select("id, is_team_stats_synced, is_player_stats_synced")
      .in("status_short", ["FT", "AET", "PEN"])
      .or("is_team_stats_synced.eq.false,is_player_stats_synced.eq.false")
      .limit(5); // バックログ消化のため、一度に最大5件ずつ処理

      if (statsFetchError) throw statsFetchError;
    const statsNeededIds = finishedFixtures?.map(f => f.id) || [];

    // タスクがない場合のみ早期終了
    if ((!liveFixtures || liveFixtures.length === 0) && statsNeededIds.length === 0) {
      console.log("ℹ️ [Manager] No tasks (Live/Stats) found in database.");
      return new Response(JSON.stringify({ message: "No matches to process" }), { status: 200 });
    }

    // 2. ステータス別の内訳を集計してログ出力 (既存処理)
    if (liveFixtures && liveFixtures.length > 0) {
      const statusSummary = liveFixtures.reduce((acc: Record<string, number>, curr) => {
        const status = curr.status_short || "UNKNOWN";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const summaryLog = Object.entries(statusSummary)
        .map(([status, count]) => `${status}: ${count}`)
        .join(", ");

      console.log(`📊 [Manager] Found ${liveFixtures.length} matches. Breakdown: ${summaryLog}`);

      // 3. 20件ずつの塊にして Worker(sync-fixture-liveupdate) 関数を呼び出す (既存処理)
      const allIds = liveFixtures.map(f => f.id);
      const workerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/sync-fixture-liveupdate`;
      let triggeredBatches = 0;

      for (let i = 0; i < allIds.length; i += 20) {
        const batch = allIds.slice(i, i + 20);
        triggeredBatches++;
        
        console.log(`📡 [Manager] Triggering Worker for Batch ${triggeredBatches} (${batch.length} IDs)...`);

        const workerRes = await fetch(workerUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ fixtureIds: batch }),
        });

        if (!workerRes.ok) {
          const errorText = await workerRes.text();
          console.error(`⚠️ [Manager] Worker Batch ${triggeredBatches} failed: ${workerRes.status} - ${errorText}`);
        } else {
          console.log(`✅ [Manager] Worker Batch ${triggeredBatches} successfully triggered.`);
        }
      }
    } else {
      // ライブ試合がない場合は元のログを出力
      console.log("ℹ️ [Manager] No live matches found in database.");
    }

    // --- 試合後統計 (sync-fixture-data) の呼び出し ---
    let statsSuccessCount = 0;
    // finishedFixtures が存在し、中身があるか確認
    const targets = finishedFixtures || [];

    if (targets.length > 0) {
      console.log(`🏁 [Manager] Found ${targets.length} finished matches needing stats sync: ${targets.map(f => f.id).join(", ")}`);

      for (const fixture of targets) {
        console.log(`📡 [Manager] Triggering Stats Worker for Fixture ID: ${fixture.id}...`);
        const statsWorkerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/sync-fixture-data`;
        
        const statsRes = await fetch(statsWorkerUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          // 🟢 修正点: fixtureオブジェクトからIDと各フラグを正しく渡す
          body: JSON.stringify({
            fixture_id: fixture.id,
            is_team_stats_synced: fixture.is_team_stats_synced,
            is_player_stats_synced: fixture.is_player_stats_synced
          }),
        });

        if (statsRes.ok) {
          console.log(`✅ [Manager] Stats Worker successfully triggered for ID: ${fixture.id}`);
          statsSuccessCount++;
        } else {
          console.error(`⚠️ [Manager] Stats Worker failed for ID: ${fixture.id}: ${statsRes.status}`);
        }
      }
      console.log(`📊 [Manager] Post-match stats summary: ${statsSuccessCount}/${targets.length} workers triggered.`);
    }

    return new Response(
      JSON.stringify({
        status: "success",
        live_count: liveFixtures?.length || 0,
        stats_sync: {
          attempted: statsNeededIds.length,
          completed: statsSuccessCount
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("❌ [Manager] Critical Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});