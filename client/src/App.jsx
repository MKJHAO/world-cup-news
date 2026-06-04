import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MatchesPage from './pages/MatchesPage';
import MatchDetailPage from './pages/MatchDetailPage';
import StandingsPage from './pages/StandingsPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import AnalysisPage from './pages/AnalysisPage';
import PredictionPage from './pages/PredictionPage';
import PredictionGamePage from './pages/PredictionGamePage';
import GroupDetailPage from './pages/GroupDetailPage';
import BracketChallengePage from './pages/BracketChallengePage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/match/:id" element={<MatchDetailPage />} />
        <Route path="/standings" element={<StandingsPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/team/:id" element={<TeamDetailPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:id" element={<NewsDetailPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/prediction" element={<PredictionPage />} />
        <Route path="/prediction-game" element={<PredictionGamePage />} />
        <Route path="/group/:id" element={<GroupDetailPage />} />
        <Route path="/bracket-challenge" element={<BracketChallengePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-6xl font-bold text-white/10 mb-4">404</div>
            <h1 className="text-xl font-semibold text-white/60 mb-2">页面不存在</h1>
            <p className="text-sm text-white/30 mb-6">您访问的页面可能已被移除或地址有误</p>
            <a href="/" className="btn-primary text-sm">返回首页</a>
          </div>
        } />
      </Routes>
    </Layout>
  );
}
