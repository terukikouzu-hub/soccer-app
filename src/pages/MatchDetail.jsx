// src/pages/MatchDetail.jsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Backbutton from '../components/Backbutton'; 
import MatchHeader from '../components/MatchHeader';
import Lineup from '../components/Lineup';
import Formation from '../components/Formation';
import { supabase } from '../lib/supabase';

function MatchDetail() {
  const location = useLocation();
  const navigate = useNavigate();

  // MatchListから渡されたデータを受け取る
  const matchData = location.state?.matchData;

  // APIから取得した詳細データを入れる箱
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  // ★追加: タブの切り替え状態 ('lineup' | 'formation')
  const [activeTab, setActiveTab] = useState('lineup');

  const [headerHeight, setHeaderHeight] = useState(240);

  // データがない場合（直接アクセスなど）はトップページに強制的に戻す
  useEffect(() => {
    if (!matchData) {
      navigate('/');
    }
  }, [matchData, navigate]);

  useEffect(() => {
    if (!matchData) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`★ Edge Function (get-match-details) に 試合ID: ${matchData.id} をリクエストします...`);
        
        // -----------------------------------------------------------
        // 1. 新しい門番（Edge Function）にすべてお任せする
        // -----------------------------------------------------------
        const { data: funcData, error: funcError } = await supabase.functions.invoke('get-match-details', {
          body: { matchId: matchData.id }
        });

        if (funcError) throw funcError;

        // -----------------------------------------------------------
        // 2. 門番から受け取った詳細データを画面にセットする
        // -----------------------------------------------------------
        if (funcData && funcData.response && funcData.response.length > 0) {
          const targetMatch = funcData.response[0];
          console.log("▼ 取得した詳細データ:", targetMatch);
          setDetails(targetMatch);
        } else {
          setError('詳細データが見つかりませんでした');
        }

      } catch (err) {
        console.error(err);
        setError('通信エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [matchData]);

  // データが読み込まれるまでは何も表示しない（チラつき防止）
  if (!matchData) return null;

  // 表示用データの優先順位: API詳細データ > 一覧から渡されたデータ
  // 詳細データがあればそちらのスコアを、なければ一覧データのスコアを使う
  const displayScore = details&& details.goals && details.goals.home !== null
    ? `${details.goals.home} - ${details.goals.away}`
    : matchData.score;

  const displayStatus = details ? details.fixture.status.short : matchData.status;

  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-fadeIn">
      {/* 1. ナビゲーションバー (一番上) */}
      <Backbutton />

      {/* 2. ヘッダー (ご希望のデザイン + 縮小機能) */}
      <MatchHeader 
        homeId={matchData.homeId}
        homeTeam={matchData.home}
        homeLogo={matchData.homeLogo}
        awayId={matchData.awayId}
        awayTeam={matchData.away}
        awayLogo={matchData.awayLogo}
        score={displayScore}
        status={displayStatus}
        date={matchData.date}
        details={details} // EventList表示用に渡す
        loading={loading} // Loading表示用に渡す
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onHeightChange={setHeaderHeight}
      />

      {/* 3. コンテンツエリア */}
      <div className="pb-0" style={{ paddingTop: `${headerHeight}px` }}>

        {/* --- 詳細コンテンツ --- */}
        <div className="max-w-2xl mx-auto px-4 mt-4">
            {loading ? (
            <div className="flex justify-center mt-20">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
            ) : details && details.lineups ? (
            <>
                {activeTab === 'lineup' && (
                <div className="animate-slideIn">
                    <Lineup lineups={details.lineups} />
                </div>
                )}

                {activeTab === 'formation' && (
                <div className="animate-slideIn">
                    <Formation 
                        homeLineup={details.lineups[0]} 
                        awayLineup={details.lineups[1]} 
                        homeStats={details.players?.[0]?.players}
                        awayStats={details.players?.[1]?.players}
                        events={details.events}
                    />
                </div>
                )}
            </>
            ) : (
            !loading && (
                <p className="text-center text-gray-400 text-xs mt-10">
                DATA NOT AVAILABLE
                </p>
            )
            )}
          </div>
      </div>
    </div>
  );
}

export default MatchDetail;