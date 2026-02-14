//Formation.jsx
import React from 'react';
import PitchBackground from './PitchBackground';
import FormationPlayer from './FormationPlayer';

// 片側のチーム配置を担当する内部コンポーネント
const TeamLayer = ({ lineup, playersStats, events, isHome }) => {
  if (!lineup || !lineup.startXI) return <div className="w-full h-1/2"></div>;

  const { startXI } = lineup;

  // グリッド解析 (1:GK, 2:DF, 3:MF, 4:FW)
  const rows = {};
  startXI.forEach(item => {
    let rowIdx = 1;
    if (item.player.grid) {
      const [r] = item.player.grid.split(':');
      rowIdx = parseInt(r, 10);
    } else {
      const pos = item.player.pos;
      if (pos === 'G') rowIdx = 1;
      if (pos === 'D') rowIdx = 2;
      if (pos === 'M') rowIdx = 3;
      if (pos === 'F') rowIdx = 4;
    }
    if (!rows[rowIdx]) rows[rowIdx] = [];
    rows[rowIdx].push(item.player);
  });

  const sortedRows = Object.keys(rows).sort((a, b) => a - b).map(key => rows[key]);

  return (
    // ★変更点: 縦配置用のクラス
    // w-full h-1/2 : 上下の半分ずつ
    // flex-col : 行を縦に並べる
    // pb-8 / pt-8 : センターライン付近の余白
    <div 
        className={`
            flex w-full h-1/2 
            ${isHome ? 'flex-col pb-8' : 'flex-col-reverse pt-8'} 
        `}
    >
      {sortedRows.map((lineupPlayers, idx) => (
        // 各「行」の中は横並び (flex-row)
        <div key={idx} className="flex-1 flex flex-row justify-around items-center w-full px-4">
          {lineupPlayers.map((lineupPlayer) => {
            
            const detail = playersStats?.find(p => p.player.id === lineupPlayer.id);
            const photoUrl = detail?.player?.photo;
            const rating = detail?.statistics?.[0]?.games?.rating;

            const playerForDisplay = {
              ...lineupPlayer,
              photo: photoUrl,
              statistics: detail?.statistics
            };

            return (
              <FormationPlayer 
                key={lineupPlayer.id} 
                player={playerForDisplay} 
                rating={rating}
                events={events}
                isHome={isHome} 
                onClick={() => console.log("Player clicked:", lineupPlayer.name)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

// メインコンポーネント
function Formation({ homeLineup, awayLineup, homeStats, awayStats, events }) {
  if (!homeLineup && !awayLineup) return null;

  return (
    // 横幅制限を強め(max-w-mdなど)、縦長に見せる
    <div className="w-full max-w-md mx-auto my-4 px-2">
      
      {/* チーム名などのヘッダーは削除済み */}

      {/* ピッチ全体: アスペクト比を縦長 (aspect-[2/3] や aspect-[3/4]) に変更 */}
      <div className="relative w-full aspect-[2/3] shadow-2xl rounded-lg overflow-hidden bg-[#2e8b57]">
        {/* 背景描画 */}
        <PitchBackground />

        {/* 選手配置: 上下に並べる (flex-col) */}
        <div className="absolute inset-0 flex flex-col">
          {/* 上半分: ホーム */}
          <TeamLayer 
            lineup={homeLineup} 
            playersStats={homeStats} 
            events={events}
            isHome={true} 
          />
          {/* 下半分: アウェイ */}
          <TeamLayer 
            lineup={awayLineup} 
            playersStats={awayStats} 
            events={events}
            isHome={false} 
          />
        </div>
      </div>
    </div>
  );
}

export default Formation;