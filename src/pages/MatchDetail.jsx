// src/pages/MatchDetail.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function MatchDetail() {
  const location = useLocation();
  const navigate = useNavigate();

  // 前の画面(MatchList)から渡されたデータを受け取る
  // (ブラウザでURLを直接入力した場合などは undefined になります)
  const matchData = location.state?.matchData;

  // データがない場合（直接アクセスなど）はトップページに強制的に戻す
  useEffect(() => {
    if (!matchData) {
      navigate('/');
    }
  }, [matchData, navigate]);

  // データが読み込まれるまでは何も表示しない（チラつき防止）
  if (!matchData) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-fadeIn">

      {/* 戻るボタン */}
      <button
        onClick={() => navigate(-1)} // 1つ前の画面に戻る
        className="mb-6 text-gray-500 hover:text-blue-600 font-bold flex items-center gap-2 transition-colors"
      >
        ◀ 一覧に戻る
      </button>

      {/* メインコンテンツエリア */}
      <div className="bg-white p-10 rounded-2xl shadow-sm text-center border border-gray-100">
        <h1 className="text-2xl font-black text-gray-800 mb-4">
          試合詳細を表示
        </h1>

        {/* 遷移が成功しているか確認するために、チーム名だけ表示しておきます */}
        <p className="text-gray-500">
          {matchData.home} vs {matchData.away}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Match ID: {matchData.id}
        </p>
      </div>

    </div>
  );
}

export default MatchDetail;