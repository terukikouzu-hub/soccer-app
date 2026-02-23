import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const FD_API_KEY = Deno.env.get("VITE_FOOTBALL_DATA_ORG_KEY")!;

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let params;
  try {
    params = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), { status: 400 });
  }

  const { af_league_id, fd_league_code, season } = params;
  console.log(`[DEBUG] Start sync: AF_ID=${af_league_id}, FD_CODE=${fd_league_code}, Season=${season}`);

  try {
    // 1. マッピングデータの取得チェック
    const { data: mappings, error: mapError } = await supabase
      .from("team_mappings")
      .select("af_team_id, fd_team_id")
      .eq("league_id", af_league_id);

    if (mapError) throw new Error(`DB Mapping Fetch Error: ${mapError.message}`);
    console.log(`[DEBUG] Loaded ${mappings?.length || 0} mappings from team_mappings table.`);

    if (!mappings || mappings.length === 0) {
      throw new Error(`No mappings found for league_id ${af_league_id}. Please run auto-map-teams first.`);
    }

    const idMap = new Map(mappings.map(m => [m.fd_team_id, m.af_team_id]));

    // 2. Football-Data API 呼び出し
    const url = `https://api.football-data.org/v4/competitions/${fd_league_code}/standings?season=${season}`;
    console.log(`[DEBUG] Calling API: ${url}`);

    const fdRes = await fetch(url, {
      headers: { "X-Auth-Token": FD_API_KEY }
    });

    console.log(`[DEBUG] API Response Status: ${fdRes.status}`);

    if (fdRes.status === 403) throw new Error("API 403 Forbidden: 2025シーズンのデータへのアクセス権がないか、プラン制限です。");
    if (!fdRes.ok) {
      const errorText = await fdRes.text();
      throw new Error(`Football-Data API Error (${fdRes.status}): ${errorText}`);
    }

    const fdData = await fdRes.json();
    const fdTable = fdData.standings?.[0]?.table;

    if (!fdTable) {
      console.log("[DEBUG] Full API Response:", JSON.stringify(fdData));
      throw new Error("APIレスポンス内に順位表(standings[0].table)が見つかりません。");
    }

    // 3. データ整形
    const standingsToUpdate = fdTable.map((row: any) => {
      const afTeamId = idMap.get(row.team.id);
      if (!afTeamId) {
        console.log(`[WARN] Skipping team: ${row.team.name} (FD_ID: ${row.team.id}) - No mapping found.`);
        return null;
      }

      return {
        league_id: af_league_id,
        season: season,
        team_id: afTeamId,
        rank: row.position,
        played: row.playedGames,
        win: row.won,
        draw: row.draw,
        lose: row.lost,
        points: row.points,
        goals_for: row.goalsFor,
        goals_against: row.goalsAgainst,
        goals_diff: row.goalDifference,
        form: row.form || "",
        updated_at: new Date().toISOString()
      };
    }).filter(Boolean);

    console.log(`[DEBUG] Prepared ${standingsToUpdate.length} rows for UPSERT.`);

    // 4. DBへの保存
    if (standingsToUpdate.length === 0) {
      throw new Error("保存可能なデータが0件です。マッピングが正しく設定されているか確認してください。");
    }

    const { error: upsertError } = await supabase
      .from("standings")
      .upsert(standingsToUpdate, { onConflict: "league_id,team_id,season" });

    if (upsertError) throw new Error(`Database Upsert Error: ${upsertError.message}`);

    return new Response(JSON.stringify({
      status: "success",
      count: standingsToUpdate.length,
      league: fd_league_code,
      season: season
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error(`[ERROR] ${err.message}`);
    return new Response(JSON.stringify({
      status: "error",
      message: err.message,
      stack: err.stack
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});