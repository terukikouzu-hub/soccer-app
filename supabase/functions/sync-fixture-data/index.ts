import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const API_KEY = Deno.env.get("API_FOOTBALL_KEY")!;

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let fixture_id: number;
  try {
    const body = await req.json();
    fixture_id = body.fixture_id;
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  console.log(`🚀 [START] Syncing Fixture: ${fixture_id}`);

  try {
    // --- 1. チーム統計取得 ---
    console.log(`📡 [API] Fetching Team Statistics...`);
    const statsRes = await fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixture_id}`, {
      headers: { "x-apisports-key": API_KEY }
    });

    if (!statsRes.ok) throw new Error(`Team Stats API failed: ${statsRes.status}`);
    const statsData = await statsRes.json();
    
    const teamStats = statsData.response.map((item: any) => {
      const s = (type: string) => item.statistics.find((x: any) => x.type === type)?.value ?? 0;
      const parsePct = (val: any) => parseInt(String(val).replace("%", "")) || 0;

      return {
        fixture_id,
        team_id: item.team.id,
        possession_pct: parsePct(s("Ball Possession")),
        shots_total: s("Total Shots"),
        shots_on_goal: s("Shots on Goal"),
        expected_goals: parseFloat(s("expected_goals")) || 0,
        passes_total: s("Total passes"),
        passes_accuracy_pct: parsePct(s("Passes %")),
        fouls: s("Fouls"),
        corners: s("Corner Kicks"),
        offsides: s("Offsides")
      };
    });

    // --- 2. 選手統計取得 & 重複排除 ---
    console.log(`📡 [API] Fetching Player Statistics...`);
    const playersRes = await fetch(`https://v3.football.api-sports.io/fixtures/players?fixture=${fixture_id}`, {
      headers: { "x-apisports-key": API_KEY }
    });

    if (!playersRes.ok) throw new Error(`Player Stats API failed: ${playersRes.status}`);
    const playersData = await playersRes.json();

    const playerMatchStats: any[] = [];
    const playerMetadataMap = new Map(); // 重複排除用のMap

    playersData.response?.forEach((teamEntry: any) => {
      const teamId = teamEntry.team.id;
      teamEntry.players.forEach((p: any) => {
        const s = p.statistics[0];
        if (!s) return;

        // 子テーブル用データ (スタッツ)
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

        // 親テーブル用データ (選手基本情報 - Mapで重複排除)
        playerMetadataMap.set(p.player.id, {
          id: p.player.id,
          name: p.player.name,
          photo: p.player.photo,
          updated_at: new Date().toISOString()
        });
      });
    });

    const playerMetadata = Array.from(playerMetadataMap.values());
    console.log(`✅ [DATA] TeamStats: ${teamStats.length}, Players: ${playerMetadata.length}`);

    // --- 3. DB保存 (親を先に保存して外部キーエラーを防ぐ) ---
    console.log(`💾 [DB] Upserting to Supabase...`);

    // ① チーム統計 (独立)
    const { error: tsError } = await supabase.from("fixture_statistics").upsert(teamStats);
    if (tsError) throw new Error(`DB Error (Team Stats): ${tsError.message}`);
    console.log("   - Team statistics saved.");

    // ② 選手基本情報 (これが「親」！ 3の前に完了させる)
    const { error: pmError } = await supabase.from("player_details").upsert(playerMetadata);
    if (pmError) throw new Error(`DB Error (Player Details): ${pmError.message}`);
    console.log("   - Player details saved.");

    // ③ 選手試合統計 (これが「子」)
    const { error: psError } = await supabase.from("fixture_players").upsert(playerMatchStats);
    if (psError) throw new Error(`DB Error (Player Stats): ${psError.message}`);
    console.log("   - Player match stats saved.");

    return new Response(JSON.stringify({ 
      status: "success", 
      fixture_id,
      synced_players: playerMatchStats.length 
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error(`❌ [CRITICAL] ${err.message}`);
    return new Response(JSON.stringify({ 
      status: "error", 
      message: err.message 
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});