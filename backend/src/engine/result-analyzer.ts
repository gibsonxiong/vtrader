// import { BacktestingResult, TradeData, PositionData, AccountData } from './backtesting-engine';

// /**
//  * 交易统计信息
//  */
// export interface TradeStatistics {
//   totalTrades: number;           // 总交易次数
//   winningTrades: number;         // 盈利交易次数
//   losingTrades: number;          // 亏损交易次数
//   winRate: number;               // 胜率
//   averageWin: number;            // 平均盈利
//   averageLoss: number;           // 平均亏损
//   largestWin: number;            // 最大盈利
//   largestLoss: number;           // 最大亏损
//   profitFactor: number;          // 盈亏比
//   expectancy: number;            // 期望收益
// }

// /**
//  * 回撤分析
//  */
// export interface DrawdownAnalysis {
//   maxDrawdown: number;           // 最大回撤
//   maxDrawdownPercent: number;    // 最大回撤百分比
//   maxDrawdownDuration: number;   // 最大回撤持续时间（天）
//   currentDrawdown: number;       // 当前回撤
//   drawdownPeriods: DrawdownPeriod[]; // 回撤期间列表
// }

// /**
//  * 回撤期间
//  */
// export interface DrawdownPeriod {
//   startDate: Date;
//   endDate: Date;
//   peakValue: number;
//   troughValue: number;
//   drawdown: number;
//   drawdownPercent: number;
//   duration: number; // 天数
// }

// /**
//  * 风险指标
//  */
// export interface RiskMetrics {
//   sharpeRatio: number;           // 夏普比率
//   sortinoRatio: number;          // 索提诺比率
//   calmarRatio: number;           // 卡玛比率
//   volatility: number;            // 波动率
//   beta: number;                  // 贝塔系数
//   alpha: number;                 // 阿尔法系数
//   informationRatio: number;      // 信息比率
//   trackingError: number;         // 跟踪误差
//   var95: number;                 // 95% VaR
//   cvar95: number;                // 95% CVaR
// }

// /**
//  * 月度收益
//  */
// export interface MonthlyReturn {
//   year: number;
//   month: number;
//   return: number;
//   returnPercent: number;
// }

// /**
//  * 年度收益
//  */
// export interface YearlyReturn {
//   year: number;
//   return: number;
//   returnPercent: number;
// }

// /**
//  * 完整的回测分析结果
//  */
// export interface BacktestAnalysis {
//   summary: BacktestingResult;
//   tradeStats: TradeStatistics;
//   drawdownAnalysis: DrawdownAnalysis;
//   riskMetrics: RiskMetrics;
//   monthlyReturns: MonthlyReturn[];
//   yearlyReturns: YearlyReturn[];
//   equityCurve: { date: Date; equity: number; }[];
//   dailyReturns: number[];
// }

// /**
//  * 回测结果分析器
//  */
// export class ResultAnalyzer {
//   private trades: TradeData[];
//   private equityHistory: { date: Date; equity: number; }[];
//   private riskFreeRate: number; // 无风险利率
//   private benchmarkReturns?: number[]; // 基准收益率

//   constructor(
//     trades: TradeData[],
//     equityHistory: { date: Date; equity: number; }[],
//     riskFreeRate: number = 0.03,
//     benchmarkReturns?: number[]
//   ) {
//     this.trades = trades;
//     this.equityHistory = equityHistory;
//     this.riskFreeRate = riskFreeRate;
//     this.benchmarkReturns = benchmarkReturns;
//   }

//   /**
//    * 执行完整的回测分析
//    */
//   public analyze(): BacktestAnalysis {
//     const summary = this.calculateSummary();
//     const tradeStats = this.calculateTradeStatistics();
//     const drawdownAnalysis = this.calculateDrawdownAnalysis();
//     const dailyReturns = this.calculateDailyReturns();
//     const riskMetrics = this.calculateRiskMetrics(dailyReturns);
//     const monthlyReturns = this.calculateMonthlyReturns();
//     const yearlyReturns = this.calculateYearlyReturns();

//     return {
//       summary,
//       tradeStats,
//       drawdownAnalysis,
//       riskMetrics,
//       monthlyReturns,
//       yearlyReturns,
//       equityCurve: this.equityHistory,
//       dailyReturns
//     };
//   }

