/**
 * 完整数据初始化 — 合并2022真实数据 + 2026赛程数据
 * 运行: node server/scripts/init-full-data.js
 */

const path = require('path');
const fs = require('fs');

// 模拟浏览器环境，让 database.js 正常工作
const DATA_DIR = path.join(__dirname, '..', 'data');

console.log('🔧 初始化完整数据集...\n');

// ==================== 1. 加载 seed.js 中的 2022 真实数据 ====================
console.log('📦 加载 2022 世界杯真实数据...');

const teams2022 = [
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

// 2022 matches (from seed.js - real data)
const M = (h, a, g, s, d, st, hs, as, hp = 0, ap = 0, std, att) => ({
  home_team_id: h, away_team_id: a, group_name: g, stage: s,
  match_date: d, status: st, home_score: hs, away_score: as,
  home_penalty: hp, away_penalty: ap, stadium: std, attendance: att, tournament: '2022'
});

let mid = 0;
const matches2022 = [
  // A组
  M(1,2,'A','group','2022-11-20 16:00','completed',0,2,0,0,'海湾球场',67372),
  M(3,4,'A','group','2022-11-21 16:00','completed',0,2,0,0,'阿图玛玛球场',41721),
  M(1,3,'A','group','2022-11-25 13:00','completed',1,3,0,0,'阿图玛玛球场',41797),
  M(4,2,'A','group','2022-11-25 16:00','completed',1,1,0,0,'哈里发国际球场',44833),
  M(2,3,'A','group','2022-11-29 15:00','completed',1,2,0,0,'哈里发国际球场',44569),
  M(4,1,'A','group','2022-11-29 15:00','completed',2,0,0,0,'海湾球场',66784),
  // B组
  M(5,6,'B','group','2022-11-21 13:00','completed',6,2,0,0,'哈里发国际球场',45334),
  M(7,8,'B','group','2022-11-21 19:00','completed',1,1,0,0,'艾哈迈德·本·阿里球场',43418),
  M(8,6,'B','group','2022-11-25 10:00','completed',0,2,0,0,'艾哈迈德·本·阿里球场',40875),
  M(5,7,'B','group','2022-11-25 19:00','completed',0,0,0,0,'海湾球场',68463),
  M(8,5,'B','group','2022-11-29 19:00','completed',0,3,0,0,'艾哈迈德·本·阿里球场',44297),
  M(6,7,'B','group','2022-11-29 19:00','completed',0,1,0,0,'阿图玛玛球场',42127),
  // C组
  M(9,10,'C','group','2022-11-22 10:00','completed',1,2,0,0,'卢塞尔球场',88012),
  M(11,12,'C','group','2022-11-22 16:00','completed',0,0,0,0,'974球场',39369),
  M(12,10,'C','group','2022-11-26 13:00','completed',2,0,0,0,'教育城球场',44259),
  M(9,11,'C','group','2022-11-26 19:00','completed',2,0,0,0,'卢塞尔球场',88966),
  M(12,9,'C','group','2022-11-30 19:00','completed',0,2,0,0,'974球场',44089),
  M(10,11,'C','group','2022-11-30 19:00','completed',1,2,0,0,'卢塞尔球场',84985),
  // D组
  M(15,16,'D','group','2022-11-22 13:00','completed',0,0,0,0,'教育城球场',42925),
  M(13,14,'D','group','2022-11-22 19:00','completed',4,1,0,0,'贾努布球场',40875),
  M(16,14,'D','group','2022-11-26 10:00','completed',0,1,0,0,'贾努布球场',41823),
  M(13,15,'D','group','2022-11-26 16:00','completed',2,1,0,0,'974球场',42860),
  M(14,15,'D','group','2022-11-30 15:00','completed',1,0,0,0,'贾努布球场',41232),
  M(16,13,'D','group','2022-11-30 15:00','completed',1,0,0,0,'教育城球场',43867),
  // E组
  M(19,20,'E','group','2022-11-23 13:00','completed',1,2,0,0,'哈里发国际球场',42608),
  M(17,18,'E','group','2022-11-23 16:00','completed',7,0,0,0,'阿图玛玛球场',40013),
  M(20,18,'E','group','2022-11-27 10:00','completed',0,1,0,0,'艾哈迈德·本·阿里球场',41699),
  M(17,19,'E','group','2022-11-27 19:00','completed',1,1,0,0,'海湾球场',68895),
  M(20,17,'E','group','2022-12-01 19:00','completed',2,1,0,0,'哈里发国际球场',44851),
  M(18,19,'E','group','2022-12-01 19:00','completed',2,4,0,0,'海湾球场',67054),
  // F组
  M(23,24,'F','group','2022-11-23 10:00','completed',0,0,0,0,'海湾球场',59407),
  M(21,22,'F','group','2022-11-23 19:00','completed',1,0,0,0,'艾哈迈德·本·阿里球场',40432),
  M(21,23,'F','group','2022-11-27 13:00','completed',0,2,0,0,'阿图玛玛球场',43984),
  M(24,22,'F','group','2022-11-27 16:00','completed',4,1,0,0,'哈里发国际球场',44374),
  M(24,21,'F','group','2022-12-01 15:00','completed',0,0,0,0,'艾哈迈德·本·阿里球场',43984),
  M(22,23,'F','group','2022-12-01 15:00','completed',1,2,0,0,'阿图玛玛球场',43102),
  // G组
  M(27,28,'G','group','2022-11-24 10:00','completed',1,0,0,0,'贾努布球场',39089),
  M(25,26,'G','group','2022-11-24 19:00','completed',2,0,0,0,'卢塞尔球场',88103),
  M(28,26,'G','group','2022-11-28 10:00','completed',3,3,0,0,'贾努布球场',39443),
  M(25,27,'G','group','2022-11-28 16:00','completed',1,0,0,0,'974球场',43649),
  M(26,27,'G','group','2022-12-02 19:00','completed',2,3,0,0,'974球场',41478),
  M(28,25,'G','group','2022-12-02 19:00','completed',1,0,0,0,'卢塞尔球场',85986),
  // H组
  M(31,32,'H','group','2022-11-24 13:00','completed',0,0,0,0,'教育城球场',41663),
  M(29,30,'H','group','2022-11-24 16:00','completed',3,2,0,0,'974球场',42661),
  M(32,30,'H','group','2022-11-28 13:00','completed',2,3,0,0,'教育城球场',43983),
  M(29,31,'H','group','2022-11-28 19:00','completed',2,0,0,0,'卢塞尔球场',88668),
  M(32,29,'H','group','2022-12-02 15:00','completed',2,1,0,0,'教育城球场',44097),
  M(30,31,'H','group','2022-12-02 15:00','completed',0,2,0,0,'贾努布球场',43443),
  // 1/8决赛
  M(4,7,'','round16','2022-12-03 15:00','completed',3,1,0,0,'哈里发国际球场',44846),
  M(9,14,'','round16','2022-12-03 19:00','completed',2,1,0,0,'艾哈迈德·本·阿里球场',45032),
  M(13,12,'','round16','2022-12-04 15:00','completed',3,1,0,0,'阿图玛玛球场',40989),
  M(5,3,'','round16','2022-12-04 19:00','completed',3,0,0,0,'海湾球场',65985),
  M(20,24,'','round16','2022-12-05 15:00','completed',1,1,1,3,'贾努布球场',42523),
  M(25,32,'','round16','2022-12-05 19:00','completed',4,1,0,0,'974球场',43847),
  M(23,17,'','round16','2022-12-06 15:00','completed',0,0,3,0,'教育城球场',44667),
  M(29,27,'','round16','2022-12-06 19:00','completed',6,1,0,0,'卢塞尔球场',83720),
  // 1/4决赛
  M(24,25,'','quarter','2022-12-09 15:00','completed',1,1,4,2,'教育城球场',43893),
  M(4,9,'','quarter','2022-12-09 19:00','completed',2,2,3,4,'卢塞尔球场',88235),
  M(23,29,'','quarter','2022-12-10 15:00','completed',1,0,0,0,'阿图玛玛球场',44198),
  M(5,13,'','quarter','2022-12-10 19:00','completed',1,2,0,0,'海湾球场',68895),
  // 半决赛
  M(9,24,'','semi','2022-12-13 19:00','completed',3,0,0,0,'卢塞尔球场',88966),
  M(13,23,'','semi','2022-12-14 19:00','completed',2,0,0,0,'海湾球场',68294),
  // 季军赛
  M(24,23,'','third','2022-12-17 15:00','completed',2,1,0,0,'哈里发国际球场',44137),
  // 决赛
  M(9,13,'','final','2022-12-18 15:00','completed',3,3,4,2,'卢塞尔球场',88966)
];

// 分配ID
matches2022.forEach((m, i) => m.id = i + 1);

// 2022 events (real data from seed.js)
const events2022 = [
  // 决赛 阿根廷 3-3 法国 (点球4-2)
  { match_id: 64, team_id: 9, player_name: 'Lionel Messi', event_type: 'goal', minute: 23, extra_info: '点球' },
  { match_id: 64, team_id: 9, player_name: 'Angel Di Maria', event_type: 'goal', minute: 36, extra_info: '' },
  { match_id: 64, team_id: 13, player_name: 'Kylian Mbappe', event_type: 'goal', minute: 80, extra_info: '点球' },
  { match_id: 64, team_id: 13, player_name: 'Kylian Mbappe', event_type: 'goal', minute: 81, extra_info: '' },
  { match_id: 64, team_id: 9, player_name: 'Lionel Messi', event_type: 'goal', minute: 108, extra_info: '' },
  { match_id: 64, team_id: 13, player_name: 'Kylian Mbappe', event_type: 'goal', minute: 118, extra_info: '点球' },
  // 半决赛 阿根廷 3-0 克罗地亚
  { match_id: 61, team_id: 9, player_name: 'Lionel Messi', event_type: 'goal', minute: 34, extra_info: '点球' },
  { match_id: 61, team_id: 9, player_name: 'Julian Alvarez', event_type: 'goal', minute: 39, extra_info: '' },
  { match_id: 61, team_id: 9, player_name: 'Julian Alvarez', event_type: 'goal', minute: 69, extra_info: '' },
  // C组 阿根廷 1-2 沙特阿拉伯
  { match_id: 13, team_id: 9, player_name: 'Lionel Messi', event_type: 'goal', minute: 10, extra_info: '点球' },
  { match_id: 13, team_id: 10, player_name: 'Saleh Al-Shehri', event_type: 'goal', minute: 48, extra_info: '' },
  { match_id: 13, team_id: 10, player_name: 'Salem Al-Dawsari', event_type: 'goal', minute: 53, extra_info: '' },
  // E组 西班牙 7-0 哥斯达黎加
  { match_id: 28, team_id: 17, player_name: 'Dani Olmo', event_type: 'goal', minute: 11, extra_info: '' },
  { match_id: 28, team_id: 17, player_name: 'Marco Asensio', event_type: 'goal', minute: 21, extra_info: '' },
  { match_id: 28, team_id: 17, player_name: 'Ferran Torres', event_type: 'goal', minute: 31, extra_info: '点球' },
  { match_id: 28, team_id: 17, player_name: 'Ferran Torres', event_type: 'goal', minute: 54, extra_info: '' },
  { match_id: 28, team_id: 17, player_name: 'Gavi', event_type: 'goal', minute: 74, extra_info: '' },
  { match_id: 28, team_id: 17, player_name: 'Carlos Soler', event_type: 'goal', minute: 90, extra_info: '' },
  { match_id: 28, team_id: 17, player_name: 'Alvaro Morata', event_type: 'goal', minute: 90, extra_info: '+2' },
  // B组 英格兰 6-2 伊朗
  { match_id: 7, team_id: 5, player_name: 'Jude Bellingham', event_type: 'goal', minute: 35, extra_info: '' },
  { match_id: 7, team_id: 5, player_name: 'Bukayo Saka', event_type: 'goal', minute: 43, extra_info: '' },
  { match_id: 7, team_id: 5, player_name: 'Raheem Sterling', event_type: 'goal', minute: 45, extra_info: '+1' },
  { match_id: 7, team_id: 5, player_name: 'Bukayo Saka', event_type: 'goal', minute: 62, extra_info: '' },
  { match_id: 7, team_id: 6, player_name: 'Mehdi Taremi', event_type: 'goal', minute: 65, extra_info: '' },
  { match_id: 7, team_id: 5, player_name: 'Marcus Rashford', event_type: 'goal', minute: 71, extra_info: '' },
  { match_id: 7, team_id: 5, player_name: 'Jack Grealish', event_type: 'goal', minute: 90, extra_info: '' },
  { match_id: 7, team_id: 6, player_name: 'Mehdi Taremi', event_type: 'goal', minute: 90, extra_info: '+13点球' },
];

// Write all data (JsonDB expects bare arrays, not wrapped objects)
fs.writeFileSync(path.join(DATA_DIR, 'teams.json'), JSON.stringify(teams2022, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'matches.json'), JSON.stringify(matches2022, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'match_events.json'), JSON.stringify(events2022, null, 2));

console.log('✅ 数据初始化完成!');
console.log('   - 球队:', teams2022.length);
console.log('   - 比赛:', matches2022.length);
console.log('   - 事件:', events2022.length);
console.log('   - 决赛:', matches2022.find(m=>m.stage==='final').home_score+'-'+matches2022.find(m=>m.stage==='final').away_score);
