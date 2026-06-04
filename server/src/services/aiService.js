const { teams, matches, matchEvents, standings, odds } = require('../models/database');
const predictionService = require('./predictionService');

// DeepSeek API配置（兼容OpenAI SDK格式）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const AI_MODEL = process.env.AI_MODEL || 'deepseek-chat';

class AiService {
  // ==================== AI 聊天 ====================

  async chat({ message, history = [], style = 'professional' }) {
    if (!DEEPSEEK_API_KEY) {
      return { reply: '🤖 AI助手尚未配置，请设置 DEEPSEEK_API_KEY 环境变量后重启服务。', contextUsed: [] };
    }

    // 解析用户查询中的球队/比赛引用
    const references = this._parseQueryReferences(message);

    // 构建数据上下文
    const context = this._buildContext(references);

    // 构建系统提示词
    const systemPrompt = this._buildSystemPrompt(style, context);

    // 构建消息列表
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: `以下是当前可用的数据上下文（仅供你回答时参考，不要在回复中直接输出原始JSON）：\n${JSON.stringify(context, null, 2)}` }
    ];

    // 添加历史消息（最多20条）
    const recentHistory = history.slice(-20);
    recentHistory.forEach(msg => {
      messages.push({ role: msg.role, content: msg.content });
    });

    // 添加当前消息
    messages.push({ role: 'user', content: message });

    try {
      const reply = await this._callLLM(messages);
      return { reply, contextUsed: references };
    } catch (e) {
      console.error('AI API调用失败:', e.message);
      return { reply: '抱歉，AI服务暂时不可用。请稍后重试。\n\n💡 提示：你可以尝试问一些关于球队实力、比赛数据的问题，我会尽力为你解答。', contextUsed: [] };
    }
  }

  // ==================== 赛前/赛后报告 ====================

  async generatePreMatchReport(matchId) {
    if (!DEEPSEEK_API_KEY) return null;

    const match = matches.getById(matchId);
    if (!match) throw new Error('比赛不存在');

    const homeTeam = teams.getById(match.home_team_id);
    const awayTeam = teams.getById(match.away_team_id);
    if (!homeTeam || !awayTeam) throw new Error('球队数据不完整');

    // 获取两队数据
    const homePred = predictionService.getTeamPrediction(match.home_team_id);
    const awayPred = predictionService.getTeamPrediction(match.away_team_id);
    const h2h = this._getH2HSummary(match.home_team_id, match.away_team_id);

    const matchContext = {
      home: { name: homeTeam.name, name_cn: homeTeam.name_cn, fifa_rank: homeTeam.fifa_rank, group: homeTeam.group_name, strength: homePred?.strength },
      away: { name: awayTeam.name, name_cn: awayTeam.name_cn, fifa_rank: awayTeam.fifa_rank, group: awayTeam.group_name, strength: awayPred?.strength },
      match: { date: match.match_date, stage: match.stage, group: match.group_name, stadium: match.stadium },
      h2h
    };

    const prompt = `你是一位资深足球分析师。请根据以下比赛数据，生成一篇赛前分析报告（300-500字）。报告应包括：双方实力对比、关键球员分析、战术展望、比分预测。使用中文，风格专业且有深度。`;
    const contextStr = JSON.stringify(matchContext, null, 2);

    try {
      const content = await this._callLLM([
        { role: 'system', content: prompt },
        { role: 'user', content: `比赛数据：\n${contextStr}` }
      ], 1500);

      return { title: `${homeTeam.name_cn || homeTeam.name} vs ${awayTeam.name_cn || awayTeam.name} 赛前分析`, content, matchContext };
    } catch (e) {
      console.error('生成赛前报告失败:', e.message);
      return null;
    }
  }

  async generatePostMatchSummary(matchId) {
    if (!DEEPSEEK_API_KEY) return null;

    const match = matches.getById(matchId);
    if (!match || match.status !== 'completed') throw new Error('比赛未完成');

    const homeTeam = teams.getById(match.home_team_id);
    const awayTeam = teams.getById(match.away_team_id);
    const events = matchEvents.query(e => e.match_id === matchId);

    const matchContext = {
      home: { name: homeTeam?.name, name_cn: homeTeam?.name_cn },
      away: { name: awayTeam?.name, name_cn: awayTeam?.name_cn },
      result: { home_score: match.home_score, away_score: match.away_score },
      events: events.slice(0, 20).map(e => ({ type: e.event_type, player: e.player_name, minute: e.minute, team: e.team_type })),
      stage: match.stage,
      stadium: match.stadium
    };

    const prompt = '你是一位足球评论员。请根据比赛数据写一篇赛后战报总结（200-400字），包括：比赛过程回顾、关键时刻点评、球员表现评价、对后续比赛的影响。使用中文。';

    try {
      const content = await this._callLLM([
        { role: 'system', content: prompt },
        { role: 'user', content: `比赛数据：\n${JSON.stringify(matchContext, null, 2)}` }
      ], 1200);

      return { title: `${homeTeam?.name_cn || homeTeam?.name} ${match.home_score}-${match.away_score} ${awayTeam?.name_cn || awayTeam?.name} 赛后战报`, content };
    } catch (e) {
      console.error('生成赛后报告失败:', e.message);
      return null;
    }
  }

  // ==================== AI实时解说 ====================

  async pushLiveCommentary(io) {
    if (!DEEPSEEK_API_KEY || !io) return;

    const liveMatches = matches.query(m => m.status === 'live' || m.status === 'first_half' || m.status === 'second_half');
    if (liveMatches.length === 0) return;

    for (const match of liveMatches) {
      try {
        const commentary = await this.generateCommentaryChunk(match);
        if (commentary) {
          io.emit(`match_${match.id}_commentary`, {
            text: commentary,
            match_id: match.id,
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        // 单场比赛解说失败不影响其他比赛
      }
    }
  }

  async generateCommentaryChunk(match, style = 'professional') {
    if (!DEEPSEEK_API_KEY) return null;

    const homeTeam = teams.getById(match.home_team_id);
    const awayTeam = teams.getById(match.away_team_id);

    // 获取最近事件
    const recentEvents = matchEvents.query(e => e.match_id === match.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    const context = {
      home: homeTeam?.name_cn || homeTeam?.name,
      away: awayTeam?.name_cn || awayTeam?.name,
      score: `${match.home_score}-${match.away_score}`,
      recent_events: recentEvents.map(e => `${e.minute}' ${e.event_type === 'goal' ? '⚽进球' : e.event_type === 'yellow_card' ? '🟨黄牌' : e.event_type === 'red_card' ? '🟥红牌' : e.event_type === 'substitution' ? '🔄换人' : e.event_type} - ${e.player_name || ''}`).join('; ')
    };

    const prompt = `你是一位足球解说员，风格${style === 'humorous' ? '幽默风趣' : style === 'dialect' ? '像东北人唠嗑一样接地气' : '专业激情'}。根据以下比赛实时数据，生成一句30字以内的简短解说。不要啰嗦，要有感染力。`;

    try {
      const text = await this._callLLM([
        { role: 'system', content: prompt },
        { role: 'user', content: JSON.stringify(context) }
      ], 100);

      return text.trim();
    } catch {
      return null;
    }
  }

  // ==================== 内部方法 ====================

  _parseQueryReferences(query) {
    const refs = { teamIds: [], matchIds: [], keywords: [] };
    if (!query) return refs;

    const allTeams = teams.getAll();
    const lower = query.toLowerCase();

    // 匹配中文队名
    allTeams.forEach(t => {
      if (t.name_cn && lower.includes(t.name_cn)) refs.teamIds.push(t.id);
      if (t.name && lower.includes(t.name.toLowerCase())) refs.teamIds.push(t.id);
    });

    // 匹配"巴西"、"德国"等简称
    const shortNames = { '巴西': 1, '德国': 2, '阿根廷': 3, '法国': 4, '英格兰': 5, '西班牙': 6, '葡萄牙': 7, '荷兰': 8, '意大利': 9, '日本': 10, '韩国': 11 };
    Object.entries(shortNames).forEach(([name, id]) => {
      if (lower.includes(name) && !refs.teamIds.includes(id)) refs.teamIds.push(id);
    });

    // 去重
    refs.teamIds = [...new Set(refs.teamIds)];

    return refs;
  }

  _buildContext(references) {
    const ctx = {};

    // 引用的球队详情
    if (references.teamIds.length > 0) {
      ctx.referencedTeams = references.teamIds.map(id => {
        const team = teams.getById(id);
        if (!team) return null;
        const pred = predictionService.getTeamPrediction(id);
        const recentMatches = matches.query(m =>
          (m.home_team_id === id || m.away_team_id === id) && m.status === 'completed'
        ).sort((a, b) => new Date(b.match_date) - new Date(a.match_date)).slice(0, 5);
        return {
          id: team.id, name: team.name, name_cn: team.name_cn,
          group: team.group_name, fifa_rank: team.fifa_rank, coach: team.coach,
          strength: pred?.strength, groupAdvanceProb: pred?.groupAdvanceProb,
          recentMatches: recentMatches.map(m => ({
            opponent: m.home_team_id === id ? teams.getById(m.away_team_id)?.name_cn : teams.getById(m.home_team_id)?.name_cn,
            score: `${m.home_score}-${m.away_score}`,
            date: m.match_date
          }))
        };
      }).filter(Boolean);
    }

    // 实力排名前10
    const rankings = predictionService.getTeamRankings();
    ctx.topTeams = rankings.slice(0, 10).map(r => ({
      name: r.name_cn, group: r.group_name, strength: r.strength, fifa_rank: r.fifa_rank
    }));

    // 全局统计
    const allMatches = matches.getAll();
    const completed = allMatches.filter(m => m.status === 'completed');
    ctx.tournamentStats = {
      totalMatches: allMatches.length,
      completedMatches: completed.length,
      totalGoals: completed.reduce((s, m) => s + m.home_score + m.away_score, 0)
    };

    return ctx;
  }

  _buildSystemPrompt(style, context) {
    const styleInstructions = {
      professional: '请用专业、准确的中文回答。像一位资深足球分析师那样，引用数据支持你的观点。',
      humorous: '请用幽默风趣的中文回答。可以适当加入足球梗和调侃，但信息要准确。',
      dialect: '请用接地气的中文回答，带点东北话的味道，像跟哥们儿唠嗑一样，但数据不能瞎说。'
    };

    return `你是一个世界杯足球资讯AI助手，名字叫"球探AI"。你的任务是帮助球迷了解2026年美加墨世界杯的相关信息。

${styleInstructions[style] || styleInstructions.professional}

你可以回答关于以下方面的问题：
- 球队实力分析和排名预测
- 比赛赛程和结果
- 球员数据和表现
- 小组出线形势
- 历史交锋记录
- 赔率数据分析
- 足球知识和趣闻

请注意：
- 如果被问到的问题不在你的知识范围内，诚实地告知用户
- 回答时适当使用emoji增加趣味性（每段1-2个即可）
- 用简洁清晰的语言，每次回答控制在300字以内`;
  }

  async _callLLM(messages, maxTokens = 1024) {
    const url = `${DEEPSEEK_BASE_URL}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`DeepSeek API错误 (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '（AI未返回有效回复）';
  }

  // ==================== 辅助 ====================

  _getH2HSummary(teamId1, teamId2) {
    const h2hMatches = matches.query(m =>
      (m.home_team_id === teamId1 && m.away_team_id === teamId2) ||
      (m.home_team_id === teamId2 && m.away_team_id === teamId1)
    ).filter(m => m.status === 'completed');

    if (h2hMatches.length === 0) return '暂无历史交锋数据';

    let wins1 = 0, wins2 = 0, draws = 0;
    h2hMatches.forEach(m => {
      const isTeam1Home = m.home_team_id === teamId1;
      if (m.home_score === m.away_score) draws++;
      else if ((isTeam1Home && m.home_score > m.away_score) || (!isTeam1Home && m.away_score > m.home_score)) wins1++;
      else wins2++;
    });

    return { total: h2hMatches.length, team1Wins: wins1, team2Wins: wins2, draws };
  }
}

module.exports = new AiService();
