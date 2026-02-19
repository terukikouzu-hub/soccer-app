//MatchHeader.jsx
import { useState, useEffect, useRef } from 'react';
import TeamBadge from './TeamBadge';
import EventList from './EventList';
import MatchTabs from './MatchTabs';

function MatchHeader({
    homeId, homeTeam, homeLogo,
    awayId, awayTeam, awayLogo,
    score, status, date,
    details, loading, // EventList表示用に必要
    activeTab, onTabChange,
    onHeightChange
}) {
    const [scrollY, setScrollY] = useState(0);
    const headerRef = useRef(null);

    // 可変長のEventListの高さを測るための準備
    const [contentHeight, setContentHeight] = useState(0);
    const contentRef = useRef(null);
    // --- ヘッダーの高さを監視して親に報告する ---
    useEffect(() => {
        if (!headerRef.current) return;

        // ResizeObserverを使うと、中身（EventList）が増えて高さが変わった瞬間に検知できます
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                // 親の MatchDetail に現在の高さを伝える
                onHeightChange(entry.contentRect.height);
            }
        });

        resizeObserver.observe(headerRef.current);
        return () => resizeObserver.disconnect();
    }, [onHeightChange]);

    // スクロール検知
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);// スクロール量(px)をそのまま保存
        };
        handleScroll(); // 初期実行
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // データが届いて描画されたら、実際の高さを測って保存する
    useEffect(() => {
        if (contentRef.current) {
            setContentHeight(contentRef.current.scrollHeight);
        }
    }, [details, loading]); // データが変わるたびに再計測

    // --- 動的スタイルの計算 ---
    // アニメーションが完了するスクロール距離（長くすることで変化を緩やかにする）
    const ANIMATION_DISTANCE = 300;

    // 進行度 (0.0 〜 1.0) - エンブレム縮小などの補助的な計算に使用
    const progress = Math.min(scrollY / ANIMATION_DISTANCE, 1);
    
    // ★最重要: Y軸の移動量 (px)
    // スクロール量と同じだけ上に移動させるが、最大値(MAX_MOVE_Y)で止める
    // これにより「スクロールに合わせて上に流れ、ある地点で固定される」動きになる
    const MAX_MOVE_Y = 8; // ヘッダーを上にずらす最大ピクセル数
    const translateY = Math.min(scrollY, MAX_MOVE_Y);

    // ヘッダーの底辺パディングを削る (24px -> 8px)
    const currentPaddingBottom = 24;
    const bottomNegativeMargin = progress * 40;

    // エンブレムなどの変形
    const logoScale = 1 - (0.3 * progress); // 1.0 -> 0.7
    const moveX = 50 * progress; // 横移動
    const scoreScale = 1 - (0.2 * progress);

    // フェードアウト (日付やチーム名)
    // 距離の半分(150px)で消え切るようにする
    const fadeOutOpacity = Math.max(0, 1 - (scrollY / (ANIMATION_DISTANCE / 2)));

    // 日付・チーム名用のスタイル
    const textCollapseStyle = {
        maxHeight: `${fadeOutOpacity * 30}px`,
        opacity: fadeOutOpacity,
        marginBottom: `${fadeOutOpacity * 0.5}rem`,
        overflow: 'hidden',
        transform: `scale(${0.95 + (0.05 * fadeOutOpacity)})`,
        transformOrigin: 'top center',
    };

    // ★重要: EventList用の動的スタイル
    // 計測した「実際の高さ(contentHeight)」を使ってアニメーションさせる
    const listCollapseStyle = {
        maxHeight: `${contentHeight * fadeOutOpacity}px`,
        opacity: fadeOutOpacity,
        marginBottom: `${fadeOutOpacity * 0.5}rem`,
        overflow: 'hidden',
        transform: `scale(${0.95 + (0.05 * fadeOutOpacity)})`,
        transformOrigin: 'top center',
    };

    return (
        <div 
            ref={headerRef}
            className="fixed top-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md shadow-sm border-gray-100 overflow-hidden will-change-transform"
            style={{
                paddingTop: '1.5rem', // 上部は固定
                //paddingBottom: `${currentPaddingBottom}px`, // 下部はスクロールで詰める
            }}
        >
            <div className="max-w-2xl mx-auto px-4 relative">

                {/* 全体を上に移動させるコンテナ */}
                <div 
                    className="w-full will-change-transform"
                    style={{ 
                        transform: `translateY(-${translateY}px)`,
                        marginBottom: `-${bottomNegativeMargin}px`
                    }}
                >

                    {/* --- 日付 --- */}
                    {/* ここも「高さが潰れるコンテナ」で包む */}
                    <div style={textCollapseStyle} className="flex justify-center">
                        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full tracking-widest inline-block">
                            {date ? new Date(date).toLocaleDateString('ja-JP') : '-'}
                        </span>
                    </div>

                    {/* --- メインコンテンツ --- */}
                    <div className="flex items-start justify-between">

                        {/* HOME TEAM */}
                        <div 
                            className="flex flex-col items-center w-[30%]"
                            style={{
                                transform: `translateX(${moveX}px) scale(${logoScale})`,
                                transformOrigin: 'center top' 
                            }}
                        >
                            <div className="w-16 flex justify-center mb-1">
                                <TeamBadge teamId={homeId} teamName="" teamLogo={homeLogo} size="large" />
                            </div>
                            
                            {/* チーム名*/}
                            <div style={textCollapseStyle} className="w-full">
                                <div className="text-xs font-bold text-gray-800 text-center leading-tight">
                                    {homeTeam}
                                </div>
                            </div>
                        </div>

                        {/* CENTER (Score) */}
                        <div className="flex flex-col items-center w-[40%] pt-1">
                            <div 
                                className="text-4xl font-black text-gray-800 tracking-tighter leading-none"
                                style={{
                                    transform: `scale(${scoreScale})`,
                                    transformOrigin: 'center top'
                                }}
                            >
                                {score}
                            </div>

                            {/* EventList (動的縮小エリア) */}
                            <div style={listCollapseStyle} className="w-full mt-2 transition-none">
                                <div ref={contentRef} className="w-full flex flex-col items-center">
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
                            className="flex flex-col items-center w-[30%]"
                            style={{
                                transform: `translateX(${-moveX}px) scale(${logoScale})`,
                                transformOrigin: 'center top'
                            }}
                        >
                            <div className="w-16 flex justify-center mb-1">
                                <TeamBadge teamId={awayId} teamName="" teamLogo={awayLogo} size="large" />
                            </div>
                            
                            {/* チーム名: 高さごと潰す */}
                            <div style={textCollapseStyle} className="w-full">
                                <div className="text-xs font-bold text-gray-800 text-center leading-tight">
                                    {awayTeam}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* --- ★追加: タブエリア (ヘッダーの最下部に固定) --- */}
            <div className="w-full mt-auto">
                <MatchTabs activeTab={activeTab} onTabChange={onTabChange} />
            </div>
        </div>
    );
}

export default MatchHeader;