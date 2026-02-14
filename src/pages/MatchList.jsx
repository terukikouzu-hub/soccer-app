// src/pages/MatchList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ページ遷移用
//import MatchCard from '../components/MatchCard';
import LeagueNav from '../components/LeagueNav';
import CompetitionGroup from '../components/CompetitionGroup';
//import CompetitionSelector from '../components/CompetitionSelector';
//import CompetitionModal from '../components/CompetitionModal';
//import MatchdayModal from '../components/MatchdayModal';

// 表示したいコンペティションの定義
const TARGET_LEAGUES = {
  // 欧州・国際 (優先度高)
  2: { code: 'CL', priority: 2 },       // Champions League
  1: { code: 'WC', priority: 9 },       // World Cup
  3: { code: 'EL', priority: 10 },       // Europa League
  39: { code: 'PL', priority: 1 },      // Premier League
  140: { code: 'LIGA', priority: 6 },   // La Liga
  135: { code: 'SERIE', priority: 7 },  // Serie A
  78: { code: 'BL', priority: 5 },      // Bundesliga
  61: { code: 'L1', priority: 8 },      // Ligue 1
  
  // 欧州その他
  848: { code: 'ECL', priority: 9 },    // Conference League
  5: { code: 'UNL', priority: 10 },     // Nations League
  4: { code: 'EURO', priority: 11 },    // Euro

  // 南米
  9: { code: 'COPA', priority: 12 },    // Copa America

  // 国内カップ戦など
  45: { code: 'FAC', priority: 3 },    // FA Cup
  48: { code: 'CAR', priority: 4 },    // Carabao Cup
  143: { code: 'CDR', priority: 15 },   // Copa del Rey
  137: { code: 'COI', priority: 16 },   // Coppa Italia
  81: { code: 'DFB', priority: 17 },    // DFB Pokal
  66: { code: 'CDF', priority: 18 },    // Coupe de France
  40: { code: 'CHA', priority: 19 },    // Championship

  // 日本
  98: { code: 'J1', priority: 20 },     // J1 League
  99: { code: 'J2', priority: 21 },     // J2 League
  101: { code: 'JLC', priority: 22 },   // J.League Cup
  102: { code: 'EMP', priority: 23 },   // 天皇杯
};

