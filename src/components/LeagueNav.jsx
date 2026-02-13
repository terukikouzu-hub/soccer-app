// src/components/LeagueNav.jsx
function LeagueNav({ leagues, onLeagueClick }) {
  if (!leagues || leagues.length === 0) return null;

  return (
    <div className="bg-white border-t border-gray-100">
      {/* スクロールコンテナ: overflow-x-auto
        中身コンテナ: w-fit mx-auto (これで数が少ない時は中央、多い時はスクロールになる)
      */}
      <div className="overflow-x-auto py-2 px-4 no-scrollbar scroll-smooth">
        <div className="flex gap-4 w-fit mx-auto">
          {leagues.map((league) => (
            <button
              key={league.id}
              onClick={() => onLeagueClick(league.id)}
              className="flex flex-col items-center min-w-[50px] group transition-transform active:scale-95 flex-shrink-0"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200 mb-1 group-hover:border-blue-400 overflow-hidden p-1">
                <img 
                  src={league.logo} 
                  alt={league.name} 
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] text-gray-500 font-bold truncate w-14 text-center group-hover:text-blue-600">
                {league.code || league.name.substring(0, 3)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LeagueNav;