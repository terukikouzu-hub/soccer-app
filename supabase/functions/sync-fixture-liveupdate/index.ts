//supabase/functions/sync-fixture-liveupdate/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const API_KEY = Deno.env.get("API_FOOTBALL_KEY")!;

Deno.serve(async (req) => {
  console.log(`🚀 [START] fixture-every5min: Function triggered`);
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. live-manager からの fixtureIds (配列) または従来の fixtureId (単体) を取得
    const body = await req.json();
    const targetIds: number[] = body.fixtureIds || (body.fixtureId ? [body.fixtureId] : []);

    if (targetIds.length === 0) {
      return new Response("fixtureId or fixtureIds is required", { status: 400 });
    }

    console.log(`📡 [fixture-every5min] Processing ${targetIds.length} fixtures: ${targetIds.join(", ")}`);

    // 2. API-Football から一括取得（?ids=ID-ID-ID 形式を使用）
    const idsParam = targetIds.join("-");
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?ids=${idsParam}`,
      {
        headers: {
          "x-apisports-key": API_KEY,
          "x-apisports-host": "v3.football.api-sports.io",
        },
      },
    );

    const resJson = await response.json();
    const batchData = resJson.response;

    if (!batchData || batchData.length === 0) {
      // 404 ではなく 200 (OK) を返し、Managerを安心させる
      console.warn(`ℹ️ [fixture-every5min] No live data from API for IDs: ${idsParam}`);
      return new Response(JSON.stringify({ 
        message: "No updates found for these IDs",
        synced_count: 0 
      }), { 
        status: 200, // ここを200にする
        headers: { "Content-Type": "application/json" } 
      });
    }

    // 保存用データのコンテナ
    const fixtureUpdates: any[] = [];
    let allEventsToUpsert: any[] = [];

    // 3. 取得した各試合データをループ処理
    batchData.forEach((data: any) => {
      // --- A. fixtures テーブルの更新用データ作成 (元の構成を維持) ---
      fixtureUpdates.push({
        id: data.fixture.id,
        elapsed: data.fixture.status.elapsed,
        status_short: data.fixture.status.short,
        status_long: data.fixture.status.long,
        goals_home: data.goals.home,
        goals_away: data.goals.away,
      });

      // --- B. fixture_events テーブルの更新用データ作成 (元の構成を維持) ---
      if (data.events && data.events.length > 0) {
        const events = data.events.map((e: any) => ({
          fixture_id: data.fixture.id,
          team_id: e.team.id,
          player_id: e.player?.id || null,
          player_name: e.player?.name || null,
          assist_id: e.assist?.id || null,
          assist_name: e.assist?.name || null,
          elapsed: e.time.elapsed,
          elapsed_extra: e.time.extra,
          type: e.type,
          detail: e.detail,
          comments: e.comments || null,
        }));
        allEventsToUpsert = [...allEventsToUpsert, ...events];
      }
    });

    // 4. まとめて DB へ Upsert
    const { error: fError } = await supabase
      .from("fixtures")
      .upsert(fixtureUpdates, { onConflict: "id" });

    if (fError) throw fError;

    if (allEventsToUpsert.length > 0) {
      const { error: eError } = await supabase
        .from("fixture_events")
        .upsert(allEventsToUpsert);

      if (eError) {
        console.error("❌ Events Table Error:", eError);
        return new Response(JSON.stringify({ 
          error: "Events table sync failed", 
          details: eError.message,
          hint: eError.hint
        }), { status: 500 });
      }
    }

    // 詳細ログの出力
    const summary = fixtureUpdates.map(f => `ID:${f.id}(${f.status_short})`).join(", ");
    console.log(`✅ [fixture-every5min] Successfully synced: ${summary}`);

    return new Response(
      JSON.stringify({
        message: `Successfully synced ${fixtureUpdates.length} fixtures`,
        synced_ids: targetIds,
        events_count: allEventsToUpsert.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("❌ Function Crash:", err.message);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), { status: 500 });
  }
});