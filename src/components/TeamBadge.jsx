// src/components/TeamBadge.jsx

// import { Link } from 'react-router-dom';
import { Link } from 'react-router-dom';

function TeamBadge({ teamId, teamName, teamLogo, align = 'center' }) {
  const alignmentClass = align === 'left' ? 'items-start text-left' : align === 'right' ? 'items-end text-right' : 'items-center text-center';

  return (
    <Link 
      to={`/team/${teamId}`} 
      state={{ teamData: { id: teamId, name: teamName, logo: teamLogo } }}
      className={`flex flex-col ${alignmentClass} w-full group transition-transform active:scale-95`}
    >
      {/* エンブレム：ホバー時に少し浮き上がる演出 */}
      <div className="h-8 w-8 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
        <img src={teamLogo} alt={teamName} className="max-h-full max-w-full object-contain" />
      </div>
      
      {/* チーム名：ホバー時に色が変わる */}
      <div className="w-full">
        <p className="text-[10px] font-bold text-gray-800 leading-tight break-words px-1 group-hover:text-blue-600 transition-colors">
          {teamName}
        </p>
      </div>
    </Link>
  );
}

export default TeamBadge;