function MatchList() {
  const navigate = useNavigate();

  // フラットな試合データではなく、グループ化されたデータを持つ
  const [groupedMatches, setGroupedMatches] = useState([]);
  const [activeLeagues, setActiveLeagues] = useState([]); // その日試合があるリーグ一覧(Nav用)
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // アコーディオンの開閉状態管理 { leagueId: boolean }
  const [openStates, setOpenStates] = useState({});

  // リーグナビの表示状態 (デフォルトfalse = 非表示)
  const [isNavOpen, setIsNavOpen] = useState(false);

  //1. 試合データを取得（日付またはリーグが変わるたびに実行）
  useEffect(() => {
    setIsLoading(true);
    const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY;

    // APIリクエスト用の日付文字列 (UTCベースでもJSTベースでも、API側が解釈できる形式で送る)
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // APIには「日本時間」を要求する
    const userTimezone = 'Asia/Tokyo';

    fetch(`https://v3.football.api-sports.io/fixtures?date=${dateStr}&timezone=${userTimezone}`, {
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
        if (!data.response) {
            setGroupedMatches([]);
            setActiveLeagues([]);
            setIsLoading(false);
            return;
        }

        // ★★★ ここが最強のフィルタリングロジックです ★★★
        // 1. ユーザーが選択している「日本時間での年月日」を取得
        // toLocaleStringを使うことで、ブラウザの内部時間に左右されず強制的にJSTへ変換して取得
        const targetDateJST = new Date(currentDate.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
        const targetY = targetDateJST.getFullYear();
        const targetM = targetDateJST.getMonth();
        const targetD = targetDateJST.getDate();

        // 2. データを整形しつつフィルタリング
        const formatted = data.response
          .filter(item => {
            // 試合開始時間 (UTC) を取得
            const matchDateUTC = new Date(item.fixture.date);
            
            // それを「日本時間」に変換したときの日付を取得
            const matchDateJST = new Date(matchDateUTC.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
            
            // 年・月・日が完全に一致するかチェック
            const isSameDay = 
                matchDateJST.getFullYear() === targetY &&
                matchDateJST.getMonth() === targetM &&
                matchDateJST.getDate() === targetD;

            return isSameDay;
          }).map(item => ({
          id: item.fixture.id,
          leagueId: item.league.id,
          leagueName: item.league.name,
          leagueLogo: item.league.logo,
          leagueCountry: item.league.country,
          homeId: item.teams.home.id,
          home: item.teams.home.name,
          homeLogo: item.teams.home.logo,
          awayId: item.teams.away.id,
          away: item.teams.away.name,
          awayLogo: item.teams.away.logo,
          score: item.goals.home !== null ? `${item.goals.home} - ${item.goals.away}` : "VS",
          date: item.fixture.date,
          status: item.fixture.status.short
        }));

        // 2. リーグごとにグループ化 (TARGET_LEAGUESに含まれるものだけ)
        const groups = {};

        formatted.forEach(match => {
           // 定義済みリストにあるリーグのみ抽出
           if (TARGET_LEAGUES[match.leagueId]) {
               if (!groups[match.leagueId]) {
                   groups[match.leagueId] = {
                       id: match.leagueId,
                       name: match.leagueName,
                       logo: match.leagueLogo,
                       country: match.leagueCountry,
                       code: TARGET_LEAGUES[match.leagueId].code,
                       priority: TARGET_LEAGUES[match.leagueId].priority,
                       matches: []
                   };
               }
               groups[match.leagueId].matches.push(match);
           }
        });

        // 3. 優先度順にソート
        const sortedGroups = Object.values(groups).sort((a, b) => a.priority - b.priority);

        setGroupedMatches(sortedGroups);
        setActiveLeagues(sortedGroups.map(g => ({ id: g.id, name: g.name, logo: g.logo, code: g.code })));

        // 4. 初期状態で全て開く
        const initialOpenState = {};
        sortedGroups.forEach(g => { initialOpenState[g.id] = true; });
        setOpenStates(initialOpenState);

        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [currentDate]);

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

  // 全開閉ボタン用
  const isAllOpen = Object.values(openStates).every(v => v === true);
  const toggleAll = () => {
    const newState = {};
    groupedMatches.forEach(g => { newState[g.id] = !isAllOpen; });
    setOpenStates(newState);
  };

  // アコーディオン個別切替
  const toggleAccordion = (leagueId) => {
    setOpenStates(prev => ({ ...prev, [leagueId]: !prev[leagueId] }));
  };

  // リーグナビクリック時のスクロール処理
  const scrollToLeague = (leagueId) => {
    const element = document.getElementById(`league-${leagueId}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // 閉じていたら開く
        if (!openStates[leagueId]) {
            setOpenStates(prev => ({ ...prev, [leagueId]: true }));
        }
    }
    // 選択したらメニューを閉じる
    setIsNavOpen(false);
  };

  const displayDateStr = currentDate.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', weekday: 'short'
  }).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Header全体を sticky top-0 にして、その中に「タイトル」「日付」「全開閉」「リーグナビ」を全部入れる*/}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200">
        
        {/* 1. タイトルエリア */}
        <div className="max-w-md mx-auto px-4 py-2 text-center border-b border-gray-100">
          <h1 className="text-lg font-black text-blue-600 tracking-tighter">
            FOOTBALL SCORE
          </h1>
        </div>

        {/* 2. 日付 & リーグ選択トグル */}
        <div className="relative flex items-center justify-center py-2 max-w-md mx-auto">
            {/* 日付操作 (中央) */}
            <div className="flex items-center gap-6">
                <button 
                    onClick={handlePrevDay} 
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-blue-50 transition-all active:scale-95"
                >
                    ◀
                </button>
                
                <h2 className="text-s font-black text-gray-800 italic leading-none whitespace-nowrap min-w-[140px] text-center">
                    {displayDateStr}
                </h2>
                
                <button 
                    onClick={handleNextDay} 
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-blue-50 transition-all active:scale-95"
                >
                    ▶
                </button>
            </div>

            {/* ★追加: リーグメニュー開閉ボタン (右端に配置) */}
            <button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className={`absolute right-4 text-[10px] font-bold px-2 py-1 rounded border transition-colors ${
                    isNavOpen 
                    ? 'bg-blue-50 text-blue-600 border-blue-200' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
            >
                リーグを選択
            </button>
        </div>

        {/* 3. リーグナビ (条件付きレンダリング) */}
        {/* isNavOpen が true の時だけ表示 */}
        {isNavOpen && !isLoading && groupedMatches.length > 0 && (
            <div className="border-t border-gray-100 animate-slideDown origin-top">
                <LeagueNav leagues={activeLeagues} onLeagueClick={scrollToLeague} />
                
                {/* 閉じるための簡易バー（お好みで） */}
                <div 
                    onClick={() => setIsNavOpen(false)}
                    className="w-full h-4 bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100"
                >
                     <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                </div>
            </div>
        )}
      </header>

      <main className="pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center mt-20">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-gray-400 font-bold text-xs">LOADING MATCHES...</p>
          </div>
        ) : (
          <div className="px-4 max-w-md mx-auto">
            {groupedMatches.length > 0 ? (
                groupedMatches.map(group => (
                    <CompetitionGroup 
                        key={group.id}
                        league={group}
                        matches={group.matches}
                        isOpen={openStates[group.id]}
                        onToggle={() => toggleAccordion(group.id)}
                        onMatchClick={(match) => navigate(`/match/${match.id}`, { state: { matchData: match } })}
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
    </div>
  );
}

export default MatchList;