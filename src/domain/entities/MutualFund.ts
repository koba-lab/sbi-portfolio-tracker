/**
 * 投資信託
 */
import { Holding } from './Holding.ts';

export class MutualFund extends Holding {
  constructor(
    tickerCode: string,
    name: string,
    quantity: number,
    acquisitionPrice: number,
    currentPrice: number,
    public readonly category?: string,
    public readonly trustFee?: number,
    public readonly isNISA?: boolean,
  ) {
    super(tickerCode, name, quantity, acquisitionPrice, currentPrice);
  }

  getAssetType(): string {
    return 'mutual_fund';
  }

  /**
   * 投資信託は10,000口単位で計算
   */
  override getMarketValue(): number {
    return (this.currentPrice * this.quantity) / 10000;
  }

  override getProfitLoss(): number {
    return ((this.currentPrice - this.acquisitionPrice) * this.quantity) / 10000;
  }
}
