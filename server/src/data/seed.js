const { teams, players, matches, matchEvents, standings, news, goalScorers } = require('../models/database');

// 清空数据
teams.deleteAll();
players.deleteAll();
matches.deleteAll();
matchEvents.deleteAll();
standings.deleteAll();
news.deleteAll();
goalScorers.deleteAll();

// === 32强球队数据 ===
const teamsData = [
  { id: 1, name: 'Qatar', name_cn: '卡塔尔', flag_emoji: '🇶🇦', group_name: 'A', fifa_rank: 50, coach: '费利克斯·桑切斯', color_primary: '#8a1538', color_secondary: '#ffffff' },
  { id: 2, name: 'Ecuador', name_cn: '厄瓜多尔', flag_emoji: '🇪🇨', group_name: 'A', fifa_rank: 44, coach: '古斯塔沃·阿尔法罗', color_primary: '#fcd116', color_secondary: '#003893' },
  { id: 3, name: 'Senegal', name_cn: '塞内加尔', flag_emoji: '🇸🇳', group_name: 'A', fifa_rank: 18, coach: '阿利乌·西塞', color_primary: '#00853f', color_secondary: '#fdef42' },
  { id: 4, name: 'Netherlands', name_cn: '荷兰', flag_emoji: '🇳🇱', group_name: 'A', fifa_rank: 8, coach: '路易斯·范加尔', color_primary: '#f36c21', color_secondary: '#ffffff' },
  { id: 5, name: 'England', name_cn: '英格兰', flag_emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group_name: 'B', fifa_rank: 5, coach: '加雷斯·索斯盖特', color_primary: '#ffffff', color_secondary: '#cf081f' },
  { id: 6, name: 'Iran', name_cn: '伊朗', flag_emoji: '🇮🇷', group_name: 'B', fifa_rank: 20, coach: '卡洛斯·奎罗斯', color_primary: '#ffffff', color_secondary: '#da0000' },
  { id: 7, name: 'USA', name_cn: '美国', flag_emoji: '🇺🇸', group_name: 'B', fifa_rank: 16, coach: '格雷格·伯哈尔特', color_primary: '#ffffff', color_secondary: '#002868' },
  { id: 8, name: 'Wales', name_cn: '威尔士', flag_emoji: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', group_name: 'B', fifa_rank: 19, coach: '罗布·佩奇', color_primary: '#d30731', color_secondary: '#ffffff' },
  { id: 9, name: 'Argentina', name_cn: '阿根廷', flag_emoji: '🇦🇷', group_name: 'C', fifa_rank: 3, coach: '利昂内尔·斯卡洛尼', color_primary: '#75aadb', color_secondary: '#ffffff' },
  { id: 10, name: 'Saudi Arabia', name_cn: '沙特阿拉伯', flag_emoji: '🇸🇦', group_name: 'C', fifa_rank: 51, coach: '埃尔韦·勒纳尔', color_primary: '#006c35', color_secondary: '#ffffff' },
  { id: 11, name: 'Mexico', name_cn: '墨西哥', flag_emoji: '🇲🇽', group_name: 'C', fifa_rank: 13, coach: '赫拉尔多·马蒂诺', color_primary: '#006847', color_secondary: '#ce1126' },
  { id: 12, name: 'Poland', name_cn: '波兰', flag_emoji: '🇵🇱', group_name: 'C', fifa_rank: 26, coach: '切斯瓦夫·米赫涅维奇', color_primary: '#ffffff', color_secondary: '#dc143c' },
  { id: 13, name: 'France', name_cn: '法国', flag_emoji: '🇫🇷', group_name: 'D', fifa_rank: 4, coach: '迪迪埃·德尚', color_primary: '#002395', color_secondary: '#ed2939' },
  { id: 14, name: 'Australia', name_cn: '澳大利亚', flag_emoji: '🇦🇺', group_name: 'D', fifa_rank: 38, coach: '格雷厄姆·阿诺德', color_primary: '#fcd116', color_secondary: '#00843d' },
  { id: 15, name: 'Denmark', name_cn: '丹麦', flag_emoji: '🇩🇰', group_name: 'D', fifa_rank: 10, coach: '卡斯珀·尤尔曼德', color_primary: '#c60c30', color_secondary: '#ffffff' },
  { id: 16, name: 'Tunisia', name_cn: '突尼斯', flag_emoji: '🇹🇳', group_name: 'D', fifa_rank: 30, coach: '贾莱尔·卡德里', color_primary: '#e70013', color_secondary: '#ffffff' },
  { id: 17, name: 'Spain', name_cn: '西班牙', flag_emoji: '🇪🇸', group_name: 'E', fifa_rank: 7, coach: '路易斯·恩里克', color_primary: '#c60b1e', color_secondary: '#ffc400' },
  { id: 18, name: 'Costa Rica', name_cn: '哥斯达黎加', flag_emoji: '🇨🇷', group_name: 'E', fifa_rank: 31, coach: '路易斯·费尔南多·苏亚雷斯', color_primary: '#002b7f', color_secondary: '#ce1126' },
  { id: 19, name: 'Germany', name_cn: '德国', flag_emoji: '🇩🇪', group_name: 'E', fifa_rank: 11, coach: '汉西·弗利克', color_primary: '#000000', color_secondary: '#dd0000' },
  { id: 20, name: 'Japan', name_cn: '日本', flag_emoji: '🇯🇵', group_name: 'E', fifa_rank: 24, coach: '森保一', color_primary: '#bc002d', color_secondary: '#ffffff' },
  { id: 21, name: 'Belgium', name_cn: '比利时', flag_emoji: '🇧🇪', group_name: 'F', fifa_rank: 2, coach: '罗伯托·马丁内斯', color_primary: '#000000', color_secondary: '#fdda24' },
  { id: 22, name: 'Canada', name_cn: '加拿大', flag_emoji: '🇨🇦', group_name: 'F', fifa_rank: 41, coach: '约翰·赫德曼', color_primary: '#ff0000', color_secondary: '#ffffff' },
  { id: 23, name: 'Morocco', name_cn: '摩洛哥', flag_emoji: '🇲🇦', group_name: 'F', fifa_rank: 22, coach: '瓦利德·雷格拉吉', color_primary: '#c1272d', color_secondary: '#006233' },
  { id: 24, name: 'Croatia', name_cn: '克罗地亚', flag_emoji: '🇭🇷', group_name: 'F', fifa_rank: 12, coach: '兹拉特科·达利奇', color_primary: '#ff0000', color_secondary: '#ffffff' },
  { id: 25, name: 'Brazil', name_cn: '巴西', flag_emoji: '🇧🇷', group_name: 'G', fifa_rank: 1, coach: '蒂特', color_primary: '#009c3b', color_secondary: '#fedd00' },
  { id: 26, name: 'Serbia', name_cn: '塞尔维亚', flag_emoji: '🇷🇸', group_name: 'G', fifa_rank: 21, coach: '德拉甘·斯托伊科维奇', color_primary: '#c6363c', color_secondary: '#0c4076' },
  { id: 27, name: 'Switzerland', name_cn: '瑞士', flag_emoji: '🇨🇭', group_name: 'G', fifa_rank: 15, coach: '穆拉特·亚金', color_primary: '#d52b1e', color_secondary: '#ffffff' },
  { id: 28, name: 'Cameroon', name_cn: '喀麦隆', flag_emoji: '🇨🇲', group_name: 'G', fifa_rank: 43, coach: '里戈贝尔·宋', color_primary: '#007a5e', color_secondary: '#fcd116' },
  { id: 29, name: 'Portugal', name_cn: '葡萄牙', flag_emoji: '🇵🇹', group_name: 'H', fifa_rank: 9, coach: '费尔南多·桑托斯', color_primary: '#006600', color_secondary: '#ff0000' },
  { id: 30, name: 'Ghana', name_cn: '加纳', flag_emoji: '🇬🇭', group_name: 'H', fifa_rank: 61, coach: '奥托·阿多', color_primary: '#006b3f', color_secondary: '#fcd116' },
  { id: 31, name: 'Uruguay', name_cn: '乌拉圭', flag_emoji: '🇺🇾', group_name: 'H', fifa_rank: 14, coach: '迭戈·阿隆索', color_primary: '#0038a8', color_secondary: '#fcd116' },
  { id: 32, name: 'South Korea', name_cn: '韩国', flag_emoji: '🇰🇷', group_name: 'H', fifa_rank: 28, coach: '保罗·本托', color_primary: '#cd2e3a', color_secondary: '#0047a0' }
];
teams.setData(teamsData);

// === 关键球员 ===
const playersData = [
  { id: 1, team_id: 9, name: 'Lionel Messi', name_cn: '梅西', number: 10, position: 'FW', age: 35 },
  { id: 2, team_id: 9, name: 'Angel Di Maria', name_cn: '迪马利亚', number: 11, position: 'FW', age: 34 },
  { id: 3, team_id: 9, name: 'Julian Alvarez', name_cn: '阿尔瓦雷斯', number: 9, position: 'FW', age: 22 },
  { id: 4, team_id: 9, name: 'Emiliano Martinez', name_cn: '马丁内斯', number: 23, position: 'GK', age: 30 },
  { id: 5, team_id: 13, name: 'Kylian Mbappe', name_cn: '姆巴佩', number: 10, position: 'FW', age: 23 },
  { id: 6, team_id: 13, name: 'Antoine Griezmann', name_cn: '格列兹曼', number: 7, position: 'FW', age: 31 },
  { id: 7, team_id: 13, name: 'Olivier Giroud', name_cn: '吉鲁', number: 9, position: 'FW', age: 36 },
  { id: 8, team_id: 25, name: 'Neymar', name_cn: '内马尔', number: 10, position: 'FW', age: 30 },
  { id: 9, team_id: 25, name: 'Vinicius Jr', name_cn: '维尼修斯', number: 20, position: 'FW', age: 22 },
  { id: 10, team_id: 25, name: 'Richarlison', name_cn: '里沙利松', number: 9, position: 'FW', age: 25 },
  { id: 11, team_id: 29, name: 'Cristiano Ronaldo', name_cn: 'C罗', number: 7, position: 'FW', age: 37 },
  { id: 12, team_id: 29, name: 'Bruno Fernandes', name_cn: 'B费', number: 8, position: 'MF', age: 28 },
  { id: 13, team_id: 5, name: 'Harry Kane', name_cn: '凯恩', number: 9, position: 'FW', age: 29 },
  { id: 14, team_id: 5, name: 'Jude Bellingham', name_cn: '贝林厄姆', number: 22, position: 'MF', age: 19 },
  { id: 15, team_id: 17, name: 'Gavi', name_cn: '加维', number: 9, position: 'MF', age: 18 },
  { id: 16, team_id: 17, name: 'Pedri', name_cn: '佩德里', number: 26, position: 'MF', age: 19 },
  { id: 17, team_id: 19, name: 'Jamal Musiala', name_cn: '穆夏拉', number: 14, position: 'MF', age: 19 },
  { id: 18, team_id: 4, name: 'Virgil van Dijk', name_cn: '范戴克', number: 4, position: 'DF', age: 31 },
  { id: 19, team_id: 4, name: 'Cody Gakpo', name_cn: '加克波', number: 8, position: 'FW', age: 23 },
  { id: 20, team_id: 24, name: 'Luka Modric', name_cn: '莫德里奇', number: 10, position: 'MF', age: 37 },
  { id: 21, team_id: 21, name: 'Kevin De Bruyne', name_cn: '德布劳内', number: 7, position: 'MF', age: 31 },
  { id: 22, team_id: 23, name: 'Achraf Hakimi', name_cn: '阿什拉夫', number: 2, position: 'DF', age: 24 },
  { id: 23, team_id: 32, name: 'Son Heung-min', name_cn: '孙兴慜', number: 7, position: 'FW', age: 30 }
];
players.setData(playersData);

// === 比赛数据 ===
let matchId = 0;
const M = (h, a, g, s, d, st, hs, as, hp = 0, ap = 0, std, att) => ({
  id: ++matchId, home_team_id: h, away_team_id: a, group_name: g, stage: s,
  match_date: d, status: st, home_score: hs, away_score: as,
  home_penalty: hp, away_penalty: ap, stadium: std, attendance: att, tournament: '2022'
});

const matchesData = [
  // A组
  M(1, 2, 'A', 'group', '2022-11-20 16:00', 'completed', 0, 2, 0, 0, '海湾球场', 67372),
  M(3, 4, 'A', 'group', '2022-11-21 16:00', 'completed', 0, 2, 0, 0, '阿图玛玛球场', 41721),
  M(1, 3, 'A', 'group', '2022-11-25 13:00', 'completed', 1, 3, 0, 0, '阿图玛玛球场', 41797),
  M(4, 2, 'A', 'group', '2022-11-25 16:00', 'completed', 1, 1, 0, 0, '哈利法国际球场', 44833),
  M(4, 1, 'A', 'group', '2022-11-29 15:00', 'completed', 2, 0, 0, 0, '海湾球场', 66784),
  M(2, 3, 'A', 'group', '2022-11-29 15:00', 'completed', 1, 2, 0, 0, '哈利法国际球场', 44569),
  // B组
  M(5, 6, 'B', 'group', '2022-11-21 13:00', 'completed', 6, 2, 0, 0, '哈利法国际球场', 45334),
  M(7, 8, 'B', 'group', '2022-11-21 19:00', 'completed', 1, 1, 0, 0, '艾哈迈德·本·阿里球场', 43418),
  M(8, 6, 'B', 'group', '2022-11-25 10:00', 'completed', 0, 2, 0, 0, '艾哈迈德·本·阿里球场', 40875),
  M(5, 7, 'B', 'group', '2022-11-25 19:00', 'completed', 0, 0, 0, 0, '海湾球场', 68463),
  M(6, 7, 'B', 'group', '2022-11-29 19:00', 'completed', 0, 1, 0, 0, '阿图玛玛球场', 42127),
  M(8, 5, 'B', 'group', '2022-11-29 19:00', 'completed', 0, 3, 0, 0, '艾哈迈德·本·阿里球场', 44297),
  // C组
  M(9, 10, 'C', 'group', '2022-11-22 10:00', 'completed', 1, 2, 0, 0, '卢塞尔球场', 88012),
  M(11, 12, 'C', 'group', '2022-11-22 16:00', 'completed', 0, 0, 0, 0, '974球场', 39369),
  M(12, 10, 'C', 'group', '2022-11-26 13:00', 'completed', 2, 0, 0, 0, '教育城球场', 44259),
  M(9, 11, 'C', 'group', '2022-11-26 19:00', 'completed', 2, 0, 0, 0, '卢塞尔球场', 88966),
  M(10, 11, 'C', 'group', '2022-11-30 19:00', 'completed', 1, 2, 0, 0, '卢塞尔球场', 84985),
  M(12, 9, 'C', 'group', '2022-11-30 19:00', 'completed', 0, 2, 0, 0, '974球场', 44089),
  // D组
  M(13, 14, 'D', 'group', '2022-11-22 19:00', 'completed', 4, 1, 0, 0, '贾努布球场', 40875),
  M(15, 16, 'D', 'group', '2022-11-22 13:00', 'completed', 0, 0, 0, 0, '教育城球场', 42925),
  M(16, 14, 'D', 'group', '2022-11-26 10:00', 'completed', 0, 1, 0, 0, '贾努布球场', 41823),
  M(13, 15, 'D', 'group', '2022-11-26 16:00', 'completed', 2, 1, 0, 0, '974球场', 42860),
  M(16, 13, 'D', 'group', '2022-11-30 15:00', 'completed', 1, 0, 0, 0, '教育城球场', 43627),
  M(14, 15, 'D', 'group', '2022-11-30 15:00', 'completed', 1, 0, 0, 0, '贾努布球场', 41232),
  // E组
  M(19, 20, 'E', 'group', '2022-11-23 13:00', 'completed', 1, 2, 0, 0, '哈利法国际球场', 42608),
  M(17, 18, 'E', 'group', '2022-11-23 16:00', 'completed', 7, 0, 0, 0, '阿图玛玛球场', 40013),
  M(20, 18, 'E', 'group', '2022-11-27 10:00', 'completed', 0, 1, 0, 0, '艾哈迈德·本·阿里球场', 41679),
  M(17, 19, 'E', 'group', '2022-11-27 19:00', 'completed', 1, 1, 0, 0, '海湾球场', 68895),
  M(18, 19, 'E', 'group', '2022-12-01 19:00', 'completed', 2, 4, 0, 0, '海湾球场', 67054),
  M(20, 17, 'E', 'group', '2022-12-01 19:00', 'completed', 2, 1, 0, 0, '哈利法国际球场', 44851),
  // F组
  M(23, 24, 'F', 'group', '2022-11-23 10:00', 'completed', 0, 0, 0, 0, '海湾球场', 59407),
  M(21, 22, 'F', 'group', '2022-11-23 19:00', 'completed', 1, 0, 0, 0, '艾哈迈德·本·阿里球场', 40198),
  M(21, 23, 'F', 'group', '2022-11-27 13:00', 'completed', 0, 2, 0, 0, '阿图玛玛球场', 43738),
  M(24, 22, 'F', 'group', '2022-11-27 16:00', 'completed', 4, 1, 0, 0, '哈利法国际球场', 44374),
  M(24, 21, 'F', 'group', '2022-12-01 15:00', 'completed', 0, 0, 0, 0, '艾哈迈德·本·阿里球场', 43984),
  M(22, 23, 'F', 'group', '2022-12-01 15:00', 'completed', 1, 2, 0, 0, '阿图玛玛球场', 43739),
  // G组
  M(27, 28, 'G', 'group', '2022-11-24 10:00', 'completed', 1, 0, 0, 0, '贾努布球场', 39089),
  M(25, 26, 'G', 'group', '2022-11-24 19:00', 'completed', 2, 0, 0, 0, '卢塞尔球场', 88103),
  M(28, 26, 'G', 'group', '2022-11-28 10:00', 'completed', 3, 3, 0, 0, '贾努布球场', 39869),
  M(25, 27, 'G', 'group', '2022-11-28 16:00', 'completed', 1, 0, 0, 0, '974球场', 43649),
  M(26, 27, 'G', 'group', '2022-12-02 19:00', 'completed', 2, 3, 0, 0, '974球场', 39385),
  M(28, 25, 'G', 'group', '2022-12-02 19:00', 'completed', 1, 0, 0, 0, '卢塞尔球场', 85986),
  // H组
  M(31, 32, 'H', 'group', '2022-11-24 13:00', 'completed', 0, 0, 0, 0, '教育城球场', 41663),
  M(29, 30, 'H', 'group', '2022-11-24 16:00', 'completed', 3, 2, 0, 0, '974球场', 42662),
  M(30, 32, 'H', 'group', '2022-11-28 13:00', 'completed', 3, 2, 0, 0, '教育城球场', 43983),
  M(29, 31, 'H', 'group', '2022-11-28 19:00', 'completed', 2, 0, 0, 0, '卢塞尔球场', 88668),
  M(30, 31, 'H', 'group', '2022-12-02 15:00', 'completed', 0, 2, 0, 0, '贾努布球场', 43443),
  M(32, 29, 'H', 'group', '2022-12-02 15:00', 'completed', 2, 1, 0, 0, '教育城球场', 44097),
  // 1/8决赛
  M(4, 7, '', 'round16', '2022-12-03 15:00', 'completed', 3, 1, 0, 0, '哈利法国际球场', 44846),
  M(9, 14, '', 'round16', '2022-12-03 19:00', 'completed', 2, 1, 0, 0, '艾哈迈德·本·阿里球场', 45032),
  M(13, 12, '', 'round16', '2022-12-04 15:00', 'completed', 3, 1, 0, 0, '阿图玛玛球场', 40972),
  M(5, 3, '', 'round16', '2022-12-04 19:00', 'completed', 3, 0, 0, 0, '海湾球场', 65985),
  M(20, 24, '', 'round16', '2022-12-05 15:00', 'completed', 1, 1, 1, 3, '贾努布球场', 42523),
  M(25, 32, '', 'round16', '2022-12-05 19:00', 'completed', 4, 1, 0, 0, '974球场', 43847),
  M(23, 17, '', 'round16', '2022-12-06 15:00', 'completed', 0, 0, 3, 0, '教育城球场', 44198),
  M(29, 27, '', 'round16', '2022-12-06 19:00', 'completed', 6, 1, 0, 0, '卢塞尔球场', 83268),
  // 1/4决赛
  M(24, 25, '', 'quarter', '2022-12-09 15:00', 'completed', 1, 1, 4, 2, '教育城球场', 43893),
  M(4, 9, '', 'quarter', '2022-12-09 19:00', 'completed', 2, 2, 3, 4, '卢塞尔球场', 88966),
  M(23, 29, '', 'quarter', '2022-12-10 15:00', 'completed', 1, 0, 0, 0, '阿图玛玛球场', 44198),
  M(5, 13, '', 'quarter', '2022-12-10 19:00', 'completed', 1, 2, 0, 0, '海湾球场', 68895),
  // 半决赛
  M(9, 24, '', 'semi', '2022-12-13 19:00', 'completed', 3, 0, 0, 0, '卢塞尔球场', 88966),
  M(13, 23, '', 'semi', '2022-12-14 19:00', 'completed', 2, 0, 0, 0, '海湾球场', 68294),
  // 季军赛
  M(24, 23, '', 'third', '2022-12-17 15:00', 'completed', 2, 1, 0, 0, '哈利法国际球场', 44137),
  // 决赛
  M(9, 13, '', 'final', '2022-12-18 15:00', 'completed', 3, 3, 4, 2, '卢塞尔球场', 88966)
];
matches.setData(matchesData);

// === 积分榜 ===
const standingsData = [
  { id: 1, team_id: 4, group_name: 'A', played: 3, won: 2, drawn: 1, lost: 0, goals_for: 5, goals_against: 1, goal_diff: 4, points: 7 },
  { id: 2, team_id: 3, group_name: 'A', played: 3, won: 2, drawn: 0, lost: 1, goals_for: 5, goals_against: 4, goal_diff: 1, points: 6 },
  { id: 3, team_id: 2, group_name: 'A', played: 3, won: 1, drawn: 1, lost: 1, goals_for: 4, goals_against: 3, goal_diff: 1, points: 4 },
  { id: 4, team_id: 1, group_name: 'A', played: 3, won: 0, drawn: 0, lost: 3, goals_for: 1, goals_against: 7, goal_diff: -6, points: 0 },
  { id: 5, team_id: 5, group_name: 'B', played: 3, won: 2, drawn: 1, lost: 0, goals_for: 9, goals_against: 2, goal_diff: 7, points: 7 },
  { id: 6, team_id: 7, group_name: 'B', played: 3, won: 1, drawn: 2, lost: 0, goals_for: 2, goals_against: 1, goal_diff: 1, points: 5 },
  { id: 7, team_id: 6, group_name: 'B', played: 3, won: 1, drawn: 0, lost: 2, goals_for: 4, goals_against: 7, goal_diff: -3, points: 3 },
  { id: 8, team_id: 8, group_name: 'B', played: 3, won: 0, drawn: 1, lost: 2, goals_for: 1, goals_against: 6, goal_diff: -5, points: 1 },
  { id: 9, team_id: 9, group_name: 'C', played: 3, won: 2, drawn: 0, lost: 1, goals_for: 5, goals_against: 2, goal_diff: 3, points: 6 },
  { id: 10, team_id: 12, group_name: 'C', played: 3, won: 1, drawn: 1, lost: 1, goals_for: 2, goals_against: 2, goal_diff: 0, points: 4 },
  { id: 11, team_id: 11, group_name: 'C', played: 3, won: 1, drawn: 1, lost: 1, goals_for: 2, goals_against: 3, goal_diff: -1, points: 4 },
  { id: 12, team_id: 10, group_name: 'C', played: 3, won: 1, drawn: 0, lost: 2, goals_for: 3, goals_against: 5, goal_diff: -2, points: 3 },
  { id: 13, team_id: 13, group_name: 'D', played: 3, won: 2, drawn: 0, lost: 1, goals_for: 6, goals_against: 3, goal_diff: 3, points: 6 },
  { id: 14, team_id: 14, group_name: 'D', played: 3, won: 2, drawn: 0, lost: 1, goals_for: 3, goals_against: 4, goal_diff: -1, points: 6 },
  { id: 15, team_id: 16, group_name: 'D', played: 3, won: 1, drawn: 1, lost: 1, goals_for: 1, goals_against: 1, goal_diff: 0, points: 4 },
  { id: 16, team_id: 15, group_name: 'D', played: 3, won: 0, drawn: 1, lost: 2, goals_for: 1, goals_against: 3, goal_diff: -2, points: 1 },
  { id: 17, team_id: 20, group_name: 'E', played: 3, won: 2, drawn: 0, lost: 1, goals_for: 4, goals_against: 3, goal_diff: 1, points: 6 },
  { id: 18, team_id: 17, group_name: 'E', played: 3, won: 1, drawn: 1, lost: 1, goals_for: 9, goals_against: 3, goal_diff: 6, points: 4 },
  { id: 19, team_id: 19, group_name: 'E', played: 3, won: 1, drawn: 1, lost: 1, goals_for: 6, goals_against: 5, goal_diff: 1, points: 4 },
  { id: 20, team_id: 18, group_name: 'E', played: 3, won: 1, drawn: 0, lost: 2, goals_for: 3, goals_against: 11, goal_diff: -8, points: 3 },
  { id: 21, team_id: 23, group_name: 'F', played: 3, won: 2, drawn: 1, lost: 0, goals_for: 4, goals_against: 1, goal_diff: 3, points: 7 },
  { id: 22, team_id: 24, group_name: 'F', played: 3, won: 1, drawn: 2, lost: 0, goals_for: 4, goals_against: 1, goal_diff: 3, points: 5 },
  { id: 23, team_id: 21, group_name: 'F', played: 3, won: 1, drawn: 1, lost: 1, goals_for: 1, goals_against: 2, goal_diff: -1, points: 4 },
  { id: 24, team_id: 22, group_name: 'F', played: 3, won: 0, drawn: 0, lost: 3, goals_for: 2, goals_against: 7, goal_diff: -5, points: 0 },
  { id: 25, team_id: 25, group_name: 'G', played: 3, won: 2, drawn: 0, lost: 1, goals_for: 3, goals_against: 1, goal_diff: 2, points: 6 },
  { id: 26, team_id: 27, group_name: 'G', played: 3, won: 2, drawn: 0, lost: 1, goals_for: 4, goals_against: 3, goal_diff: 1, points: 6 },
  { id: 27, team_id: 28, group_name: 'G', played: 3, won: 1, drawn: 1, lost: 1, goals_for: 4, goals_against: 4, goal_diff: 0, points: 4 },
  { id: 28, team_id: 26, group_name: 'G', played: 3, won: 0, drawn: 1, lost: 2, goals_for: 5, goals_against: 8, goal_diff: -3, points: 1 },
  { id: 29, team_id: 29, group_name: 'H', played: 3, won: 2, drawn: 0, lost: 1, goals_for: 6, goals_against: 4, goal_diff: 2, points: 6 },
  { id: 30, team_id: 32, group_name: 'H', played: 3, won: 1, drawn: 1, lost: 1, goals_for: 4, goals_against: 4, goal_diff: 0, points: 4 },
  { id: 31, team_id: 31, group_name: 'H', played: 3, won: 1, drawn: 1, lost: 1, goals_for: 2, goals_against: 2, goal_diff: 0, points: 4 },
  { id: 32, team_id: 30, group_name: 'H', played: 3, won: 1, drawn: 0, lost: 2, goals_for: 5, goals_against: 7, goal_diff: -2, points: 3 }
];
standingsData.forEach(s => s.tournament = '2022');
standings.setData(standingsData);

// === 比赛事件 ===
const eventsData = [
  { id: 1, match_id: 64, team_id: 9, player_name: 'Lionel Messi', event_type: 'goal', minute: 23, extra_info: '点球' },
  { id: 2, match_id: 64, team_id: 9, player_name: 'Angel Di Maria', event_type: 'goal', minute: 36, extra_info: '' },
  { id: 3, match_id: 64, team_id: 13, player_name: 'Kylian Mbappe', event_type: 'goal', minute: 80, extra_info: '点球' },
  { id: 4, match_id: 64, team_id: 13, player_name: 'Kylian Mbappe', event_type: 'goal', minute: 81, extra_info: '' },
  { id: 5, match_id: 64, team_id: 9, player_name: 'Lionel Messi', event_type: 'goal', minute: 108, extra_info: '' },
  { id: 6, match_id: 64, team_id: 13, player_name: 'Kylian Mbappe', event_type: 'goal', minute: 118, extra_info: '点球' },
  { id: 7, match_id: 61, team_id: 9, player_name: 'Lionel Messi', event_type: 'goal', minute: 34, extra_info: '点球' },
  { id: 8, match_id: 61, team_id: 9, player_name: 'Julian Alvarez', event_type: 'goal', minute: 39, extra_info: '' },
  { id: 9, match_id: 61, team_id: 9, player_name: 'Julian Alvarez', event_type: 'goal', minute: 69, extra_info: '' },
  { id: 10, match_id: 13, team_id: 9, player_name: 'Lionel Messi', event_type: 'goal', minute: 10, extra_info: '点球' },
  { id: 11, match_id: 13, team_id: 10, player_name: 'Saleh Al-Shehri', event_type: 'goal', minute: 48, extra_info: '' },
  { id: 12, match_id: 13, team_id: 10, player_name: 'Salem Al-Dawsari', event_type: 'goal', minute: 53, extra_info: '' },
  { id: 13, match_id: 28, team_id: 17, player_name: 'Dani Olmo', event_type: 'goal', minute: 11, extra_info: '' },
  { id: 14, match_id: 28, team_id: 17, player_name: 'Marco Asensio', event_type: 'goal', minute: 21, extra_info: '' },
  { id: 15, match_id: 28, team_id: 17, player_name: 'Ferran Torres', event_type: 'goal', minute: 31, extra_info: '点球' },
  { id: 16, match_id: 28, team_id: 17, player_name: 'Ferran Torres', event_type: 'goal', minute: 54, extra_info: '' },
  { id: 17, match_id: 28, team_id: 17, player_name: 'Gavi', event_type: 'goal', minute: 74, extra_info: '' },
  { id: 18, match_id: 28, team_id: 17, player_name: 'Carlos Soler', event_type: 'goal', minute: 90, extra_info: '' },
  { id: 19, match_id: 28, team_id: 17, player_name: 'Alvaro Morata', event_type: 'goal', minute: 90, extra_info: '+2' },
  { id: 20, match_id: 7, team_id: 5, player_name: 'Jude Bellingham', event_type: 'goal', minute: 35, extra_info: '' },
  { id: 21, match_id: 7, team_id: 5, player_name: 'Bukayo Saka', event_type: 'goal', minute: 43, extra_info: '' },
  { id: 22, match_id: 7, team_id: 5, player_name: 'Raheem Sterling', event_type: 'goal', minute: 45, extra_info: '+1' },
  { id: 23, match_id: 7, team_id: 6, player_name: 'Mehdi Taremi', event_type: 'goal', minute: 65, extra_info: '' },
  { id: 24, match_id: 7, team_id: 5, player_name: 'Bukayo Saka', event_type: 'goal', minute: 62, extra_info: '' },
  { id: 25, match_id: 7, team_id: 6, player_name: 'Mehdi Taremi', event_type: 'goal', minute: 90, extra_info: '+13 点球' },
  { id: 26, match_id: 7, team_id: 5, player_name: 'Marcus Rashford', event_type: 'goal', minute: 71, extra_info: '' },
  { id: 27, match_id: 7, team_id: 5, player_name: 'Jack Grealish', event_type: 'goal', minute: 90, extra_info: '' }
];
matchEvents.setData(eventsData);

// === 射手榜 ===
goalScorers.setData([
  { id: 1, player_name: 'Kylian Mbappe', team_id: 13, goals: 8, assists: 2, matches_played: 7 },
  { id: 2, player_name: 'Lionel Messi', team_id: 9, goals: 7, assists: 3, matches_played: 7 },
  { id: 3, player_name: 'Olivier Giroud', team_id: 13, goals: 4, assists: 0, matches_played: 6 },
  { id: 4, player_name: 'Julian Alvarez', team_id: 9, goals: 4, assists: 0, matches_played: 7 },
  { id: 5, player_name: 'Alvaro Morata', team_id: 17, goals: 3, assists: 0, matches_played: 4 },
  { id: 6, player_name: 'Marcus Rashford', team_id: 5, goals: 3, assists: 0, matches_played: 5 },
  { id: 7, player_name: 'Bukayo Saka', team_id: 5, goals: 3, assists: 0, matches_played: 4 },
  { id: 8, player_name: 'Cody Gakpo', team_id: 4, goals: 3, assists: 0, matches_played: 5 },
  { id: 9, player_name: 'Richarlison', team_id: 25, goals: 3, assists: 0, matches_played: 4 },
  { id: 10, player_name: 'Enner Valencia', team_id: 2, goals: 3, assists: 0, matches_played: 3 }
]);

// === 新闻 ===
news.setData([
  { id: 1, title: '阿根廷点球大战击败法国，时隔36年再夺世界杯冠军！', summary: '2022卡塔尔世界杯决赛在卢塞尔球场打响，阿根廷与法国上演了一场惊心动魄的进球大战，最终阿根廷在点球大战中4-2胜出。', content: '这是一场将被载入史册的世界杯决赛。梅西点球首开记录，迪马利亚扩大比分，阿根廷上半场2-0领先。下半场姆巴佩97秒内连入两球扳平比分。加时赛梅西再次破门，姆巴佩点球帽子戏法再度扳平。点球大战中，马丁内斯神勇扑点，阿根廷4-2胜出！梅西终于捧起了他职业生涯中最重要的一座奖杯。', cover_url: '', category: 'match_report', source: 'FIFA官方', published_at: '2022-12-18 19:00' },
  { id: 2, title: '梅西荣获2022卡塔尔世界杯金球奖', summary: '阿根廷队长梅西凭借7球3助攻的出色表现，荣膺本届世界杯金球奖。', content: '梅西在本届世界杯上打进7球并送出3次助攻，几乎凭借一己之力带领阿根廷夺冠。这是他职业生涯的巅峰时刻，也为他的传奇生涯画上了完美的句号。', cover_url: '', category: 'award', source: 'FIFA官方', published_at: '2022-12-18 20:00' },
  { id: 3, title: '姆巴佩决赛帽子戏法，荣膺世界杯金靴奖', summary: '法国前锋姆巴佩在决赛中上演帽子戏法，以8粒进球夺得金靴奖。', content: '尽管法国队未能卫冕成功，但姆巴佩的表现无可挑剔。他在决赛中打入3球，成为继1966年赫斯特之后第二位在世界杯决赛中上演帽子戏法的球员。', cover_url: '', category: 'award', source: 'FIFA官方', published_at: '2022-12-18 20:30' },
  { id: 4, title: '摩洛哥创造历史，成为首支闯入世界杯四强的非洲球队', summary: '摩洛哥队先后淘汰西班牙和葡萄牙，成为世界杯历史上第一支闯入四强的非洲球队。', content: '摩洛哥队的表现令人惊叹。小组赛力压克罗地亚和比利时以头名出线，淘汰赛连续击败西班牙和葡萄牙两大欧洲劲旅，虽然半决赛不敌法国，但他们已经创造了非洲足球的历史。', cover_url: '', category: 'feature', source: 'FIFA官方', published_at: '2022-12-14 22:00' },
  { id: 5, title: '日本队连克德国西班牙，小组头名出线震惊世界', summary: '日本队在E组中先后2-1逆转德国、2-1逆转西班牙，以小组头名身份晋级16强。', content: '森保一率领的日本队在死亡之组中完成了不可能的任务。面对德国和西班牙两支前世界冠军，日本队展现出顽强的斗志和出色的战术执行力，两次在落后的情况下完成逆转。', cover_url: '', category: 'feature', source: 'FIFA官方', published_at: '2022-12-02 19:00' },
  { id: 6, title: '沙特阿拉伯2-1逆转阿根廷，爆出世界杯最大冷门', summary: '小组赛C组首轮，沙特阿拉伯队在先失一球的情况下2-1逆转击败阿根廷队。', content: '这场比赛震惊了全世界。梅西点球首开记录后，阿根廷多次进球被判越位。下半场沙特队5分钟内连入两球完成逆转，这场胜利将永远被铭记。', cover_url: '', category: 'match_report', source: 'FIFA官方', published_at: '2022-11-22 12:00' },
  { id: 7, title: '巴西队4-1大胜韩国，桑巴军团展现强大火力', summary: '1/8决赛中，巴西队以4-1大胜韩国队，展现出强大的进攻实力。', content: '巴西队在上半场就打入4球，维尼修斯、内马尔、里沙利松和帕奎塔各入一球，展现出桑巴足球的华丽风采。', cover_url: '', category: 'match_report', source: 'FIFA官方', published_at: '2022-12-05 21:00' },
  { id: 8, title: 'C罗泪别世界杯，葡萄牙0-1不敌摩洛哥止步八强', summary: '葡萄牙队0-1不敌摩洛哥队，C罗的世界杯之旅遗憾落幕。', content: '这很可能是37岁的C罗最后一届世界杯。葡萄牙队在1/4决赛中0-1被摩洛哥淘汰，C罗替补出场未能改变战局，赛后独自离场时泪流满面。', cover_url: '', category: 'feature', source: 'FIFA官方', published_at: '2022-12-10 18:00' },
  { id: 9, title: '2026世界杯将由美国、加拿大、墨西哥联合举办', summary: '2026年世界杯将首次由三个国家联合举办，参赛队伍扩军至48支。', content: '2026年世界杯将在美国、加拿大和墨西哥三国举办，这是世界杯历史上首次由三个国家共同承办。参赛队伍将扩军至48支，比赛场次将从64场增加到104场。', cover_url: '', category: 'news', source: 'FIFA官方', published_at: '2022-12-20 10:00' },
  { id: 10, title: '恩纳·瓦伦西亚领衔厄瓜多尔，A组黑马表现亮眼', summary: '厄瓜多尔前锋恩纳·瓦伦西亚在小组赛中打入3球，表现令人印象深刻。', content: '33岁的恩纳·瓦伦西亚在卡塔尔世界杯上证明了自己。他在对阵卡塔尔的揭幕战中梅开二度，对阵荷兰的比赛中再次进球，成为厄瓜多尔队史上世界杯最佳射手。', cover_url: '', category: 'player', source: 'FIFA官方', published_at: '2022-11-30 18:00' }
]);

const totalTeams = teams.getAll().length;
const totalPlayers = players.getAll().length;
const totalMatches = matches.getAll().length;
const totalStandings = standings.getAll().length;
const totalNews = news.getAll().length;
const totalEvents = matchEvents.getAll().length;
const totalScorers = goalScorers.getAll().length;

console.log('✅ 数据库初始化完成！');
console.log(`  - ${totalTeams} 支球队`);
console.log(`  - ${totalPlayers} 名球员`);
console.log(`  - ${totalMatches} 场比赛`);
console.log(`  - ${totalStandings} 条积分数据`);
console.log(`  - ${totalNews} 条新闻`);
console.log(`  - ${totalEvents} 个比赛事件`);
console.log(`  - ${totalScorers} 条射手榜`);
