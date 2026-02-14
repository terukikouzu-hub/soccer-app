import React, { useState } from 'react';

const PlayerAvatar = ({ src, alt, size = "md", className = "" }) => {
  // 画像読み込みエラー管理
  const [imgError, setImgError] = useState(false);

  // サイズ定義 (Tailwindのクラス)
  const sizeClasses = {
    sm: "w-8 h-8",       // リスト用など
    md: "w-10 h-10",     // フォーメーション用
    lg: "w-16 h-16",     // モーダルなど
    xl: "w-24 h-24"      // 選手詳細画面用
  };

  // デフォルト画像 (人影アイコンのSVGなど、または空のグレー背景)
  const FallbackIcon = () => (
    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2/3 h-2/3">
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
      </svg>
    </div>
  );

  return (
    <div className={`relative rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100 ${sizeClasses[size]} ${className}`}>
      {!imgError && src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <FallbackIcon />
      )}
    </div>
  );
};

export default PlayerAvatar;