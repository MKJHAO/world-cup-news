/**
 * 同步2026世界杯真实赛程数据，合并到现有2022数据集
 * 运行: node server/scripts/sync-2026-data.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// 中文队名映射
const TEAM_CN_MAP = {
  'United States': '美国', 'Mexico': '墨西哥', 'Canada': '加拿大',
  'Argentina': '阿根廷', 'Brazil': '巴西', 'Uruguay': '乌拉圭', 'Colombia': '哥伦比亚',
  'France': '法国', 'England': '英格兰', 'Spain': '西班牙', 'Germany': '德国',
  'Portugal': '葡萄牙', 'Netherlands': '荷兰', 'Belgium': '比利时', 'Italy': '意大利',
  'Croatia': '克罗地亚', 'Switzerland': '瑞士', 'Denmark': '丹麦', 'Austria': '奥地利',
  'Serbia': '塞尔维亚', 'Sweden': '瑞典', 'Poland': '波兰', 'Turkey': '土耳其',
  'Japan': '日本', 'South Korea': '韩国', 'Iran': '伊朗', 'Saudi Arabia': '沙特阿拉伯',
  'Australia': '澳大利亚', 'Qatar': '卡塔尔', 'Morocco': '摩洛哥', 'Senegal': '塞内加尔',
  'Tunisia': '突尼斯', 'Egypt': '埃及', 'Algeria': '阿尔及利亚', 'Nigeria': '尼日利亚',
  'Cameroon': '喀麦隆', 'Ghana': '加纳', 'South Africa': '南非',
  'Ecuador': '厄瓜多尔', 'Chile': '智利', 'Peru': '秘鲁', 'Paraguay': '巴拉圭',
  'Costa Rica': '哥斯达黎加', 'Jamaica': '牙买加', 'Panama': '巴拿马', 'Honduras': '洪都拉斯',
  'New Zealand': '新西兰', 'United Arab Emirates': '阿联酋', 'Iraq': '伊拉克',
  'Wales': '威尔士', 'Scotland': '苏格兰', 'Ukraine': '乌克兰', 'Czech Republic': '捷克',
  'Norway': '挪威', 'Hungary': '匈牙利', 'Russia': '俄罗斯', 'Greece': '希腊',
  'Slovakia': '斯洛伐克', 'Romania': '罗马尼亚', 'Republic of Ireland': '爱尔兰',
  'Bosnia and Herzegovina': '波黑', 'Finland': '芬兰', 'Israel': '以色列',
  'Burkina Faso': '布基纳法索', 'Mali': '马里', "Côte d'Ivoire": '科特迪瓦', 'Guinea': '几内亚',
  'Venezuela': '委内瑞拉', 'Bolivia': '玻利维亚', 'Jordan': '约旦',
};

const COLORS = ['#006847', '#002868', '#c60b1e', '#fcd116', '#00853f', '#003893',
  '#75aadb', '#c1272d', '#da0000', '#ce1126', '#009c3b', '#0c4076'];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 30000 }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  });
}

function stageLabel(round, group) {
  const r = (round || '').toLowerCase();
  if (r.includes('matchday')) return 'group';
  if (r.includes('round') && r.includes('32')) return 'round32';
  if (r.includes('round') && r.includes('16')) return 'round16';
  if (r.includes('quarter')) return 'quarter';
  if (r.includes('semi')) return group?.includes('Third') ? 'third' : 'semi';
  if (r.includes('final')) return 'final';
  return 'group';
}

async function main() {
  console.log('📥 获取2026世界杯赛程数据...\n');

  // 从 openfootball 获取
  let raw;
  try {
    raw = await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json');
    console.log('✅ 数据获取成功');
  } catch (e) {
    console.error('❌ 获取失败:', e.message);
    console.log('💡 使用内置2026赛程数据...');
    // 回退：加载本地预存数据
    raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'worldcup2026_fallback.json'), 'utf-8');
  }

  const data = JSON.parse(raw);
  const matchList = data.matches || data.rounds || [];

  // 收集所有比赛和球队
  const allMatches = [];
  const teamNames = new Set();

  matchList.forEach(m => {
    const t1 = typeof m.team1 === 'string' ? m.team1 : (m.team1?.name || m.team1);
    const t2 = typeof m.team2 === 'string' ? m.team2 : (m.team2?.name || m.team2);
    if (!t1 || !t2) return;
    // 过滤占位符
    if (t1.startsWith('W') || t1.startsWith('L') || t1.match(/^\d/)) return;
    if (t2.startsWith('W') || t2.startsWith('L') || t2.match(/^\d/)) return;

    teamNames.add(t1);
    teamNames.add(t2);

    allMatches.push({
      team1: t1,
      team2: t2,
      date: m.date || '',
      group: m.group || '',
      round: m.round || '',
      stadium: typeof m.stadium === 'string' ? m.stadium : (m.stadium?.name || ''),
    });
  });

  console.log(`📊 解析到: ${teamNames.size} 支球队, ${allMatches.length} 场比赛`);

  // 加载现有数据
  const existingTeams = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'teams.json'), 'utf-8'));
  const existingMatches = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'matches.json'), 'utf-8'));

  // 分配新ID
  let nextTeamId = Math.max(...existingTeams.map(t => t.id || 0), 0) + 1;
  let nextMatchId = Math.max(...existingMatches.map(m => m.id || 0), 0) + 1;

  const teamIdMap = {};
  existingTeams.forEach(t => { teamIdMap[t.name] = t.id; });

  const newTeams = [];
  [...teamNames].sort().forEach((name, i) => {
    if (!teamIdMap[name]) {
      const id = nextTeamId++;
      teamIdMap[name] = id;
      newTeams.push({
        id,
        name,
        name_cn: TEAM_CN_MAP[name] || name,
        flag_emoji: '',
        group_name: '',
        fifa_rank: 0,
        coach: '',
        color_primary: COLORS[i % COLORS.length],
        color_secondary: '#ffffff'
      });
    }
  });

  console.log(`  + ${newTeams.length} 支新球队`);

  // 创建2026比赛（全部标记为scheduled）
  const newMatches = [];
  allMatches.forEach((m, i) => {
    const homeId = teamIdMap[m.team1];
    const awayId = teamIdMap[m.team2];
    if (!homeId || !awayId) return;

    const groupName = (m.group || '').replace('Group ', '');
    const stage = stageLabel(m.round, m.group);

    newMatches.push({
      id: nextMatchId++,
      home_team_id: homeId,
      away_team_id: awayId,
      group_name: stage === 'group' ? groupName : '',
      stage: stage,
      match_date: m.date || '2026-06-01 00:00',
      status: 'scheduled',
      home_score: 0,
      away_score: 0,
      home_penalty: 0,
      away_penalty: 0,
      stadium: m.stadium || '',
      attendance: 0,
      tournament: '2026',
      match_minute: 0,
      simulated: false
    });
  });

  // 按日期排序
  newMatches.sort((a, b) => (a.match_date || '').localeCompare(b.match_date || ''));

  // 合并并写入
  const allTeams = [...existingTeams, ...newTeams];
  const allMatchesData = [...existingMatches, ...newMatches];

  fs.writeFileSync(path.join(DATA_DIR, 'teams.json'), JSON.stringify(allTeams, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'matches.json'), JSON.stringify(allMatchesData, null, 2));

  console.log(`\n✅ 同步完成!`);
  console.log(`   球队: ${existingTeams.length} → ${allTeams.length} (+${newTeams.length})`);
  console.log(`   比赛: ${existingMatches.length} → ${allMatchesData.length} (+${newMatches.length})`);
  console.log(`   2022: ${existingMatches.length} 场 (真实比分)`);
  console.log(`   2026: ${newMatches.length} 场 (赛程数据)`);
  console.log(`   总计: ${allMatchesData.length} 场`);
}

main().catch(e => { console.error('失败:', e.message); process.exit(1); });
