import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const API_KEY = Deno.env.get("API_FOOTBALL_KEY")!;

Deno.serve(async (req) => {
  // ★ 改善1: 関数の入り口で真っ先にログを出す（これで「届いているか」がわかる）
  console.log(`--- Function triggered: ${new Date().toISOString()} ---`);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ★ 改善2: req.json() のエラーで関数が落ちるのを防ぐ
    // net.http_post は空の body を送ることがあり、その場合 req.json() はクラッシュします
    let body: any = {};
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch (e) {
      console.log("📝 No valid JSON body found, proceeding with empty object.");
    }

    let targetFixtureIds: number[] = body.fixtureId ? [body.fixtureId] : [];

    if (targetFixtureIds.length === 0) {
      const now = new Date();
      const lowerBound = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
      const upperBound = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

      console.log(`🔍 Scanning DB for matches between: ${lowerBound} and ${upperBound}`);

      const { data: fixtures, error: fError } = await supabase
        .from("fixtures")
        .select("id")
        .gte("event_date", lowerBound)
        .lte("event_date", upperBound);

      if (fError) throw fError;

      // 試合がない場合はここで終了（理由をログに残す）
      if (!fixtures || fixtures.length === 0) {
        console.log("ℹ️ No matches found in the time range. Ending process.");
        return new Response(JSON.stringify({ message: "No upcoming matches found in DB." }), { status: 200 });
      }

      const foundIds = fixtures.map((f) => f.id);
      console.log(`📡 Matches found in range: ${foundIds.join(", ")}`);

      const { data: existingLineups, error: lError } = await supabase
        .from("fixture_lineups")
        .select("fixture_id")
        .in("fixture_id", foundIds);

      if (lError) throw lError;

      const syncedIds = existingLineups?.map((l) => l.fixture_id) || [];
      targetFixtureIds = foundIds.filter((id) => !syncedIds.includes(id));

      if (targetFixtureIds.length === 0) {
        console.log("✅ All matches are already synced. Nothing to do.");
        return new Response(JSON.stringify({ message: "All upcoming matches are already synced." }), { status: 200 });
      }
    }

    console.log(`🚀 Syncing ${targetFixtureIds.length} matches: ${targetFixtureIds.join(", ")}`);

    const results = [];
    for (const id of targetFixtureIds) {
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
        console.log(`⚠️ Lineups not yet available from API for ID: ${id}`);
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
        console.error(`❌ DB Upsert Error for ID ${id}:`, upsertError.message);
      } else {
        console.log(`✅ Successfully saved lineups for ID: ${id}`);
        results.push(id);
      }
    }

    return new Response(JSON.stringify({ synced_ids: results }), { status: 200 });

  } catch (err: any) {
    // ここでエラーが出た場合も確実にログに残す
    console.error("❌ Critical Error in Edge Function:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});