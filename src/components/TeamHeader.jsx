
import React from 'react';
import TeamTabs from './TeamTabs';

function TeamHeader({ teamInfo, loading, onTabChange, activeTab }) {
  // ロード中（スケルトンも横並びに合わせます）
  if (loading || !teamInfo) {
    return (
      <div className="fixed top-0 left-0 z-30 bg-white border-b border-gray-100">
        <div className="pt-14 pb-6 px-6 flex items-center justify-center gap-5 animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
          <div className="flex flex-col gap-2">
            <div className="h-3 w-20 bg-gray-200 rounded"></div>
            <div className="h-5 w-40 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="h-12 bg-gray-50 animate-pulse"></div>
      </div>
    );
  }

  const { team } = teamInfo;

  return (
    <div className="fixed top-0 left-0 w-full z-30 bg-white shadow-sm">
      
      {/* 2. ご提示のデザイン（一切変更なし） */}
      <div className="bg-white pt-8 pb-8 px-6 border-b border-gray-100 flex items-center justify-center gap-6 relative overflow-hidden">
        {/* 背景エンブレム（配置を少し右に調整） */}
        <img 
          src={team.logo} 
          alt="" 
          className="absolute w-48 h-48 opacity-[0.2] -right-5 -bottom-5 pointer-events-none"
        />

        {/* 1. エンブレム (左側) */}
        <div className="relative z-10 w-22 h-22 flex items-center justify-center">
          <img 
            src={team.logo} 
            alt={team.name} 
            className="max-w-full max-h-full object-contain drop-shadow-sm"
          />
        </div>

        {/* 2. テキスト情報 (右側) */}
        <div className="flex flex-col items-start z-10">
          {/* 国名 */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {team.country}
            </span>
          </div>
          {/* チーム名 */}
          <h1 className="text-xl font-black text-gray-900 leading-tight uppercase">
            {team.name}
          </h1>
        </div>
      </div>

      {/* 3. タブの追加 */}
      <TeamTabs activeTab={activeTab} onTabChange={onTabChange} />
    </div>
    );
}

export default TeamHeader;