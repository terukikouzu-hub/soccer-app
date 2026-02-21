import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const API_KEY = Deno.env.get("API_FOOTBALL_KEY")!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // リクエストから playerId と season を取得
    const { playerId, season = 2025 } = await req.json();
    if (!playerId) return new Response("playerId is required", { status: 400 });

    console.log(`📡 Fetching detailed info for Player ID: ${playerId} (Season: ${season})`);

    // API-Football の選手詳細エンドポイント
    const response = await fetch(
      `https://v3.football.api-sports.io/players?id=${playerId}&season=${season}`,
      {
        headers: {
          "x-apisports-key": API_KEY,
          "x-apisports-host": "v3.football.api-sports.io",
        },
      }
    );

    const resJson = await response.json();
    const data = resJson.response?.[0]; // 1人分のデータ

    if (!data) {
      return new Response(JSON.stringify({ error: "Player not found in API" }), { status: 404 });
    }

    // --- データベースのカラムに合わせてマッピング ---
    const detailedData = {
      id: data.player.id,
      name: data.player.name,
      age: data.player.age,
      nationality: data.player.nationality,
      photo: data.player.photo,
      height: data.player.height,
      weight: data.player.weight,
      birth_date: data.player.birth.date,
      injured: data.player.injured,
      statistics: data.statistics, // JSONBとして保存
    };

    // player_details テーブルを更新 (upsert)
    const { error } = await supabase
      .from("player_details")
      .upsert(detailedData, { onConflict: 'id' });

    if (error) throw error;

    return new Response(JSON.stringify({
      message: `Successfully updated details for ${detailedData.name}`,
      updated_fields: ["nationality", "height", "weight", "birth_date", "injured", "statistics"]
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});