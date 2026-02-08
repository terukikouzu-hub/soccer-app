import { useState, useEffect } from 'react';
import MatchCard from './components/MatchCard';

function App() {
  const [matchGroups, setMatchGroups] = useState({});
  const [displayMatchday, setDisplayMatchday] = useState(1); // 表示中の節
  const [matchdayList, setMatchdayList] = useState([]); // 1〜38節のリスト
  const [isLoading, setIsLoading] = useState(true);
  const [allOpen, setAllOpen] = useState(false); // 全表示フラグ

  useEffect(() => {
    const API_KEY = import.meta.env.VITE_API_KEY;
    const options = { headers: { 'X-Auth-Token': API_KEY } };

    // プレミアリーグの全試合データを取得
    fetch('/api/competitions/PL/matches', options)
      .then(res => {
        if (!res.ok) throw new Error('APIリクエストに失敗しました');
        return res.json();
      })
      .then(data => {
        // 1. 節(matchday)ごとにデータをグループ化
        const groups = data.matches.reduce((acc, match) => {
          const day = match.matchday;
          if (!acc[day]) acc[day] = [];
          acc[day].push({
            id: match.id,
            home: match.homeTeam.name,
            homeLogo: match.homeTeam.crest,
            away: match.awayTeam.name,
            awayLogo: match.awayTeam.crest,
            // スコアが未定（null）の場合は「試合前」と表示
            score: match.score.fullTime.home !== null 
              ? `${match.score.fullTime.home} - ${match.score.fullTime.away}` 
              : "試合前",
            date: match.utcDate,
            status: match.status
          });
          return acc;
        }, {});

        setMatchGroups(groups);
        setMatchdayList(Object.keys(groups));

        // 2. 「今節」を自動判定（未完了の最初の試合がある節）
        const current = data.matches.find(m => m.status !== 'FINISHED');
        const initialDay = current ? current.matchday : data.matches[data.matches.length - 1].matchday;
        
        setDisplayMatchday(initialDay);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  // 節を切り替えたら、一括表示フラグをリセット（ネタバレ防止）
  useEffect(() => {
    setAllOpen(false);
  }, [displayMatchday]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 固定ヘッダー：タイトルと節選択、一括表示ボタンを配置 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-lg font-black text-blue-600 tracking-tighter">
              ⚽ PREMIER SCORES
            </h1>
            
            {!isLoading && (
              <select 
                value={displayMatchday} 
                onChange={(e) => setDisplayMatchday(Number(e.target.value))}
                className="bg-gray-100 border-none text-xs font-bold py-1 px-2 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {matchdayList.map(day => (
                  <option key={day} value={day}>第 {day} 節</option>
                ))}
              </select>
            )}
          </div>

          {/* 一括表示・隠すボタン */}
          {!isLoading && (
            <button 
              onClick={() => setAllOpen(!allOpen)}
              className="w-full py-2 bg-gray-800 text-white text-[10px] font-black rounded-md hover:bg-gray-700 transition-colors uppercase tracking-[0.2em]"
            >
              {allOpen ? "すべてのスコアを隠す" : "今節の結果をすべて表示"}
            </button>
          )}
        </div>
      </header>

      <main className="pt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center mt-20">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-gray-400 font-bold text-xs">STADIUM DATA LOADING...</p>
          </div>
        ) : (
          <div className="px-4">
            {/* 現在の節の見出し */}
            <div className="max-w-md mx-auto mb-4 flex items-center justify-between border-b border-gray-200 pb-2">
              <h2 className="text-xl font-black text-gray-800 italic">MATCHDAY {displayMatchday}</h2>
              <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                {matchGroups[displayMatchday]?.length} MATCHES
              </span>
            </div>

            {/* 試合カード一覧 */}
            {matchGroups[displayMatchday]?.map(match => (
              <MatchCard 
                key={match.id} 
                homeTeam={match.home} 
                awayTeam={match.away} 
                score={match.score} 
                date={match.date} 
                homeLogo={match.homeLogo} 
                awayLogo={match.awayLogo}
                allOpen={allOpen} // 親の状態を渡す
              />
            ))}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full bg-white/80 backdrop-blur-sm border-t border-gray-100 py-2 text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
        Spoiler-Free Football App
      </footer>
    </div>
  );
}

export default App;