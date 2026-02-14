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
    <div className="sticky top-[100px] z-30 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="flex w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 py-3 text-sm font-bold transition-colors relative outline-none
              ${activeTab === tab.id 
                ? 'text-blue-600' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            {tab.label}
            
            {/* アクティブなタブの下に青い線を表示 */}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-blue-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MatchTabs;