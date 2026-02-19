import React from 'react';
import PlayerAvatar from './PlayerAvatar'; // インポートを追加

// ポジションの日本語マッピング
const POSITION_MAP = {
  'Attacker': 'FW',
  'Midfielder': 'MF',
  'Defender': 'DF',
  'Goalkeeper': 'GK'
};

function SquadList({ squad }) {
  if (!squad || squad.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400 font-bold">
        選手データが見つかりません
      </div>
    );
  }

  // ポジションごとにグループ化
  const groupedSquad = squad.reduce((acc, player) => {
    const pos = player.position || 'Unknown';
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(player);
    return acc;
  }, {});

  const positions = ['Attacker','Midfielder', 'Defender', 'Goalkeeper'];

  return (
    <div className="flex flex-col gap-4 pb-6">
      {positions.map(posKey => (
        groupedSquad[posKey] && (
          <div key={posKey}>
            {/* ポジションの見出し - スポーツアプリらしいアクセント */}
            <h2 className="text-[10px] font-black text-blue-600 italic uppercase tracking-[0.3em] mb-4 flex items-center gap-2 px-1">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              {POSITION_MAP[posKey]}
              <span className="flex-grow h-[1px] bg-gray-100"></span>
            </h2>

            {/* 選手リスト */}
            <div className="grid gap-1">
              {groupedSquad[posKey].map(player => (
                <div 
                  key={player.id} 
                  className="bg-white py-2 px-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 transition-transform active:scale-[0.98] cursor-pointer"
                >
                  {/* 左側: PlayerAvatarを使用 */}
                  <PlayerAvatar 
                    src={player.photo} 
                    alt={player.name} 
                    size="md" 
                    className="flex-shrink-0"
                  />

                  {/* 右側: 名前 / 背番号 / ポジション / 国籍 */}
                  <div className="flex flex-col flex-grow min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      {/* 背番号 */}
                      <span className="text-xs font-black text-blue-500 italic">
                        {player.number ? `${player.number}` : '--'}
                      </span>
                      {/* 名前 */}
                      <h3 className="text-sm font-black text-gray-900 uppercase italic">
                        {player.name}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {/* ポジション詳細 */}
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter bg-gray-100 px-2 py-0.5 rounded-full">
                        {player.position}
                      </span>
                      {/* 国籍 */}
                      <span className="text-[9px] font-bold text-gray-400 uppercase">
                         {player.nationality || 'Unknown'}
                      </span>
                      {/* 年齢 */}
                      <span className="text-[9px] font-bold text-gray-400">
                        AGE: {player.age}
                      </span>
                    </div>
                  </div>
                  
                  {/* 右端の矢印（詳細への期待感を出す装飾） */}
                  <div className="text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}

export default SquadList;