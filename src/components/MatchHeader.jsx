//MatchHeader.jsx
import { useState, useEffect } from 'react';
import TeamBadge from './TeamBadge';
import EventList from './EventList';

function MatchHeader({
    homeId, homeTeam, homeLogo,
    awayId, awayTeam, awayLogo,
    score, status, date,
    details, loading // EventList表示用に必要
}) {
    const [scrollY, setScrollY] = useState(0);

    // スクロール検知
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);// スクロール量(px)をそのまま保存
        };
        handleScroll(); // 初期実行
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- 動的スタイルの計算 ---
    // アニメーションが完了するスクロール距離（長くすることで変化を緩やかにする）
    const ANIMATION_DISTANCE = 300;

    // 進行度 (0.0 〜 1.0) - エンブレム縮小などの補助的な計算に使用
    const progress = Math.min(scrollY / ANIMATION_DISTANCE, 1);
    
    // ★最重要: Y軸の移動量 (px)
    // スクロール量と同じだけ上に移動させるが、最大値(MAX_MOVE_Y)で止める
    // これにより「スクロールに合わせて上に流れ、ある地点で固定される」動きになる
    const MAX_MOVE_Y = 40; // ヘッダーを上にずらす最大ピクセル数
    const translateY = Math.min(scrollY, MAX_MOVE_Y);

    // ヘッダー自体の高さ制御
    // 中身が上にズレる分、ヘッダーの底辺も上に詰めないと余白が空いてしまうため
    // paddingBottomをスクロール量に合わせて減らす
    const maxPaddingBottom = 24; // 1.5rem = 24px
    const minPaddingBottom = 8;  // 0.5rem = 8px
    // スクロールに合わせて 24px -> 8px へ減らす
    const currentPaddingBottom = Math.max(
        minPaddingBottom, 
        maxPaddingBottom - (scrollY * 0.1) // 少しゆっくり減らす
    );

    // エンブレムなどの変形
    const logoScale = 1 - (0.4 * progress); // 1.0 -> 0.6
    const moveX = 50 * progress; // 横移動
    const scoreScale = 1 - (0.2 * progress);

    // フェードアウト (日付やチーム名)
    // 距離の半分(150px)で消え切るようにする
    const fadeOutOpacity = Math.max(0, 1 - (scrollY / (ANIMATION_DISTANCE / 2)));
    const extrasStyle = {
        opacity: fadeOutOpacity,
        transform: `scale(${0.8 + (0.2 * fadeOutOpacity)})`, // 消えるときに少し縮む
        // 完全に消えたらレイアウトから消す（クリック判定防止）
        display: fadeOutOpacity === 0 ? 'none' : 'block',
    };

    const collapsingContainerStyle = {
        display: 'grid',
        gridTemplateRows: fadeOutOpacity > 0.01 ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.2s ease-out',
    };

    const collapsingContentStyle = {
        overflow: 'hidden', 
        opacity: fadeOutOpacity,
        transform: `scale(${0.9 + (0.1 * fadeOutOpacity)})`,
        transformOrigin: 'top center',
    };

    return (
        <div 
            className="fixed top-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 overflow-hidden will-change-transform"
            style={{
                paddingTop: '1rem', // 上部は固定
                paddingBottom: `${currentPaddingBottom}px`, // 下部はスクロールで詰める
            }}
        >
            <div className="max-w-2xl mx-auto px-4 relative">

                {/* 全体を上に移動させるコンテナ */}
                <div 
                    className="w-full will-change-transform"
                    style={{ transform: `translateY(-${translateY}px)` }}
                >

                    {/* --- 日付 --- */}
                    {/* ここも「高さが潰れるコンテナ」で包む */}
                    <div style={collapsingContainerStyle} className="mb-2">
                        <div style={collapsingContentStyle} className="text-center">
                            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full tracking-widest inline-block">
                                {date ? new Date(date).toLocaleDateString('ja-JP') : '-'}
                            </span>
                        </div>
                    </div>

                    {/* --- メインコンテンツ --- */}
                    <div className="flex items-start justify-between">

                        {/* HOME TEAM */}
                        <div 
                            className="flex flex-col items-center w-[30%] will-change-transform"
                            style={{
                                transform: `translateX(${moveX}px) scale(${logoScale})`,
                                transformOrigin: 'center top' 
                            }}
                        >
                            <div className="w-20 flex justify-center">
                                <TeamBadge teamId={homeId} teamName="" teamLogo={homeLogo} size="large" />
                            </div>
                            
                            {/* チーム名: 高さごと潰す */}
                            <div style={collapsingContainerStyle} className="w-full mt-1">
                                <div style={collapsingContentStyle}>
                                    <div className="text-xs font-bold text-gray-800 text-center leading-tight">
                                        {homeTeam}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CENTER (Score) */}
                        <div className="flex flex-col items-center w-[40%] pt-1">
                            <div 
                                className="text-4xl font-black text-gray-800 tracking-tighter leading-none will-change-transform whitespace-nowrap mt-1"
                                style={{
                                    transform: `scale(${scoreScale})`,
                                    transformOrigin: 'center top'
                                }}
                            >
                                {score}
                            </div>

                            {/* ステータス & イベントリスト: 高さごと潰す */}
                            <div style={collapsingContainerStyle} className="w-full mt-2">
                                <div style={collapsingContentStyle} className="w-full flex flex-col items-center">
                                    <div className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded mb-2">
                                        {status}
                                    </div>
                                    <div className="w-full mb-2">
                                        {details && <EventList events={details.events} homeTeamId={homeId} awayTeamId={awayId} />}
                                        {loading && <div className="animate-pulse text-[10px] text-gray-400 font-bold mt-2 text-center">UPDATING...</div>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AWAY TEAM */}
                        <div 
                            className="flex flex-col items-center w-[30%] will-change-transform"
                            style={{
                                transform: `translateX(${-moveX}px) scale(${logoScale})`,
                                transformOrigin: 'center top'
                            }}
                        >
                            <div className="w-20 flex justify-center">
                                <TeamBadge teamId={awayId} teamName="" teamLogo={awayLogo} size="large" />
                            </div>
                            
                            {/* チーム名: 高さごと潰す */}
                            <div style={collapsingContainerStyle} className="w-full mt-1">
                                <div style={collapsingContentStyle}>
                                    <div className="text-xs font-bold text-gray-800 text-center leading-tight">
                                        {awayTeam}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MatchHeader;