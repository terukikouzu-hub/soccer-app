// Supabase Edge Function: get-match-details
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const API_FOOTBALL_KEY = Deno.env.get('API_FOOTBALL_KEY')!
const DAILY_LIMIT = 95

serve(async (req: Request) => {
  // ブラウザの事前確認（OPTIONS）対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { matchId } = await req.json()
    
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), { 
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // --- 1. まず新テーブル(match_details)にデータがあるか確認 ---
    const { data: existingDetail } = await supabase
      .from('match_details')
      .select('data')
      .eq('id', matchId)
      .single()

    // データがあればそのまま返す！(API消費ゼロ)
    if (existingDetail && existingDetail.data) {
      console.log(`Detail found in DB for match ${matchId}.`)
      return new Response(JSON.stringify({ response: [existingDetail.data] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // --- 2. API使用制限のチェック ---
    const today = new Date().toISOString().split('T')[0]
    const { data: usageData } = await supabase.from('api_usage').select('count').eq('date', today).single()
    const currentCount = usageData?.count || 0

    if (currentCount >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: 'Daily API limit reached' }), { 
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    // --- 3. APIから詳細データを取得 ---
    console.log(`Fetching detail from API for match ${matchId}...`)
    const apiUrl = `https://v3.football.api-sports.io/fixtures?id=${matchId}`
    const apiRes = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-key': API_FOOTBALL_KEY,
        'x-apisports-key': API_FOOTBALL_KEY
      }
    })
    const apiJson = await apiRes.json()

    if (!apiJson.response || apiJson.response.length === 0) {
      throw new Error('API Error or Match Not Found')
    }

    const matchData = apiJson.response[0]

    // --- 4. 取得したデータを新テーブル(match_details)に保存 ---
    const { error: upsertError } = await supabase
      .from('match_details')
      .upsert({
        id: matchId,
        data: matchData,
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Upsert Error:', upsertError)
    } else {
      // 成功したらAPI使用回数を+1
      await supabase.from('api_usage').upsert({ date: today, count: currentCount + 1 })
    }

    // クライアントへ返す
    return new Response(JSON.stringify(apiJson), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})