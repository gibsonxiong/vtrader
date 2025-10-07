#!/usr/bin/env node
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录（scripts 的上一级）
const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'shared');
const targets = [
  path.join(rootDir, 'backend', 'src'),
  path.join(rootDir, 'frontend', 'src'),
];

const destFolderName = 'shared'; // 目标处包含 shared 目录本身

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDir(src, dest) {
  // Node 16+ 提供 cpSync，Node 20 可直接使用
  if (fs.cpSync) {
    fs.cpSync(src, dest, { recursive: true });
    return;
  }
  // 兼容回退：递归复制
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      copyDir(srcPath, destPath);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function removeDirIfExists(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  if (!fs.existsSync(sourceDir)) {
    console.error(`源目录不存在: ${sourceDir}`);
    process.exit(1);
  }

  console.log(`开始复制: ${sourceDir}`);
  for (const target of targets) {
    try {
      ensureDir(target);
      const dest = path.join(target, destFolderName);
      removeDirIfExists(dest);
      copyDir(sourceDir, dest);
      console.log(`✔ 已复制到: ${dest}`);
    } catch (err) {
      console.error(`✖ 复制到 ${target} 失败:`, err);
      process.exitCode = 1;
    }
  }
  console.log('完成');
}

main();