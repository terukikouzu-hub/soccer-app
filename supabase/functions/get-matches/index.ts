// supabase/functions/get-matches/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// 環境変数からAPIキーなどを取得
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const API_FOOTBALL_KEY = Deno.env.get('API_FOOTBALL_KEY')!

// 1日のリクエスト上限 (安全マージンを取って95回にする)
const DAILY_LIMIT = 95

serve(async (req) => {
  try {
    // 1. リクエストから日付とリーグIDを取得 (POST bodyから)
    const { date } = await req.json()
    
    // 日付がない場合はエラー
    if (!date) {
        return new Response(JSON.stringify({ error: 'Date is required' }), { status: 400 })
    }

    // Supabaseクライアント作成
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // ---------------------------------------------------------
    // 2. 「今日のAPI使用回数」をチェック (門番)
    // ---------------------------------------------------------
    const today = new Date().toISOString().split('T')[0]
    const { data: usageData } = await supabase
      .from('api_usage')
      .select('count')
      .eq('date', today)
      .single()

    const currentCount = usageData?.count || 0
    console.log(`Today's API usage: ${currentCount}`)

    // ---------------------------------------------------------
    // 3. データベースに既にデータがあるかチェック (キャッシュ確認)
    // ---------------------------------------------------------
    // 指定された日付のデータが存在するか確認 (1件でもあればOKとする簡易判定)
    // 本来はリーグIDなどで絞り込むが、まずは「その日のデータがあるか」で判定
    // 日付範囲検索: 指定日の 00:00:00 ～ 23:59:59
    const startDate = `${date}T00:00:00`
    const endDate = `${date}T23:59:59`
    
    const { data: existingMatches } = await supabase
        .from('matches')
        .select('id')
        .gte('date', startDate)
        .lte('date', endDate)
        .limit(1)

    // データがあり、かつAPI制限に達している場合はエラー（またはDBデータ取得を促す）
    if (existingMatches && existingMatches.length > 0) {
        console.log('Data already exists in DB.')
        // ここでDBからデータを返しても良いが、
        // フロントエンド側で「エラーならDBを見る」というロジックにするため、
        // ここでは「保存済み」というメッセージを返す等の運用も可能。
        // 今回はシンプルに「API叩かない」判断だけして、DBにあるものを返すロジック等は省略。
    }

    if (currentCount >= DAILY_LIMIT) {
      console.log('API limit reached.')
      return new Response(JSON.stringify({ error: 'Daily API limit reached' }), { headers: { "Content-Type": "application/json" }, status: 429 })
    }

    // データがない、かつ制限内ならAPIを叩く
    if (!existingMatches || existingMatches.length === 0) {
        // ---------------------------------------------------------
        // 4. API-Football からデータを取得
        // ---------------------------------------------------------
        console.log('Fetching from API-Football...')
        const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${date}&timezone=Asia/Tokyo`
        const apiRes = await fetch(apiUrl, {
          headers: {
            'x-rapidapi-key': API_FOOTBALL_KEY,
            'x-apisports-key': API_FOOTBALL_KEY
          }
        })
        const apiJson = await apiRes.json()
    
        if (!apiJson.response) {
          throw new Error('API Error')
        }
    
        // ---------------------------------------------------------
        // 5. データをSupabaseに保存 (Upsert)
        // ---------------------------------------------------------
        const matchesToUpsert = apiJson.response.map((match: any) => ({
          id: match.fixture.id,
          date: match.fixture.date, // ISO string
          league_id: match.league.id,
          season: match.league.season,
          home_team_id: match.teams.home.id,
          away_team_id: match.teams.away.id,
          status: match.fixture.status.short,
          data: match, // JSON丸ごと
          updated_at: new Date().toISOString()
        }))
    
        if (matchesToUpsert.length > 0) {
          const { error: upsertError } = await supabase
            .from('matches')
            .upsert(matchesToUpsert)
          
          if (upsertError) console.error('Upsert Error:', upsertError)
        }
    
        // ---------------------------------------------------------
        // 6. API使用回数を +1 カウントアップ
        // ---------------------------------------------------------
        const { error: usageError } = await supabase
          .from('api_usage')
          .upsert({ date: today, count: currentCount + 1 })
          
        // 取得したデータを返す
        return new Response(JSON.stringify(apiJson), {
          headers: { "Content-Type": "application/json" },
        })
    } else {
        // すでにデータがある場合は、DBから取得して返す処理（今回は簡易的に空レスポンスまたはメッセージ）
        // 実際はここで select * from matches... して返すと親切
        return new Response(JSON.stringify({ message: 'Data already exists' }), {
            headers: { "Content-Type": "application/json" },
        })
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})