//   /**
//    * 计算基本汇总信息
//    */
//   private calculateSummary(): BacktestingResult {
//     if (this.equityHistory.length === 0) {
//       throw new Error('权益曲线数据为空');
//     }

//     const startEquity = this.equityHistory[0].equity;
//     const endEquity = this.equityHistory[this.equityHistory.length - 1].equity;
//     const totalReturn = endEquity - startEquity;
//     const totalReturnPercent = (totalReturn / startEquity) * 100;

//     const startDate = this.equityHistory[0].date;
//     const endDate = this.equityHistory[this.equityHistory.length - 1].date;
//     const tradingDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

//     // 计算年化收益率
//     const years = tradingDays / 365;
//     const annualizedReturn = years > 0 ? Math.pow(endEquity / startEquity, 1 / years) - 1 : 0;

//     return {
//       startDate,
//       endDate,
//       startCapital: startEquity,
//       endCapital: endEquity,
//       totalReturn,
//       totalReturnPercent,
//       annualizedReturn: annualizedReturn * 100,
//       maxDrawdown: this.calculateMaxDrawdown(),
//       sharpeRatio: this.calculateSharpeRatio(),
//       totalTrades: this.trades.length,
//       winningTrades: this.trades.filter(t => t.pnl > 0).length,
//       winRate: this.trades.length > 0 ? (this.trades.filter(t => t.pnl > 0).length / this.trades.length) * 100 : 0
//     };
//   }

//   /**
//    * 计算交易统计
//    */
//   private calculateTradeStatistics(): TradeStatistics {
//     if (this.trades.length === 0) {
//       return {
//         totalTrades: 0,
//         winningTrades: 0,
//         losingTrades: 0,
//         winRate: 0,
//         averageWin: 0,
//         averageLoss: 0,
//         largestWin: 0,
//         largestLoss: 0,
//         profitFactor: 0,
//         expectancy: 0
//       };
//     }

//     const winningTrades = this.trades.filter(t => t.pnl > 0);
//     const losingTrades = this.trades.filter(t => t.pnl < 0);

//     const totalWin = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
//     const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));

//     const averageWin = winningTrades.length > 0 ? totalWin / winningTrades.length : 0;
//     const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;

//     const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0;
//     const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0;

//     const profitFactor = totalLoss > 0 ? totalWin / totalLoss : 0;
//     const winRate = (winningTrades.length / this.trades.length) * 100;
//     const expectancy = (winRate / 100) * averageWin - ((100 - winRate) / 100) * averageLoss;

//     return {
//       totalTrades: this.trades.length,
//       winningTrades: winningTrades.length,
//       losingTrades: losingTrades.length,
//       winRate,
//       averageWin,
//       averageLoss,
//       largestWin,
//       largestLoss,
//       profitFactor,
//       expectancy
//     };
//   }

//   /**
//    * 计算回撤分析
//    */
//   private calculateDrawdownAnalysis(): DrawdownAnalysis {
//     if (this.equityHistory.length === 0) {
//       return {
//         maxDrawdown: 0,
//         maxDrawdownPercent: 0,
//         maxDrawdownDuration: 0,
//         currentDrawdown: 0,
//         drawdownPeriods: []
//       };
//     }

//     let peak = this.equityHistory[0].equity;
//     let maxDrawdown = 0;
//     let maxDrawdownPercent = 0;
//     let maxDrawdownDuration = 0;

//     const drawdownPeriods: DrawdownPeriod[] = [];
//     let currentDrawdownStart: Date | null = null;
//     let currentPeak = peak;

//     for (let i = 1; i < this.equityHistory.length; i++) {
//       const current = this.equityHistory[i];

//       if (current.equity > peak) {
//         // 新高点，结束当前回撤期
//         if (currentDrawdownStart) {
//           const duration = Math.ceil((this.equityHistory[i - 1].date.getTime() - currentDrawdownStart.getTime()) / (1000 * 60 * 60 * 24));
//           const drawdown = currentPeak - this.equityHistory[i - 1].equity;
//           const drawdownPercent = (drawdown / currentPeak) * 100;

