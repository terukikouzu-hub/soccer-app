import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const API_KEY = Deno.env.get("API_FOOTBALL_KEY")!;

// ご要望のあった全ターゲット大会のIDリスト
const TARGET_LEAGUES = [
  // 国内リーグ
  39,  // Premier League
  78,  // Bundesliga
  135, // Serie A
  40,  // Championship
  140, // La Liga
  61,  // Ligue 1
  94,  // Primeira Liga
  // 国内カップ戦
  45,  // FA Cup
  48,  // Carabao Cup
  81,  // DFB Pokal
  137, // Coppa Italia
  143, // Copa del Rey
  66,  // Coupe de France
  // ヨーロッパトーナメント
  2,   // Champions League (CL)
  3,   // Europa League (EL)
  848, // Conference League (ECL)
  // その他（国際大会）
  1,   // World Cup
  5,   // Nations League
  4,   // Euro
  9,   // Copa America
];

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- 日付の計算 (UTC基準) ---
    const now = new Date();

    // 1. 前日 (Yesterday)
    const yesterdayUTC = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 2. 当日 (Today)
    const todayUTC = now.toISOString().split('T')[0];
    
    // 3. 翌日 (Tomorrow)
    const tomorrowUTC = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 取得対象の配列
    const datesToFetch = [yesterdayUTC, todayUTC, tomorrowUTC];
    console.log(`🚀 Sync started for UTC dates: ${datesToFetch.join(", ")}`);

    let totalFixturesSynced = 0;
    let totalTeamsSynced = 0;

    const syncedLeagues = new Set<string>();

    // 3日分ループ
    for (const dateString of datesToFetch) {
      console.log(`📡 Fetching API: ${dateString}...`);

      const response = await fetch(
        `https://v3.football.api-sports.io/fixtures?date=${dateString}`,
        {
          headers: {
            "x-apisports-key": API_KEY,
            "x-apisports-host": "v3.football.api-sports.io",
          },
        }
      );

      const resJson = await response.json();
      const allFixtures = resJson.response;

      if (!allFixtures || allFixtures.length === 0) {
        console.log(`⚠️ No fixtures found for ${dateString}`);
        continue;
      }

      // 指定したリーグだけに絞り込み
      const filtered = allFixtures.filter((f: any) => 
        TARGET_LEAGUES.includes(f.league.id)
      );

      if (filtered.length > 0) {
        // --- ✨ [追加機能] チーム情報を抽出して保存 ---
        const teamsMap = new Map();
        filtered.forEach((f: any) => {
          // ホームチーム
          teamsMap.set(f.teams.home.id, {
            id: f.teams.home.id,
            name: f.teams.home.name,
            logo: f.teams.home.logo,
          });
          // アウェイチーム
          teamsMap.set(f.teams.away.id, {
            id: f.teams.away.id,
            name: f.teams.away.name,
            logo: f.teams.away.logo,
          });
          syncedLeagues.add(f.league.name);
        });
        const teamsToUpsert = Array.from(teamsMap.values());
        const { error: teamError } = await supabase.from("teams").upsert(teamsToUpsert);
        if (teamError) console.error("⚠️ Team sync error:", teamError.message);
        totalTeamsSynced += teamsToUpsert.length;
        // データの整形
        const upsertData = filtered.map((f: any) => ({
          id: f.fixture.id,
          league_id: f.league.id,
          season: f.league.season,
          event_date: f.fixture.date,
          timezone: f.fixture.timezone,
          venue_id: f.fixture.venue.id,
          venue_name: f.fixture.venue.name,
          venue_city: f.fixture.venue.city,
          referee: f.fixture.referee,
          status_long: f.fixture.status.long,
          status_short: f.fixture.status.short,
          elapsed: f.fixture.status.elapsed,
          home_team_id: f.teams.home.id,
          away_team_id: f.teams.away.id,
          goals_home: f.goals.home,
          goals_away: f.goals.away,
          score_halftime_home: f.score.halftime.home,
          score_halftime_away: f.score.halftime.away,
          score_fulltime_home: f.score.fulltime.home,
          score_fulltime_away: f.score.fulltime.away,
          score_extratime_home: f.score.extratime.home,
          score_extratime_away: f.score.extratime.away,
          score_penalty_home: f.score.penalty.home,
          score_penalty_away: f.score.penalty.away,
        }));

        // Supabaseへ保存（upsert）
        const { error } = await supabase.from("fixtures").upsert(upsertData);
        if (error) throw error;

        totalFixturesSynced += upsertData.length;
        filtered.forEach((f: any) => syncedLeagues.add(f.league.name));
        console.log(`✅ ${dateString}: Synced ${upsertData.length} matches.`);
      }
    }

    return new Response(JSON.stringify({ 
      status: "Daily sync complete",
      synced_fixtures: totalFixturesSynced,
      synced_teams: totalTeamsSynced,
      leagues: Array.from(syncedLeagues),
      period: datesToFetch
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("❌ Critical Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});