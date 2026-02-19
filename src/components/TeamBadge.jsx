// src/components/TeamBadge.jsx

import { useNavigate } from 'react-router-dom';
function TeamBadge({ teamId, teamName, teamLogo, align = 'center', size = 'small' }) {
  const navigate = useNavigate();
  const alignmentClass = align === 'left' ? 'items-start text-left' : align === 'right' ? 'items-end text-right' : 'items-center text-center';

  // サイズのクラス切り替え
  const isLarge = size === 'large';
  const imgSizeClass = isLarge ? "h-20 w-20 mb-3" : "h-8 w-8 mb-1.5";
  const textSizeClass = isLarge ? "text-sm font-bold" : "text-[10px] font-bold";

  // クリック時にURL遷移させる関数
  const handleNavigate = () => {
    navigate(`/team/${teamId}`, {
      state: { teamData: { id: teamId, name: teamName, logo: teamLogo } }
    });
  };

  return (
    <div 
      onClick={handleNavigate}
      className={`flex flex-col ${alignmentClass} w-full group transition-transform active:scale-95 cursor-pointer`}
    >
      {/* エンブレム */}
      <div className={`${imgSizeClass} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <img src={teamLogo} alt={teamName} className="max-h-full max-w-full object-contain" />
      </div>
      
      {/* チーム名 */}
      <div className="w-full">
        <p className={`${textSizeClass} text-gray-800 leading-tight break-words px-1 group-hover:text-blue-600 transition-colors`}>
          {teamName}
        </p>
      </div>
    </div>
  );
}

export default TeamBadge;