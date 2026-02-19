import React, { useState } from 'react';
import Backbutton from '../components/Backbutton';
import { supabase } from '../lib/supabase';

function ApiTestPlayerDetail() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // テスト用のパラメータ（ウーデゴール選手のIDと、2024シーズンを指定）
    const [playerId, setPlayerId] = useState(37127);
    const [season, setSeason] = useState(2024);

    const runTest = async () => {
        setLoading(true);
        setError(null);
        setData(null);
        setSaveMessage('');

        // .env から直接APIキーを読み込む
        const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY;
        console.log("テスト開始: 選手詳細取得 ID:", playerId, "Season:", season);

        try {
            // Reactから直接APIを叩く
            const response = await fetch(
                `https://v3.football.api-sports.io/players?id=${playerId}&season=${season}`,
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

    const saveToDB = async () => {
        if (!data || !data.response || data.response.length === 0) return;

        setSaving(true);
        setSaveMessage('');

        try {
            // APIのレスポンスから必要なデータを抽出
            const playerData = data.response[0].player;
            const statisticsData = data.response[0].statistics;

            // Supabaseの player_details テーブルに保存（Upsert）
            const { error: supabaseError } = await supabase
                .from('player_details')
                .upsert({
                    id: playerData.id,
                    name: playerData.name,
                    age: playerData.age,
                    nationality: playerData.nationality,
                    height: playerData.height,
                    weight: playerData.weight,
                    birth_date: playerData.birth?.date, // birthの中のdateを取り出す（無い場合のエラー防止に ? をつける）
                    injured: playerData.injured,
                    photo: playerData.photo,
                    statistics: statisticsData, // JSONのまま丸投げ！
                    updated_at: new Date().toISOString() // 現在時刻
                });

            if (supabaseError) throw supabaseError;

            setSaveMessage('✅ データベースへの保存が完了しました！');
        } catch (err) {
            console.error("DB保存エラー:", err);
            setSaveMessage('❌ 保存に失敗しました: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <Backbutton />
            
            <h1 className="text-2xl font-bold mt-4 mb-4">API-Football 選手詳細テスト</h1>

            <div className="bg-white p-4 rounded shadow mb-6 flex gap-4 items-end max-w-xl">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Player ID</label>
                    <input 
                        type="number" 
                        value={playerId} 
                        onChange={(e) => setPlayerId(Number(e.target.value))}
                        className="border border-gray-300 rounded px-3 py-2 text-sm w-32"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Season</label>
                    <input 
                        type="number" 
                        value={season} 
                        onChange={(e) => setSeason(Number(e.target.value))}
                        className="border border-gray-300 rounded px-3 py-2 text-sm w-32"
                    />
                </div>
                <button
                    onClick={runTest}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold disabled:bg-blue-300"
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
                    <h2 className="text-lg font-bold mb-2">取得結果: {data.results} 件</h2>
                    <div className="flex items-center gap-3">
                            {saveMessage && (
                                <span className="text-sm font-bold text-green-600">{saveMessage}</span>
                            )}
                            <button
                                onClick={saveToDB}
                                disabled={saving}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold text-sm transition-transform active:scale-95 disabled:bg-green-300"
                            >
                                {saving ? '保存中...' : 'データをDBに保存する'}
                            </button>
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

export default ApiTestPlayerDetail;