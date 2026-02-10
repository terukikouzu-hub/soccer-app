// src/pages/TeamDetail.jsx

import { useParams, Link } from 'react-router-dom';

function TeamDetail() {
  const { id } = useParams(); // URLからチームIDを取得

  return (
    <div className="p-8">
      <Link to="/" className="text-blue-500 underline text-sm">← 試合一覧に戻る</Link>
      <h1 className="text-2xl font-bold mt-4">Team ID: {id} の詳細画面</h1>
      <p className="mt-2 text-gray-600">ここにチームの情報を表示する予定です。</p>
    </div>
  );
}

export default TeamDetail;