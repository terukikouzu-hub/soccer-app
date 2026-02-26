import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  console.log(`🚀 [Manager] Starting live fixture scan...`);

  try {
    // 1. ライブ中または開始時間を過ぎた未終了の試合を抽出
    // ステータス: 1H, HT, 2H, ET, BT, P, SUSP, INT, NS(開始予定) など
    // 終了系(FT, AET, PEN)や中止(PST, CANC)を除外
    const { data: liveFixtures, error: fetchError } = await supabase
      .from("fixtures")
      .select("id, status_short")
      .not("status_short", "in", '("FT","AET","PEN","PST","CANC")')
      .lte("event_date", new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!liveFixtures || liveFixtures.length === 0) {
      console.log("ℹ️ [Manager] No live matches found in database.");
      return new Response(JSON.stringify({ message: "No live matches" }), { status: 200 });
    }

    // 2. ステータス別の内訳を集計してログ出力
    const statusSummary = liveFixtures.reduce((acc: Record<string, number>, curr) => {
      const status = curr.status_short || "UNKNOWN";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const summaryLog = Object.entries(statusSummary)
      .map(([status, count]) => `${status}: ${count}`)
      .join(", ");

    console.log(`📊 [Manager] Found ${liveFixtures.length} matches. Breakdown: ${summaryLog}`);

    // 3. 20件ずつの塊（バッチ）にして Worker 関数を呼び出す
    const allIds = liveFixtures.map(f => f.id);
    const workerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/sync-fixture-every5min`;
    let triggeredBatches = 0;

    for (let i = 0; i < allIds.length; i += 20) {
      const batch = allIds.slice(i, i + 20);
      triggeredBatches++;
      
      console.log(`📡 [Manager] Triggering Worker for Batch ${triggeredBatches} (${batch.length} IDs)...`);

      // Worker (fixture-every5min) を HTTP POST で呼び出し
      // 待機(await)することで、順番に確実にリクエストを送ります
      const workerRes = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, // 内部呼び出しのため Service Role を使用
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

    return new Response(
      JSON.stringify({
        status: "success",
        total_fixtures: allIds.length,
        batches: triggeredBatches,
        summary: statusSummary,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("❌ [Manager] Critical Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});