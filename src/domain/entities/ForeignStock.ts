/**
 * 海外株式
 */
import { Holding } from './Holding.ts';

export class ForeignStock extends Holding {
  constructor(
    tickerCode: string,
    name: string,
    quantity: number,
    acquisitionPrice: number,
    currentPrice: number,
    public readonly country: string,
    public readonly currency: string,
    public readonly exchangeRate: number,
    public readonly localPrice?: number,
  ) {
    super(tickerCode, name, quantity, acquisitionPrice, currentPrice);
  }

  getAssetType(): string {
    return 'foreign_stock';
  }

  /**
   * 現地通貨建ての評価額
   */
  getLocalMarketValue(): number {
    if (!this.localPrice) return 0;
    return this.localPrice * this.quantity;
  }

  /**
   * 円建ての評価額
   */
  override getMarketValue(): number {
    return this.currentPrice * this.quantity;
  }
}
