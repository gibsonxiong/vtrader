import { EvaluateFunc, KeyFunc, OptimizationResult, GeneticAlgorithmConfig } from './types';
import { OptimizationSetting } from './optimization-setting';

export class Individual {
  public params: Record<string, any>;
  public fitness: number = 0;
  public evaluated: boolean = false;

  constructor(params: Record<string, any>) {
    this.params = params;
  }

  clone(): Individual {
    return new Individual({ ...this.params });
  }
}

export class GeneticAlgorithm {
  private cache: Map<string, OptimizationResult> = new Map();
  private allSettings: Record<string, any>[] = [];

  constructor(
    private optimizationSetting: OptimizationSetting,
    private evaluateFunc: EvaluateFunc,
    private keyFunc: KeyFunc,
    private config: GeneticAlgorithmConfig
  ) {
    this.allSettings = optimizationSetting.generateSettings();
  }

  /**
   * 生成随机个体
   */
  private generateRandomIndividual(): Individual {
    const randomSetting = this.allSettings[Math.floor(Math.random() * this.allSettings.length)];
    return new Individual(randomSetting);
  }

  /**
   * 初始化种群
   */
  private initializePopulation(): Individual[] {
    const population: Individual[] = [];
    for (let i = 0; i < this.config.populationSize; i++) {
      population.push(this.generateRandomIndividual());
    }
    return population;
  }

  /**
   * 评估个体适应度
   */
  private async evaluateIndividual(individual: Individual): Promise<void> {
    if (individual.evaluated) {
      return;
    }

    const key = JSON.stringify(individual.params);
    
    // 检查缓存
    if (this.cache.has(key)) {
      const cached = this.cache.get(key)!;
      individual.fitness = cached.target;
      individual.evaluated = true;
      return;
    }

    // 执行评估
    const result = await this.evaluateFunc(individual.params);
    const fitness = this.keyFunc(result);
    
    individual.fitness = fitness;
    individual.evaluated = true;

    // 缓存结果
    this.cache.set(key, {
      params: individual.params,
      result,
      target: fitness
    });
  }

  /**
   * 评估整个种群
   */
  private async evaluatePopulation(population: Individual[]): Promise<void> {
    const promises = population.map(individual => this.evaluateIndividual(individual));
    await Promise.all(promises);
  }

  /**
   * 锦标赛选择
   */
  private tournamentSelection(population: Individual[], tournamentSize: number = 3): Individual {
    const tournament: Individual[] = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }

    // 选择适应度最高的个体
    return tournament.reduce((best, current) => 
      current.fitness > best.fitness ? current : best
    );
  }

  /**
   * 两点交叉
   */
  private crossover(parent1: Individual, parent2: Individual): [Individual, Individual] {
    const keys = Object.keys(parent1.params);
    
    if (keys.length <= 2) {
      return [parent1.clone(), parent2.clone()];
    }

    const point1 = Math.floor(Math.random() * (keys.length - 1));
    const point2 = Math.floor(Math.random() * (keys.length - point1 - 1)) + point1 + 1;

    const child1Params = { ...parent1.params };
    const child2Params = { ...parent2.params };

    for (let i = point1; i < point2; i++) {
      const key = keys[i];
      child1Params[key] = parent2.params[key];
      child2Params[key] = parent1.params[key];
    }

    return [new Individual(child1Params), new Individual(child2Params)];
  }

  /**
   * 变异
   */
  private mutate(individual: Individual): Individual {
    const mutated = individual.clone();
    const keys = Object.keys(mutated.params);
    
    for (const key of keys) {
      if (Math.random() < 1.0 / keys.length) {
        // 随机选择一个新值
        const randomSetting = this.allSettings[Math.floor(Math.random() * this.allSettings.length)];
        mutated.params[key] = randomSetting[key];
      }
    }

    return mutated;
  }

  /**
   * 环境选择（选择最优个体）
   */
  private environmentalSelection(population: Individual[], targetSize: number): Individual[] {
    const sorted = [...population].sort((a, b) => b.fitness - a.fitness);
    return sorted.slice(0, targetSize);
  }

  /**
   * 运行遗传算法
   */
  async run(outputFunc?: (message: string) => void): Promise<OptimizationResult[]> {
    const output = outputFunc || console.log;

    output('开始执行遗传算法优化');
    output(`参数优化空间：${this.allSettings.length}`);
    output(`每代族群总数：${this.config.populationSize}`);
    output(`优良筛选个数：${this.config.mu}`);
    output(`迭代次数：${this.config.ngenSize}`);
    output(`交叉概率：${(this.config.cxpb * 100).toFixed(0)}%`);
    output(`突变概率：${(this.config.mutpb * 100).toFixed(0)}%`);

    const startTime = Date.now();

    // 初始化种群
    let population = this.initializePopulation();
    await this.evaluatePopulation(population);

    for (let generation = 0; generation < this.config.ngenSize; generation++) {
      // 选择、交叉、变异
      const offspring: Individual[] = [];

      while (offspring.length < this.config.populationSize) {
        // 选择父母
        const parent1 = this.tournamentSelection(population);
        const parent2 = this.tournamentSelection(population);

        let child1: Individual, child2: Individual;

        // 交叉
        if (Math.random() < this.config.cxpb) {
          [child1, child2] = this.crossover(parent1, parent2);
        } else {
          child1 = parent1.clone();
          child2 = parent2.clone();
        }

        // 变异
        if (Math.random() < this.config.mutpb) {
          child1 = this.mutate(child1);
        }
        if (Math.random() < this.config.mutpb) {
          child2 = this.mutate(child2);
        }

        offspring.push(child1, child2);
      }

      // 评估后代
      await this.evaluatePopulation(offspring);

      // 环境选择
      const combined = [...population, ...offspring];
      population = this.environmentalSelection(combined, this.config.mu);

      // 输出进度
      const best = population[0];
      output(`第${generation + 1}代，最佳适应度：${best.fitness.toFixed(6)}`);
    }

    const endTime = Date.now();
    const cost = Math.floor((endTime - startTime) / 1000);
    output(`遗传算法优化完成，耗时${cost}秒`);

    // 返回所有缓存的结果，按适应度排序
    const results = Array.from(this.cache.values());
    results.sort((a, b) => b.target - a.target);
    
    return results;
  }
}