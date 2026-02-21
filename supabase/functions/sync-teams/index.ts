import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const API_KEY = Deno.env.get("API_FOOTBALL_KEY")!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // リクエストから teamId を取得 (POST {"teamId": 33})
    const { teamId } = await req.json();

    if (!teamId) {
      return new Response(JSON.stringify({ error: "teamId is required" }), { status: 400 });
    }

    console.log(`📡 Fetching full details for Team ID: ${teamId}`);

    // API-Football のチーム詳細エンドポイントを叩く
    const response = await fetch(
      `https://v3.football.api-sports.io/teams?id=${teamId}`,
      {
        headers: {
          "x-apisports-key": API_KEY,
          "x-apisports-host": "v3.football.api-sports.io",
        },
      }
    );

    const resJson = await response.json();
    const teamData = resJson.response?.[0]; // 配列の1番目を取得

    if (!teamData) {
      return new Response(JSON.stringify({ error: "Team not found in API" }), { status: 404 });
    }

    // --- データのマッピング ---
    const detailedData = {
      id: teamData.team.id,
      name: teamData.team.name,
      code: teamData.team.code, // 略称 (ARSなど)
      country: teamData.team.country,
      founded: teamData.team.founded, // 設立年
      logo: teamData.team.logo,
      is_national: teamData.team.national,
      venue_name: teamData.venue.name,
      venue_city: teamData.venue.city,
      venue_capacity: teamData.venue.capacity,
      venue_surface: teamData.venue.surface, // 芝の種類
      venue_image: teamData.venue.image,    // スタジアム画像
    };

    // 保存 (既存の ID があれば全カラムを最新情報で上書き)
    const { error } = await supabase.from("teams").upsert(detailedData);
    if (error) throw error;

    return new Response(JSON.stringify({
      message: `Successfully updated ${detailedData.name}`,
      updated_data: detailedData
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});