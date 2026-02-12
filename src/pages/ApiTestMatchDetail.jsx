// src/pages/ApiTestMatchDetail.jsx
import { useState } from 'react';

function ApiTestMatchDetail() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // テストしたい特定の試合ID (Nottingham Forest vs Wolves)
    const MATCH_ID = '1379225';

    const runTest = async () => {
        setLoading(true);
        setError(null);

        const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY;
        console.log("テスト開始: 試合詳細取得 ID:", MATCH_ID);

        try {
            const response = await fetch(
                `https://v3.football.api-sports.io/fixtures?id=${MATCH_ID}`,
                {
                    headers: {
                        'x-rapidapi-key': API_KEY,
                        'x-apisports-key': API_KEY
                    }
                }
            );

            const json = await response.json();
            console.log("API生データ:", json); // コンソールでも確認可能

            if (json.errors && Object.keys(json.errors).length > 0) {
                throw new Error(JSON.stringify(json.errors));
            }

            setData(json);

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">API-Football 接続テスト</h1>

            <button
                onClick={runTest}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold mb-6"
            >
                APIをテストする (ID: {MATCH_ID})
            </button>

            {loading && <p className="text-gray-500">データ取得中...</p>}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>エラー:</strong> {error}
                </div>
            )}

            {data && (
                <div className="bg-white p-4 rounded shadow overflow-auto">
                    <h2 className="text-lg font-bold mb-2">取得結果: {data.results} 件</h2>
                    <p className="text-sm text-gray-500 mb-4">※下の方にスクロールすると詳細が見れます</p>

                    {/* JSONをそのまま画面に表示 */}
                    <pre className="text-xs bg-gray-800 text-green-400 p-4 rounded overflow-x-auto h-[600px]">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

export default ApiTestMatchDetail;