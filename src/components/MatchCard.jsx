import { useState, useEffect } from 'react';

function MatchCard({ homeTeam, awayTeam, score, date, homeLogo, awayLogo, allOpen }) {
  // 個別で開閉するための状態
  const [isIndividualOpen, setIsIndividualOpen] = useState(false);

  // 全表示ボタンが押された（allOpenが変わった）ら、個別の状態もそれに合わせる
  useEffect(() => {
    setIsIndividualOpen(allOpen);
  }, [allOpen]);

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
        <div className="flex flex-col items-center w-[30%]">
          <img src={homeLogo} alt="" className="w-6 h-6 mb-0.5 object-contain" />
          <p className="text-[9px] font-black text-gray-800 text-center truncate w-full px-1">{homeTeam}</p>
        </div>

        <div className="flex flex-col items-center w-[40%] px-1">
          <div className="text-[9px] font-black text-gray-500 mb-1 bg-gray-50 px-2 py-0.5 rounded-full scale-90">
            {getDisplayDate(date)}
          </div>
          
          <button 
            onClick={() => setIsIndividualOpen(!isIndividualOpen)}
            className={`
              w-full py-1.5 rounded-md font-bold transition-all duration-300
              ${isIndividualOpen 
                ? 'bg-transparent text-gray-700 border border-gray-100 text-sm' 
                : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 text-[11px]'
              }
            `}
          >
            {isIndividualOpen ? score : "スコアを表示"}
          </button>
        </div>

        <div className="flex flex-col items-center w-[30%]">
          <img src={awayLogo} alt="" className="w-6 h-6 mb-0.5 object-contain" />
          <p className="text-[9px] font-black text-gray-800 text-center truncate w-full px-1">{awayTeam}</p>
        </div>
      </div>
    </div>
  );
}

export default MatchCard;