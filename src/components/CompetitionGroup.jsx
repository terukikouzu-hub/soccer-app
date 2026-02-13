import { useState } from 'react';
import MatchCard from './MatchCard';

function CompetitionGroup({ league, matches, isOpen, onToggle, onMatchClick }) {
  // スコア表示の状態管理 (初期値 false)
  const [isScoreVisible, setIsScoreVisible] = useState(false);

  // 進行中または終了した試合があるかチェック
  const hasStartedMatches = matches.some(m => 
    !['NS', 'TBD', 'P', 'C'].includes(m.status)
  );

  // ボタンを有効にする条件: 「試合が始まっている」かつ「まだ表示していない」
  const isButtonActive = hasStartedMatches && !isScoreVisible;

  return (
    <div 
      id={`league-${league.id}`}
      className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4 scroll-mt-[180px]"
    >
      {/* アコーディオンヘッダー */}
      <div className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        
        {/* 左側: リーグ情報 & 開閉アクションエリア */}
        <button 
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <div className="w-8 h-8 bg-white rounded-full border border-gray-200 flex items-center justify-center p-1">
             <img src={league.logo} alt={league.name} className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm leading-tight">{league.name}</h3>
            <span className="text-[10px] text-gray-500">{league.country}</span>
          </div>
        </button>
        
        {/* 右側: スコア表示ボタン & 矢印 */}
        <div className="flex items-center gap-3">
            
            {/* ★修正: スコア表示ボタン */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (isButtonActive) {
                        setIsScoreVisible(true);
                    }
                }}
                disabled={!isButtonActive} // 試合前 or 表示済み なら押せない
                className={`
                    text-[10px] font-bold px-2 py-1 rounded border transition-colors
                    ${isButtonActive 
                        ? 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer shadow-sm' // 押せる時(青)
                        : 'bg-gray-50 text-gray-300 border-gray-200 cursor-default'} // 押せない時(グレー)
                `}
            >
                {/* 状態に応じてテキストも変更（任意ですが分かりやすさのため） */}
                {isScoreVisible ? '表示済み' : 'スコア表示'}
            </button>

            {/* 開閉状態の矢印 */}
            <button onClick={onToggle} className="p-1">
                <span className={`block text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>
        </div>
      </div>

      {/* 試合リスト */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-2 bg-gray-50/50">
            {matches.map(match => (
            <MatchCard 
                key={match.id} 
                {...match} 
                homeTeam={match.home} 
                awayTeam={match.away} 
                allOpen={isScoreVisible}
                onScoreClick={() => onMatchClick(match)}
            />
            ))}
        </div>
      </div>
    </div>
  );
}

export default CompetitionGroup;