//           drawdownPeriods.push({
//             startDate: currentDrawdownStart,
//             endDate: this.equityHistory[i - 1].date,
//             peakValue: currentPeak,
//             troughValue: this.equityHistory[i - 1].equity,
//             drawdown,
//             drawdownPercent,
//             duration
//           });

//           if (duration > maxDrawdownDuration) {
//             maxDrawdownDuration = duration;
//           }

//           currentDrawdownStart = null;
//         }

//         peak = current.equity;
//         currentPeak = peak;
//       } else {
//         // 回撤中
//         if (!currentDrawdownStart) {
//           currentDrawdownStart = this.equityHistory[i - 1].date;
//         }

//         const drawdown = peak - current.equity;
//         const drawdownPercent = (drawdown / peak) * 100;

//         if (drawdown > maxDrawdown) {
//           maxDrawdown = drawdown;
//         }

//         if (drawdownPercent > maxDrawdownPercent) {
//           maxDrawdownPercent = drawdownPercent;
//         }
//       }
//     }

//     // 处理最后的回撤期（如果存在）
//     if (currentDrawdownStart) {
//       const lastEquity = this.equityHistory[this.equityHistory.length - 1];
//       const duration = Math.ceil((lastEquity.date.getTime() - currentDrawdownStart.getTime()) / (1000 * 60 * 60 * 24));
//       const drawdown = currentPeak - lastEquity.equity;
//       const drawdownPercent = (drawdown / currentPeak) * 100;

//       drawdownPeriods.push({
//         startDate: currentDrawdownStart,
//         endDate: lastEquity.date,
//         peakValue: currentPeak,
//         troughValue: lastEquity.equity,
//         drawdown,
//         drawdownPercent,
//         duration
//       });
//     }

//     const currentEquity = this.equityHistory[this.equityHistory.length - 1].equity;
//     const currentDrawdown = peak - currentEquity;

//     return {
//       maxDrawdown,
//       maxDrawdownPercent,
//       maxDrawdownDuration,
//       currentDrawdown,
//       drawdownPeriods
//     };
//   }

//   /**
//    * 计算日收益率
//    */
//   private calculateDailyReturns(): number[] {
//     const returns: number[] = [];

//     for (let i = 1; i < this.equityHistory.length; i++) {
//       const prevEquity = this.equityHistory[i - 1].equity;
//       const currentEquity = this.equityHistory[i].equity;
//       const dailyReturn = (currentEquity - prevEquity) / prevEquity;
//       returns.push(dailyReturn);
//     }

//     return returns;
//   }

//   /**
//    * 计算风险指标
//    */
//   private calculateRiskMetrics(dailyReturns: number[]): RiskMetrics {
//     if (dailyReturns.length === 0) {
//       return {
//         sharpeRatio: 0,
//         sortinoRatio: 0,
//         calmarRatio: 0,
//         volatility: 0,
//         beta: 0,
//         alpha: 0,
//         informationRatio: 0,
//         trackingError: 0,
//         var95: 0,
//         cvar95: 0
//       };
//     }

//     const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
//     const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / dailyReturns.length;
//     const volatility = Math.sqrt(variance) * Math.sqrt(252); // 年化波动率

//     const dailyRiskFreeRate = this.riskFreeRate / 252;
//     const excessReturn = meanReturn - dailyRiskFreeRate;
//     const sharpeRatio = volatility > 0 ? (excessReturn * 252) / volatility : 0;

//     // 计算下行偏差（用于索提诺比率）
//     const downwardReturns = dailyReturns.filter(r => r < dailyRiskFreeRate);
//     const downwardVariance = downwardReturns.length > 0 ?
//       downwardReturns.reduce((sum, r) => sum + Math.pow(r - dailyRiskFreeRate, 2), 0) / downwardReturns.length : 0;
//     const downwardDeviation = Math.sqrt(downwardVariance) * Math.sqrt(252);
//     const sortinoRatio = downwardDeviation > 0 ? (excessReturn * 252) / downwardDeviation : 0;

//     // 计算卡玛比率
//     const maxDrawdownPercent = this.calculateDrawdownAnalysis().maxDrawdownPercent / 100;
//     const calmarRatio = maxDrawdownPercent > 0 ? (meanReturn * 252) / maxDrawdownPercent : 0;

