const { odds, news, matches, teams } = require('../models/database');

function seedOdds() {
  const existing = odds.getAll();
  if (existing.length > 0) return;

  const completedMatches = matches.query(m => m.status === 'completed' && m.home_score !== undefined);
  const bookmakers = ['bet365', 'William Hill', 'Pinnacle', '综合'];
  const items = [];

  completedMatches.forEach(m => {
    const bookmaker = bookmakers[Math.floor(Math.random() * bookmakers.length)];
    const homeStrength = 0.35 + Math.random() * 0.3;
    const drawStrength = 0.2 + Math.random() * 0.15;
    const awayStrength = 1 - homeStrength - drawStrength;

    const totalProb = homeStrength + drawStrength + awayStrength;
    const homeProb = homeStrength / totalProb;
    const drawProb = drawStrength / totalProb;
    const awayProb = awayStrength / totalProb;

    const homeOdds = Math.round((1 / homeProb) * 100) / 100;
    const drawOdds = Math.round((1 / drawProb) * 100) / 100;
    const awayOdds = Math.round((1 / awayProb) * 100) / 100;

    items.push({
      match_id: m.id,
      team_id: m.home_team_id,
      win_odds: homeOdds,
      draw_odds: drawOdds,
      lose_odds: awayOdds,
      implied_win_prob: Math.round(homeProb * 1000) / 1000,
      implied_draw_prob: Math.round(drawProb * 1000) / 1000,
      implied_lose_prob: Math.round(awayProb * 1000) / 1000,
      bookmaker,
      updated_at: new Date().toISOString()
    });
  });

  if (items.length > 0) odds.bulkInsert(items);
  console.log(`  赔率数据已种子化: ${items.length} 条`);
}

