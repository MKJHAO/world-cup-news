/**
 * 修复被模拟引擎错误标记为 completed 的未来比赛
 * 运行: node server/scripts/fix-corrupted-matches.js
 */

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');

console.log('🔧 正在修复损坏的比赛数据...\n');

// 读取比赛数据
const raw = fs.readFileSync(MATCHES_FILE, 'utf-8');
const data = JSON.parse(raw);
const matches = data.data || data;

const today = new Date().toISOString().slice(0, 10); // 2026-06-12
console.log(`📅 当前日期: ${today}`);

let fixed = 0;
let cleaned = 0;

const fixedMatches = matches.map(m => {
  const mDate = (m.match_date || '').slice(0, 10);
  const isFuture = mDate > today;
  const wasSimulated = m.simulated === true;

  // 未来日期且被模拟过 → 恢复为 scheduled
  if (isFuture && wasSimulated) {
    fixed++;
    console.log(`  ✅ 恢复 #${m.id}: ${m.home_team_id} vs ${m.away_team_id} (${m.match_date}) ${m.status} → scheduled`);
    return {
      ...m,
      status: 'scheduled',
      home_score: 0,
      away_score: 0,
      home_penalty: 0,
      away_penalty: 0,
      match_minute: 0,
      injury_time: 0,
      simulated: false
    };
  }

  // 过去日期且被模拟标记 → 清理标记但保留结果
  if (!isFuture && wasSimulated) {
    cleaned++;
    return {
      ...m,
      simulated: false
    };
  }

  return m;
});

// 写回文件
const output = { ...data, data: fixedMatches };
fs.writeFileSync(MATCHES_FILE, JSON.stringify(output, null, 2), 'utf-8');

console.log(`\n📊 修复完成:`);
console.log(`   恢复未来比赛: ${fixed} 场`);
console.log(`   清理模拟标记: ${cleaned} 场`);
console.log(`   总比赛数: ${fixedMatches.length}`);
