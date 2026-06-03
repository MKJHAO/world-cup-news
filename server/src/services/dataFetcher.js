const https = require('https');
const http = require('http');
const { teams, matches, news, standings } = require('../models/database');
const rssService = require('./rssService');

// 球队英文名到中文名的映射
const TEAM_CN_MAP = {
  'Mexico': '墨西哥', 'South Africa': '南非', 'South Korea': '韩国', 'Czech Republic': '捷克',
  'Canada': '加拿大', 'Bosnia & Herzegovina': '波黑', 'Qatar': '卡塔尔', 'Switzerland': '瑞士',
  'Brazil': '巴西', 'Morocco': '摩洛哥', 'Haiti': '海地', 'Scotland': '苏格兰',
  'USA': '美国', 'Paraguay': '巴拉圭', 'Australia': '澳大利亚', 'Turkey': '土耳其',
  'Germany': '德国', 'Curaçao': '库拉索', 'Ivory Coast': '科特迪瓦', 'Ecuador': '厄瓜多尔',
  'Netherlands': '荷兰', 'Japan': '日本', 'Sweden': '瑞典', 'Tunisia': '突尼斯',
  'Belgium': '比利时', 'Egypt': '埃及', 'Iran': '伊朗', 'New Zealand': '新西兰',
  'Spain': '西班牙', 'Cape Verde': '佛得角', 'Saudi Arabia': '沙特阿拉伯', 'Uruguay': '乌拉圭',
  'France': '法国', 'Senegal': '塞内加尔', 'Iraq': '伊拉克', 'Norway': '挪威',
  'Argentina': '阿根廷', 'Algeria': '阿尔及利亚', 'Austria': '奥地利', 'Jordan': '约旦',
  'Portugal': '葡萄牙', 'DR Congo': '刚果(金)', 'Uzbekistan': '乌兹别克斯坦', 'Colombia': '哥伦比亚',
  'England': '英格兰', 'Croatia': '克罗地亚', 'Ghana': '加纳', 'Panama': '巴拿马',
  'Denmark': '丹麦', 'Poland': '波兰', 'Serbia': '塞尔维亚', 'Cameroon': '喀麦隆',
  'Costa Rica': '哥斯达黎加', 'Wales': '威尔士', 'Italy': '意大利', 'Chile': '智利',
  'Russia': '俄罗斯', 'Nigeria': '尼日利亚', 'Peru': '秘鲁', 'Venezuela': '委内瑞拉'
};

const FLAG_COUNTRY_MAP = {
  'Mexico': 'mx', 'South Africa': 'za', 'South Korea': 'kr', 'Czech Republic': 'cz',
  'Canada': 'ca', 'Bosnia & Herzegovina': 'ba', 'Qatar': 'qa', 'Switzerland': 'ch',
  'Brazil': 'br', 'Morocco': 'ma', 'Haiti': 'ht', 'Scotland': 'gb-sct',
  'USA': 'us', 'Paraguay': 'py', 'Australia': 'au', 'Turkey': 'tr',
  'Germany': 'de', 'Curaçao': 'cw', 'Ivory Coast': 'ci', 'Ecuador': 'ec',
  'Netherlands': 'nl', 'Japan': 'jp', 'Sweden': 'se', 'Tunisia': 'tn',
  'Belgium': 'be', 'Egypt': 'eg', 'Iran': 'ir', 'New Zealand': 'nz',
  'Spain': 'es', 'Cape Verde': 'cv', 'Saudi Arabia': 'sa', 'Uruguay': 'uy',
  'France': 'fr', 'Senegal': 'sn', 'Iraq': 'iq', 'Norway': 'no',
  'Argentina': 'ar', 'Algeria': 'dz', 'Austria': 'at', 'Jordan': 'jo',
  'Portugal': 'pt', 'DR Congo': 'cd', 'Uzbekistan': 'uz', 'Colombia': 'co',
  'England': 'gb-eng', 'Croatia': 'hr', 'Ghana': 'gh', 'Panama': 'pa'
};

const COLORS = ['#1a472a', '#c4922e', '#002395', '#8a1538', '#006847', '#bc002d', '#c60b1e', '#f36c21',
  '#0038a8', '#009c3b', '#d52b1e', '#cd2e3a'];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  });
}

class DataFetcher {
  // 从 openfootball 获取2026世界杯数据
  async fetchWorldCup2026() {
    try {
      const json = await fetchUrl('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json');
      const data = JSON.parse(json);
      console.log(`📥 获取到2026世界杯数据: ${(data.matches || []).length} 场比赛`);
      return data;
    } catch (e) {
      console.error('获取2026数据失败:', e.message);
      return null;
    }
  }

