// src/components/MatchCard.jsx
import { useState, useEffect } from 'react';
//import { Link } from 'react-router-dom';
import TeamBadge from './TeamBadge';

function MatchCard({ id, homeId, homeTeam, homeLogo, awayId, awayTeam, awayLogo, score, date, allOpen, status, onScoreClick }) {
  const [isIndividualOpen, setIsIndividualOpen] = useState(false);

  useEffect(() => {
    setIsIndividualOpen(allOpen);
  }, [allOpen]);

  // 終了: FT(Full Time), AET(延長), PEN(PK)
  const isFinished = ['FT', 'AET', 'PEN'].includes(status);
  
  // 延期・中止: PST(Postponed), CANC(Cancelled), ABD(Abandoned)
  const isPostponed = ['PST', 'CANC', 'ABD'].includes(status);
  
  // ライブ中: 1H(前半), HT(ハーフタイム), 2H(後半), ET(延長中), P(PK中)
  const isLive = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status);

  // 試合前: NS(Not Started), TBD(Time to be defined)
  const isScheduled = ['NS', 'TBD'].includes(status);

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
                <div
                  onClick={onScoreClick}
                  className="w-full h-8 rounded-md font-black text-lg text-gray-800 bg-transparent border border-gray-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all text-center group flex items-center justify-center gap-1 cursor-pointer"
                >
                  {score}
                </div>
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
          ) : isLive ? (
            /* 試合中 */
            <div className="w-full h-8 rounded-md bg-red-50 text-red-600 border border-red-100 flex items-center justify-center gap-1">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[11px] font-bold">試合中</span>
            </div>
          ) : isPostponed ? (
            /* 延期 */
            <div className="w-full h-8 rounded-md bg-gray-100 text-gray-400 text-[11px] font-bold border border-gray-200 flex items-center justify-center pt-[1px]">
              延期
            </div>
          ) : (
            /* 試合前 (NSなど) */
            <div className="w-full h-8 rounded-md bg-gray-50 text-gray-400 text-[11px] font-bold border border-gray-100 flex items-center justify-center pt-[1px]">
              試合前
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