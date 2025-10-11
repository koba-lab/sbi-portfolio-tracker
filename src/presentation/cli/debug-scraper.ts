/**
 * スクレイピングデバッグ用CLI
 * ブラウザを表示して動作を確認できる
 *
 * 使い方:
 * HEADLESS=false deno run -A src/presentation/cli/debug-scraper.ts
 */
import { SBIScraper } from '@/infrastructure/scraping/SBIScraper.ts';

async function main() {
  const username = Deno.env.get('SBI_USERNAME');
  const password = Deno.env.get('SBI_PASSWORD');

  if (!username || !password) {
    console.error('❌ 環境変数 SBI_USERNAME と SBI_PASSWORD を設定してください');
    Deno.exit(1);
  }

  console.log('🔍 SBI証券スクレイピングデバッグモード');
  console.log(`   ユーザー: ${username}`);
  console.log(`   Headless: ${Deno.env.get('HEADLESS') !== 'false' ? 'ON' : 'OFF'}`);
  console.log('');

  try {
    const scraper = new SBIScraper();
    console.log('⏳ スクレイピング開始...');

    const portfolio = await scraper.scrape({ username, password });

    console.log('✅ スクレイピング成功！');
    console.log('');
    console.log('📊 ポートフォリオ情報:');
    console.log(`   スナップショット日時: ${portfolio.snapshotDate.toISOString()}`);
    console.log(`   保有銘柄数: ${portfolio.holdings.length}`);
    console.log(`   総評価額: ¥${portfolio.getTotalValue().toLocaleString()}`);
    console.log(`   総損益: ¥${portfolio.getTotalProfitLoss().toLocaleString()}`);
    console.log(`   総損益率: ${portfolio.getTotalProfitLossRate().toFixed(2)}%`);
    console.log('');

    if (portfolio.holdings.length > 0) {
      console.log('📈 保有銘柄:');
      portfolio.holdings.forEach((holding) => {
        console.log(`   - ${holding.name} (${holding.tickerCode})`);
        console.log(`     数量: ${holding.quantity}, 評価額: ¥${holding.getMarketValue().toLocaleString()}`);
      });
    }
  } catch (error) {
    console.error('❌ エラー発生:', error instanceof Error ? error.message : error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
