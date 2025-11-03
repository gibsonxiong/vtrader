// 超参数类型定义
interface Hyperparameter {
  name: string;
  type: 'continuous' | 'categorical';
  range: number[] | string[];
}

interface TrialResult {
  id: number;
  hyperparameters: Record<string, any>;
  score: number;
}

interface OptimizerConfig {
  hyperparameters: Hyperparameter[];
  trainModel: (hyperparameters: Record<string, any>) => Promise<number>;
  maxTrials: number;
  direction: 'maximize' | 'minimize';
  earlyStoppingRounds?: number;
}

abstract class HyperparameterOptimizer {
  protected hyperparameters: Hyperparameter[];
  protected trainModel: (hyperparameters: Record<string, any>) => Promise<number>;
  protected config: OptimizerConfig;
  public trials: TrialResult[] = [];
  protected currentTrialId = 0;

  constructor(config: OptimizerConfig) {
    this.hyperparameters = config.hyperparameters;
    this.trainModel = config.trainModel;
    this.config = config;
  }

  abstract generateNextParameters(): Record<string, any> | null;

  addTrialResult(hyperparameters: Record<string, any>, score: number): void {
    this.trials.push({
      id: this.currentTrialId++,
      hyperparameters,
      score,
    });
  }

  getBestTrial(): TrialResult | null {
    if (this.trials.length === 0) return null;

    return this.trials.reduce((best, current) => {
      if (this.config.direction === 'maximize') {
        return current.score > best.score ? current : best;
      } else {
        return current.score < best.score ? current : best;
      }
    });
  }

  shouldStop(): boolean {
    if (this.trials.length >= this.config.maxTrials) return true;
    
    if (this.config.earlyStoppingRounds && this.trials.length > this.config.earlyStoppingRounds) {
      const recentTrials = this.trials.slice(-this.config.earlyStoppingRounds);
      const bestScore = this.getBestTrial()?.score;
      
      if (bestScore !== undefined) {
        const noImprovement = recentTrials.every(trial => 
          this.config.direction === 'maximize' 
            ? trial.score <= bestScore 
            : trial.score >= bestScore
        );
        return noImprovement;
      }
    }
    
    return false;
  }

  // 运行优化过程
  async run() {
    this.currentTrialId = 0;
    while (!this.shouldStop()) {
      try {
        const params = this.generateNextParameters();
        if (params === null) break;
        
        const score = await this.trainModel(params);
        this.addTrialResult(params, score);
        
        console.log(`Trial ${this.trials.length}: Score = ${score.toFixed(4)}`);
      } catch (error) {
        console.error('Trial failed:', error);
      }
    }

    const bestTrial = this.getBestTrial();
    console.log('\nBest trial:', bestTrial);
  }
}

class GridSearchOptimizer extends HyperparameterOptimizer {
  private parameterCombinations: Record<string, any>[] = [];
  private currentIndex = 0;

  constructor(config: OptimizerConfig) {
    super(config);
    this.generateParameterCombinations();
  }

  private generateParameterCombinations(): void {
    this.parameterCombinations = this.generateCombinations(this.hyperparameters);
  }

  private generateCombinations(
    params: Hyperparameter[], 
    current: Record<string, any> = {}, 
    index = 0
  ): Record<string, any>[] {
    if (index === params.length) {
      return [current];
    }

    const param = params[index];
    const combinations: Record<string, any>[] = [];

    let values: any[];
    if (param.type === 'continuous') {
      // 对于连续参数，在网格搜索中我们使用离散化的值
      const [min, max, step = 1] = param.range as number[];

      // 实现
      values = Array.from({ length: Math.ceil((max - min) / step) }, (_, i) => 
        min + i * step
      );
      // 确保包含最大值
      if (values[values.length - 1] !== max) {
        values.push(max);
      }

    } else {
      values = param.range;
    }

    for (const value of values) {
      const newCurrent = { ...current, [param.name]: value };
      combinations.push(...this.generateCombinations(params, newCurrent, index + 1));
    }

    return combinations;
  }

  generateNextParameters(): Record<string, any> | null {
    if (this.currentIndex >= this.parameterCombinations.length) {
      return null;
    }

    return this.parameterCombinations[this.currentIndex++];
  }
}

type OptimizerType = 'grid';

class OptimizerFactory {
  static createOptimizer(
    type: OptimizerType,
    config: OptimizerConfig
  ): HyperparameterOptimizer {
    switch (type) {
      case 'grid':
        return new GridSearchOptimizer(config);
      default:
        throw new Error(`Unknown optimizer type: ${type}`);
    }
  }
}

// 创建优化器
const optimizer = OptimizerFactory.createOptimizer('grid', {
  hyperparameters: [
    {
      name: 'learning_rate',
      type: 'continuous',
      range: [0.001, 0.1, 0.05]
    },
    {
      name: 'batch_size',
      type: 'categorical',
      range: [32, 64, 128, 256]
    },
    {
      name: 'optimizer',
      type: 'categorical',
      range: ['adam', 'sgd', 'rmsprop']
    }
  ],
  maxTrials: 50,
  direction: 'maximize',
  // earlyStoppingRounds: 10,
  trainModel: async (hyperparameters: Record<string, any>): Promise<number> => {
    console.log(`Training with:`, hyperparameters);
    
    // 模拟训练过程
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 返回模拟的准确率
    const baseScore = 0.7;
    const noise = (Math.random() - 0.5) * 0.1;
    return baseScore + noise;
  }
});

export async function test() {
  // 执行优化
  const result = await optimizer.run();

  console.log(result);
}