  // 将2026数据同步到数据库
  async syncWorldCup2026() {
    const data = await this.fetchWorldCup2026();
    if (!data || !data.matches) return { success: false, message: '数据获取失败' };

    const result = { newTeams: 0, newMatches: 0, skippedMatches: 0 };

    // 1. 提取并创建新球队
    const uniqueTeams = new Set();
    data.matches.forEach(m => {
      if (m.team1 && !m.team1.startsWith('W') && !m.team1.startsWith('L') && !m.team1.match(/^\d/)) uniqueTeams.add(m.team1);
      if (m.team2 && !m.team2.startsWith('W') && !m.team2.startsWith('L') && !m.team2.match(/^\d/)) uniqueTeams.add(m.team2);
    });

    const teamIdMap = {}; // name -> id
    // 检查已存在的球队
    const existingTeams = teams.getAll();
    existingTeams.forEach(t => { teamIdMap[t.name] = t.id; });

    [...uniqueTeams].forEach((name, i) => {
      if (!teamIdMap[name]) {
        const groupName = data.matches.find(m => m.team1 === name || m.team2 === name)?.group?.replace('Group ', '') || '';
        const newTeam = teams.insert({
          name, name_cn: TEAM_CN_MAP[name] || name,
          flag_emoji: '', group_name: groupName, fifa_rank: 0, coach: '',
          color_primary: COLORS[i % COLORS.length], color_secondary: '#ffffff'
        });
        teamIdMap[name] = newTeam.id;
        result.newTeams++;
      }
    });

    // 2. 创建比赛记录（只创建尚未存在的）
    const existingMatches = matches.getAll();
    const matchKeys = new Set(existingMatches.map(m => `${m.home_team_id}-${m.away_team_id}-${m.match_date}`));

    // 标准化阶段名
    const stageMap = {};
    data.matches.forEach(m => {
      const rd = m.round || '';
      if (rd.startsWith('Matchday')) stageMap[rd] = 'group';
      else if (rd.includes('Round of 32')) stageMap[rd] = 'round32';
      else if (rd.includes('Round of 16')) stageMap[rd] = 'round16';
      else if (rd.includes('Quarter')) stageMap[rd] = 'quarter';
      else if (rd.includes('Semi')) stageMap[rd] = 'semi';
      else if (rd.includes('Third place') || rd.includes('3rd')) stageMap[rd] = 'third';
      else if (rd.includes('Final')) stageMap[rd] = 'final';
      else stageMap[rd] = 'group';
    });

    let newMatchCount = 0;
    data.matches.forEach(m => {
      const hId = teamIdMap[m.team1];
      const aId = teamIdMap[m.team2];
      if (!hId || !aId) return; // 淘汰赛占位符

      const dateStr = `${m.date} ${(m.time || '00:00').split(' ')[0]}`;
      const key = `${hId}-${aId}-${dateStr}`;

      if (!matchKeys.has(key)) {
        const groupName = (m.group || '').replace('Group ', '');
        const stage = stageMap[m.round] || 'group';
        const status = new Date(m.date) < new Date() ? 'completed' : 'scheduled';

        matches.insert({
          home_team_id: hId, away_team_id: aId,
          group_name: groupName, stage,
          match_date: dateStr, status,
          home_score: 0, away_score: 0, home_penalty: 0, away_penalty: 0,
          stadium: m.ground || '', attendance: 0,
          tournament: '2026'
        });
        newMatchCount++;
      } else {
        result.skippedMatches++;
      }
    });

    result.newMatches = newMatchCount;
    console.log(`✅ 2026世界杯数据同步完成: ${result.newTeams} 支新球队, ${result.newMatches} 场新比赛`);
    return { success: true, ...result };
  }

  // 从多个源获取最新世界杯新闻 (RSS优先)
  async fetchLatestNews() {
    console.log('📰 开始获取最新新闻...');

    // 1) 优先从 RSS 源获取
    try {
      const rssResult = await rssService.fetchAllFeeds();
      if (rssResult.success && rssResult.added > 0) {
        console.log(`✅ RSS新闻获取成功: ${rssResult.added} 篇新文章`);
        return { success: true, added: rssResult.added, source: 'rss', details: rssResult };
      }
    } catch (e) {
      console.warn('RSS新闻获取异常:', e.message);
    }

    // 2) 回退到 GNews API
    const apiKey = process.env.GNEWS_API_KEY;
    if (apiKey) {
      try {
        const json = await fetchUrl(
          `https://gnews.io/api/v4/search?q=world+cup+2026+football&lang=en&max=10&apikey=${apiKey}`
        );
        const data = JSON.parse(json);
        if (data.articles) {
          let addedCount = 0;
          const existingTitles = new Set(news.getAll().map(n => n.title));
          data.articles.forEach(a => {
            if (!existingTitles.has(a.title)) {
              news.insert({
                title: a.title, summary: a.description || '', content: a.content || '',
                cover_url: a.image || '', category: 'news',
                source: a.source?.name || 'GNews', published_at: a.publishedAt || new Date().toISOString()
              });
              addedCount++;
            }
          });
          console.log(`📰 GNews获取到 ${addedCount} 条新闻`);
          return { success: true, added: addedCount, source: 'gnews' };
        }
      } catch (e) {
        console.warn('GNews获取失败:', e.message);
      }
    }

    // 3) 最后回退到内置新闻源
    console.log('📋 使用内置新闻源');
    return this.fetchBuiltInNews();
  }