function seedGossipNews() {
  const existingGossip = news.query(n => n.category === 'gossip');
  if (existingGossip.length > 0) return;

  const gossipArticles = [
    {
      title: '梅西或将参加2026世界杯 — 家庭因素成关键',
      summary: '据阿根廷媒体报道，梅西的家人正在推动他参加2026年美加墨世界杯。消息人士称，梅西本人对再次冲击世界杯持开放态度。',
      content: '据阿根廷TyC Sports报道，梅西的家人在他的职业生涯决策中扮演着重要角色。妻子安东内拉据悉支持梅西继续国家队生涯，而梅西的三个孩子也希望看到父亲在2026年世界杯上亮相。\n\n梅西在2022年卡塔尔世界杯上带领阿根廷夺冠后，曾表示那将是他的最后一届世界杯。然而，随着2026年世界杯临近，多位阿根廷足协官员和队友都在公开场合表达了希望梅西继续参赛的愿望。\n\n阿根廷主帅斯卡洛尼在接受采访时表示："如果梅西的身体状况允许，国家队的大门永远为他敞开。" 这一言论引发了广泛讨论。',
      category: 'gossip', source: 'TyC Sports',
      published_at: '2026-05-28 10:30', cover_url: ''
    },
    {
      title: '巴西队内讧疑云？更衣室矛盾浮出水面',
      summary: '巴西队在热身赛中的表现引发关注。消息人士透露，队内多名老将与新生代球员之间存在战术分歧，训练场上多次发生争执。',
      content: '据巴西环球体育报道，巴西国家队在备战2026年世界杯的过程中出现了内部的裂痕。以维尼修斯和罗德里戈为代表的新生代球员希望球队采用更加灵活的进攻战术，而以卡塞米罗为代表的老将则坚持传统的巴西足球风格。\n\n消息人士透露，在上周的封闭训练中，维尼修斯和主教练之间发生了一次"激烈的对话"，虽然事后双方都表示这只是正常的战术讨论，但训练场的气氛明显紧张。\n\n巴西足协对此保持沉默，但一位不愿透露姓名的技术官员承认"存在一些需要解决的问题"。这对于志在夺冠的巴西队来说不是好消息。',
      category: 'gossip', source: '环球体育',
      published_at: '2026-05-25 14:00', cover_url: ''
    },
    {
      title: '姆巴佩与法国队教练关系紧张？训练中的异常举动引猜测',
      summary: '法国队训练营传出不和谐声音。姆巴佩在最近的训练中被拍到独自跑圈，与主教练的互动明显减少。',
      content: '法国《队报》报道，姆巴佩在法国队训练营中的行为引起关注。一名摄影记者拍到了姆巴佩在全队合练时独自在场边跑圈的画面，这一异常举动引发了外界对他与主教练德尚关系的猜测。\n\n有消息称，姆巴佩对于球队的战术安排感到不满，希望在进攻端承担更多的自由度。然而德尚的战术体系强调纪律性和整体防守。\n\n一位接近法国队的消息人士表示："这是两人之间的战术分歧，不是什么大问题。但确实需要解决。"法国足协主席在接受采访时拒绝就此事发表评论。',
      category: 'gossip', source: '队报',
      published_at: '2026-05-22 09:15', cover_url: ''
    },
    {
      title: 'C罗转会传闻：或加盟沙特联赛全明星阵容？',
      summary: '转会市场再起波澜。据传C罗正在推动一项重磅转会计划，希望组建一支"全明星"阵容参加2026年世界杯前的商业赛事。',
      content: '据意大利《米兰体育报》报道，C罗正在与沙特阿拉伯方面进行秘密谈判，计划在2026年世界杯前组建一支由多位顶级球星组成的"全明星商业战队"，在全球范围内进行表演赛。\n\n消息人士称，本泽马、内马尔和莫德里奇等球星都在受邀名单上。这支临时组建的队伍将在世界杯前进行为期两周的商业巡回赛，旨在为C罗的个人品牌增添更多曝光度。\n\nC罗的经纪人门德斯对此传闻予以否认，称"C罗目前完全专注于葡萄牙国家队的世界杯备战"。但这一传闻仍在社交媒体上引发了大量讨论。',
      category: 'gossip', source: '米兰体育报',
      published_at: '2026-05-20 16:45', cover_url: ''
    },
    {
      title: '阿根廷队伤病危机：三名主力恐缺席开幕战',
      summary: '阿根廷医疗团队透露，三名关键球员在俱乐部赛季末遭遇不同程度的伤病，可能影响世界杯开幕战的出战。',
      content: '阿根廷《奥莱报》从国家队医疗组获悉，有三名重要球员在各自俱乐部赛季末的比赛中遭遇伤病困扰。\n\n其中最为严重的是中场核心的腿筋伤势，预计需要4-6周恢复。另外两名球员分别是膝盖扭伤和肌肉疲劳。阿根廷队医团队正在与各俱乐部密切沟通，争取在世界杯开幕前让所有球员恢复到最佳状态。\n\n斯卡洛尼在新闻发布会上表示："我们对医疗团队有信心，现在还有时间。世界杯大名单最终确定前，我们会密切关注所有球员的身体状况。"',
      category: 'gossip', source: '奥莱报',
      published_at: '2026-05-18 11:00', cover_url: ''
    },
    {
      title: '英国队热身赛酒店冲突事件：两名球员深夜外出被罚',
      summary: '英国队在美国集训期间发生纪律问题。两名年轻球员被发现在宵禁后私自离开酒店，球队已对两人进行了内部处罚。',
      content: '据英国《每日邮报》报道，英国队在美国迈阿密集训期间发生了一起纪律事件。两名年龄在23岁以下的球员在球队规定的宵禁时间后被发现在当地一家夜店，直到凌晨才返回酒店。\n\n球队管理人员在例行查房时发现了这一情况。第二天早晨，主教练在全体会议上对此提出了严厉批评，并宣布对两名球员处以"限制部分训练权利"的内部处罚。\n\n一位球队内部人士表示："这是年轻球员的常见错误，但世界杯前的集训容不得任何纪律问题。教练组希望以此警示全队。"',
      category: 'gossip', source: '每日邮报',
      published_at: '2026-05-15 08:30', cover_url: ''
    },
    {
      title: '日本队技术总监质疑森保一战术安排：内部矛盾公开化？',
      summary: '日本足球圈内爆发争议。技术总监在接受采访时对主教练森保一的备战策略提出了不同意见，引发广泛关注。',
      content: '日本《日刊体育》报道，日本足协技术总监在一次非公开会议上对主教练森保一的战术方向提出了质疑。据悉，争议的焦点在于日本队在2026年世界杯上应该采取积极进攻的打法还是继续沿用2022年成功的防守反击策略。\n\n技术总监认为"面对欧美强队，日本队需要更加积极主动"，而森保一则坚持"防守反击是最适合日本队的战术"。\n\n日本足协主席随后出面调停，表示"技术讨论是正常的备战过程，不存在所谓的矛盾"。但这一事件已引起日本媒体和球迷的广泛讨论。',
      category: 'gossip', source: '日刊体育',
      published_at: '2026-05-12 13:00', cover_url: ''
    },
    {
      title: '美国队备战风波：球员对酒店条件不满，抱怨与世界杯规格不符',
      summary: '美国队在多伦多集训期间遭遇"住宿风波"。部分球员对球队安排的酒店条件表示不满，认为与世界杯规格存在差距。',
      content: '据美国ESPN报道，美国国家队在北卡罗来纳州夏洛特集训期间发生了一起小风波。部分球员私下抱怨球队为他们安排的住宿条件"不如预期"，尤其是健身房和康复设施的配置与"世界杯级别"存在差距。\n\n一名球员匿名向媒体表示："我们理解预算有限，但世界杯是最高级别的赛事，我们的备战条件应该匹配这个级别。"\n\n美国足协迅速回应了这些担忧，表示正在评估所有训练设施，并会根据球员反馈进行调整。主教练贝尔哈特则公开表示对球队目前的备战环境"完全满意"。',
      category: 'gossip', source: 'ESPN',
      published_at: '2026-05-10 14:30', cover_url: ''
    },
    {
      title: '多队球迷冲突预警：北美三国联合加强世界杯安保',
      summary: '据北美联合安保委员会透露，多个国家队的球迷团体已在社交媒体上发出挑衅信息，三国警方正在加强合作预防球迷冲突。',
      content: '据美联社报道，美国、加拿大和墨西哥三国已建立联合安保指挥中心，专门负责2026年世界杯期间的球迷安全。委员会发言人表示，已在社交媒体上监测到多起球迷团体之间的挑衅性言论，涉及英格兰与阿根廷、巴西与德国等历史对手球队的球迷。\n\n"我们正在采取预防性措施，"发言人表示，"包括加强比赛场馆周边的警力部署，以及建立跨国球迷信息共享机制。"\n\n东道国还在主要球迷聚集区增加了监控摄像头和应急响应资源。三国政府强调，球迷安全是本届世界杯的"头等大事"。',
      category: 'gossip', source: '美联社',
      published_at: '2026-05-08 10:00', cover_url: ''
    },
    {
      title: '非洲球队资金争议：奖金分配方案引发球员不满',
      summary: '多支非洲世界杯参赛队在奖金分配问题上出现摩擦。球员代表与足协之间的谈判陷入僵局，可能影响世界杯备战。',
      content: '据BBC非洲频道报道，至少三支参加2026年世界杯的非洲球队正在面临奖金分配的争议。球员代表要求提高世界杯比赛奖金的分成比例，而各国足协则强调财政压力。\n\n一位匿名球员经纪人对BBC表示："球员们看到欧洲球队的奖金标准后感到不满。他们知道足协从FIFA获得了大量参赛奖金，但分给球员的部分太少。"\n\n其中一支球队的队长本周公开呼吁透明的奖金分配制度，引起了广泛关注。FIFA表示正在与各国足协沟通，但强调这是"各足协的内部事务"。',
      category: 'gossip', source: 'BBC Africa',
      published_at: '2026-05-05 12:00', cover_url: ''
    }
  ];

  gossipArticles.forEach(a => news.insert(a));
  console.log(`  花边新闻已种子化: ${gossipArticles.length} 条`);
}

module.exports = { seedOdds, seedGossipNews };
