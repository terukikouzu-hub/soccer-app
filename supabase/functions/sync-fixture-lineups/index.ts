// Supabase Edge Function: sync-fixture-lineups
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const API_KEY = Deno.env.get("API_FOOTBALL_KEY")!;

Deno.serve(async (req) => {
  const timestamp = new Date().toISOString();
  console.log(`--- [Worker] Lineup Sync Started: ${timestamp} ---`);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. リクエストボディの解析
    let body: any = {};
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch (e) {
      console.log("📝 [Worker] Request body is empty or invalid JSON.");
    }

    // 2. 処理対象 ID の確定（Manager からの指示を優先）
    const targetFixtureIds: number[] = Array.isArray(body.fixtureIds) 
      ? body.fixtureIds 
      : body.fixtureId ? [body.fixtureId] : [];

    if (targetFixtureIds.length === 0) {
      console.log("ℹ️ [Worker] No Fixture IDs provided. Ending process.");
      return new Response(JSON.stringify({ synced_ids: [], message: "No IDs provided" }), { status: 200 });
    }

    console.log(`🚀 [Worker] Processing ${targetFixtureIds.length} matches: ${targetFixtureIds.join(", ")}`);

    const results: number[] = [];

    for (const id of targetFixtureIds) {
      console.log(`📡 [Worker] [ID:${id}] Fetching API...`);
      
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
      const lineups = resJson.response; // lineups[0]がホーム、lineups[1]がアウェイ

      if (!lineups || lineups.length === 0) {
        console.log(`⚠️ [Worker] [ID:${id}] Lineups not yet available from API.`);
        continue;
      }

      for (const teamData of lineups) {
        const teamId = teamData.team.id;

        // A. チーム単位の情報を保存 (fixture_lineup_teams)
        const { error: teamError } = await supabase
          .from("fixture_lineup_teams")
          .upsert({
            fixture_id: id,
            team_id: teamId,
            formation: teamData.formation,
            coach: teamData.coach?.name || null
          }, { onConflict: "fixture_id, team_id" });

        if (teamError) {
          console.error(`❌ [Worker] [ID:${id}] Team Upsert Error:`, teamError.message);
          continue;
        }

        // B. 選手リストの整形（Start XI と Substitutes を統合）
        const allPlayers = [
          ...teamData.startXI.map((p: any) => ({ ...p, is_start: true })),
          ...teamData.substitutes.map((p: any) => ({ ...p, is_start: false }))
        ];

        // C. 未知の選手を player_details に登録
        const playerIds = allPlayers.map(p => p.player.id);
        const { data: existingPlayers } = await supabase
          .from("player_details")
          .select("id")
          .in("id", playerIds);
        
        const existingIds = existingPlayers?.map(p => p.id) || [];
        const newPlayers = allPlayers
          .filter(p => !existingIds.includes(p.player.id))
          .map(p => ({
            id: p.player.id,
            name: p.player.name,
            // 必要に応じて photo などのカラムも追加可能
          }));

        if (newPlayers.length > 0) {
          const { error: pDetailError } = await supabase
            .from("player_details")
            .upsert(newPlayers, { onConflict: "id" });
          
          if (!pDetailError) {
            console.log(`👤 [Worker] [ID:${id}] Registered ${newPlayers.length} new players to player_details.`);
          }
        }

        // D. 選手情報を保存 (fixture_lineup_players)
        const playersUpsertData = allPlayers.map((p: any) => ({
          fixture_id: id,
          team_id: teamId,
          player_id: p.player.id,
          number: p.player.number,
          pos: p.player.pos,
          grid: p.player.grid,
          is_start: p.is_start
        }));

        const { error: playersError } = await supabase
          .from("fixture_lineup_players")
          .upsert(playersUpsertData, { onConflict: "fixture_id, player_id" });

        if (playersError) {
          console.error(`❌ [Worker] [ID:${id}] Players Upsert Error:`, playersError.message);
        }
      }

      console.log(`✅ [Worker] [ID:${id}] Sync complete (Teams & Players).`);
      results.push(id);
    }

    return new Response(JSON.stringify({ synced_ids: results }), { status: 200 });

  } catch (err: any) {
    console.error("❌ [Worker] Critical Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});