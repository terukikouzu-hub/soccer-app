import React from 'react';

function TeamTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'schedule', label: '日程' },
    { id: 'squad', label: '選手' },
    { id: 'results', label: '戦績' },
    { id: 'standings', label: '順位' },
    { id: 'stats', label: 'スタッツ' },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            // text-center を追加して文字を中央へ。
            // さらに flex items-center justify-center を念のため追加して完璧に中央に固定します。
            className={`flex-1 relative py-4 text-[11px] font-black uppercase italic tracking-wider transition-all text-center flex items-center justify-center
              ${activeTab === tab.id 
                ? 'text-blue-600 scale-105' 
                : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            {tab.label}
            
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.3)]"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TeamTabs;