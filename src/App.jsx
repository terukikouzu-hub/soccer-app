// src/App.jsx

import { Routes, Route } from 'react-router-dom';
import MatchList from './pages/MatchList';
import TeamDetail from './pages/TeamDetail';
import MatchDetail from './pages/MatchDetail';
import ApiTestMatchList from './pages/ApiTestMatchList';
import ApiTestMatchDetail from './pages/ApiTestMatchDetail';
import TestScroll from './pages/TestScroll';

function App() {
  return (
    <Routes>
      {/* URLが「/」のときは、引っ越し先の MatchList を表示 */}
      <Route path="/" element={<MatchList />} />
      
      {/* URLが「/team/ID」のときは、TeamDetail を表示 */}
      <Route path="/team/:id" element={<TeamDetail />} />
      <Route path="/match/:id" element={<MatchDetail />} />
      <Route path="/test-list" element={<ApiTestMatchList />} />
      <Route path="/test-detail" element={<ApiTestMatchDetail />} />
      <Route path="/test-scroll" element={<TestScroll />} />
    </Routes>
  );
}

export default App;