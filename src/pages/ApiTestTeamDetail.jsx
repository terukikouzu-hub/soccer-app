// src/pages/ApiTestTeamDetail.jsx
import React, { useState } from 'react';
import Backbutton from '../components/Backbutton';

function ApiTestTeamDetail() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // テスト用のパラメータ（アトレティコマドリードのIDを指定）
    const [teamId, setTeamId] = useState(530);

    const runTest = async () => {
        setLoading(true);
        setError(null);
        setData(null);

        // .env から直接APIキーを読み込む
        const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY;
        console.log("テスト開始: チーム詳細取得 ID:", teamId);

        try {
            // Reactから直接API-Sportsの /teams エンドポイントを叩く
            const response = await fetch(
                `https://v3.football.api-sports.io/teams?id=${teamId}`,
                {
                    headers: {
                        'x-rapidapi-key': API_KEY,
                        'x-apisports-key': API_KEY
                    }
                }
            );

            const json = await response.json();
            console.log("API生データ:", json);

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
            <Backbutton />
            
            <h1 className="text-2xl font-bold mt-4 mb-4">API-Football チーム情報テスト</h1>

            <div className="bg-white p-4 rounded shadow mb-6 flex gap-4 items-end max-w-xl">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Team ID</label>
                    <input 
                        type="number" 
                        value={teamId} 
                        onChange={(e) => setTeamId(Number(e.target.value))}
                        className="border border-gray-300 rounded px-3 py-2 text-sm w-32"
                    />
                </div>
                <button
                    onClick={runTest}
                    disabled={loading}
                    className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 font-bold disabled:bg-purple-300 transition-transform active:scale-95"
                >
                    {loading ? '取得中...' : 'APIをテストする'}
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-xl">
                    <strong>エラー:</strong> {error}
                </div>
            )}

            {data && (
                <div className="bg-white p-4 rounded shadow overflow-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold">取得結果: {data.results} 件</h2>
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-4">※下の方にスクロールすると詳細が見れます</p>

                    <pre className="text-xs bg-gray-800 text-green-400 p-4 rounded overflow-x-auto h-[600px] custom-scrollbar">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

export default ApiTestTeamDetail;