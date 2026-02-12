// src/pages/ApiTestMatchList.jsx
import { useState } from 'react';

function ApiTestMatchList() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 日付指定
    const MATCH_DATE = '2026-02-11';

    const runTest = async () => {
        setLoading(true);
        setError(null);

        const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY;

        try {
            const response = await fetch(
                `https://v3.football.api-sports.io/fixtures?date=${MATCH_DATE}`,
                {
                    headers: {
                        'x-rapidapi-key': API_KEY,
                        'x-apisports-key': API_KEY
                    }
                }
            );

            const json = await response.json();

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
                APIをテストする (ID: {MATCH_DATE})
            </button>

            {loading && <p className="text-gray-500">データ取得中...</p>}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>エラー:</strong> {error}
                </div>
            )}

            {data && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold">取得結果: {data.results} 件</h2>

                    {/* IDコピー用の簡易リストを表示すると便利 */}
                    <div className="bg-white p-4 rounded shadow mb-4 max-h-96 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="py-2">Match ID</th>
                                    <th>League</th>
                                    <th>Match (Home vs Away)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.response.map((item) => (
                                    <tr key={item.fixture.id} className="border-b hover:bg-gray-50">
                                        <td className="py-2 font-mono font-bold text-blue-600 selection:bg-yellow-200">
                                            {item.fixture.id}
                                        </td>
                                        <td>{item.league.name}</td>
                                        <td>{item.teams.home.name} vs {item.teams.away.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <details>
                        <summary className="cursor-pointer text-blue-500 underline mb-2">Raw JSONを表示</summary>
                        <pre className="text-xs bg-gray-800 text-green-400 p-4 rounded h-96 overflow-auto">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </details>
                </div>
            )}
        </div>
    );
}

export default ApiTestMatchList;