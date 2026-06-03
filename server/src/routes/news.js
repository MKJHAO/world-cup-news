const express = require('express');
const router = express.Router();
const newsService = require('../services/newsService');
const rssService = require('../services/rssService');

router.get('/', (req, res) => {
  const { category, limit, offset } = req.query;
  const news = newsService.getAll({
    category,
    limit: parseInt(limit) || 20,
    offset: parseInt(offset) || 0
  });
  res.json({ success: true, data: news });
});

router.get('/categories', (req, res) => {
  const categories = newsService.getCategories();
  res.json({ success: true, data: categories });
});

// RSS同步状态
router.get('/rss-status', (req, res) => {
  res.json({ success: true, data: rssService.getStatus() });
});

router.get('/:id', (req, res) => {
  const article = newsService.getById(parseInt(req.params.id));
  if (!article) return res.status(404).json({ success: false, message: '新闻不存在' });
  res.json({ success: true, data: article });
});

module.exports = router;
