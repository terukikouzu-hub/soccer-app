// Supabase Edge Function: lineup-manager
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  console.log(`📋 [LineupManager] Starting scan: ${new Date().toISOString()}`);

  try {
    const now = new Date();
    
    // --- 修正箇所: 時間枠の設定 ---
    // 1. 開始10分後までの試合を拾う (now - 10分)
    const lineupStart = new Date(now.getTime() - 10 * 60 * 1000).toISOString(); 
    // 2. 開始60分前からの試合を拾う (now + 60分)
    const lineupEnd = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); 
    
    console.log(`🔍 [LineupManager] Searching for matches between ${lineupStart} and ${lineupEnd}`);

    // 1. 対象となる試合を抽出
    const { data: potentialLineups, error: fetchError } = await supabase
      .from("fixtures")
      .select("id, event_date")
      .gte("event_date", lineupStart)
      .lte("event_date", lineupEnd);

    if (fetchError) throw fetchError;

    const pIds = potentialLineups?.map(m => m.id) || [];

    if (pIds.length === 0) {
      console.log("ℹ️ [LineupManager] No matches found in the lineup window.");
      return new Response(JSON.stringify({ message: "No matches to process" }), { status: 200 });
    }

    // 2. すでにラインナップが存在するか確認 (重複取得防止)
    const { data: existing } = await supabase
      .from("fixture_lineup_teams")
      .select("fixture_id")
      .in("fixture_id", pIds);
    
    const existingIds = existing?.map(e => e.fixture_id) || [];
    const neededLineupIds = pIds.filter(id => !existingIds.includes(id));

    if (neededLineupIds.length === 0) {
      console.log(`✅ [LineupManager] ${pIds.length} matches in window, but all already have lineups.`);
      return new Response(JSON.stringify({ message: "All lineups already synced" }), { status: 200 });
    }

    // 3. Worker (sync-fixture-lineups) の呼び出し
    console.log(`📡 [LineupManager] Triggering Lineup Worker for ${neededLineupIds.length} IDs: ${neededLineupIds.join(", ")}`);

    const lineupWorkerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/sync-fixture-lineups`;
    const lineupRes = await fetch(lineupWorkerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ fixtureIds: neededLineupIds }),
    });

    let resultData: { success: number[], failed: number[] } = { success: [], failed: [] };
    if (lineupRes.ok) {
      const resData = await lineupRes.json();
      const syncedIds = resData.synced_ids || [];
      resultData.success = syncedIds;
      resultData.failed = neededLineupIds.filter(id => !syncedIds.includes(id));

      console.log(`✅ [LineupManager] Sync Complete. Synced: ${syncedIds.length}, Failed: ${resultData.failed.length}`);
    } else {
      console.error(`⚠️ [LineupManager] Worker failed with status: ${lineupRes.status}`);
    }

    return new Response(JSON.stringify({ 
      status: "success", 
      attempted: neededLineupIds.length,
      synced: resultData.success.length 
    }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (err: any) {
    console.error("❌ [LineupManager] Critical Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});