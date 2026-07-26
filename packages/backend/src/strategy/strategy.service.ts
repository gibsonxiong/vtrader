import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Injectable } from '@nestjs/common';
import { Strategy, StrategyProps, ParamConfig } from './strategy';


export interface CreateInstanceParam extends StrategyProps {
  name: string;
}
export interface StrategyConfig {
  name: string;
  strategyClass: new (props: StrategyProps) => Strategy;
  paramConfigs: Record<string, ParamConfig>;
}

export default async function loadStrategyClasses() {
  const dirPath = path.resolve(__dirname, './strategies');
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
      } else if (stats.isFile() && item.endsWith('.js')) {
        try {
          const fileUrl = pathToFileURL(itemPath).href;
          const module = await import(fileUrl);
          if (typeof module?.default?.default === 'function') {
            const className = module.default.default.name;
            strategyClassMap[className] = module.default.default; // 保存默认导出
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
  list: StrategyConfig[] = [];

  async getStategieConfigs(): Promise<StrategyConfig[]> {
    if (this.list.length === 0) {
      const list: StrategyConfig[] = [];
      const maps = await loadStrategyClasses();

      for (const [name, StrategyClass] of Object.entries(maps)) {
        const instance = new StrategyClass({
          engine: {} as any,
          symbols: [],
          assetBalance: 1000,
          assetName: 'USDT',
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

  async createInstance(param: CreateInstanceParam): Promise<Strategy | null> {
    const { name } = param;
    const strategyConfigs = await this.getStategieConfigs();
    const strategyConfig = strategyConfigs.find((item) => item.name === name);
    if (!strategyConfig) {
      return null;
    }

    const StrategyClass = strategyConfig.strategyClass;
    const instance = new StrategyClass(param);

    return instance;
  }
}
