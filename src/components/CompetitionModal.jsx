// src/components/CompetitionModal.jsx

function CompetitionModal({ isOpen, onClose, competitions, currentId, onSelect, isLoading }) {
  // 開いていないときは何も表示しない（nullを返す）
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">

      {/* 白いボックス本体 */}
      <div className="bg-white w-[90%] max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slideUp max-h-[70vh] flex flex-col">

        {/* ヘッダー部分（固定） */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h3 className="font-black text-gray-700 text-sm">SELECT LEAGUE</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* リスト表示部分（スクロール可能） */}
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          {isLoading ? (
            <div className="text-center text-xs text-gray-400 py-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {competitions.map(comp => (
                <button
                  key={comp.id}
                  onClick={() => onSelect(comp.code)}
                  className={`
                    flex flex-col items-center justify-center p-3 h-28 rounded-xl transition-all
                    ${comp.code === currentId
                      ? 'bg-blue-50 border-2 border-blue-500 shadow-sm' // 選択中
                      : 'bg-gray-50 hover:bg-white hover:shadow-md border border-gray-100' // 未選択
                    }
                  `}
                >
                  <div className="w-10 h-10 mb-2 flex items-center justify-center">
                    <img
                      src={`https://media.api-sports.io/football/leagues/${comp.id}.png`}
                      alt={comp.name}
                      className="w-full h-full object-contain"
                      onError={(e) => e.target.style.display = 'none'} // エラー時は非表示
                    />
                  </div>
                  <span className={`text-[10px] font-bold text-center leading-tight ${comp.code === currentId ? 'text-blue-700' : 'text-gray-700'}`}>
                    {comp.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 背景クリックでも閉じる機能 */}
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
}

export default CompetitionModal;