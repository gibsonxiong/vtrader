import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Injectable } from '@nestjs/common';
import { Strategy } from './strategy';
import { StrategyProps, StrategyConstructor, CreateInstanceParam, StrategyConfig } from '../types/strategy';

export default async function loadStrategyClasses(): Promise<Record<string, StrategyConstructor>> {
  const dirPath = path.resolve(__dirname, './strategies');
  const strategyClassMap: Record<string, StrategyConstructor> = {};

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

          // Q9: 兼容多种 CJS/ESM 互操作输出格式
          const Cls: unknown =
            module?.default?.default
            ?? module?.default
            ?? module;

          if (typeof Cls === 'function' && typeof Cls.prototype !== 'undefined') {
            const className = (Cls as Function).name || item.replace('.js', '');
            strategyClassMap[className] = Cls as StrategyConstructor;
          } else {
            console.warn(`跳过无效策略模块: ${itemPath} (未找到可用的默认导出类)`);
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
  private list: StrategyConfig[] = [];
  private loading: Promise<StrategyConfig[]> | null = null;

  async getStategieConfigs(): Promise<StrategyConfig[]> {
    if (this.list.length > 0) {
      return this.list;
    }

    // 防止并发请求重复触发文件扫描
    if (!this.loading) {
      this.loading = this.loadConfigs();
    }

    return this.loading;
  }

  private async loadConfigs(): Promise<StrategyConfig[]> {
    const list: StrategyConfig[] = [];
    const maps = await loadStrategyClasses();

    for (const [name, StrategyClass] of Object.entries(maps)) {
      list.push({
        name,
        strategyClass: StrategyClass,
        paramConfigs: StrategyClass.getParamConfigs(),
      });
    }

    this.list = list;
    return list;
  }

  async createInstance(param: CreateInstanceParam): Promise<Strategy | null> {
    const { name } = param;
    const strategyConfigs = await this.getStategieConfigs();
    const strategyConfig = strategyConfigs.find((item) => item.name === name);
    if (!strategyConfig) {
      return null;
    }

    const StrategyClass = strategyConfig.strategyClass;
    const instance = new StrategyClass();
    instance._init(param);

    return instance;
  }
}
