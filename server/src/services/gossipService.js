const { news, teams } = require('../models/database');

class GossipService {
  getTeamGossipStats(teamId) {
    const team = teams.getById(teamId);
    if (!team) return null;

    const gossipArticles = news.query(n => n.category === 'gossip');
    const teamMentions = gossipArticles.filter(a => {
      const text = (a.title + ' ' + (a.summary || '')).toLowerCase();
      return text.includes((team.name || '').toLowerCase()) ||
             text.includes((team.name_cn || '').toLowerCase());
    });

    const totalGossip = gossipArticles.length;
    const gossipRate = totalGossip > 0 ? Math.round(teamMentions.length / totalGossip * 1000) / 10 : 0;

    const recentGossip = teamMentions
      .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at))
      .slice(0, 5);

    const gossipLevel = teamMentions.length >= 5 ? 5 : teamMentions.length >= 3 ? 3 : teamMentions.length >= 1 ? 1 : 0;

    return {
      team: { id: teamId, name: team.name, name_cn: team.name_cn },
      totalGossip,
      teamGossipCount: teamMentions.length,
      gossipRate,
      gossipLevel,
      recentGossip: recentGossip.map(a => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        published_at: a.published_at,
        source: a.source
      }))
    };
  }

  getAllGossipStats() {
    const allTeams = teams.getAll();
    const stats = allTeams.map(t => this.getTeamGossipStats(t.id)).filter(s => s && s.teamGossipCount > 0);
    stats.sort((a, b) => b.teamGossipCount - a.teamGossipCount);
    return stats;
  }

  getGossipTrend(teamId) {
    const stats = this.getTeamGossipStats(teamId);
    if (!stats) return null;

    const allGossip = news.query(n => n.category === 'gossip');
    const teamGossip = allGossip.filter(a => {
      const text = (a.title + ' ' + (a.summary || '')).toLowerCase();
      const team = teams.getById(teamId);
      return team && (text.includes((team.name || '').toLowerCase()) || text.includes((team.name_cn || '').toLowerCase()));
    });

    const byMonth = {};
    teamGossip.forEach(a => {
      const month = (a.published_at || a.created_at || '').slice(0, 7);
      if (month) byMonth[month] = (byMonth[month] || 0) + 1;
    });

    const trend = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    return { ...stats, trend };
  }
}

module.exports = new GossipService();
