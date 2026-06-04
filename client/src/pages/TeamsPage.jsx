import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Search } from 'lucide-react';
import useAppStore from '../stores/appStore';
import FlagImage from '../components/FlagImage';

const allGroups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export default function TeamsPage() {
  const { teams, teamsLoading, fetchTeams } = useAppStore();
  const [selectedGroup, setSelectedGroup] = useState('');
  const [search, setSearch] = useState('');
  const [tournament, setTournament] = useState('2026');

  const groups = tournament === '2026' ? allGroups : allGroups.slice(0, 8);

  useEffect(() => { fetchTeams(selectedGroup ? { group: selectedGroup } : {}); }, [selectedGroup]);

  const filtered = teams.filter(t =>
    !search || t.name_cn.includes(search) || t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 landscape:space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-3 landscape:gap-1.5">
        <h1 className="text-2xl landscape:text-lg font-bold tracking-tight flex items-center gap-3 landscape:gap-1.5">
          <Shield className="w-6 h-6 landscape:w-4 landscape:h-4 text-gold" /> 球队中心
        </h1>
        <div className="flex gap-1">
          {['2026', '2022'].map(y => (
            <button key={y} onClick={() => setTournament(y)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tournament === y ? 'bg-gold text-dark shadow-lg shadow-gold/20' : 'glass-card !py-2 text-white/40 hover:text-white/80'
              }`}>{y === '2026' ? '2026 世界杯' : '2022 卡塔尔'}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 landscape:gap-1.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 landscape:w-3 landscape:h-3 text-white/30 absolute left-3.5 landscape:left-2.5 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="搜索球队..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl landscape:rounded-lg pl-10 landscape:pl-8 pr-4 py-2.5 landscape:py-1.5 text-sm landscape:text-[11px] text-white placeholder-white/25
              focus:outline-none focus:border-gold/40 transition-colors" />
        </div>
        <div className="flex gap-1 landscape:gap-0.5 overflow-x-auto">
          <button onClick={() => setSelectedGroup('')}
            className={`px-3.5 py-2.5 landscape:px-2 landscape:py-1.5 rounded-xl text-sm landscape:text-[11px] whitespace-nowrap font-medium transition-all ${
              !selectedGroup ? 'bg-gold text-dark shadow-lg shadow-gold/20' : 'glass-card !py-2.5 landscape:!py-1.5 text-white/40 hover:text-white/80'
            }`}>全部</button>
          {groups.map(g => (
            <button key={g} onClick={() => setSelectedGroup(g)}
              className={`px-3.5 py-2.5 landscape:px-2 landscape:py-1.5 rounded-xl text-sm landscape:text-[11px] whitespace-nowrap font-medium transition-all ${
                selectedGroup === g ? 'bg-gold text-dark shadow-lg shadow-gold/20' : 'glass-card !py-2.5 landscape:!py-1.5 text-white/40 hover:text-white/80'
              }`}>{g}组</button>
          ))}
        </div>
      </div>

      {teamsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => <div key={i} className="glass-card h-40 shimmer rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 landscape:grid-cols-4 gap-3 landscape:gap-1.5">
          {filtered.map(team => (
            <Link key={team.id} to={`/team/${team.id}`} className="glass-card landscape:!p-2.5 text-center group match-card-hover">
              <FlagImage teamName={team.name} size="lg" />
              <h3 className="font-bold text-sm landscape:text-[11px] mt-3 landscape:mt-1.5 group-hover:text-gold transition-colors">{team.name_cn}</h3>
              <p className="text-[11px] landscape:text-[8px] text-white/30 mt-0.5">{team.name}</p>
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/[0.05] text-white/35 font-medium">{team.group_name}组</span>
                <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/[0.05] text-white/35 font-medium">#{team.fifa_rank}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
