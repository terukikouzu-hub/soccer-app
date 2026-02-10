// src/pages/MatchList.jsx
import { useState, useEffect } from 'react';
import MatchCard from '../components/MatchCard';
import CompetitionSelector from '../components/CompetitionSelector';
import CompetitionModal from '../components/CompetitionModal';
import MatchdayModal from '../components/MatchdayModal';

const TARGET_LEAGUES = ['PL', 'PD', 'SA', 'BL1', 'FL1', 'CL'];
const LEAGUE_TITLES = {
  'PL': 'PREMIER LEAGUE',
  'PD': 'LA LIGA',
  'SA': 'SERIE A',
  'BL1': 'BUNDESLIGA',
  'FL1': 'LIGUE 1',
  'CL': 'CHAMPIONS LEAGUE',
};

function MatchList() {
  const [matchGroups, setMatchGroups] = useState({});
  const [displayMatchday, setDisplayMatchday] = useState(1); // 表示中の節
  const [matchdayList, setMatchdayList] = useState([]); // 1〜38節のリスト
  const [isLoading, setIsLoading] = useState(true);
  const [allOpen, setAllOpen] = useState(false); // 全表示フラグ
  // モーダルの開閉状態
  const [isMatchdaySelectorOpen, setIsMatchdaySelectorOpen] = useState(false);
  const [isLeagueSelectorOpen, setIsLeagueSelectorOpen] = useState(false);
  // リーグ選択の状態
  const [currentCompetition, setCurrentCompetition] = useState('PL');
  const [competitions, setCompetitions] = useState([]);
  const [isCompLoading, setIsCompLoading] = useState(true);

  // 1. 初回ロード時にリーグ一覧を取得
  useEffect(() => {
    const API_KEY = import.meta.env.VITE_API_KEY;
    const options = { headers: { 'X-Auth-Token': API_KEY } };

    fetch('/api/competitions', options)
      .then(res => res.json())
      .then(data => {
        const filtered = TARGET_LEAGUES.map(code => 
          data.competitions.find(comp => comp.code === code)
        ).filter(Boolean);
        setCompetitions(filtered);
        setIsCompLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsCompLoading(false);
      });
  }, []);
 
  //2. 試合データを取得（リーグが変わるたびに実行）
  useEffect(() => {
    setIsLoading(true); // リーグが変わったらローディングを表示
    const API_KEY = import.meta.env.VITE_API_KEY;
    const options = { headers: { 'X-Auth-Token': API_KEY } };

    fetch(`/api/competitions/${currentCompetition}/matches`, options)
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
            homeId: match.homeTeam.id,
            home: match.homeTeam.name,
            homeLogo: match.homeTeam.crest,
            awayId: match.awayTeam.id,
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
        const sortedDays = Object.keys(groups).sort((a, b) => Number(a) - Number(b));
        setMatchdayList(sortedDays);

        //「今節」を自動判定（未完了の最初の試合がある節）
        const current = data.matches.find(m => m.status !== 'FINISHED');
        const initialDay = current ? current.matchday : data.matches[data.matches.length - 1].matchday;
        
        setDisplayMatchday(initialDay);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [currentCompetition]);

  // 節を切り替えたら、一括表示フラグをリセット（ネタバレ防止）
  useEffect(() => {
    setAllOpen(false);
  }, [displayMatchday]);

  // ヘッダーボタンに渡すための「現在選択中のリーグ情報」
  const currentCompInfo = competitions.find(c => c.code === currentCompetition);

  // 前の節へ移動する関数
  const handlePrev = () => {
    if (displayMatchday > 1) {
      setDisplayMatchday(displayMatchday - 1);
    }
  };

  // 次の節へ移動する関数
  const handleNext = () => {
    if (displayMatchday < matchdayList.length) {
      setDisplayMatchday(displayMatchday + 1);
    }
  };

  // 節を選んだらメニューを閉じて更新する関数
  const handleSelectDay = (day) => {
    setDisplayMatchday(Number(day));
    setIsMatchdaySelectorOpen(false);
  };

  // リーグ選択時の処理
  const handleSelectLeague = (code) => {
    setCurrentCompetition(code);
    setIsLeagueSelectorOpen(false); // 選択したら閉じる
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー：プルダウンを削除し、タイトルのみに */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 text-center">
           <h1 className="text-lg font-black text-blue-600 tracking-tighter">
             ⚽{LEAGUE_TITLES[currentCompetition] || 'FOOTBALL'} SCORES
           </h1>
           <CompetitionSelector 
             currentComp={currentCompInfo} 
             onClick={() => setIsLeagueSelectorOpen(true)} 
           />
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
            {/* 節ナビゲーションエリア */}
            <div className="max-w-md mx-auto mb-4 flex items-center justify-between border-b border-gray-200 pb-2">
              
              <div className="flex items-center gap-2">
                {/* 前へボタン */}
                <button 
                  onClick={handlePrev}
                  disabled={displayMatchday <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-gray-100 disabled:hover:text-gray-500 transition-all"
                >
                  ◀
                </button>

                {/* MATCHDAY表示（ここをクリックでモーダルが開く） */}
                <div 
                  onClick={() => setIsMatchdaySelectorOpen(true)}
                  className="cursor-pointer group relative"
                >
                  <h2 className="text-xl font-black text-gray-800 italic leading-none group-hover:text-blue-600 transition-colors">
                    MATCHDAY <span className="underline decoration-dotted decoration-2 underline-offset-4">{displayMatchday}</span>
                  </h2>
                </div>

                {/* 次へボタン */}
                <button 
                  onClick={handleNext}
                  disabled={displayMatchday >= matchdayList.length}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-gray-100 disabled:hover:text-gray-500 transition-all"
                >
                  ▶
                </button>
              </div>

              {/*一括表示ボタン */}
              <button 
                onClick={() => setAllOpen(true)} 
                disabled={allOpen} 
                className={`
                  ml-2 px-3 py-1 rounded text-[10px] font-bold transition-colors tracking-wider whitespace-nowrap
                  ${allOpen 
                    ? 'bg-gray-100 text-gray-400 cursor-default border border-gray-100' 
                    : 'bg-gray-800 text-white hover:bg-gray-700 shadow-sm'
                  }
                `}
              >
                {allOpen ? "表示済み" : "全スコア表示"}
              </button>
            </div>

            {/* 試合カード一覧 */}
            {matchGroups[displayMatchday]?.map(match => (
              <MatchCard 
                key={match.id} 
                id={match.id}
                homeId={match.homeId}
                homeTeam={match.home} 
                homeLogo={match.homeLogo}
                awayId={match.awayId}
                awayTeam={match.away} 
                awayLogo={match.awayLogo}
                score={match.score} 
                date={match.date} 
                allOpen={allOpen} // 親の状態を渡す
                status={match.status} // statusをpropsとして渡す
              />
            ))}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full bg-white/80 backdrop-blur-sm border-t border-gray-100 py-2 text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
        Spoiler-Free Football App
      </footer>

      {/* --- モーダルエリア --- */}

      {/* 1. 節選択モーダル（コンポーネント化） */}
      <MatchdayModal 
        isOpen={isMatchdaySelectorOpen}
        onClose={() => setIsMatchdaySelectorOpen(false)}
        days={matchdayList}
        currentDay={displayMatchday}
        onSelect={handleSelectDay}
      />

      {/* 2. リーグ選択モーダル（コンポーネント化済み） */}
      <CompetitionModal
        isOpen={isLeagueSelectorOpen}
        onClose={() => setIsLeagueSelectorOpen(false)}
        competitions={competitions}
        currentId={currentCompetition}
        onSelect={handleSelectLeague}
        isLoading={isCompLoading}
      />

    </div>
  );
}

export default MatchList;