  // 内置世界杯相关新闻（当API不可用时）
  fetchBuiltInNews() {
    const currentNews = [
      {
        title: '2026世界杯赛程公布：墨西哥城揭幕战，纽约/新泽西举办决赛',
        summary: 'FIFA正式公布2026美加墨世界杯完整赛程，104场比赛横跨16个主办城市。',
        content: '2026年世界杯将在6月11日于墨西哥城阿兹特克球场揭幕，这是世界杯历史上首次由三个国家联合举办。决赛将于7月19日在纽约/新泽西大都会人寿球场举行。本届世界杯首次扩军至48支球队，共进行104场比赛。',
        category: 'news', source: 'FIFA官方'
      },
      {
        title: '2026世界杯分组出炉：阿根廷遇奥地利，巴西同组摩洛哥',
        summary: '48支球队被分入12个小组，多场重量级对决值得期待。',
        content: 'A组：墨西哥、南非、韩国、捷克；B组：加拿大、波黑、卡塔尔、瑞士；C组：巴西、摩洛哥、海地、苏格兰...阿根廷作为J组种子队，将面对阿尔及利亚、奥地利和约旦的挑战。',
        category: 'news', source: 'FIFA官方'
      },
      {
        title: '世界杯扩军48队：亚洲8.5个名额创历史新高',
        summary: '2026世界杯亚洲区预选赛竞争激烈，8.5个名额为亚洲球队提供更多机会。',
        content: '随着2026世界杯扩军至48支球队，亚洲足联获得8.5个参赛名额。中国、日本、韩国、伊朗、沙特、澳大利亚等球队正在激烈争夺出线资格。这是亚洲球队在世界杯历史上获得的最多名额。',
        category: 'feature', source: 'AFC官方'
      },
      {
        title: '2026世界杯16个主办城市：横跨北美三国',
        summary: '美国11城、加拿大2城、墨西哥3城将共同承办2026世界杯。',
        content: '美国主办城市：亚特兰大、波士顿、达拉斯、休斯顿、堪萨斯城、洛杉矶、迈阿密、纽约/新泽西、费城、旧金山湾区、西雅图。加拿大：多伦多、温哥华。墨西哥：墨西哥城、瓜达拉哈拉、蒙特雷。',
        category: 'feature', source: 'FIFA官方'
      },
      {
        title: '世界杯预选赛最新战况：多支传统强队提前出线',
        summary: '2026世界杯各大洲预选赛进入关键阶段，多支球队已锁定出线名额。',
        content: '南美区预选赛中，阿根廷、巴西继续保持强势。欧洲区预选赛竞争白热化，法国、英格兰、西班牙、德国、葡萄牙等传统强队占据有利位置。亚洲区18强赛正在激烈进行中。',
        category: 'news', source: '综合报道'
      },
      {
        title: '梅西确认参加2026世界杯：将冲击第六届世界杯纪录',
        summary: '阿根廷球星梅西表示将参加2026美加墨世界杯，追逐更多纪录。',
        content: '尽管届时将年满39岁，梅西仍在近期采访中确认将参加2026世界杯。如果成行，这将是他第六次参加世界杯，创造新的历史纪录。他在2022年率领阿根廷夺冠后，希望在2026年成功卫冕。',
        category: 'player', source: 'ESPN'
      },
      {
        title: '2026世界杯吉祥物和官方用球即将发布',
        summary: 'FIFA将在近期公布2026世界杯官方吉祥物和比赛用球设计。',
        content: '距离2026世界杯开幕还有约一年时间，FIFA正在紧锣密鼓地筹备各项事宜。据透露，新的吉祥物设计将融合北美三国文化特色，官方比赛用球也将在技术上实现新的突破。',
        category: 'news', source: 'FIFA官方'
      }
    ];

    const existingTitles = new Set(news.getAll().map(n => n.title));
    let added = 0;
    currentNews.forEach(n => {
      if (!existingTitles.has(n.title)) {
        news.insert({
          ...n, cover_url: '', published_at: new Date().toISOString()
        });
        added++;
      }
    });
    console.log(`📰 添加了 ${added} 条内置新闻`);
    return { success: true, added };
  }

  // 获取全部最新数据
  async refreshAll() {
    const results = {
      worldcup2026: null,
      news: null
    };

    console.log('🔄 开始刷新数据...');
    results.worldcup2026 = await this.syncWorldCup2026();
    results.news = await this.fetchLatestNews();
    console.log('✅ 数据刷新完成');

    return results;
  }
}

module.exports = new DataFetcher();
