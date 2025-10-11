/**
 * ポートフォリオ全体を表すエンティティ
 */
import { Holding } from './Holding.ts';

export class Portfolio {
  constructor(
    public readonly holdings: Holding[],
    public readonly snapshotDate: Date,
  ) {}

  /**
   * ポートフォリオ全体の評価額
   */
  getTotalValue(): number {
    return this.holdings.reduce((sum, holding) => sum + holding.getMarketValue(), 0);
  }

  /**
   * ポートフォリオ全体の評価損益
   */
  getTotalProfitLoss(): number {
    return this.holdings.reduce((sum, holding) => sum + holding.getProfitLoss(), 0);
  }

  /**
   * ポートフォリオ全体の評価損益率（%）
   */
  getTotalProfitLossRate(): number {
    const totalAcquisitionValue = this.holdings.reduce(
      (sum, holding) => sum + holding.acquisitionPrice * holding.quantity,
      0,
    );
    if (totalAcquisitionValue === 0) return 0;
    return (this.getTotalProfitLoss() / totalAcquisitionValue) * 100;
  }

  /**
   * 資産配分を計算（各保有銘柄の評価額の割合）
   */
  getAssetAllocation(): Map<string, number> {
    const totalValue = this.getTotalValue();
    const allocation = new Map<string, number>();

    for (const holding of this.holdings) {
      const percentage = totalValue > 0 ? (holding.getMarketValue() / totalValue) * 100 : 0;
      allocation.set(holding.tickerCode, percentage);
    }

    return allocation;
  }

  /**
   * リスクレベルを判定
   */
  getRiskLevel(): 'HIGH' | 'MEDIUM' | 'LOW' {
    const allocation = this.getAssetAllocation();
    const maxConcentration = Math.max(...allocation.values());

    if (maxConcentration > 50) return 'HIGH';
    if (maxConcentration > 30) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * 資産種別ごとの保有数を取得
   */
  getHoldingsByType(assetType: string): Holding[] {
    return this.holdings.filter((holding) => holding.getAssetType() === assetType);
  }
}
