import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const API_KEY = Deno.env.get("API_FOOTBALL_KEY")!;

Deno.serve(async (req) => {
  console.log(`🚀 [START] fixtures-every5min: Function triggered`);
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { fixtureId } = await req.json();
    if (!fixtureId) {
      return new Response("fixtureId is required", { status: 400 });
    }

    console.log(`📡 [fixtures-every5min] Checking details for Fixture ID: ${fixtureId}`);
    
    // 1. APIから特定の試合詳細（スコア + イベント入り）を取得
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
      {
        headers: {
          "x-apisports-key": API_KEY,
          "x-apisports-host": "v3.football.api-sports.io",
        },
      },
    );

    const resJson = await response.json();
    const data = resJson.response?.[0];

    if (!data) {
      return new Response(JSON.stringify({ error: "Fixture not found" }), {
        status: 404,
      });
    }

    // --- A. fixtures テーブルのスコアとステータスを更新 ---
    const fixtureUpdate = {
      id: data.fixture.id,
      status_short: data.fixture.status.short,
      status_long: data.fixture.status.long,
      goals_home: data.goals.home,
      goals_away: data.goals.away,
      // 経過時間などのカラムがあればここに追加
    };

    const { error: fError } = await supabase
      .from("fixtures")
      .upsert(fixtureUpdate, { onConflict: "id" });

    if (fError) throw fError;

    // --- B. fixtures_events テーブルの更新 ---
    if (data.events && data.events.length > 0) {
      const eventsToUpsert = data.events.map((e: any) => ({
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

      const { error: eError } = await supabase
        .from("fixture_events")
        .upsert(eventsToUpsert);

      if (eError) {
        console.error("❌ Events Table Error:", eError);
        // ここで詳細なエラーを返すようにします
        return new Response(JSON.stringify({ 
          error: "Events table sync failed", 
          details: eError.message,
          hint: eError.hint
        }), { status: 500 });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Successfully synced fixture ${fixtureId}`,
        score: `${data.goals.home} - ${data.goals.away}`,
        events_count: data.events?.length || 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("❌ Function Crash:", err.message);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), { status: 500 });
  }
});