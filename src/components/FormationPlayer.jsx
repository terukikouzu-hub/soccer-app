import React from 'react';
import PlayerAvatar from './PlayerAvatar';
import RatingBadge from './RatingBadge';

const FormationPlayer = ({ player, rating, isHome, onClick }) => {
  if (!player) return null;

  // 長い名前は名字だけにする
  const displayName = player.name ? player.name.split(' ').pop() : "";

  return (
    <div 
      onClick={onClick}
      className="flex flex-col items-center justify-center w-16 z-10 transition-transform hover:scale-110 cursor-pointer group"
    >
      <div className="relative">
        {/* 顔写真 */}
        <PlayerAvatar 
          src={player.photo} 
          alt={player.name} 
          size="md"
          // ホーム/アウェイで枠線の色を変える
          className={isHome ? "border-blue-500" : "border-red-500"} 
        />
        
        {/* 評価バッジ (写真の右下に少し被せる) */}
        <div className="absolute -bottom-1 -right-1 z-20">
          <RatingBadge rating={rating} />
        </div>
      </div>

      {/* 名前 (写真の下) */}
      <div className="mt-1.5 bg-black/60 backdrop-blur-[2px] text-white text-[9px] font-bold px-2 py-0.5 rounded truncate max-w-[80px] text-center shadow-sm leading-tight">
        {displayName}
      </div>
    </div>
  );
};

export default FormationPlayer;