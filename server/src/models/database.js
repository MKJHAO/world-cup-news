const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JsonDB {
  constructor(name) {
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.data = [];
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        if (!raw.trim()) { this.data = []; return; }
        this.data = JSON.parse(raw);
        if (!Array.isArray(this.data)) { this.data = []; }
      }
    } catch (e) {
      console.error(`数据库文件损坏 [${this.filePath}]:`, e.message);
      this.data = [];
    }
  }

  _save() {
    const tmpPath = this.filePath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2));
    fs.renameSync(tmpPath, this.filePath);
  }

  getAll() { return [...this.data]; }
  getById(id) { return this.data.find(item => item.id == id) || null; }
  count() { return this.data.length; }

  query(fn) { return this.data.filter(fn); }

  findOne(fn) { return this.data.find(fn) || null; }

  insert(item) {
    const maxId = this.data.length > 0 ? Math.max(...this.data.map(i => i.id || 0)) : 0;
    const newItem = { id: maxId + 1, ...item, created_at: new Date().toISOString() };
    this.data.push(newItem);
    this._save();
    return newItem;
  }

  update(id, updates) {
    const idx = this.data.findIndex(item => item.id == id);
    if (idx === -1) return null;
    this.data[idx] = { ...this.data[idx], ...updates };
    this._save();
    return this.data[idx];
  }

  delete(id) {
    const idx = this.data.findIndex(item => item.id == id);
    if (idx === -1) return false;
    this.data.splice(idx, 1);
    this._save();
    return true;
  }

  deleteAll() {
    this.data = [];
    this._save();
  }

  bulkInsert(items) {
    let maxId = this.data.length > 0 ? Math.max(...this.data.map(i => i.id)) : 0;
    items.forEach(item => {
      maxId++;
      this.data.push({ id: maxId, ...item });
    });
    this._save();
  }

  setData(items) {
    this.data = items;
    this._save();
  }
}

const dbs = {};

function getCollection(name) {
  if (!dbs[name]) {
    dbs[name] = new JsonDB(name);
  }
  return dbs[name];
}

// 导出集合
const teams = getCollection('teams');
const players = getCollection('players');
const matches = getCollection('matches');
const matchEvents = getCollection('match_events');
const matchStats = getCollection('match_statistics');
const standings = getCollection('standings');
const news = getCollection('news');
const goalScorers = getCollection('goal_scorers');
const odds = getCollection('odds');
const gossip = getCollection('gossip');

// 新增：用户系统 + 预测竞猜相关集合
const users = getCollection('users');
const userPredictions = getCollection('user_predictions');
const predictionGroups = getCollection('prediction_groups');
const groupMemberships = getCollection('group_memberships');
const bracketPredictions = getCollection('bracket_predictions');

module.exports = { teams, players, matches, matchEvents, matchStats, standings, news, goalScorers, odds, gossip, users, userPredictions, predictionGroups, groupMemberships, bracketPredictions, getCollection };
