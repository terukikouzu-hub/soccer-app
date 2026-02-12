// src/pages/MatchList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ★追加: ページ遷移用
import MatchCard from '../components/MatchCard';
import CompetitionSelector from '../components/CompetitionSelector';
import CompetitionModal from '../components/CompetitionModal';
//import MatchdayModal from '../components/MatchdayModal';

// API-FOOTBALL用のリーグID定義
const LEAGUES = [
  { code: 'PL', id: 39, name: 'PREMIER LEAGUE' },
  { code: 'PD', id: 140, name: 'LA LIGA' },
  { code: 'SA', id: 135, name: 'SERIE A' },
  { code: 'BL1', id: 78, name: 'BUNDESLIGA' },
  { code: 'FL1', id: 61, name: 'LIGUE 1' },
  { code: 'CL', id: 2, name: 'CHAMPIONS LEAGUE' },
];

function MatchList() {
  const navigate = useNavigate();
  // matchGroupsではなく、単純なリストで管理
  const [matches, setMatches] = useState([]);
  // 日付管理（初期値は今日）
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isLoading, setIsLoading] = useState(true);
  const [allOpen, setAllOpen] = useState(false);

  const [isLeagueSelectorOpen, setIsLeagueSelectorOpen] = useState(false);

  // 初期リーグID（プレミアリーグ: 39）
  const [currentLeagueId, setCurrentLeagueId] = useState(39);



  //1. 試合データを取得（日付またはリーグが変わるたびに実行）
  useEffect(() => {
    setIsLoading(true);
    const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY;
    // 日付を YYYY-MM-DD 形式に変換
    const dateStr = currentDate.toISOString().split('T')[0];

    fetch(`https://v3.football.api-sports.io/fixtures?date=${dateStr}`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-apisports-key': API_KEY
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('APIリクエストに失敗しました');
        return res.json();
      })
      .then(data => {
        // 選択中のリーグIDでフィルタリング
        const filtered = data.response.filter(item => item.league.id === currentLeagueId);
        // UI用にフォーマット
        const formatted = filtered.map(item => ({
          id: item.fixture.id,
          homeId: item.teams.home.id,
          home: item.teams.home.name,
          homeLogo: item.teams.home.logo,
          awayId: item.teams.away.id,
          away: item.teams.away.name,
          awayLogo: item.teams.away.logo,
          score: item.goals.home !== null
            ? `${item.goals.home} - ${item.goals.away}`
            : "試合前",
          date: item.fixture.date,
          status: item.fixture.status.short // 'FT', 'NS' など
        }));

        setMatches(formatted);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [currentDate, currentLeagueId]);

  // 日付操作関数
  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  // リーグ選択時の処理
  const handleSelectLeague = (id) => {
    setCurrentLeagueId(id);
    setIsLeagueSelectorOpen(false);
  };

  // 表示用データ
  const currentCompInfo = LEAGUES.find(l => l.id === currentLeagueId);
  const displayDateStr = currentDate.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', weekday: 'short'
  }).toUpperCase();

  console.log("Current League ID:", currentLeagueId);
  console.log("Current Comp Info:", currentCompInfo);
  console.log("Matches:", matches);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 text-center">
          <h1 className="text-lg font-black text-blue-600 tracking-tighter">
            ⚽ {currentCompInfo?.name || 'FOOTBALL'}
          </h1>
          {/* CompetitionSelectorは、propsのインターフェースを合わせる必要あり */}
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
            <p className="text-gray-400 font-bold text-xs">LOADING...</p>
          </div>
        ) : (
          <div className="px-4">
            {/* 日付ナビゲーションエリア */}
            <div className="max-w-md mx-auto mb-4 flex items-center justify-between border-b border-gray-200 pb-2">

              <div className="flex items-center gap-4">
                {/* 前へボタン */}
                <button
                  onClick={handlePrevDay}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-blue-100 transition-all"                >
                  ◀
                </button>

                <div className="text-center w-24"> {/* 幅を指定してガタつき防止 */}
                  <h2 className="text-xl font-black text-gray-800 italic leading-none">
                    {displayDateStr}
                  </h2>
                </div>

                {/* 次へボタン */}
                <button
                  onClick={handleNextDay}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-blue-100 transition-all"                >
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
            {matches.length > 0 ? (
              matches.map(match => (
                <MatchCard
                  key={match.id}
                  {...match} // オブジェクトを展開して渡す
                  homeTeam={match.home} // props名を合わせる
                  awayTeam={match.away}
                  allOpen={allOpen}
                  onScoreClick={() => navigate(`/match/${match.id}`, { state: { matchData: match } })}
                />
              ))
            ) : (
              <div className="text-center text-gray-400 mt-10">
                <p>NO MATCHES</p>
                <p className="text-xs">ON THIS DAY</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- モーダルエリア --- */}

      {/* リーグ選択モーダル（コンポーネント化済み） */}
      <CompetitionModal
        isOpen={isLeagueSelectorOpen}
        onClose={() => setIsLeagueSelectorOpen(false)}
        competitions={LEAGUES}
        currentId={currentLeagueId}
        onSelect={handleSelectLeague}
        isLoading={false}
      />

    </div>
  );
}

export default MatchList;