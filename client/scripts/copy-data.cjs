// 构建前将服务端 JSON 数据复制到 src/data/ (Vite 内联打包) 和 public/data/ (fetch 可用)
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', '..', 'server', 'data');
const destPublic = path.join(__dirname, '..', 'public', 'data');
const destSrc = path.join(__dirname, '..', 'src', 'data');

[destPublic, destSrc].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.json'));
files.forEach(file => {
  [destPublic, destSrc].forEach(d => fs.copyFileSync(path.join(srcDir, file), path.join(d, file)));
  const size = fs.statSync(path.join(destSrc, file)).size;
  console.log(`  ✓ ${file} (${(size / 1024).toFixed(1)} KB)`);
});

console.log(`\n已复制 ${files.length} 个数据文件到 public/data/ 和 src/data/`);
