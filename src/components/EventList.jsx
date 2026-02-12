function EventList({ events, homeTeamId, awayTeamId }) {
  if (!events || events.length === 0) return null;

  // 表示したいイベントタイプだけをフィルタリング
  const targetEvents = events.filter(e => {
    // 得点 (Goal) ※PK失敗は除く
    if (e.type === 'Goal' && e.detail !== 'Missed Penalty') return true;
    // カード (Card) ※イエローカードは今回は除外（要望にあわせて）
    if (e.type === 'Card' && e.detail === 'Red Card') return true;
    return false;
  });

  return (
    <div className="w-full space-y-1 mt-2">
      {targetEvents.map((event, i) => {
        const isHome = event.team.id === homeTeamId;
        
        // イベントの種類によってアイコンとテキストを決める
        let icon = '';
        let extraText = '';
        let colorClass = 'text-gray-700';

        if (event.type === 'Goal') {
          if (event.detail === 'Own Goal') {
            icon = '(OG)';
            extraText = '';
          } else if (event.detail === 'Penalty') {
            icon = '⚽';
            extraText = '(P)';
          } else {
            icon = '⚽';
          }
        } else if (event.type === 'Card' && event.detail === 'Red Card') {
          icon = '🟥'; // レッドカード
          colorClass = 'text-red-600';
        }

        return (
          <div key={i} className={`flex items-center text-xs w-full ${isHome ? 'justify-start text-left' : 'justify-end text-right'}`}>
            
            {/* アウェイチームの場合のレイアウト（右寄せ） */}
            {!isHome && (
              <>
                <span className={`font-bold truncate max-w-[80px] ${colorClass}`}>
                  {event.player.name} {extraText}
                </span>
                <span className="mx-1 font-mono text-[10px] text-gray-400">
                  {event.time.elapsed}'
                </span>
                <span className="text-[10px] ml-1">{icon}</span>
              </>
            )}

            {/* ホームチームの場合のレイアウト（左寄せ） */}
            {isHome && (
              <>
                <span className="text-[10px] mr-1">{icon}</span>
                <span className="mx-1 font-mono text-[10px] text-gray-400">
                  {event.time.elapsed}'
                </span>
                <span className={`font-bold truncate max-w-[80px] ${colorClass}`}>
                  {event.player.name} {extraText}
                </span>
              </>
            )}
            
          </div>
        );
      })}
    </div>
  );
}

export default EventList;