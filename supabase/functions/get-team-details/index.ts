// supabase/functions/get-team-details/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 環境変数の取得
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const API_FOOTBALL_KEY = Deno.env.get('API_FOOTBALL_KEY')!

serve(async (req: Request) => {
  // ブラウザの事前確認（OPTIONS）対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { teamId } = await req.json()
    
    if (!teamId) {
      throw new Error('Team ID is required')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // -----------------------------------------------------------
    // 1. まずDB (team_details) にデータがあるか確認
    // -----------------------------------------------------------
    const { data: existingData, error: dbError } = await supabase
      .from('team_details')
      .select('data')
      .eq('id', teamId)
      .single()

    // データがあればAPIは叩かずにDBのデータを返す
    if (existingData && existingData.data) {
      console.log(`【DBヒット】チームID: ${teamId} のデータをDBから返します。API消費ゼロ！`)
      return new Response(JSON.stringify(existingData.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // -----------------------------------------------------------
    // 2. DBに無ければ、API-Footballを叩く
    // -----------------------------------------------------------
    console.log(`【API取得】チームID: ${teamId} のデータがDBに無いためAPIを叩きます...`)
    
    const headers = {
      'x-rapidapi-key': API_FOOTBALL_KEY,
      'x-apisports-key': API_FOOTBALL_KEY
    }

    // チーム基本情報と選手一覧(squad)の2つのAPIを同時に叩く（高速化）
    const [teamRes, squadRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/teams?id=${teamId}`, { headers }),
      fetch(`https://v3.football.api-sports.io/players/squads?team=${teamId}`, { headers })
    ])

    const teamJson = await teamRes.json()
    const squadJson = await squadRes.json()

    // 2つのAPIの結果を1つのオブジェクトに合体させる
    const combinedData = {
      teamInfo: teamJson.response?.[0] || null,
      squad: squadJson.response?.[0]?.players || []
    }

    // -----------------------------------------------------------
    // 3. 取得したデータをDB (team_details) に保存
    // -----------------------------------------------------------
    console.log(`【DB保存】取得したデータを team_details テーブルに保存します...`)
    const { error: upsertError } = await supabase
      .from('team_details')
      .upsert({
        id: teamId,
        data: combinedData,
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Supabase保存エラー:', upsertError)
      throw upsertError
    }

    // フロントエンドへデータを返す
    return new Response(JSON.stringify(combinedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error: any) {
    console.error("Edge Function エラー:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})