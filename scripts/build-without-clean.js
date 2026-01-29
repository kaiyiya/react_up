// 不删除 dist，直接构建（会覆盖现有文件，但如果文件被占用会失败）
const { execSync } = require('child_process');
const path = require('path');

console.log('开始构建（不清理 dist 目录）...');
console.log('⚠️  如果文件被占用，请关闭浏览器后再试');

try {
  execSync('rollup --config scripts/rollup/dev.config.mjs', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ 构建完成');
} catch (error) {
  console.error('\n❌ 构建失败：文件被占用');
  console.error('   解决方案：');
  console.error('   1. 关闭所有浏览器窗口');
  console.error('   2. 或者手动删除 dist 目录后重试');
  console.error('   3. 或者使用: pnpm run build-dev:force');
  process.exit(1);
}

