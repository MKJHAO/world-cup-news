// 使用 Unsplash Source 提供高质量足球实况图片 (无需API Key)
const FOOTBALL_IMAGES = {
  stadiums: [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80', // 球场全景
    'https://images.unsplash.com/photo-1489944440613-453fc8b5a9a6?w=1200&q=80', // 足球场
    'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&q=80', // 经典球场
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&q=80', // 球迷
    'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=1200&q=80', // 比赛瞬间
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=80', // 球场灯光
    'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=1200&q=80', // 大力神杯
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=80', // 球场远景
  ],
  action: [
    'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80', // 射门瞬间
    'https://images.unsplash.com/photo-1517747619996-61ba67d4b39e?w=800&q=80', // 球场竞技
    'https://images.unsplash.com/photo-1600679472829-3044539ce8ed?w=800&q=80', // 传球
    'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&q=80', // 庆祝
    'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80', // 球场拼搏
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80', // 球员特写
  ],
  fans: [
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80', // 球迷欢呼
    'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80', // 观众席
    'https://images.unsplash.com/photo-1472162072942-ca51488f11ad?w=800&q=80', // 国旗海洋
    'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800&q=80', // 球迷聚集
  ]
};

// 获取随机图片
export function getRandomPhoto(category = 'stadiums') {
  const images = FOOTBALL_IMAGES[category] || FOOTBALL_IMAGES.stadiums;
  return images[Math.floor(Math.random() * images.length)];
}

// 根据索引获取（保证一致性）
export function getPhotoByIndex(category = 'stadiums', index = 0) {
  const images = FOOTBALL_IMAGES[category] || FOOTBALL_IMAGES.stadiums;
  return images[index % images.length];
}

export default FOOTBALL_IMAGES;
