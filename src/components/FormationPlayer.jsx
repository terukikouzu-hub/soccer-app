//FormationPlayer.jsx
import React from 'react';
import PlayerAvatar from './PlayerAvatar';
import RatingBadge from './RatingBadge';

// ゴール (ボール)
const BallIcon = ({ count }) => (
    <div className="flex items-center justify-center bg-white rounded-full w-4 h-4 shadow-sm border border-gray-200 z-30">
        <span className="text-xs leading-none">⚽</span>
        {count > 1 && (
            <span className="absolute -right-2 bg-red-600 text-white text-[9px] font-black px-1 py-0.5 rounded-full leading-none border border-white">
                {count}
            </span>
        )}
    </div>
);

// アシスト (スパイク)
const BootIcon = () => (
    <div className="flex items-center justify-center bg-white rounded-full w-4 h-4 shadow-sm border border-gray-200 z-20">

        <span className="text-xs leading-none grayscale">👟</span>
    </div>
);

// カード (イエロー/レッド)
const CardContainer = ({ yellow, red }) => {
    // 退場(2枚目)の場合: 奥にイエロー、手前にレッド
    if (red > 0 && yellow > 0) {
        return (
            <div className="relative w-3 h-4">
                <div className="absolute top-1.5 left-0 w-2 h-3 bg-yellow-400 border border-white rounded-[1px] transform shadow-sm z-10"></div>
                <div className="absolute top-1 left-1 w-2 h-3 bg-red-600 border border-white rounded-[1px] transform shadow-sm z-20"></div>
            </div>
        );
    }
    // レッド一発
    if (red > 0) {
        return <div className="w-2 h-3 bg-red-600 border border-white rounded-[1px] shadow-sm z-20"></div>;
    }
    // イエローのみ
    if (yellow > 0) {
        return <div className="w-2 h-3 bg-yellow-400 border border-white rounded-[1px] shadow-sm z-20"></div>;
    }
    return null;
};

// 交代 (OUT矢印 + 時間)
const SubOutIcon = ({ minute }) => (
    <div className="flex flex-col items-center z-20">
        <span className="text-black text-[13px] font-bold leading-none">↩</span>
        <span className="text-[8px] font-black text-white bg-black/60 px-1 rounded leading-tight backdrop-blur-sm">
            {minute}'
        </span>
    </div>
);

const FormationPlayer = ({ player, rating, isHome, events, onClick }) => {
    if (!player) return null;

    // 長い名前は名字だけにする
    const displayName = player.name ? player.name.split(' ').pop() : "";

    // 統計情報 (API構造: player.statistics[0] にデータがある前提)
    const stats = player.statistics?.[0];
    const goals = stats?.goals?.total || 0;
    const assists = stats?.goals?.assists || 0;
    const yellow = stats?.cards?.yellow || 0;
    const red = stats?.cards?.red || 0;

    // 交代情報の検索
    // events配列から、この選手が「交代でOUTになった (e.player.id === player.id)」イベントを探す
    const subEvent = events?.find(e => e.type === 'subst' && e.player?.id === player.id);
    const subMinute = subEvent ? subEvent.time.elapsed : null;

    if (subEvent) {
        console.log(`★交代検知! 選手: ${displayName}, 時間: ${subMinute}分`, subEvent);
    }

    return (
        <div
            onClick={onClick}
            className="flex flex-col items-center justify-center w-20 z-10 transition-transform hover:scale-110 cursor-pointer group"
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

                {/* 1. 得点 (右上) */}
                {goals > 0 && (
                    <div className="absolute -top-0.5 -right-0.5">
                        <BallIcon count={goals} />
                    </div>
                )}

                {/* 2. アシスト (右下) */}
                {assists > 0 && (
                    <div className="absolute -bottom-0.5 -right-0.5">
                        <BootIcon />
                    </div>
                )}

                {/* 3. カード (左上) */}
                {(yellow > 0 || red > 0) && (
                    <div className="absolute -top-0.5 -left-0.5">
                        <CardContainer yellow={yellow} red={red} />
                    </div>
                )}

                {/* 4. 交代 (左側) */}
                {subMinute && (
                    <div className="absolute top-6 -left-3 transform -translate-y-1/2">
                        <SubOutIcon minute={subMinute} />
                    </div>
                )}

                {/* 評価バッジ (写真の右下に少し被せる) */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-30">
                    <RatingBadge rating={rating} />
                </div>
            </div>

            {/* 名前 (写真の下) */}
            <div className="mt-1.5 mb-1 bg-black/60 backdrop-blur-[2px] text-white text-[9px] font-bold px-2 py-0.5 rounded truncate max-w-[80px] text-center shadow-sm leading-tight">
                {displayName}
            </div>
        </div>
    );
};

export default FormationPlayer;