//MatchTabs.jsx
import React from 'react';

const MatchTabs = ({ activeTab, onTabChange }) => {
  // タブの定義 (将来項目が増えたらここに追加するだけでOK)
  const tabs = [
    { id: 'lineup', label: 'ラインナップ' },
    { id: 'formation', label: 'フォーメーション' },
  ];

  return (
    // ヘッダーの下に配置することを想定したコンテナ
    <div className="bg-white/80 backdrop-blur-md border-t border-b border-gray-100">
      <div className="flex w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 relative py-4 text-[11px] font-black uppercase italic tracking-wider transition-all text-center flex items-center justify-center
              ${activeTab === tab.id 
                ? 'text-blue-600 scale-105' 
                : 'text-gray-400 hover:text-gray-600'
              }
            `}
          >
            {tab.label}
            
            {/* アクティブなタブの下に青い線を表示 */}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.3)]"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MatchTabs;