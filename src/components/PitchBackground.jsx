import React from 'react';

const PitchBackground = () => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-lg bg-[#2e8b57]">
      
      {/* 芝目のストライプ (縦方向なので to bottom) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03)_10%,transparent_10%)] bg-[length:100%_10%]"></div>
      
      {/* 外枠 */}
      <div className="absolute inset-0 border-2 border-white/40 rounded-lg"></div>
      
      {/* センターライン (水平) */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40 -translate-y-1/2"></div>
      
      {/* センターサークル */}
      <div className="absolute top-1/2 left-1/2 w-[30%] pt-[30%] border-2 border-white/40 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white/60 rounded-full -translate-x-1/2 -translate-y-1/2"></div>

      {/* --- 上側 (ホーム) --- */}
      {/* ペナルティエリア */}
      <div className="absolute top-0 left-[20%] right-[20%] h-[15%] border-2 border-t-0 border-white/40 bg-white/5"></div>
      {/* ゴールエリア */}
      <div className="absolute top-0 left-[36%] right-[36%] h-[5%] border-2 border-t-0 border-white/40"></div>
      {/* PKスポット */}
      <div className="absolute top-[10%] left-1/2 w-1 h-1 bg-white/60 rounded-full -translate-x-1/2"></div>
      {/* アーク (簡易) */}
      <div className="absolute top-[15%] left-1/2 w-[20%] pt-[10%] border-2 border-t-0 border-white/40 rounded-b-full -translate-x-1/2"></div>

      {/* --- 下側 (アウェイ) --- */}
      {/* ペナルティエリア */}
      <div className="absolute bottom-0 left-[20%] right-[20%] h-[15%] border-2 border-b-0 border-white/40 bg-white/5"></div>
      {/* ゴールエリア */}
      <div className="absolute bottom-0 left-[36%] right-[36%] h-[5%] border-2 border-b-0 border-white/40"></div>
      {/* PKスポット */}
      <div className="absolute bottom-[10%] left-1/2 w-1 h-1 bg-white/60 rounded-full -translate-x-1/2"></div>
      {/* アーク (簡易) */}
      <div className="absolute bottom-[15%] left-1/2 w-[20%] pt-[10%] border-2 border-b-0 border-white/40 rounded-t-full -translate-x-1/2"></div>

      {/* コーナーアーク (四隅) */}
      <div className="absolute top-0 left-0 w-3 h-3 border-b-2 border-r-2 border-white/40 rounded-br-full"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-b-2 border-l-2 border-white/40 rounded-bl-full"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-t-2 border-r-2 border-white/40 rounded-tr-full"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-t-2 border-l-2 border-white/40 rounded-tl-full"></div>
    </div>
  );
};

export default PitchBackground;