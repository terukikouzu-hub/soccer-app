import React from 'react';

const RatingBadge = ({ rating, className = "" }) => {
  // 評価値がない場合は表示しない
  if (!rating) return null;

  const num = parseFloat(rating);
  
  // 色分けロジック
  let colorClass = "bg-gray-500"; // デフォルト
  
  if (num >= 9.0) {
    colorClass = "bg-blue-600";   // 青（とても高い）
  } else if (num >= 8.0) {
    colorClass = "bg-sky-400";    // 水色（高い）
  } else if (num >= 7.0) {
    colorClass = "bg-green-500";  // 緑（やや高い）
  } else if (num >= 6.0) {
    colorClass = "bg-yellow-500 text-black"; // 黄（やや低い）※文字色を黒に調整
  } else {
    colorClass = "bg-red-500";    // 赤（低い）
  }

  return (
    <div className={`
      flex items-center justify-center
      px-1.5 py-0.5 rounded-full border border-white 
      text-[9px] font-black text-white leading-none shadow-sm
      ${colorClass} ${className}
    `}>
      {rating}
    </div>
  );
};

export default RatingBadge;