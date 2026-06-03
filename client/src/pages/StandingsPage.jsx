import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Trophy } from 'lucide-react';
import useAppStore from '../stores/appStore';
import FlagImage from '../components/FlagImage';
import FormIndicator from '../components/FormIndicator';

const allGroups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export default function StandingsPage() {
  const { standings, topScorers, standingsLoading, fetchStandings, fetchTopScorers } = useAppStore();
  const [activeGroup, setActiveGroup] = useState('A');
  const [tournament, setTournament] = useState('2026');

  const groups = tournament === '2026' ? allGroups : allGroups.slice(0, 8);

  useEffect(() => { fetchStandings(activeGroup, tournament); fetchTopScorers(); }, [activeGroup, tournament]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-gold" />
          积分榜
        </h1>
        <div className="flex gap-1">
          {['2026', '2022'].map(y => (
            <button key={y} onClick={() => { setTournament(y); setActiveGroup('A'); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tournament === y ? 'bg-gold text-dark shadow-lg shadow-gold/20' : 'glass-card !py-2 text-white/40 hover:text-white/80'
              }`}>{y === '2026' ? '2026 世界杯' : '2022 卡塔尔'}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Group tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {groups.map(g => (
              <button key={g} onClick={() => setActiveGroup(g)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                  activeGroup === g
                    ? 'bg-gold text-dark shadow-lg shadow-gold/20'
                    : 'glass-card !py-2.5 text-white/40 hover:text-white/80'
                }`}>{g} 组</button>
            ))}
          </div>

          {standingsLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="glass-card h-12 shimmer rounded-xl" />)}</div>
          ) : (
            <div className="glass-card !p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-white/30 uppercase tracking-wider border-b border-white/[0.04]">
                    <th className="py-3.5 pl-5 text-left w-8">#</th>
                    <th className="py-3.5 text-left">球队</th>
                    <th className="py-3.5 text-center">场</th>
                    <th className="py-3.5 text-center hidden sm:table-cell">胜</th>
                    <th className="py-3.5 text-center hidden sm:table-cell">平</th>
                    <th className="py-3.5 text-center hidden sm:table-cell">负</th>
                    <th className="py-3.5 text-center">进/失</th>
                    <th className="py-3.5 text-center hidden md:table-cell">净胜</th>
                    <th className="py-3.5 pr-5 text-center font-bold">分</th>
                    <th className="py-3.5 text-center hidden md:table-cell pr-3">近5场</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => (
                    <tr key={s.id} className={`border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors ${i < 2 ? 'bg-white/[0.02]' : ''}`}>
                      <td className="py-3 pl-5">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                          i === 0 ? 'bg-gold/20 text-gold' : i === 1 ? 'bg-white/[0.06] text-white/60' : 'text-white/25'
                        }`}>{i + 1}</span>
                      </td>
                      <td className="py-3">
                        <Link to={`/team/${s.team_id}`} className="flex items-center gap-2.5 hover:text-gold transition-colors">
                          <FlagImage teamName={s.name} size="sm" />
                          <span className="font-semibold text-[13px]">{s.name_cn}</span>
                        </Link>
                      </td>
                      <td className="py-3 text-center text-white/40 text-[13px]">{s.played}</td>
                      <td className="py-3 text-center font-medium text-[13px] hidden sm:table-cell">{s.won}</td>
                      <td className="py-3 text-center text-white/40 text-[13px] hidden sm:table-cell">{s.drawn}</td>
                      <td className="py-3 text-center text-white/40 text-[13px] hidden sm:table-cell">{s.lost}</td>
                      <td className="py-3 text-center text-[13px]">{s.goals_for}<span className="text-white/20">-</span>{s.goals_against}</td>
                      <td className={`py-3 text-center font-medium text-[13px] hidden md:table-cell ${
                        s.goal_diff > 0 ? 'text-accent' : s.goal_diff < 0 ? 'text-danger/80' : 'text-white/30'
                      }`}>{s.goal_diff > 0 ? '+' : ''}{s.goal_diff}</td>
                      <td className="py-3 pr-5 text-center text-[15px] font-bold text-gold">{s.points}</td>
                      <td className="py-3 text-center hidden md:table-cell"><FormIndicator form={s.form} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top scorers sidebar */}
        <div className="glass-card">
          <h2 className="section-title"><Trophy className="w-4 h-4" />射手榜 TOP 10</h2>
          <div className="space-y-1">
            {topScorers.map((s, i) => (
              <Link key={s.id} to={`/team/${s.team_id}`}
                className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl hover:bg-white/[0.04] transition-colors group">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  i === 0 ? 'bg-gold text-dark' : i < 3 ? 'bg-white/15 text-white' : 'bg-white/[0.04] text-white/30'
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate group-hover:text-gold transition-colors">{s.player_name}</div>
                  <div className="text-[11px] text-white/35 flex items-center gap-1.5 mt-0.5">
                    <FlagImage teamName={s.team_name} size="sm" />
                    {s.team_cn} · {s.matches_played}场
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-gold">{s.goals}</div>
                  <div className="text-[9px] text-white/25">{s.assists}助攻</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
