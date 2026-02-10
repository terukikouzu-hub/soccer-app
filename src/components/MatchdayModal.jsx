// src/components/MatchdayModal.jsx

function MatchdayModal({ isOpen, onClose, days, currentDay, onSelect }) {
  if (!isOpen) return null;

  return(
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
        {/* 白いボックス */}
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
            
            {/* メニューヘッダー */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-black text-gray-700 text-sm">SELECT MATCHDAY</h3>
              <button 
                onClick={() => setIsMatchdaySelectorOpen(false)}
                className="text-gray-400 hover:text-gray-800 font-bold text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* グリッド表示エリア（スクロール可能） */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-5 gap-2">
                {days.map(day => (
                  <button
                    key={day}
                    onClick={() => onSelect(day)}
                    className={`
                      h-10 rounded-lg font-bold text-sm transition-all
                      ${Number(day) === currentDay
                        ? 'bg-blue-600 text-white shadow-md scale-105' // 選択中は青
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600' // その他はグレー
                      }
                    `}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* 背景クリックでも閉じるための透明なレイヤー */}
          <div className="absolute inset-0 -z-10" onClick={() => setIsMatchdaySelectorOpen(false)}></div>
        </div>
        
    );

}

export default MatchdayModal;