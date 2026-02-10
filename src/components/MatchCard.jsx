// src/components/MatchCard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TeamBadge from './TeamBadge';

function MatchCard({ id, homeId, homeTeam, homeLogo, awayId, awayTeam, awayLogo, score, date, allOpen, status }) {
  const [isIndividualOpen, setIsIndividualOpen] = useState(false);

  useEffect(() => {
    setIsIndividualOpen(allOpen);
  }, [allOpen]);

  // 試合が終了しているか判定（FINISHED 以外は試合前・中とみなす）
  const isFinished = status === 'FINISHED';
  const isPostponed = status === 'POSTPONED';

  const getDisplayDate = (dateString) => {
    const matchDate = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const timeStr = matchDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    
    if (matchDate.toDateString() === today.toDateString()) return `今日 ${timeStr}`;
    if (matchDate.toDateString() === tomorrow.toDateString()) return `明日 ${timeStr}`;
    return `${matchDate.getMonth() + 1}/${matchDate.getDate()} ${timeStr}`;
  };

  return (
    <div className="max-w-md mx-auto my-1.5 overflow-hidden bg-white rounded-lg shadow-sm border border-gray-100 transition-all hover:bg-gray-50">
      <div className="p-2 flex items-center justify-between gap-1">
        {/* 1. 左チーム (Home) */}
        <div className={`w-[30%] ${isPostponed ? 'opacity-50 pointer-events-none' : ''}`}>
          <TeamBadge 
            teamId={homeId} 
            teamName={homeTeam} 
            teamLogo={homeLogo} 
          />
        </div>
        
        {/* 2. 中央：日時 / スコア表示 */}
        <div className="flex flex-col items-center w-[40%] px-1">
          <div className="text-[9px] font-black text-gray-500 mb-1 bg-gray-50 px-2 py-0.5 rounded-full scale-90">
            {getDisplayDate(date)}
          </div>
          
          {/* 条件分岐：試合終了しているか？ */}
          {isFinished ? (
            <>
              {/* さらに条件分岐：スコアが開いているか？ */}
              {isIndividualOpen ? (
                // ★ 開いている場合：詳細画面へのリンクを表示
                <Link 
                  to={`/match/${id}`} 
                  className="w-full h-8 rounded-md font-black text-lg text-gray-800 bg-transparent border border-gray-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all text-center group flex items-center justify-center gap-1"
                >
                  {score}
                </Link>
              ) : (
                // ★ 閉じている場合：「スコアを表示」ボタン（押すと開くだけ）
                <button 
                  onClick={() => setIsIndividualOpen(true)}
                  className="w-full h-8 rounded-md font-bold bg-blue-600 text-white shadow-sm hover:bg-blue-700 text-[11px] transition-all flex items-center justify-center pt-[1px]"
                >
                  スコアを表示
                </button>
              )}
            </>
          ) : (
            // 試合前または延期の場合
            <div className="w-full h-8 rounded-md bg-gray-100 text-gray-400 text-[11px] font-bold border border-gray-50 flex items-center justify-center pt-[1px]">              {isPostponed ? "延期" : "試合前"}
            </div>
          )}
        </div>

        {/* 3. 右チーム (Away) */}
        <div className={`w-[30%] ${isPostponed ? 'opacity-50 pointer-events-none' : ''}`}>
          <TeamBadge 
            teamId={awayId} 
            teamName={awayTeam} 
            teamLogo={awayLogo} 
          />
        </div>
      </div>
    </div>
  );
}

export default MatchCard;