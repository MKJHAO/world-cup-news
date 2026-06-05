const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cron = require('node-cron');

const matchRoutes = require('./routes/matches');
const teamRoutes = require('./routes/teams');
const standingRoutes = require('./routes/standings');
const newsRoutes = require('./routes/news');
const adminRoutes = require('./routes/admin');
const dataRoutes = require('./routes/data');
const oddsRoutes = require('./routes/odds');
const gossipRoutes = require('./routes/gossip');
const predictionRoutes = require('./routes/prediction');
const userRoutes = require('./routes/users');
const predictionGameRoutes = require('./routes/predictionGame');
const aiRoutes = require('./routes/ai');
const dataFetcher = require('./services/dataFetcher');
const { seedOdds, seedGossipNews } = require('./data/seedExtra');
const { adminAuth, login, logout, checkAuth } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件（生产环境前端构建产物）
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));

// 把 io 传给路由
app.set('io', io);

// API路由
app.use('/api/matches', matchRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/standings', standingRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/admin', adminAuth, adminRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/odds', oddsRoutes);
app.use('/api/gossip', gossipRoutes);
app.use('/api/prediction', predictionRoutes);

// 新增：用户系统 + 预测竞猜 + AI助手
app.use('/api/users', userRoutes);
app.use('/api', predictionGameRoutes);  // 挂载多个路径：/predictions, /leaderboard, /groups, /bracket
app.use('/api/ai', aiRoutes);

// 管理员认证
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/check', checkAuth);

// 公开统计（无需认证）
app.get('/api/stats', (req, res) => {
  const { matches, teams, players, news } = require('./models/database');
  const allMatches = matches.getAll();
  const completed = allMatches.filter(m => m.status === 'completed');
  const totalGoals = completed.reduce((s, m) => s + m.home_score + m.away_score, 0);
  const avgGoals = completed.length > 0 ? (totalGoals / completed.length).toFixed(1) : '0';
  const now = new Date();
  const upcoming2026 = allMatches.filter(m => new Date(m.match_date) > now && (m.match_date || '').startsWith('2026')).length;
  res.json({ success: true, data: { totalMatches: allMatches.length, totalGoals, avgGoals, totalTeams: teams.count(), totalPlayers: players.count(), totalNews: news.count(), upcoming2026Matches: upcoming2026 } });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, time: new Date().toISOString() });
});

// SPA fallback (生产环境) — 仅处理非API路径
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: '接口不存在' });
  }
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).json({ success: true, message: 'API Server Running' });
    }
  });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.message);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// WebSocket 连接
io.on('connection', (socket) => {
  console.log(`🔗 客户端连接: ${socket.id}`);

  socket.on('subscribe_match', (matchId) => {
    socket.join(`match_${matchId}`);
    console.log(`  📺 订阅比赛房间: match_${matchId}`);
  });

  socket.on('subscribe_group', (groupName) => {
    socket.join(`group_${groupName}`);
  });

  // 比赛聊天消息
  socket.on('chat_message', (data) => {
    const { matchId, message, userName, userId } = data || {};
    if (!matchId || !message || !message.trim()) return;

    const trimmed = message.trim().slice(0, 500);
    const { matchMessages } = require('./models/database');
    const msgRecord = matchMessages.insert({
      match_id: parseInt(matchId),
      user_id: userId || 0,
      user_name: (userName || '球迷').slice(0, 20),
      message: trimmed,
      created_at: new Date().toISOString()
    });

    const payload = {
      id: msgRecord.id,
      match_id: msgRecord.match_id,
      user_name: msgRecord.user_name,
      user_id: msgRecord.user_id,
      message: msgRecord.message,
      created_at: msgRecord.created_at
    };

    // 广播给该比赛房间内所有客户端
    io.to(`match_${matchId}`).emit('match_chat_message', payload);
  });

  socket.on('disconnect', () => {
    console.log(`❌ 客户端断开: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log(`⚽ 世界杯足球资讯服务已启动: http://localhost:${PORT}`);
  console.log(`📡 WebSocket 服务已就绪`);
  console.log(`🔌 API 地址: http://localhost:${PORT}/api`);

  // 启动时自动同步最新数据
  console.log('🔄 正在检查数据更新...');
  try {
    const result = await dataFetcher.refreshAll();
    console.log(`  - 2026赛程: ${result.worldcup2026?.newMatches || 0} 场新比赛`);
    console.log(`  - 新闻: ${result.news?.added || 0} 条`);
    // 为已完成比赛生成统计数据
    const statsService = require('./services/statsService');
    statsService.seedStatsForCompletedMatches();
    // 种子赔率数据 + 花边新闻
    seedOdds();
    seedGossipNews();
  } catch (e) {
    console.log('  ⚠️ 数据同步跳过:', e.message);
  }
});

// 每天凌晨2点自动刷新全部数据
cron.schedule('0 2 * * *', async () => {
  console.log('🔄 定时刷新数据...');
  try {
    await dataFetcher.refreshAll();
  } catch (e) {
    console.error('定时刷新失败:', e.message);
  }
});

// 每3小时自动刷新新闻
cron.schedule('0 */3 * * *', async () => {
  console.log('📰 定时刷新新闻...');
  try {
    const result = await dataFetcher.fetchLatestNews();
    console.log(`  - 新增: ${result.added || 0} 条`);
  } catch (e) {
    console.error('新闻刷新失败:', e.message);
  }
});

// 每分钟检查是否有直播比赛，触发AI解说
cron.schedule('* * * * *', async () => {
  try {
    const aiService = require('./services/aiService');
    await aiService.pushLiveCommentary(io);
  } catch (e) {
    // AI解说失败不影响主服务
  }
});
