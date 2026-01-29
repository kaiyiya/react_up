const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const testFile = path.join(__dirname, '../test/index.tsx');
const outputFile = path.join(__dirname, '../test/index.js');

try {
  // 读取 TSX 文件内容
  const content = fs.readFileSync(testFile, 'utf-8');
  
  // 使用 esbuild transform API，避免配置文件问题
  const result = esbuild.transformSync(content, {
    loader: 'tsx',
    format: 'esm',
    target: 'esnext',
    jsx: 'preserve'
  });
  
  // 写入编译后的 JS 文件
  fs.writeFileSync(outputFile, result.code, 'utf-8');
  
  console.log('✅ TSX 编译成功: test/index.tsx -> test/index.js');
} catch (error) {
  console.error('❌ 编译失败:', error.message);
  if (error.errors) {
    error.errors.forEach(err => console.error('  ', err.text));
  }
  process.exit(1);
}

