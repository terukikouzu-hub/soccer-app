// src/pages/MatchDetail.jsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TeamBadge from '../components/TeamBadge';

function MatchDetail() {
  const location = useLocation();
  const navigate = useNavigate();

  // 前の画面(MatchList)から渡されたデータを受け取る
  const matchData = location.state?.matchData;

  // APIから取得した詳細データを入れる箱
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // データがない場合（直接アクセスなど）はトップページに強制的に戻す
  useEffect(() => {
    if (!matchData) {
      navigate('/');
    }
  }, [matchData, navigate]);

  useEffect(() => {
    if (!matchData) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. 日付を YYYY-MM-DD 形式に整形 (例: 2023-10-15)
        const dateStr = matchData.date.split('T')[0];

        // 2. 詳細データ用APIキー (API-Football)
        const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY;

        // 3. その日の試合を全件取得する
        // (IDが異なるため、直接ID指定ではなく日付検索を行います)
        const response = await fetch(
          `https://v3.football.api-sports.io/fixtures?date=${dateStr}`,
          {
            headers: {
              'x-rapidapi-key': API_KEY,
              'x-apisports-key': API_KEY
            }
          }
        );

        if (!response.ok) throw new Error('データ取得に失敗しました');
        const json = await response.json();

        // 4. チーム名を使って、今見ている試合を探し出す
        const targetMatch = json.response.find(game => {
          // APIから来たチーム名
          const apiHome = game.teams.home.name.toLowerCase();
          const apiAway = game.teams.away.name.toLowerCase();
          // 前の画面から来たチーム名
          const orgHome = matchData.home.toLowerCase();
          const orgAway = matchData.away.toLowerCase();

          // 名前が部分一致するかチェック (表記ゆれ対策)
          const isHomeMatch = apiHome.includes(orgHome) || orgHome.includes(apiHome);
          const isAwayMatch = apiAway.includes(orgAway) || orgAway.includes(apiAway);

          console.log(`比較: API[${apiHome}] vs 一覧[${orgHome}]`);

          return isHomeMatch || isAwayMatch;
        });

        if (targetMatch) {
          console.log("詳細データ取得成功:", targetMatch);
          console.log("イベントデータ:", targetMatch.events);
          setDetails(targetMatch);
        } else {
          setError('詳細データが見つかりませんでした');
        }

      } catch (err) {
        console.error(err);
        setError('通信エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [matchData]);

  // ★得点者だけを抜き出すロジック
  const getScorers = (events) => {
    if (!events) return [];
    // typeが 'Goal' のものだけフィルターし、PK失敗などは除外
    return events.filter(e => e.type === 'Goal' && e.detail !== 'Missed Penalty');
  };

  // データが読み込まれるまでは何も表示しない（チラつき防止）
  if (!matchData) return null;

  // 詳細データがあればそちらのスコアを、なければ一覧データのスコアを使う
  const displayScore = details
    ? `${details.goals.home} - ${details.goals.away}`
    : matchData.score;

  const displayStatus = details ? details.fixture.status.short : matchData.status;

  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-fadeIn">

      {/* 戻るボタン */}
      <button
        onClick={() => navigate(-1)} // 1つ前の画面に戻る
        className="mb-6 text-gray-500 hover:text-blue-600 font-bold flex items-center gap-2 transition-colors"
      >
        ◀ 一覧に戻る
      </button>

      {/* --- ヘッダーエリア --- */}
      <div className="bg-white pb-8 pt-2 px-4 shadow-sm border-b border-gray-100 rounded-b-3xl">
        <div className="max-w-2xl mx-auto">

          {/* 日付 */}
          <div className="text-center mb-6">
            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full tracking-widest">
              {matchData.date.split('T')[0]}
            </span>
          </div>

          {/* メイン：チームとスコア */}
          <div className="flex items-start justify-between gap-2">

            {/* HOME TEAM */}
            <div className="w-[30%]">
              <TeamBadge
                teamId={matchData.homeId}
                teamName={matchData.home}
                teamLogo={matchData.homeLogo}
                size="large" // ★大きく表示
              />
            </div>

            {/* SCORE & INFO */}
            <div className="w-[40%] flex flex-col items-center pt-2">
              {/* スコア */}
              <div className="text-4xl font-black text-gray-800 tracking-tighter leading-none mb-2">
                {displayScore}
              </div>

              {/* ステータス */}
              <div className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded mb-4">
                {displayStatus}
              </div>

              {/* 得点者リスト (詳細データがある場合のみ) */}
              {details && (
                <div className="w-full space-y-1">
                  {getScorers(details.events).map((goal, i) => {
                    const isHomeGoal = goal.team.id === details.teams.home.id;
                    return (
                      <div key={i} className={`flex items-center text-xs w-full ${isHomeGoal ? 'justify-start text-left' : 'justify-end text-right'}`}>
                        {/* アウェイゴールの場合は時間を後ろに */}
                        {!isHomeGoal && (
                          <span className="text-gray-700 font-bold truncate max-w-[80px]">{goal.player.name}</span>
                        )}

                        <span className="mx-1 font-mono text-[10px] text-gray-400">
                          {goal.time.elapsed}'
                          {goal.detail === 'Penalty' && ' (P)'}
                        </span>

                        {/* ホームゴールの場合は時間を前に */}
                        {isHomeGoal && (
                          <span className="text-gray-700 font-bold truncate max-w-[80px]">{goal.player.name}</span>
                        )}

                        {/* ボールアイコン（装飾） */}
                        <span className="text-[10px] ml-1">⚽</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ロード中表示 */}
              {loading && (
                <div className="animate-pulse text-[10px] text-gray-400 font-bold mt-2">
                  UPDATING...
                </div>
              )}
            </div>

            {/* AWAY TEAM */}
            <div className="w-[30%]">
              <TeamBadge
                teamId={matchData.awayId}
                teamName={matchData.away}
                teamLogo={matchData.awayLogo}
                size="large" // ★大きく表示
              />
            </div>

          </div>
        </div>
      </div>

      {/* --- コンテンツエリア (仮) --- */}
      <div className="max-w-2xl mx-auto p-4 text-center text-gray-400 text-xs mt-10">
        <p>ここにスタメンやスタッツが入ります</p>
        <div className="h-[500px]"></div> {/* スクロール確認用の余白 */}
      </div>

    </div>
  );
}

export default MatchDetail;