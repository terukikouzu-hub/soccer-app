// src/components/TeamBadge.jsx

import { Link } from 'react-router-dom';

function TeamBadge({ teamId, teamName, teamLogo, align = 'center', size = 'small' }) {
  const alignmentClass = align === 'left' ? 'items-start text-left' : align === 'right' ? 'items-end text-right' : 'items-center text-center';

  // サイズのクラス切り替え
  const isLarge = size === 'large';
  const imgSizeClass = isLarge ? "h-20 w-20 mb-3" : "h-8 w-8 mb-1.5";
  const textSizeClass = isLarge ? "text-sm font-bold" : "text-[10px] font-bold";

  return (
    <Link 
      to={`/team/${teamId}`} 
      state={{ teamData: { id: teamId, name: teamName, logo: teamLogo } }}
      className={`flex flex-col ${alignmentClass} w-full group transition-transform active:scale-95`}
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
    </Link>
  );
}

export default TeamBadge;