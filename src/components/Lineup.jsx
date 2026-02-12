function Lineup({ lineups }) {
  // データがまだない、または発表されていない場合
  if (!lineups || lineups.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400 text-xs">
        LINEUPS NOT AVAILABLE YET
      </div>
    );
  }

  const home = lineups[0];
  const away = lineups[1];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-4 animate-slideUp">
      <h3 className="text-center font-black text-gray-700 mb-4 text-sm tracking-widest">
        LINEUPS
      </h3>

      {/* フォーメーション表示 */}
      <div className="flex justify-between items-center mb-6 px-4">
        <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
          {home.formation}
        </div>
        <div className="text-[10px] text-gray-400 font-bold">FORMATION</div>
        <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
          {away.formation}
        </div>
      </div>

      {/* 2カラムレイアウト */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* --- HOME TEAM (左側) --- */}
        <div className="border-r border-gray-100 pr-2">
          {/* 監督 */}
          <div className="mb-4 text-xs">
            <span className="text-gray-400 block text-[9px] font-bold">COACH</span>
            <span className="font-bold text-gray-800">{home.coach.name}</span>
          </div>

          {/* スタメン */}
          <div className="space-y-2 mb-6">
            <div className="text-[9px] font-bold text-gray-400 mb-1">STARTING XI</div>
            {home.startXI.map((item) => (
              <div key={item.player.id} className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-blue-600 w-4 text-right">
                  {item.player.number}
                </span>
                <span className="font-medium text-gray-700 truncate">
                  {item.player.name}
                </span>
              </div>
            ))}
          </div>

          {/* ベンチ */}
          <div className="space-y-1">
            <div className="text-[9px] font-bold text-gray-400 mb-1">SUBS</div>
            {home.substitutes.map((item) => (
              <div key={item.player.id} className="flex items-center gap-2 text-[10px] text-gray-500">
                <span className="font-mono w-4 text-right">{item.player.number}</span>
                <span className="truncate">{item.player.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- AWAY TEAM (右側・文字右寄せ) --- */}
        <div className="pl-2 text-right">
          {/* 監督 */}
          <div className="mb-4 text-xs">
            <span className="text-gray-400 block text-[9px] font-bold">COACH</span>
            <span className="font-bold text-gray-800">{away.coach.name}</span>
          </div>

          {/* スタメン */}
          <div className="space-y-2 mb-6">
            <div className="text-[9px] font-bold text-gray-400 mb-1">STARTING XI</div>
            {away.startXI.map((item) => (
              <div key={item.player.id} className="flex items-center justify-end gap-2 text-xs">
                <span className="font-medium text-gray-700 truncate">
                  {item.player.name}
                </span>
                <span className="font-mono font-bold text-red-500 w-4 text-left">
                  {item.player.number}
                </span>
              </div>
            ))}
          </div>

          {/* ベンチ */}
          <div className="space-y-1">
            <div className="text-[9px] font-bold text-gray-400 mb-1">SUBS</div>
            {away.substitutes.map((item) => (
              <div key={item.player.id} className="flex items-center justify-end gap-2 text-[10px] text-gray-500">
                <span className="truncate">{item.player.name}</span>
                <span className="font-mono w-4 text-left">{item.player.number}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Lineup;