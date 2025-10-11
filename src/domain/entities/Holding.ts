/**
 * 資産種別の型定義
 */
export type AssetType = "stock" | "mutual_fund" | "foreign_stock";

/**
 * 口座種別の型定義
 */
export type AccountType =
  | "specific"           // 特定預り
  | "general"            // 一般預り
  | "nisa_growth"        // NISA預り（成長投資枠）
  | "nisa_tsumitate"     // NISA預り（つみたて投資枠）
  | "nisa_old_tsumitate" // 旧つみたてNISA預り
  ;

/**
 * 保有資産の基底クラス
 */
export abstract class Holding {
  constructor(
    public readonly tickerCode: string,
    public readonly name: string,
    public readonly quantity: number,
    public readonly acquisitionPrice: number,
    public readonly currentPrice: number,
    public readonly accountType: AccountType,
  ) {
    if (quantity <= 0) {
      throw new Error('保有数量は正の数である必要があります');
    }
  }

  /**
   * 評価額を計算
   */
  getMarketValue(): number {
    return this.currentPrice * this.quantity;
  }

  /**
   * 評価損益を計算
   */
  getProfitLoss(): number {
    return (this.currentPrice - this.acquisitionPrice) * this.quantity;
  }

  /**
   * 評価損益率を計算（%）
   */
  getProfitLossRate(): number {
    if (this.acquisitionPrice === 0) return 0;
    return ((this.currentPrice - this.acquisitionPrice) / this.acquisitionPrice) * 100;
  }

  /**
   * 資産種別を取得（派生クラスで実装）
   */
  abstract getAssetType(): AssetType;
}
