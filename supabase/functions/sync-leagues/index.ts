import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const API_KEY = Deno.env.get("API_FOOTBALL_KEY")!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // リクエストから leagueId を取得
    const { leagueId } = await req.json();
    if (!leagueId) return new Response("leagueId is required", { status: 400 });

    console.log(`📡 Fetching league info for ID: ${leagueId}`);

    // API-Football のリーグエンドポイント
    const response = await fetch(
      `https://v3.football.api-sports.io/leagues?id=${leagueId}`,
      {
        headers: {
          "x-apisports-key": API_KEY,
          "x-apisports-host": "v3.football.api-sports.io",
        },
      }
    );

    const resJson = await response.json();
    const data = resJson.response?.[0]; // 1つ目のリーグデータを取得

    if (!data) {
      return new Response(JSON.stringify({ error: "League not found in API" }), { status: 404 });
    }

    // --- データベースのカラムに合わせてマッピング ---
    const leagueData = {
      id: data.league.id,
      name: data.league.name,
      type: data.league.type,
      logo: data.league.logo,
      country_name: data.country.name,
      country_code: data.country.code,
      country_flag: data.country.flag
    };

    // leagues テーブルを更新 (upsert)
    const { error } = await supabase
      .from("leagues")
      .upsert(leagueData, { onConflict: 'id' });

    if (error) throw error;

    return new Response(JSON.stringify({
      message: `Successfully synced league: ${leagueData.name}`,
      id: leagueData.id
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});