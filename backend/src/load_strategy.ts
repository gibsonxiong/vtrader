import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { Strategy } from './strategy/strategy';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export default async function loadStrategyClasses() {
  const dirPath = path.resolve(__dirname, './strategy/strategies');
  const strategyClassMap: Record<
    string,
    new (...args: ConstructorParameters<typeof Strategy>) => Strategy
  > = {};

  async function traverse(currentPath: string) {
    const items = await readdir(currentPath);
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stats = await stat(itemPath);

      if (stats.isDirectory()) {
        await traverse(itemPath); // 递归遍历子目录
      } else if (stats.isFile() && item.endsWith('.js')) {
        try {
          const module = await import(itemPath);
          if (typeof module.default === 'function') {
            const className = module.default.name;
            strategyClassMap[className] = module.default; // 保存默认导出
          }
        } catch (error) {
          console.error(`导入失败: ${itemPath}`, error);
        }
      }
    }
  }

  await traverse(path.resolve(dirPath));
  return strategyClassMap;
}
