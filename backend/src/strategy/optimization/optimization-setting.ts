import { OptimizationParameter } from './types';

export class OptimizationSetting {
  private params: Map<string, any[]> = new Map();
  public targetName: string = '';

  /**
   * 添加固定参数或范围参数
   */
  addParameter(
    name: string,
    start: number,
    end?: number,
    step?: number
  ): { success: boolean; message: string } {
    if (end === undefined || step === undefined) {
      // 固定参数
      this.params.set(name, [start]);
      return { success: true, message: '固定参数添加成功' };
    }

    if (start >= end) {
      return { success: false, message: '参数优化起始点必须小于终止点' };
    }

    if (step <= 0) {
      return { success: false, message: '参数优化步进必须大于0' };
    }

    // 范围参数
    const values: number[] = [];
    let value = start;
    while (value <= end) {
      values.push(value);
      value += step;
    }

    this.params.set(name, values);
    return { 
      success: true, 
      message: `范围参数添加成功，数量${values.length}` 
    };
  }

  /**
   * 添加离散参数
   */
  addDiscreteParameter(name: string, values: any[]): void {
    this.params.set(name, values);
  }

  /**
   * 设置优化目标
   */
  setTarget(targetName: string): void {
    this.targetName = targetName;
  }

  /**
   * 生成所有参数组合（笛卡尔积）
   */
  generateSettings(): Record<string, any>[] {
    if (this.params.size === 0) {
      return [];
    }

    const keys = Array.from(this.params.keys());
    const values = Array.from(this.params.values());
    
    // 计算笛卡尔积
    const cartesianProduct = (arrays: any[][]): any[][] => {
      return arrays.reduce((acc, curr) => 
        acc.flatMap(a => curr.map(c => [...a, c]))
      , [[]]);
    };

    const products = cartesianProduct(values);
    
    return products.map(product => {
      const setting: Record<string, any> = {};
      keys.forEach((key, index) => {
        setting[key] = product[index];
      });
      return setting;
    });
  }

  /**
   * 获取参数名称列表
   */
  getParameterNames(): string[] {
    return Array.from(this.params.keys());
  }

  /**
   * 检查设置是否有效
   */
  isValid(): { valid: boolean; message: string } {
    const settings = this.generateSettings();
    if (settings.length === 0) {
      return { valid: false, message: '优化参数组合为空，请检查' };
    }

    if (!this.targetName) {
      return { valid: false, message: '优化目标未设置，请检查' };
    }

    return { valid: true, message: '设置有效' };
  }
}