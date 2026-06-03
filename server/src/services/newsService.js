const { news } = require('../models/database');

class NewsService {
  getAll({ category, limit = 20, offset = 0 } = {}) {
    let result = news.getAll();
    if (category) result = result.filter(n => n.category === category);
    result.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    return result.slice(offset, offset + limit);
  }

  getById(id) {
    return news.getById(id);
  }

  getCategories() {
    return [...new Set(news.getAll().map(n => n.category))].sort().map(c => ({ category: c }));
  }
}

module.exports = new NewsService();
