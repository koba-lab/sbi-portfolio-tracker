/**
 * SBIScraper のテスト
 */
import { describe, it } from 'jsr:@std/testing/bdd';
import { expect } from 'jsr:@std/expect';
import { SBIScraper } from '@/infrastructure/scraping/SBIScraper.ts';
import type { Credentials } from '@/domain/services/ScrapingService.ts';

describe('SBIScraper', () => {
  describe('基本動作', () => {
    it('ScrapingServiceインターフェースを実装している', () => {
      const scraper = new SBIScraper();
      expect(typeof scraper.scrape).toBe('function');
    });

    it('認証情報なしでエラーを投げる', async () => {
      const scraper = new SBIScraper();
      const invalidCredentials: Credentials = {
        username: '',
        password: '',
      };

      await expect(scraper.scrape(invalidCredentials)).rejects.toThrow();
    });
  });

  describe('スクレイピング機能', () => {
    const credentials: Credentials = {
      username: Deno.env.get('SBI_USERNAME') || 'test_user',
      password: Deno.env.get('SBI_PASSWORD') || 'test_pass',
    };

    // 実際のSBI証券にアクセスするE2Eテストは環境変数がある場合のみ実行
    const shouldRunE2E = Deno.env.get('SBI_USERNAME') && Deno.env.get('SBI_PASSWORD');

    if (shouldRunE2E) {
      it.skip('SBI証券からポートフォリオデータを取得できる', async () => {
        // E2Eテストは実装後に有効化
        const scraper = new SBIScraper();
        const portfolio = await scraper.scrape(credentials);

        expect(portfolio).toBeDefined();
        expect(portfolio.holdings).toBeDefined();
        expect(Array.isArray(portfolio.holdings)).toBe(true);
        expect(portfolio.snapshotDate).toBeInstanceOf(Date);
      }, { timeout: 30000 }); // 30秒タイムアウト
    }
  });
});
