/**
 * 国内株式
 */
import { Holding } from './Holding.ts';

export class Stock extends Holding {
  constructor(
    tickerCode: string,
    name: string,
    quantity: number,
    acquisitionPrice: number,
    currentPrice: number,
    public readonly market?: string,
    public readonly dividendYield?: number,
  ) {
    super(tickerCode, name, quantity, acquisitionPrice, currentPrice);
  }

  getAssetType(): string {
    return 'stock';
  }
}
