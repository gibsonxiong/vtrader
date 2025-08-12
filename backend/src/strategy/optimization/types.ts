export type OutputFunc = (message: string) => void;
export type EvaluateFunc = (params: Record<string, any>) => Promise<Record<string, any>>;
export type KeyFunc = (result: Record<string, any>) => number;

export interface OptimizationParameter {
  name: string;
  values?: any[];
  start?: number;
  end?: number;
  step?: number;
  type: 'fixed' | 'range' | 'discrete';
}

export interface OptimizationResult {
  params: Record<string, any>;
  result: Record<string, any>;
  target: number;
}

export interface GeneticAlgorithmConfig {
  populationSize: number;
  ngenSize: number;
  cxpb: number; // 交叉概率
  mutpb: number; // 变异概率
  mu: number; // 选择个数
}