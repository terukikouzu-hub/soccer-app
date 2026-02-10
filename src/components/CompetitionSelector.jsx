// src/components/CompetitionSelector.jsx

function CompetitionSelector({ currentComp, onClick }) {
  
  // データがロードされる前や、万が一見つからない場合のダミーデータ
  const displayComp = currentComp || {
    name: 'Loading...',
    area: { name: '' },
    emblem: null
  };

  return (
    <button 
      onClick={onClick} // クリックされたら親の関数（モーダルを開く処理）を実行
      className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 shadow-sm rounded-full text-xs font-bold text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all mx-auto mt-2"
    >
      {/* エンブレム（あれば表示、なければロード中の丸） */}
      {displayComp.emblem ? (
        <img src={displayComp.emblem} alt="" className="w-4 h-4 object-contain" />
      ) : (
        <span className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></span>
      )}
      
      {/* 国名とリーグ名 */}
      <span className="flex flex-col items-start leading-none">
        <span className="text-[8px] text-gray-400 font-normal mb-0.5">
          {displayComp.area.name}
        </span>
        <span>{displayComp.name}</span>
      </span>
      
      <span className="text-[8px] text-gray-400 ml-1">▼</span>
    </button>
  );
}

export default CompetitionSelector;