import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Users, Timer, ChevronRight, BarChart3, Volume2, VolumeX, Bot } from 'lucide-react';
import useAppStore from '../stores/appStore';
import { getSocket } from '../hooks/useSocket';
import { aiAPI } from '../services/api';
import FlagImage from '../components/FlagImage';
import { ErrorState, LoadingSkeleton } from '../components/UIComponents';
import StatsPanel from '../components/StatsBar';
import ShareButton from '../components/ShareButton';
import OddsPanel from '../components/OddsPanel';
import LiveChat from '../components/LiveChat';

const stageLabels = { group: '小组赛', round16: '1/8决赛', quarter: '1/4决赛', semi: '半决赛', third: '季军赛', final: '决赛' };
const eventIcons = { goal: '⚽', yellow_card: '🟨', red_card: '🟥', substitution: '🔄', penalty_goal: '🎯', own_goal: '😱' };
const eventLabels = { goal: '进球', yellow_card: '黄牌', red_card: '红牌', substitution: '换人', penalty_goal: '点球', own_goal: '乌龙' };

export default function MatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentMatch, fetchMatchById } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [matchStats, setMatchStats] = useState(null);

  // AI解说状态
  const [commentaryOn, setCommentaryOn] = useState(false);
  const [commentary, setCommentary] = useState([]);
  const [commentaryLoading, setCommentaryLoading] = useState(false);

  // AI解说轮询（使用专用解说端点，不污染聊天历史）
  useEffect(() => {
    if (!commentaryOn) return;

    const fetchCommentary = async () => {
      try {
        const m = currentMatch;
        if (!m) return;
        const r = await aiAPI.getCommentary({
          matchId: parseInt(id),
          homeTeam: m.home_team_cn,
          awayTeam: m.away_team_cn,
          homeScore: m.home_score || 0,
          awayScore: m.away_score || 0,
          status: m.status,
          minute: Math.floor(m.match_minute || 0)
        });
        if (r?.data?.text) {
          setCommentary(prev => [...prev.slice(-19), { text: r.data.text, time: new Date().toLocaleTimeString() }]);
        }
      } catch (e) { /* ignore */ }
    };

    fetchCommentary();
    const timer = setInterval(fetchCommentary, 8000);
    return () => clearInterval(timer);
  }, [commentaryOn, id]);

  // WebSocket AI解说推送
  useEffect(() => {
    const s = getSocket();
    const handler = (event, data) => {
      if (event.startsWith('match_') && event.endsWith('_commentary') && data?.match_id === parseInt(id)) {
        setCommentary(prev => [...prev.slice(-19), { text: data.text, time: new Date().toLocaleTimeString() }]);
      }
    };
    s.onAny(handler);
    return () => s.offAny(handler);
  }, [id]);

  // AI赛后总结
  const [postSummary, setPostSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const handlePostSummary = async () => {
    setSummaryLoading(true);
    try {
      const r = await aiAPI.getPostMatchSummary(parseInt(id));
      if (r?.data) setPostSummary(r.data);
    } catch (e) { /* ignore */ }
    setSummaryLoading(false);
  };

  // 初始数据加载
  useEffect(() => {
    setError(false); setLoading(true); setMatchStats(null);
    fetchMatchById(parseInt(id))
      .then(() => {
        fetch(`/api/matches/${id}/statistics`).then(r => r.json())
          .then(d => d.success && setMatchStats(d.data))
          .catch(() => {});
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  // WebSocket 实时更新
  const { updateCurrentMatch, addMatchEvent } = useAppStore();
  useEffect(() => {
    const s = getSocket();
    const matchId = parseInt(id);

    const handleMatchUpdate = (updatedMatch) => {
      if (updatedMatch.id === matchId) {
        updateCurrentMatch(updatedMatch);
      }
    };

    const handleEventAdded = (event) => {
      if (event.match_id === matchId) {
        addMatchEvent(event);
      }
    };

    s.on('match_updated', handleMatchUpdate);
    s.on('match_event_added', handleEventAdded);

    return () => {
      s.off('match_updated', handleMatchUpdate);
      s.off('match_event_added', handleEventAdded);
    };
  }, [id]);

  if (loading) return <div className="max-w-3xl mx-auto py-10"><LoadingSkeleton count={4} /></div>;
  if (error) return <ErrorState message="加载失败，请稍后重试" onRetry={() => window.location.reload()} />;
  if (!currentMatch) return <ErrorState title="比赛不存在" message="未找到该比赛信息" />;

  const m = currentMatch;
  const isLive = ['live', 'first_half', 'second_half'].includes(m.status);
  const isCompleted = m.status === 'completed';
  const isKnockout = ['round16', 'quarter', 'semi', 'third', 'final'].includes(m.stage);

  const winner = isCompleted ? (
    (m.home_penalty > 0 || m.away_penalty > 0)
      ? (m.home_penalty > m.away_penalty ? 'home' : 'away')
      : (m.home_score > m.away_score ? 'home' : m.away_score > m.home_score ? 'away' : 'draw')
  ) : null;

  const homeEvents = (m.events || []).filter(e => e.team_id === m.home_team_id).sort((a, b) => a.minute - b.minute);
  const awayEvents = (m.events || []).filter(e => e.team_id === m.away_team_id).sort((a, b) => a.minute - b.minute);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/matches')} className="inline-flex items-center gap-1.5 text-white/35 hover:text-white/70 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>
      <ShareButton title={`${currentMatch.home_team_cn} vs ${currentMatch.away_team_cn}`}
        text={`${currentMatch.home_team_cn} ${currentMatch.home_score}-${currentMatch.away_score} ${currentMatch.away_team_cn}`} />

      {/* Scoreboard */}
      <div className="glass-card text-center py-8 md:py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider ${
              isLive ? 'bg-red-600/20 text-red-400 animate-live-pulse' :
              isCompleted ? 'bg-white/[0.06] text-white/40' : 'bg-accent/15 text-accent'
            }`}>{isLive ? '● LIVE' : isCompleted ? 'FT' : '即将开始'}</span>
            {isLive && (m.match_minute || 0) > 0 && (
              <span className="text-xs text-red-400 font-mono font-bold">{Math.floor(m.match_minute)}'</span>
            )}
            {m.status === 'halftime' && (
              <span className="text-xs text-warning font-bold">中场休息</span>
            )}
            <span className="text-xs text-white/30">{m.group_name ? `${m.group_name}组 · ` : ''}{stageLabels[m.stage]}</span>
          </div>

          <div className="flex items-center justify-center gap-6 md:gap-14">
            <div className="flex-1 text-right">
              <FlagImage teamName={m.home_team_name} size="lg" />
              <div className={`text-lg md:text-2xl font-bold mt-3 ${winner === 'home' ? 'text-gold' : ''}`}>
                {m.home_team_cn} {winner === 'home' && '👑'}
              </div>
              <div className="text-xs text-white/30 mt-0.5">{m.home_team_name}</div>
            </div>

            <div className="text-center min-w-[120px]">
              {m.status === 'scheduled' ? (
                <div className="text-3xl font-bold text-white/15">VS</div>
              ) : (
                <>
                  <div className={`text-5xl md:text-7xl font-bold score-number tracking-tight ${isLive ? 'text-red-400' : ''}`}>
                    <span className={m.home_score >= m.away_score ? 'text-white' : 'text-white/50'}>{m.home_score}</span>
                    <span className="text-white/15 mx-2">:</span>
                    <span className={m.away_score >= m.home_score ? 'text-white' : 'text-white/50'}>{m.away_score}</span>
                  </div>
                  {(m.home_penalty > 0 || m.away_penalty > 0) && (
                    <div className="text-sm text-white/40 mt-2">
                      点球 {m.home_penalty} - {m.away_penalty}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex-1">
              <FlagImage teamName={m.away_team_name} size="lg" />
              <div className={`text-lg md:text-2xl font-bold mt-3 ${winner === 'away' ? 'text-gold' : ''}`}>
                {m.away_team_cn} {winner === 'away' && '👑'}
              </div>
              <div className="text-xs text-white/30 mt-0.5">{m.away_team_name}</div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-5 mt-6 text-xs text-white/25">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{m.match_date}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{m.stadium}</span>
            {m.attendance > 0 && <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{m.attendance.toLocaleString()}</span>}
          </div>
        </div>
      </div>

      {/* AI解说/赛后总结控制栏 */}
      <div className="flex items-center gap-3 flex-wrap">
        {isCompleted && (
          <button
            onClick={handlePostSummary}
            disabled={summaryLoading}
            className="glass-card flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gold hover:text-yellow-300 border border-gold/20 hover:border-gold/40 transition-all disabled:opacity-50"
          >
            {summaryLoading ? (
              <span className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
            {summaryLoading ? '生成中...' : postSummary ? '🤖 重新生成赛事解说' : '🤖 AI赛事解说'}
          </button>
        )}
        {isLive && (
          <button
            onClick={() => setCommentaryOn(!commentaryOn)}
            className={`glass-card flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all ${
              commentaryOn
                ? 'text-accent border border-accent/30 bg-accent/5'
                : 'text-white/40 hover:text-white/70 border border-white/[0.08]'
            }`}
          >
            {commentaryOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {commentaryOn ? '🤖 AI解说中' : '🤖 开启AI解说'}
          </button>
        )}
      </div>

      {/* AI解说面板 */}
      {commentaryOn && commentary.length > 0 && (
        <div className="glass-card border-l-2 border-l-accent">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-accent">AI 实时解说</h2>
            <span className="text-[10px] text-white/20 ml-auto">{commentary.length}条</span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {commentary.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-sm py-1.5 border-b border-white/[0.03] last:border-0 event-slide-in">
                <span className="text-[10px] text-white/25 shrink-0 mt-0.5 font-mono">{c.time}</span>
                <p className="text-white/70 text-[13px] leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 赛后总结（完赛比赛） */}
      {postSummary && (
        <div className="glass-card border-l-2 border-l-gold">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-gold" />
            <h2 className="text-sm font-bold text-gold">{postSummary.title || 'AI 赛事解说'}</h2>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-white/80 text-[14px] leading-relaxed whitespace-pre-line">{postSummary.content}</p>
          </div>
        </div>
      )}

      {/* Events — 比赛进行中或已结束时始终展示 */}
      {(isCompleted || isLive) && (
        <div className="glass-card">
          <h2 className="section-title"><Timer className="w-4 h-4" />比赛事件</h2>
          {(m.events || []).length === 0 ? (
            <div className="text-center py-6 text-xs text-white/25">
              {isLive ? '⏳ 比赛进行中，事件实时更新...' : '暂无比赛事件记录'}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <FlagImage teamName={m.home_team_name} size="sm" /> {m.home_team_cn}
              </h3>
              <div className="space-y-2.5">
                {homeEvents.map((e, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm py-1">
                    <span className="text-[11px] text-white/30 w-10 text-right font-mono">{e.minute}'</span>
                    <span className="text-base">{eventIcons[e.event_type] || '📌'}</span>
                    <span className="font-medium text-[13px]">{e.player_name}</span>
                    <span className="text-[10px] text-white/25 ml-auto">{eventLabels[e.event_type]}</span>
                  </div>
                ))}
                {homeEvents.length === 0 && <div className="text-xs text-white/20 py-2">暂无数据</div>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <FlagImage teamName={m.away_team_name} size="sm" /> {m.away_team_cn}
              </h3>
              <div className="space-y-2.5">
                {awayEvents.map((e, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm py-1">
                    <span className="text-[11px] text-white/30 w-10 text-right font-mono">{e.minute}'</span>
                    <span className="text-base">{eventIcons[e.event_type] || '📌'}</span>
                    <span className="font-medium text-[13px]">{e.player_name}</span>
                    <span className="text-[10px] text-white/25 ml-auto">{eventLabels[e.event_type]}</span>
                  </div>
                ))}
                {awayEvents.length === 0 && <div className="text-xs text-white/20 py-2">暂无数据</div>}
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* Match Statistics */}
      {(isCompleted || isLive) && (
        matchStats && matchStats.length >= 2 ? (
          <StatsPanel
            homeStats={matchStats.find(s => s.team_id === m.home_team_id)}
            awayStats={matchStats.find(s => s.team_id === m.away_team_id)}
            homeColor={m.home_color || '#c4922e'}
            awayColor={m.away_color || '#4b5563'}
          />
        ) : (
          <div className="glass-card text-center py-6">
            <BarChart3 className="w-5 h-5 text-white/15 mx-auto mb-2" />
            <p className="text-xs text-white/25">
              {isLive ? '📊 统计数据将在比赛结束后生成' : '暂无统计数据'}
            </p>
          </div>
        )
      )}

      {/* Odds Analysis */}
      <OddsPanel matchId={parseInt(id)} homeTeam={m.home_team_cn} awayTeam={m.away_team_cn} />

      {/* 球迷聊天室 */}
      <LiveChat matchId={parseInt(id)} matchStatus={m.status} />

      <div className="flex gap-4 justify-center">
        <Link to={`/team/${m.home_team_id}`} className="btn-outline text-sm inline-flex items-center gap-1.5">
          {m.home_team_cn} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
        <Link to={`/team/${m.away_team_id}`} className="btn-outline text-sm inline-flex items-center gap-1.5">
          {m.away_team_cn} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
