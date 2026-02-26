// Supabase Edge Function: sync-fixture-data
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const API_KEY = Deno.env.get("API_FOOTBALL_KEY")!;

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: { 
    fixture_id: number; 
    is_team_stats_synced: boolean; 
    is_player_stats_synced: boolean; 
  };

  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const { fixture_id, is_team_stats_synced, is_player_stats_synced } = body;
  console.log(`🚀 [START] Syncing Fixture: ${fixture_id} (Team: ${is_team_stats_synced}, Player: ${is_player_stats_synced})`);

  // 最終的にDBのfixturesテーブルを更新するためのオブジェクト
  const updateFlags: Record<string, boolean> = {};

  try {
    // --- 1. チーム統計取得 (未同期の場合のみ) ---
    if (!is_team_stats_synced) {
      console.log(`📡 [API] Fetching Team Statistics...`);
      const statsRes = await fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixture_id}`, {
        headers: { "x-apisports-key": API_KEY }
      });

      if (!statsRes.ok) throw new Error(`Team Stats API failed: ${statsRes.status}`);
      const statsData = await statsRes.json();

      // レスポンスが空でないか確認
      if (statsData.response && statsData.response.length > 0) {
        const teamStats = statsData.response.map((item: any) => {
          const s = (type: string) => item.statistics.find((x: any) => x.type === type)?.value ?? 0;
          const parsePct = (val: any) => parseInt(String(val).replace("%", "")) || 0;

          return {
            fixture_id,
            team_id: item.team.id,
            possession_pct: parsePct(s("Ball Possession")),
            shots_total: s("Total Shots"),
            shots_on_goal: s("Shots on Goal"),
            expected_goals: parseFloat(s("Expected Goals")) || 0,
            passes_total: s("Total passes"),
            passes_accuracy_pct: parsePct(s("Passes %")),
            fouls: s("Fouls"),
            corners: s("Corner Kicks"),
            offsides: s("Offsides")
          };
        });

        const { error: tsError } = await supabase.from("fixture_statistics").upsert(teamStats);
        if (tsError) throw new Error(`DB Error (Team Stats): ${tsError.message}`);
        
        console.log("✅ Team statistics saved.");
        updateFlags.is_team_stats_synced = true; // データがあったのでフラグを立てる
      } else {
        console.log("ℹ️ Team statistics response was empty. Keeping flag false.");
      }
    }

    // --- 2. 選手統計取得 (未同期の場合のみ) ---
    if (!is_player_stats_synced) {
      console.log(`📡 [API] Fetching Player Statistics...`);
      const playersRes = await fetch(`https://v3.football.api-sports.io/fixtures/players?fixture=${fixture_id}`, {
        headers: { "x-apisports-key": API_KEY }
      });

      if (!playersRes.ok) throw new Error(`Player Stats API failed: ${playersRes.status}`);
      const playersData = await playersRes.json();

      if (playersData.response && playersData.response.length > 0) {
        const playerMatchStats: any[] = [];
        const playerMetadataMap = new Map();

        playersData.response.forEach((teamEntry: any) => {
          const teamId = teamEntry.team.id;
          teamEntry.players.forEach((p: any) => {
            const s = p.statistics[0];
            if (!s) return;

            playerMatchStats.push({
              fixture_id,
              player_id: p.player.id,
              team_id: teamId,
              player_name: p.player.name,
              minutes: s.games.minutes || 0,
              number: s.games.number,
              position: s.games.position,
              rating: s.games.rating,
              captain: s.games.captain || false,
              substitute: s.games.substitute || false,
              goals: s.goals.total || 0,
              assists: s.goals.assists || 0,
              shots_total: s.shots.total || 0,
              passes_total: s.passes.total || 0,
              passes_accuracy_pct: parseInt(s.passes.accuracy) || 0,
              tackles_total: s.tackles.total || 0,
              interceptions: s.tackles.interceptions || 0,
              duels_won: s.duels.won || 0,
              dribbles_success: s.dribbles.success || 0,
              raw_stats: s
            });

            playerMetadataMap.set(p.player.id, {
              id: p.player.id,
              name: p.player.name,
              photo: p.player.photo,
              updated_at: new Date().toISOString()
            });
          });
        });

        const playerMetadata = Array.from(playerMetadataMap.values());

        // 親(選手詳細)を先に保存
        const { error: pmError } = await supabase.from("player_details").upsert(playerMetadata);
        if (pmError) throw new Error(`DB Error (Player Details): ${pmError.message}`);

        // 子(試合統計)を保存
        const { error: psError } = await supabase.from("fixture_players").upsert(playerMatchStats);
        if (psError) throw new Error(`DB Error (Player Stats): ${psError.message}`);

        console.log(`✅ Player match stats saved (${playerMatchStats.length} players).`);
        updateFlags.is_player_stats_synced = true; // データがあったのでフラグを立てる
      } else {
        console.log("ℹ️ Player statistics response was empty. Keeping flag false.");
      }
    }

    // --- 3. フラグ更新 ---
    if (Object.keys(updateFlags).length > 0) {
      const { error: updateError } = await supabase
        .from("fixtures")
        .update(updateFlags)
        .eq("id", fixture_id);
      
      if (updateError) console.error(`⚠️ Failed to update fixture flags: ${updateError.message}`);
      else console.log(`💾 Fixture flags updated: ${JSON.stringify(updateFlags)}`);
    }

    return new Response(JSON.stringify({ 
      status: "success", 
      fixture_id,
      updated_fields: Object.keys(updateFlags)
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error(`❌ [CRITICAL] ${err.message}`);
    return new Response(JSON.stringify({ 
      status: "error", 
      message: err.message 
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});