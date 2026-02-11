// src/pages/TeamDetail.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

function TeamDetail() {
  const { id } = useParams(); // URLの :id を取得
  const location = useLocation();
  const navigate = useNavigate();

  // 前の画面(TeamBadge)から渡されたデータを受け取る
  // 直接URLアクセスの場合は undefined になる
  const teamData = location.state?.teamData;

  // データがないのにアクセスされた場合（URL直接入力など）
  // とりあえず今回は「データがなければIDだけ表示」してエラーにはしません
  // (APIで詳細を取得する処理を後で書くため)

  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-fadeIn">
      
      {/* 戻るボタン */}
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 text-gray-500 hover:text-blue-600 font-bold flex items-center gap-2 transition-colors"
      >
        ◀ 戻る
      </button>

      <div className="bg-white p-10 rounded-2xl shadow-sm text-center border border-gray-100 max-w-lg mx-auto">
        <h1 className="text-xl font-black text-gray-800 mb-6">TEAM PROFILE</h1>
        
        {teamData ? (
          // TeamBadgeからデータが渡ってきた場合
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 p-4 bg-gray-50 rounded-full mb-4 flex items-center justify-center">
              <img src={teamData.logo} alt={teamData.name} className="w-full h-full object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{teamData.name}</h2>
            <p className="text-xs text-gray-400 mt-2 font-mono">ID: {teamData.id}</p>
          </div>
        ) : (
          // 直接URL入力などでデータがない場合
          <div className="text-gray-500">
            <p>Team ID: {id}</p>
            <p className="text-xs text-gray-400 mt-2">詳細データを読み込み中...</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default TeamDetail;