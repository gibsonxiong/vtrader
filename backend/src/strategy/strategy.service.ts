import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable } from '@nestjs/common';
import { Strategy, StrategyProps, ParamConfig } from './strategy';

export interface StrategyInfo {
  name: string;
  strategyClass: new (props: StrategyProps) => Strategy;
  paramConfigs: Record<string, ParamConfig>;
}

export default async function loadStrategyClasses() {
  // 在开发环境使用src目录，在生产环境使用dist目录
  const isDev = process.env.NODE_ENV !== 'production';
  const dirPath = isDev 
    ? path.resolve(__dirname, './strategies')
    : path.resolve(__dirname, './strategies');
  
  const strategyClassMap: Record<
    string,
    new (...args: ConstructorParameters<typeof Strategy>) => Strategy
  > = {};

  async function traverse(currentPath: string) {
    const items = fs.readdirSync(currentPath);
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        await traverse(itemPath); // 递归遍历子目录
      } else if (stats.isFile() && item.endsWith('.js') && !item.endsWith('.d.ts')) {
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

@Injectable()
export class StrategyService {
  list: StrategyInfo[] = [];

  async getStategies(): Promise<StrategyInfo[]> {
    if (this.list.length === 0) {
      const list: StrategyInfo[] = [];
      const maps = await loadStrategyClasses();

      for (const [name, StrategyClass] of Object.entries(maps)) {
        const instance = new StrategyClass({
          engine: {} as any,
          symbols: [],
        });

        list.push({
          name,
          strategyClass: StrategyClass,
          paramConfigs: instance.getParamConfigs(),
        });
      }

      this.list = list;
    }

    return this.list;
  }

  async createInstance(name: string, props: StrategyProps): Promise<Strategy | null> {
    const strategyInfos = await this.getStategies();
    const strategyInfo = strategyInfos.find((item) => item.name === name);
    if (!strategyInfo) {
      return null;
    }

    const StrategyClass = strategyInfo.strategyClass;
    const instance = new StrategyClass(props);

    return instance;
  }
}
