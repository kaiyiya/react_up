const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 尝试删除 dist 目录，如果失败则跳过
const distPath = path.join(__dirname, '../dist');

function tryRemoveDist() {
  try {
    if (fs.existsSync(distPath)) {
      // 在 Windows 上，先尝试使用 PowerShell 删除
      try {
        execSync(`powershell -Command "Remove-Item -Path '${distPath}' -Recurse -Force -ErrorAction SilentlyContinue"`, {
          stdio: 'ignore'
        });
        console.log('✅ 已清理 dist 目录');
      } catch (e) {
        // 如果 PowerShell 失败，尝试使用 rimraf
        try {
          execSync('npx rimraf dist', { stdio: 'inherit' });
        } catch (e2) {
          console.warn('⚠️  无法删除 dist 目录，文件可能被占用');
          console.warn('   请关闭浏览器后再试，或手动删除 dist 目录');
          // 不抛出错误，继续构建
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  清理 dist 目录时出错，继续构建...');
  }
}

tryRemoveDist();

// 运行 rollup 构建
console.log('开始构建...');
try {
  execSync('rollup --config scripts/rollup/dev.config.mjs', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ 构建完成');
} catch (error) {
  console.error('❌ 构建失败');
  process.exit(1);
}

