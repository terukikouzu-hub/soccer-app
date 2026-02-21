import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const API_KEY = Deno.env.get("API_FOOTBALL_KEY")!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { teamId } = await req.json();
    if (!teamId) return new Response("teamId is required", { status: 400 });

    console.log(`📡 Fetching squad for Team: ${teamId}`);

    // API-Footballから名簿を取得
    const response = await fetch(
      `https://v3.football.api-sports.io/players/squads?team=${teamId}`,
      {
        headers: {
          "x-apisports-key": API_KEY,
          "x-apisports-host": "v3.football.api-sports.io",
        },
      }
    );

    const resJson = await response.json();
    const players = resJson.response?.[0]?.players;

    if (!players || players.length === 0) {
      return new Response("No players found", { status: 404 });
    }

    // A. player_details 用 (個人の基本情報)
    const playersToUpsert = players.map((p: any) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      photo: p.photo
    }));

    // B. team_squads 用 (チームごとの背番号・ポジション)
    const squadsToUpsert = players.map((p: any) => ({
      team_id: teamId,
      player_id: p.id,
      number: p.number,
      position: p.position
    }));

    // DB保存 (upsert)
    const { error: err1 } = await supabase.from("player_details").upsert(playersToUpsert);
    if (err1) throw err1;

    const { error: err2 } = await supabase.from("team_squads").upsert(squadsToUpsert);
    if (err2) throw err2;

    return new Response(JSON.stringify({
      message: `Successfully synced ${players.length} players for team ${teamId}`
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});