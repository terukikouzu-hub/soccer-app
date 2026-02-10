// src/pages/MatchDetail.jsx
import { useParams, Link } from 'react-router-dom';

function MatchDetail() {
  const { id } = useParams(); // URLから試合IDを取得

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* 戻るボタン */}
      <Link to="/" className="inline-block mb-4 text-blue-600 font-bold text-xs">
        &larr; 一覧に戻る
      </Link>

      <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-100">
        <h1 className="text-xl font-black text-gray-800 mb-2">MATCH DETAIL</h1>
        <p className="text-gray-500 text-sm">Match ID: {id}</p>
        <p className="mt-4 text-xs text-gray-400">ここにスタメンやスタッツを表示予定</p>
      </div>
    </div>
  );
}

export default MatchDetail;