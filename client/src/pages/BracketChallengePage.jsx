import { useState } from 'react';
import { Swords, Trophy } from 'lucide-react';
import BracketChallenge from '../components/BracketChallenge';
import Leaderboard from '../components/Leaderboard';
import UserRegisterModal from '../components/UserRegisterModal';

export default function BracketChallengePage() {
  const [tab, setTab] = useState('bracket');

  const tabs = [
    { value: 'bracket', label: '预测对阵', icon: Swords },
    { value: 'leaderboard', label: '排行榜', icon: Trophy }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <UserRegisterModal />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
          <Trophy size={22} className="text-gold" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Bracket Challenge</h1>
          <p className="text-xs text-white/30">预测淘汰赛全部对阵，赢取高额积分</p>
        </div>
      </div>

      {/* Tab切换 */}
      <div className="flex gap-1 mb-5 p-1 bg-white/5 rounded-xl w-fit">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                tab === t.value ? 'bg-gold text-dark shadow-lg' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'bracket' ? <BracketChallenge /> : <Leaderboard />}
    </div>
  );
}
