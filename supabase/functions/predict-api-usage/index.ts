import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  console.log(`📊 [Predictor] Starting API Usage Prediction...`);

  try {
    // --- 1. APIの1日 (JST 09:00 - 翌08:59) の範囲を定義 ---
    const now = new Date();
    // 実行時の日付に基づき、今日の09:00 JST (UTC 00:00) を起点にする
    const apiDayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const apiDayEnd = new Date(apiDayStart.getTime() + 24 * 60 * 60 * 1000);

    const dateString = apiDayStart.toISOString().split('T')[0]; // YYYY-MM-DD
    console.log(`📅 Target API Day: ${dateString} (JST 09:00 to Next 08:59)`);

    // --- 2. 影響する可能性がある試合を抽出 ---
    // 試合終了(開始+120分)が今日の09:00以降、かつ開始が明日の09:00より前の試合
    const searchStart = new Date(apiDayStart.getTime() - 150 * 60 * 1000).toISOString(); // 余裕を持って取得
    const searchEnd = apiDayEnd.toISOString();

    const { data: fixtures, error: fetchError } = await supabase
      .from("fixtures")
      .select("id, event_date")
      .gte("event_date", searchStart)
      .lt("event_date", searchEnd);

    if (fetchError) throw fetchError;

    // --- 3. コスト計算の初期化 ---
    let lineupsCost = 0;
    let statsCost = 0;
    const slots = new Array(288).fill(0); // 5分刻みの24時間 (24 * 12)

    for (const f of fixtures || []) {
      const matchStart = new Date(f.event_date).getTime();
      const matchEnd = matchStart + (120 * 60 * 1000); // 終了想定 (120分後)
      const lineupSyncTime = matchStart - (50 * 60 * 1000); // ラインナップ取得 (30分前)

      // ① Lineups 予測 (1.2回)
      if (lineupSyncTime >= apiDayStart.getTime() && lineupSyncTime < apiDayEnd.getTime()) {
        lineupsCost += 1.2;
      }

      // ② Stats 予測 (2.5回)
      if (matchEnd >= apiDayStart.getTime() && matchEnd < apiDayEnd.getTime()) {
        statsCost += 2.5;
      }

      // ③ Live Sync 予測 (スロット埋め)
      for (let s = 0; s < 288; s++) {
        const slotStartTime = apiDayStart.getTime() + (s * 5 * 60 * 1000);
        const slotEndTime = slotStartTime + (5 * 60 * 1000);

        // 試合時間がスロットと重なっているか判定
        if (matchStart < slotEndTime && matchEnd > slotStartTime) {
          slots[s]++;
        }
      }
    }

    // --- 4. スロットごとのバッチ消費(20件/1回)を合算 ---
    const liveSyncTotal = slots.reduce((acc, count) => {
      return acc + Math.ceil(count / 20);
    }, 0);

    // --- 5. 最終集計 (固定費 3回を加算) ---
    const totalCost = 3 + lineupsCost + statsCost + liveSyncTotal;

    const predictionData = {
      date: dateString,
      daily_fixtures_cost: 3,
      lineups_predicted_cost: parseFloat(lineupsCost.toFixed(1)),
      stats_predicted_cost: parseFloat(statsCost.toFixed(1)),
      live_sync_predicted_cost: liveSyncTotal,
      total_predicted_cost: parseFloat(totalCost.toFixed(1))
    };

    console.log(`📈 Prediction Results:`, predictionData);

    // --- 6. DBへ保存 (upsert) ---
    const { error: upsertError } = await supabase
      .from("api_usage_predictions")
      .upsert(predictionData);

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ 
      status: "success", 
      prediction: predictionData 
    }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (err: any) {
    console.error(`❌ [Error] ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});