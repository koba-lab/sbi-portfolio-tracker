/**
 * 国内株式
 */
import { type AccountType, type AssetType, Holding } from './Holding.ts';

export class Stock extends Holding {
  constructor(
    tickerCode: string,
    name: string,
    quantity: number,
    acquisitionPrice: number,
    currentPrice: number,
    accountType: AccountType,
    public readonly market?: string,
    public readonly dividendYield?: number,
  ) {
    super(tickerCode, name, quantity, acquisitionPrice, currentPrice, accountType);
  }

  getAssetType(): AssetType {
    return 'stock';
  }
}
