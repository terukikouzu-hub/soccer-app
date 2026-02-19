import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS対策
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. リクエストから teamId を取得
    const { teamId } = await req.json()
    if (!teamId) throw new Error('teamId は必須です')

    // 2. 環境変数の取得
    const API_KEY = Deno.env.get('VITE_API_FOOTBALL_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ""

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 3. API-Sports からスカッド情報を取得
    console.log(`Fetching squad for team: ${teamId}`)
    const response = await fetch(
      `https://v3.football.api-sports.io/players/squads?team=${teamId}`,
      {
        headers: { 'x-apisports-key': API_KEY || '' }
      }
    )

    const apiData = await response.json()
    if (!apiData.response || apiData.response.length === 0) {
      throw new Error('APIからスカッド情報を取得できませんでした')
    }

    const players = apiData.response[0].players

    // 4. 取得した選手リストを DB (team_squads) 用の形式に整形
    const squadData = players.map((p: any) => ({
      team_id: teamId,
      player_id: p.id,
      position: p.position,
      number: p.number,
      updated_at: new Date().toISOString()
    }))

    // 5. DB への保存 (Upsert: 重複は更新、新規は追加)
    const { error: dbError } = await supabase
      .from('team_squads')
      .upsert(squadData, { onConflict: 'team_id, player_id' })

    if (dbError) throw dbError

    return new Response(
      JSON.stringify({ 
        message: 'スカッドの同期に成功しました', 
        count: squadData.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})