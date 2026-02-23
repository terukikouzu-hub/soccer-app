import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// .env の変数名 VITE_FOOTBALL_DATA_ORG_KEY を使用
const FD_API_KEY = Deno.env.get("VITE_FOOTBALL_DATA_ORG_KEY")!;

/**
 * 名前の正規化関数
 * チーム名から接頭辞・接尾辞を除去し、比較の精度を上げます。
 */
const normalize = (name: string) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\s(fc|afc|ssc|as|ac|cf|ud|de|1907|1913|1909|1900|milano|1904|real|united|city|town|club|deportivo)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. リクエストボディの解析
  let af_league_id: number;
  let fd_league_code: string;
  try {
    const body = await req.json();
    af_league_id = body.af_league_id;
    fd_league_code = body.fd_league_code;
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  if (!af_league_id || !fd_league_code) {
    return new Response(JSON.stringify({ error: "Missing af_league_id or fd_league_code" }), { status: 400 });
  }

  console.log(`[DEBUG] Mapping Started: AF_ID=${af_league_id}, FD_CODE=${fd_league_code}`);

  try {
    // 2. DBから全チームを取得 (teamsテーブルにleague_idがないため全件取得)
    const { data: afTeams, error: afError } = await supabase
      .from("teams")
      .select("id, name");
    if (afError) throw new Error(`Database Fetch Error: ${afError.message}`);

    // 3. Football-Data.org から順位表（最新のチームリスト）を取得
    const fdRes = await fetch(`https://api.football-data.org/v4/competitions/${fd_league_code}/standings`, {
      headers: { "X-Auth-Token": FD_API_KEY }
    });
    
    if (fdRes.status === 429) throw new Error("Football-Data API Rate Limit exceeded. Wait 1 minute.");
    if (!fdRes.ok) throw new Error(`Football-Data API error: ${fdRes.status}`);
    
    const fdData = await fdRes.json();
    const fdTable = fdData.standings?.[0]?.table;
    if (!fdTable) throw new Error(`Standings table not found for ${fd_league_code}`);

    const mappings = [];
    const unmatched = [];

    // 4. マッチングロジックの実行
    for (const row of fdTable) {
      const fdId = row.team.id;
      const fdName = row.team.name;
      const fdShortName = row.team.shortName || "";

      const match = afTeams.find(af => {
        const afNorm = normalize(af.name);
        return (
          afNorm === normalize(fdName) || 
          afNorm === normalize(fdShortName) ||
          af.name.toLowerCase().includes(fdShortName.toLowerCase()) ||
          fdName.toLowerCase().includes(af.name.toLowerCase())
        );
      });

      if (match) {
        mappings.push({
          league_id: af_league_id,
          af_team_id: match.id,
          fd_team_id: fdId,
          team_name: match.name
        });
      } else {
        unmatched.push({ fdId, fdName });
      }
    }

    // 5. 重複排除ロジック (Upsert Error: ON CONFLICT DO UPDATE... の対策)
    // af_team_id が重複している場合、最初に見つかったものだけを保持します
    const uniqueMappings = Array.from(
      new Map(mappings.map((m) => [m.af_team_id, m])).values()
    );

    // 6. team_mappings テーブルへ書き込み
    let upsertStatus = "No mappings to save";
    if (uniqueMappings.length > 0) {
      const { error: upsertError } = await supabase
        .from("team_mappings")
        .upsert(uniqueMappings, { onConflict: "league_id,af_team_id" });
      
      if (upsertError) throw new Error(`Upsert Error: ${upsertError.message}`);
      upsertStatus = `Successfully saved ${uniqueMappings.length} mappings`;
    }

    return new Response(JSON.stringify({
      status: "success",
      matched_count: uniqueMappings.length,
      duplicate_removed: mappings.length - uniqueMappings.length,
      unmatched_count: unmatched.length,
      unmatched_teams: unmatched,
      upsert_status: upsertStatus
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error(`[CRITICAL] ${err.message}`);
    return new Response(JSON.stringify({ 
      status: "error", 
      message: err.message,
      stack: err.stack 
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});