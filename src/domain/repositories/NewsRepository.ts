/**
 * ニュースリポジトリインターフェース
 */
export interface News {
  title: string;
  url: string;
  publishedAt: Date;
  source: string;
}

export interface NewsRepository {
  /**
   * 銘柄コードに関連するニュースを取得
   */
  findByTickerCode(tickerCode: string, limit?: number): Promise<News[]>;

  /**
   * 複数の銘柄に関連するニュースを取得
   */
  findByTickerCodes(tickerCodes: string[], limit?: number): Promise<News[]>;
}