//     // 计算VaR和CVaR
//     const sortedReturns = [...dailyReturns].sort((a, b) => a - b);
//     const var95Index = Math.floor(sortedReturns.length * 0.05);
//     const var95 = sortedReturns[var95Index] || 0;
//     const cvar95 = var95Index > 0 ?
//       sortedReturns.slice(0, var95Index).reduce((sum, r) => sum + r, 0) / var95Index : 0;

//     // 计算贝塔和阿尔法（需要基准收益率）
//     let beta = 0;
//     let alpha = 0;
//     let informationRatio = 0;
//     let trackingError = 0;

//     if (this.benchmarkReturns && this.benchmarkReturns.length === dailyReturns.length) {
//       const benchmarkMean = this.benchmarkReturns.reduce((sum, r) => sum + r, 0) / this.benchmarkReturns.length;

//       let covariance = 0;
//       let benchmarkVariance = 0;

//       for (let i = 0; i < dailyReturns.length; i++) {
//         covariance += (dailyReturns[i] - meanReturn) * (this.benchmarkReturns[i] - benchmarkMean);
//         benchmarkVariance += Math.pow(this.benchmarkReturns[i] - benchmarkMean, 2);
//       }

//       covariance /= dailyReturns.length;
//       benchmarkVariance /= this.benchmarkReturns.length;

//       beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 0;
//       alpha = (meanReturn - dailyRiskFreeRate) - beta * (benchmarkMean - dailyRiskFreeRate);

//       // 计算跟踪误差和信息比率
//       const trackingDifferences = dailyReturns.map((r, i) => r - this.benchmarkReturns![i]);
//       const trackingMean = trackingDifferences.reduce((sum, d) => sum + d, 0) / trackingDifferences.length;
//       const trackingVariance = trackingDifferences.reduce((sum, d) => sum + Math.pow(d - trackingMean, 2), 0) / trackingDifferences.length;
//       trackingError = Math.sqrt(trackingVariance) * Math.sqrt(252);
//       informationRatio = trackingError > 0 ? (trackingMean * 252) / trackingError : 0;
//     }

//     return {
//       sharpeRatio,
//       sortinoRatio,
//       calmarRatio,
//       volatility,
//       beta,
//       alpha: alpha * 252, // 年化阿尔法
//       informationRatio,
//       trackingError,
//       var95,
//       cvar95
//     };
//   }

//   /**
//    * 计算月度收益
//    */
//   private calculateMonthlyReturns(): MonthlyReturn[] {
//     const monthlyReturns: MonthlyReturn[] = [];
//     const monthlyEquity: { [key: string]: { start: number; end: number } } = {};

//     for (const point of this.equityHistory) {
//       const key = `${point.date.getFullYear()}-${point.date.getMonth()}`;

//       if (!monthlyEquity[key]) {
//         monthlyEquity[key] = { start: point.equity, end: point.equity };
//       } else {
//         monthlyEquity[key].end = point.equity;
//       }
//     }

//     for (const [key, equity] of Object.entries(monthlyEquity)) {
//       const [year, month] = key.split('-').map(Number);
//       const monthReturn = equity.end - equity.start;
//       const monthReturnPercent = (monthReturn / equity.start) * 100;

//       monthlyReturns.push({
//         year,
//         month: month + 1, // JavaScript月份从0开始，转换为1-12
//         return: monthReturn,
//         returnPercent: monthReturnPercent
//       });
//     }

//     return monthlyReturns.sort((a, b) => a.year - b.year || a.month - b.month);
//   }

//   /**
//    * 计算年度收益
//    */
//   private calculateYearlyReturns(): YearlyReturn[] {
//     const yearlyReturns: YearlyReturn[] = [];
//     const yearlyEquity: { [key: number]: { start: number; end: number } } = {};

//     for (const point of this.equityHistory) {
//       const year = point.date.getFullYear();

//       if (!yearlyEquity[year]) {
//         yearlyEquity[year] = { start: point.equity, end: point.equity };
//       } else {
//         yearlyEquity[year].end = point.equity;
//       }
//     }

//     for (const [year, equity] of Object.entries(yearlyEquity)) {
//       const yearReturn = equity.end - equity.start;
//       const yearReturnPercent = (yearReturn / equity.start) * 100;

