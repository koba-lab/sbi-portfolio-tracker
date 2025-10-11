/**
 * ポートフォリオリポジトリインターフェース
 */
import { Portfolio } from '../entities/Portfolio.ts';

export interface PortfolioRepository {
  /**
   * ポートフォリオを保存
   */
  save(portfolio: Portfolio): Promise<void>;

  /**
   * 最新のポートフォリオを取得
   */
  findLatest(): Promise<Portfolio | null>;

  /**
   * 指定日のポートフォリオを取得
   */
  findByDate(date: Date): Promise<Portfolio | null>;

  /**
   * 期間内のポートフォリオ履歴を取得
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<Portfolio[]>;
}
