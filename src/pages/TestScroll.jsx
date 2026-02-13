import { useState, useEffect } from 'react';

// --- テスト用のヘッダーコンポーネント ---
function TestHeader() {
    const [scrollY, setScrollY] = useState(0);

    // スクロール検知
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ==========================================
    //  アニメーション計算ロジック (本番と同じ)
    // ==========================================

    // アニメーション完了までの距離
    const ANIMATION_DISTANCE = 300;
    const progress = Math.min(scrollY / ANIMATION_DISTANCE, 1);

    // 1. ヘッダー全体を上にスライドさせる (最大100px)
    const MAX_MOVE_Y = 8;
    const translateY = Math.min(scrollY, MAX_MOVE_Y);

    // 2. ヘッダーの底辺パディングを削る (24px -> 8px)
    const currentPaddingBottom = 24;
    const bottomNegativeMargin = progress * 40;

    // 3. エンブレムの変形 (縮小 & 横移動)
    const logoScale = 1 - (0.3 * progress); // 1.0 -> 0.6
    const moveX = 50 * progress;            // 中央へ寄せる距離
    const scoreScale = 1 - (0.2 * progress);

    // 4. フェードアウト & 高さ潰し (スクロールの半分で完了)
    const fadeOutOpacity = Math.max(0, 1 - (scrollY / (ANIMATION_DISTANCE / 2)));

    // 消える要素のスタイル (高さも連動して潰す)
    const collapsingContainerStyle = {
        // 300pxはダミーEventListの想定高さ
        maxHeight: `${fadeOutOpacity * 100}px`,
        opacity: fadeOutOpacity,
        marginBottom: `${fadeOutOpacity * 0.5}rem`,
        overflow: 'hidden',
        transform: `scale(${0.95 + (0.05 * fadeOutOpacity)})`,
        transformOrigin: 'top center',
    };

    return (
        <div
            className="fixed top-0 left-0 w-full z-40 bg-white shadow-md border-b-4 border-green-500 overflow-hidden will-change-transform"
            style={{
                paddingTop: '1.5rem',
                paddingBottom: `${currentPaddingBottom}px`,
                // 高さの変化がわかりやすいように少し色をつける
                backgroundColor: 'rgba(240, 248, 255, 0.95)'
            }}
        >
            {/* デバッグ用数値表示 (右上に表示) */}
            <div className="absolute top-0 right-0 bg-black text-white text-xs p-1 opacity-50">
                Scroll: {scrollY.toFixed(0)} / Progress: {progress.toFixed(2)}
            </div>

            <div className="max-w-2xl mx-auto px-4 relative border-l border-r border-dashed border-gray-300 h-full">

                {/* 全体スライド用コンテナ */}
                <div
                    className="w-full will-change-transform"
                    style={{ 
                        transform: `translateY(-${translateY}px)`,
                        marginBottom: `-${bottomNegativeMargin}px`
                    }}
                >

                    {/* --- 日付エリア (赤枠) --- */}
                    <div style={collapsingContainerStyle} className="mb-2 flex justify-center">
                        <div className="border-2 border-red-400 bg-red-100 text-red-600 text-xs px-4 py-1 rounded">
                            Date Area (Collapsing)
                        </div>
                    </div>

                    {/* --- メインコンテンツ --- */}
                    <div className="flex items-start justify-between">

                        {/* HOME (青枠) */}
                        <div
                            className="flex flex-col items-center w-[30%] border border-blue-200 bg-blue-50 p-2"
                            style={{
                                transform: `translateX(${moveX}px) scale(${logoScale})`,
                                transformOrigin: 'center top'
                            }}
                        >
                            {/* エンブレム代わりの四角 */}
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs mb-1">
                                HOME
                            </div>

                            {/* チーム名 (消える) */}
                            <div style={collapsingContainerStyle} className="w-full">
                                <div className="text-xs font-bold text-blue-800 text-center bg-blue-200 mt-1">
                                    Home Team Name
                                </div>
                            </div>
                        </div>

                        {/* CENTER (黒枠) */}
                        <div className="flex flex-col items-center w-[40%] pt-1 border-l border-r border-gray-200">
                            {/* スコア */}
                            <div
                                className="text-4xl font-black text-gray-800 tracking-tighter leading-none"
                                style={{
                                    transform: `scale(${scoreScale})`,
                                    transformOrigin: 'center top'
                                }}
                            >
                                2 - 1
                            </div>

                            {/* 消えるエリア (EventList代わり) */}
                            <div style={collapsingContainerStyle} className="w-full mt-2">
                                <div className="w-full flex flex-col items-center bg-gray-100 border border-gray-400 p-2 text-xs text-gray-500">
                                    <p>Status: FT</p>
                                    <div className="w-full h-20 bg-gray-200 mt-2 flex items-center justify-center">
                                        Event List Area<br />(Height: 300px max)
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AWAY (オレンジ枠) */}
                        <div
                            className="flex flex-col items-center w-[30%] border border-orange-200 bg-orange-50 p-2"
                            style={{
                                transform: `translateX(${-moveX}px) scale(${logoScale})`,
                                transformOrigin: 'center top'
                            }}
                        >
                            {/* エンブレム代わりの四角 */}
                            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs mb-1">
                                AWAY
                            </div>

                            {/* チーム名 (消える) */}
                            <div style={collapsingContainerStyle} className="w-full">
                                <div className="text-xs font-bold text-orange-800 text-center bg-orange-200 mt-1">
                                    Away Team Name
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

// --- メインページコンポーネント ---
function TestScroll() {
    return (
        <div className="min-h-[200vh] bg-gray-100">
            {/* ヘッダー */}
            <TestHeader />

            {/* ダミーコンテンツエリア */}
            {/* ヘッダーの最大高さに合わせて余白を取る */}
            <div className="pt-[400px] px-4 max-w-2xl mx-auto pb-20">

                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-300 mb-4">
                    <h2 className="text-xl font-bold mb-4">Content Area Start</h2>
                    <p className="text-gray-600 mb-4">
                        ここにスタメンやスタッツが表示されます。<br />
                        スクロールしてヘッダーの動きを確認してください。
                    </p>
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                </div>

                {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TestScroll;