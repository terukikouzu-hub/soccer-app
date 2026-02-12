// src/pages/MatchDetail.jsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Backbutton from '../components/Backbutton'; 
import MatchHeader from '../components/MatchHeader';
import Lineup from '../components/Lineup';

function MatchDetail() {
  const location = useLocation();
  const navigate = useNavigate();

  // MatchListから渡されたデータを受け取る
  const matchData = location.state?.matchData;

  // APIから取得した詳細データを入れる箱
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

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
        const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY;

        //IDで試合情報を取得
        const response = await fetch(
          `https://v3.football.api-sports.io/fixtures?id=${matchData.id}`,
          {
            headers: {
              'x-rapidapi-key': API_KEY,
              'x-apisports-key': API_KEY
            }
          }
        );

        if (!response.ok) throw new Error('データ取得に失敗しました');
        const json = await response.json();

        // ID指定の場合、response配列には該当する1試合だけが入ってきます
        if (json.response && json.response.length > 0) {
          const targetMatch = json.response[0];
          console.log("詳細データ取得成功:", targetMatch);
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
  const displayScore = details
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
      />

      {/* 3. コンテンツエリア 
         ヘッダーが EventList を含むため高さが可変ですが、
         初期状態の高さに合わせて余白(pt)を大きめに取ります。
         ※EventListが多い場合は被る可能性があるため、本来は動的計算がベストですが、
           まずは十分な余白(pt-80程度)で調整します。
      */}
      <div className="pt-80 max-w-2xl mx-auto px-4 pb-20">
        {/* スタメン表示*/}
        {details && details.lineups ? (
          <Lineup lineups={details.lineups} />
        ) : (
          !loading && (
            <p className="text-center text-gray-400 text-xs mt-10">
              LINEUP INFO NOT AVAILABLE
            </p>)
        )}
        <div className="h-20"></div>
      </div>

    </div>
  );
}

export default MatchDetail;