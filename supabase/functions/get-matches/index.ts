// Supabase Edge Function: get-matches
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// 1. CORSヘッダーの定義 (ブラウザからのアクセスを許可する)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const API_FOOTBALL_KEY = Deno.env.get('API_FOOTBALL_KEY')!
const DAILY_LIMIT = 95

serve(async (req: Request) => {
  // 2. OPTIONSリクエスト（ブラウザの事前確認）への即答
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { date } = await req.json()
    if (!date) {
      return new Response(JSON.stringify({ error: 'Date is required' }), { 
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 3. すでにDBにデータがあるかチェック
    const startDate = `${date}T00:00:00`
    const endDate = `${date}T23:59:59`
    
    const { data: existingMatches, error: fetchError } = await supabase
        .from('matches')
        .select('data') // JSONデータそのものを取得
        .gte('date', startDate)
        .lte('date', endDate)

    // 4. 【修正ポイント】データがあれば、そのデータをそのままフロントエンドに返す！
    if (existingMatches && existingMatches.length > 0) {
        console.log(`Data found in DB for ${date}. Returning ${existingMatches.length} matches.`)
        return new Response(JSON.stringify({ response: existingMatches.map(m => m.data) }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
    }

    // 5. 使用回数チェック
    const today = new Date().toISOString().split('T')[0]
    const { data: usageData } = await supabase.from('api_usage').select('count').eq('date', today).single()
    const currentCount = usageData?.count || 0

    if (currentCount >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: 'Daily API limit reached' }), { 
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    // 6. API-Football から取得
    console.log('Fetching from API-Football...')
    const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${date}&timezone=Asia/Tokyo`
    const apiRes = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-key': API_FOOTBALL_KEY,
        'x-apisports-key': API_FOOTBALL_KEY
      }
    })
    const apiJson = await apiRes.json()

    if (!apiJson.response) throw new Error('API Error')

    // 7. DBに保存 (バックグラウンドで実行)
    const matchesToUpsert = apiJson.response.map((match: any) => ({
      id: match.fixture.id,
      date: match.fixture.date,
      league_id: match.league.id,
      season: match.league.season,
      home_team_id: match.teams.home.id,
      away_team_id: match.teams.away.id,
      status: match.fixture.status.short,
      data: match,
      updated_at: new Date().toISOString()
    }))

    if (matchesToUpsert.length > 0) {
      await supabase.from('matches').upsert(matchesToUpsert)
      await supabase.from('api_usage').upsert({ date: today, count: currentCount + 1 })
    }

    // 取得したデータを返す
    return new Response(JSON.stringify(apiJson), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})