//       yearlyReturns.push({
//         year: Number(year),
//         return: yearReturn,
//         returnPercent: yearReturnPercent
//       });
//     }

//     return yearlyReturns.sort((a, b) => a.year - b.year);
//   }

//   /**
//    * 计算最大回撤
//    */
//   private calculateMaxDrawdown(): number {
//     let peak = this.equityHistory[0]?.equity || 0;
//     let maxDrawdown = 0;

//     for (const point of this.equityHistory) {
//       if (point.equity > peak) {
//         peak = point.equity;
//       }

//       const drawdown = ((peak - point.equity) / peak) * 100;
//       if (drawdown > maxDrawdown) {
//         maxDrawdown = drawdown;
//       }
//     }

//     return maxDrawdown;
//   }

//   /**
//    * 计算夏普比率
//    */
//   private calculateSharpeRatio(): number {
//     const dailyReturns = this.calculateDailyReturns();

//     if (dailyReturns.length === 0) {
//       return 0;
//     }

//     const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
//     const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / dailyReturns.length;
//     const volatility = Math.sqrt(variance);

//     const dailyRiskFreeRate = this.riskFreeRate / 252;
//     const excessReturn = meanReturn - dailyRiskFreeRate;

//     return volatility > 0 ? excessReturn / volatility * Math.sqrt(252) : 0;
//   }

//   /**
//    * 生成分析报告
//    */
//   public generateReport(): string {
//     const analysis = this.analyze();

//     let report = '\n=== 回测分析报告 ===\n\n';

//     // 基本信息
//     report += '基本信息:\n';
//     report += `回测期间: ${analysis.summary.startDate.toLocaleDateString()} - ${analysis.summary.endDate.toLocaleDateString()}\n`;
//     report += `交易天数: ${analysis.summary.tradingDays}\n`;
//     report += `初始资金: ${analysis.summary.startCapital.toFixed(2)}\n`;
//     report += `最终资金: ${analysis.summary.endCapital.toFixed(2)}\n`;
//     report += `总收益: ${analysis.summary.totalReturn.toFixed(2)} (${analysis.summary.totalReturnPercent.toFixed(2)}%)\n`;
//     report += `年化收益率: ${analysis.summary.annualizedReturn.toFixed(2)}%\n\n`;

//     // 交易统计
//     report += '交易统计:\n';
//     report += `总交易次数: ${analysis.tradeStats.totalTrades}\n`;
//     report += `盈利交易: ${analysis.tradeStats.winningTrades}\n`;
//     report += `亏损交易: ${analysis.tradeStats.losingTrades}\n`;
//     report += `胜率: ${analysis.tradeStats.winRate.toFixed(2)}%\n`;
//     report += `平均盈利: ${analysis.tradeStats.averageWin.toFixed(2)}\n`;
//     report += `平均亏损: ${analysis.tradeStats.averageLoss.toFixed(2)}\n`;
//     report += `最大盈利: ${analysis.tradeStats.largestWin.toFixed(2)}\n`;
//     report += `最大亏损: ${analysis.tradeStats.largestLoss.toFixed(2)}\n`;
//     report += `盈亏比: ${analysis.tradeStats.profitFactor.toFixed(2)}\n`;
//     report += `期望收益: ${analysis.tradeStats.expectancy.toFixed(2)}\n\n`;

//     // 风险指标
//     report += '风险指标:\n';
//     report += `最大回撤: ${analysis.drawdownAnalysis.maxDrawdownPercent.toFixed(2)}%\n`;
//     report += `夏普比率: ${analysis.riskMetrics.sharpeRatio.toFixed(2)}\n`;
//     report += `索提诺比率: ${analysis.riskMetrics.sortinoRatio.toFixed(2)}\n`;
//     report += `卡玛比率: ${analysis.riskMetrics.calmarRatio.toFixed(2)}\n`;
//     report += `年化波动率: ${(analysis.riskMetrics.volatility * 100).toFixed(2)}%\n`;
//     report += `95% VaR: ${(analysis.riskMetrics.var95 * 100).toFixed(2)}%\n`;
//     report += `95% CVaR: ${(analysis.riskMetrics.cvar95 * 100).toFixed(2)}%\n\n`;

//     return report;
//   }
// }
