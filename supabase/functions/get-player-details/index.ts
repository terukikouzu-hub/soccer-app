// supabase/functions/get-player-details/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// .env.localからAPIキーを取得
const API_KEY = Deno.env.get("VITE_API_FOOTBALL_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORSエラーを防ぐためのおまじない
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // React（フロントエンド）から送られてきたパラメータを受け取る
    const { playerId, season } = await req.json();

    if (!playerId || !season) {
      throw new Error("playerId と season は必須です");
    }

    // API-Sports のエンドポイントURL
    const apiUrl =
      `https://v3.football.api-sports.io/players?id=${playerId}&season=${season}`;
    console.log(`Fetching player data: ${apiUrl}`);

    // 外部APIを叩く
    const response = await fetch(apiUrl, {
      headers: {
        "x-apisports-key": API_KEY || "", // 取得したAPIキーをセット
      },
    });

    const data = await response.json();

    // 取得したデータをそのままReactに返す
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
