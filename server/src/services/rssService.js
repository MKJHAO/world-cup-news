const RssParser = require('rss-parser');
const { news } = require('../models/database');

const WORLD_CUP_KEYWORDS = [
  'World Cup', 'world cup', '世界杯',
  'FIFA', 'fifa', '2026',
  'qualifier', 'qualification', '预选赛', '资格赛',
  'Qatar 2022', '卡塔尔',
  'Messi', 'Ronaldo', 'Mbappe', 'Neymar', 'Kane', 'Bellingham', 'Haaland',
  'Argentina', 'Brazil', 'France', 'England', 'Germany', 'Spain', 'Portugal',
  'USA', 'USMNT', 'Mexico', 'Canada', 'Japan', 'South Korea',
  'Champions League', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga',
  'transfer', '转会', 'international', 'friendly', '热身赛',
  'Copa America', 'Euro 2024', '亚洲杯', 'Africa Cup',
  'football', 'soccer', '足球'
];

const FEEDS = [
  { name: 'BBC Sport Football', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', category: 'news' },
  { name: 'ESPN Soccer', url: 'https://www.espn.com/espn/rss/soccer/news', category: 'news' },
  { name: 'Sky Sports Football', url: 'https://www.skysports.com/football/rss', category: 'news' },
];

class RssService {
  constructor() {
    this.parser = new RssParser({ timeout: 15000, headers: { 'User-Agent': 'WorldCupApp/1.0' } });
    this.feeds = FEEDS;
    this.keywords = WORLD_CUP_KEYWORDS;
    this.lastFetch = null;
    this.lastError = null;
    this.sourceStats = {};
  }

  async fetchAllFeeds() {
    const allItems = [];
    this.sourceStats = {};
    let totalFetched = 0;

    console.log(`📡 开始从 ${this.feeds.length} 个RSS源获取新闻...`);

    for (const feed of this.feeds) {
      try {
        const items = await this.fetchSingleFeed(feed);
        this.sourceStats[feed.name] = { fetched: items.length, added: 0, error: null };
        totalFetched += items.length;
        allItems.push(...items);
        // 源之间加1秒延迟以避免被屏蔽
        await new Promise(r => setTimeout(r, 1000));
      } catch (e) {
        this.sourceStats[feed.name] = { fetched: 0, added: 0, error: e.message };
        console.warn(`⚠️ RSS源获取失败 [${feed.name}]: ${e.message}`);
      }
    }

    console.log(`📥 共获取 ${totalFetched} 篇原始文章`);
    const filtered = this.filterByKeywords(allItems);
    console.log(`🔍 关键词过滤后: ${filtered.length} 篇`);

    const deduped = this.deduplicate(filtered);
    console.log(`📋 去重后: ${deduped.length} 篇新文章`);

    const added = await this.syncToDatabase(deduped);
    this.lastFetch = new Date().toISOString();
    this.lastError = null;

    return { success: true, added, totalFetched, filtered: filtered.length, sources: this.sourceStats };
  }

  async fetchSingleFeed(feedConfig) {
    const feed = await this.parser.parseURL(feedConfig.url);
    return (feed.items || []).map(item => ({
      title: (item.title || '').trim(),
      summary: (item.contentSnippet || item.content || '').slice(0, 300).trim(),
      content: (item.content || item.contentSnippet || '').trim(),
      link: item.link || '',
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      source: feedConfig.name,
      category: feedConfig.category
    })).filter(item => item.title.length > 5);
  }

  _classifyCategory(item) {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    const gossipKw = ['rumor', 'gossip', 'scandal', 'controversy', 'transfer gossip', '传闻', '绯闻', '丑闻', '争议', '内讧', 'dressing room', 'bust-up', 'tension', 'rift', 'fallout', 'wags', 'affair', 'party', 'nightclub', 'disciplinary'];
    const transferKw = ['transfer', 'signs', 'signing', 'deal', 'contract', 'bid', '€', '£', 'fee', '转会', '签约', '报价'];
    const injuryKw = ['injury', 'injured', 'out for', 'hamstring', 'knee', 'ankle', 'fracture', 'surgery', '伤病', '受伤', '缺席'];
    const previewKw = ['preview', 'preview', 'preview:', 'vs', 'clash', 'preview', '前瞻', '预告', '对阵', '赛前'];

    if (gossipKw.some(k => text.includes(k))) return 'gossip';
    if (transferKw.some(k => text.includes(k))) return 'transfer';
    if (injuryKw.some(k => text.includes(k))) return 'injury';
    if (previewKw.some(k => text.includes(k))) return 'preview';
    return item.category || 'news';
  }

  filterByKeywords(items) {
    return items.filter(item => {
      const text = `${item.title} ${item.summary}`.toLowerCase();
      return this.keywords.some(kw => text.includes(kw.toLowerCase()));
    }).map(item => ({ ...item, category: this._classifyCategory(item) }));
  }

  deduplicate(items) {
    const existingTitles = new Set(
      news.getAll().map(n => (n.title || '').toLowerCase().trim())
    );
    const seen = new Set();
    return items.filter(item => {
      const key = item.title.toLowerCase().trim();
      if (existingTitles.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async syncToDatabase(items) {
    let added = 0;
    for (const item of items) {
      try {
        news.insert({
          title: item.title,
          summary: item.summary,
          content: item.content,
          cover_url: '',
          category: item.category,
          source: item.source,
          published_at: item.published_at
        });
        added++;
      } catch (e) {
        console.warn(`新闻插入失败: ${item.title.slice(0, 30)}...`);
      }
    }
    return added;
  }

  getStatus() {
    return {
      lastFetch: this.lastFetch,
      lastError: this.lastError,
      feeds: this.feeds.map(f => ({
        name: f.name,
        url: f.url,
        ...(this.sourceStats[f.name] || { fetched: 0, added: 0, error: null })
      }))
    };
  }
}

module.exports = new RssService();
