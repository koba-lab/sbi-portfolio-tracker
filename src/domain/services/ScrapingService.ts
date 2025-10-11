/**
 * スクレイピングサービスインターフェース
 */
import { Portfolio } from '../entities/Portfolio.ts';

export interface Credentials {
  username: string;
  password: string;
}

export interface ScrapingService {
  /**
   * SBI証券からポートフォリオデータを取得
   */
  scrape(credentials: Credentials): Promise<Portfolio>;
}
