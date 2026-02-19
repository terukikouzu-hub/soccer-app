// src/pages/TeamDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Backbutton from '../components/Backbutton';
import TeamHeader from '../components/TeamHeader';
import { supabase } from '../lib/supabase';
import SquadList from '../components/SquadList';

function TeamDetail() {
  const { id } = useParams(); // URLパラメータ (/team/:id) からチームIDを取得
  const [details, setDetails] = useState(null); // データ保存用
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('squad');

  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!id) return;
      setLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke('get-team-details', {
          body: { teamId: id }
        });

        if (error) throw error;
        
        // バックエンドから返ってきた combinedData をセット
        setDetails(data);
      } catch (err) {
        console.error("データ取得エラー:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* 戻るボタン */}
      <Backbutton />

      {/* ヘッダー (DB/APIからのデータを渡す) */}
      <TeamHeader 
        teamInfo={details?.teamInfo} 
        loading={loading} 
        activeTab={activeTab}
        onTabChange={setActiveTab} />

      <div className="pt-55 p-6 max-w-2xl mx-auto">
        {!loading && (
          <div className="animate-slideIn">
            {activeTab === 'squad' && (
              <SquadList squad={details?.squad} />
            )}
            
            {/* 他のタブは以前のまま */}
            {activeTab === 'schedule' && <div className="text-center py-20 font-bold text-gray-300">日程（準備中）</div>}
            {/* ... */}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamDetail;