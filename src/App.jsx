// src/App.jsx

import { Routes, Route } from 'react-router-dom';
import MatchList from './pages/MatchList';
import TeamDetail from './pages/TeamDetail';
import MatchDetail from './pages/MatchDetail';

function App() {
  return (
    <Routes>
      {/* URLが「/」のときは、引っ越し先の MatchList を表示 */}
      <Route path="/" element={<MatchList />} />
      
      {/* URLが「/team/ID」のときは、TeamDetail を表示 */}
      <Route path="/team/:id" element={<TeamDetail />} />
      <Route path="/match/:id" element={<MatchDetail />} />
    </Routes>
  );
}

export default App;