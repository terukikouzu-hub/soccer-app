import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const API_KEY = Deno.env.get("API_FOOTBALL_KEY")!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // リクエストから fixtureId を取得（Cron実行時は空になる）
    const body = await req.json().catch(() => ({}));
    let targetFixtureIds: number[] = body.fixtureId ? [body.fixtureId] : [];

    // --- 自動スキャンロジック (fixtureId が指定されていない場合) ---
    if (targetFixtureIds.length === 0) {
      const now = new Date();
      // 開始30分前 〜 開始後30分 の範囲を設定
      const lowerBound = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
      const upperBound = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

      console.log(`🔍 Scanning matches between ${lowerBound} and ${upperBound}`);

      // 1. 範囲内の試合IDを取得
      const { data: fixtures, error: fError } = await supabase
        .from("fixtures")
        .select("id")
        .gte("event_date", lowerBound)
        .lte("event_date", upperBound);

      if (fError) throw fError;
      if (!fixtures || fixtures.length === 0) {
        return new Response(JSON.stringify({ message: "No upcoming matches found in DB." }), { status: 200 });
      }

      const foundIds = fixtures.map((f) => f.id);

      // 2. 既に fixture_lineups に存在するIDを除外
      const { data: existingLineups, error: lError } = await supabase
        .from("fixture_lineups")
        .select("fixture_id")
        .in("fixture_id", foundIds);

      if (lError) throw lError;

      const syncedIds = existingLineups?.map((l) => l.fixture_id) || [];
      targetFixtureIds = foundIds.filter((id) => !syncedIds.includes(id));

      if (targetFixtureIds.length === 0) {
        return new Response(JSON.stringify({ message: "All upcoming matches are already synced." }), { status: 200 });
      }
    }

    console.log(`🚀 Starting sync for Fixture IDs: ${targetFixtureIds.join(", ")}`);

    const results = [];

    // --- 各試合のラインナップを取得・保存 ---
    for (const id of targetFixtureIds) {
      console.log(`📡 Fetching API for Fixture ID: ${id}`);
      
      const response = await fetch(
        `https://v3.football.api-sports.io/fixtures/lineups?fixture=${id}`,
        {
          headers: {
            "x-apisports-key": API_KEY,
            "x-apisports-host": "v3.football.api-sports.io",
          },
        }
      );

      const resJson = await response.json();
      const lineups = resJson.response;

      if (!lineups || lineups.length === 0) {
        console.log(`⚠️ Lineups not yet available for ID: ${id}`);
        continue;
      }

      const upsertData = lineups.map((l: any) => ({
        fixture_id: id,
        team_id: l.team.id,
        formation: l.formation,
        start_xi: l.startXI,
        substitutes: l.substitutes,
        coach: l.coach
      }));

      const { error: upsertError } = await supabase
        .from("fixture_lineups")
        .upsert(upsertData, { onConflict: "fixture_id, team_id" });

      if (upsertError) {
        console.error(`❌ Error upserting ID ${id}:`, upsertError.message);
      } else {
        results.push(id);
      }
    }

    return new Response(JSON.stringify({
      message: "Sync process completed",
      synced_ids: results,
      total_attempted: targetFixtureIds.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("❌ Critical Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});