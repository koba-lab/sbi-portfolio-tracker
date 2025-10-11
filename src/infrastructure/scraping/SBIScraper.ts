/**
 * SBI証券スクレイピング実装
 */
import { chromium } from 'npm:playwright@^1.40.0';
import type { Browser, Page, BrowserContext } from 'npm:playwright@^1.40.0';
import type { ScrapingService, Credentials } from '@/domain/services/ScrapingService.ts';
import { Portfolio } from '@/domain/entities/Portfolio.ts';
import { Stock } from '@/domain/entities/Stock.ts';
import { MutualFund } from '@/domain/entities/MutualFund.ts';
import type { Holding, AccountType } from '@/domain/entities/Holding.ts';

// SBI証券のURL
const SBI_LOGIN_URL = 'https://www.sbisec.co.jp/ETGate';
const SBI_DOMESTIC_PORTFOLIO_URL = 'https://site2.sbisec.co.jp/ETGate/?_ControlID=WPLETacR002Control&_PageID=DefaultPID&_DataStoreID=DSWPLETacR002Control&getFlg=on&_ActionID=DefaultAID&OutSide=on';
const SBI_FOREIGN_PORTFOLIO_URL = 'https://site.sbisec.co.jp/account/foreign/assets';

// Cookie保存先
const COOKIE_FILE = './tmp/sbi-cookies.json';

export class SBIScraper implements ScrapingService {
  private browser?: Browser;
  private context?: BrowserContext;

  async scrape(credentials: Credentials): Promise<Portfolio> {
    // バリデーション
    if (!credentials.username || !credentials.password) {
      throw new Error('認証情報が不正です');
    }

    try {
      // 環境変数HEADLESS=falseでブラウザUIを表示
      const headless = Deno.env.get('HEADLESS') !== 'false';

      this.browser = await chromium.launch({
        headless,
        slowMo: headless ? 0 : 1000, // 非headless時は1秒ごとにスローモーション
        devtools: !headless, // 非headless時はDevToolsを開く
      });

      // Cookie読み込み（存在する場合）
      const hasCookies = await this.hasCookies();
      this.context = await this.browser.newContext(
        hasCookies ? { storageState: COOKIE_FILE } : {}
      );

      const page = await this.context.newPage();

      // 1. ログイン（Cookie未保存の場合のみ実行）
      if (!hasCookies) {
        console.log('🔐 初回ログイン - Cookie保存モード');
        await this.login(page, credentials);

        // デバイス認証待機
        await this.waitForDeviceAuth(page);

        // Cookie保存
        await this.saveCookies();
        console.log('✅ Cookie保存完了 - 次回から自動ログイン可能');
      } else {
        console.log('🍪 保存済みCookieでログイン');
        // まずトップページに遷移
        await page.goto('https://www.sbisec.co.jp/ETGate');
        await page.waitForLoadState('domcontentloaded');
      }

      // 現在のページを確認
      await this.saveScreenshot(page, '04-current-page');

      // 2. 国内株式・投資信託データ取得
      console.log('📊 国内株式・投資信託を取得中...');
      await page.goto(SBI_DOMESTIC_PORTFOLIO_URL);
      await page.waitForLoadState('domcontentloaded');
      await this.saveScreenshot(page, '05-domestic-portfolio');
      await this.saveHtml(page, 'domestic-portfolio');
      const domesticHoldings = await this.extractDomesticHoldings(page);

      // 3. 海外株式データ取得
      console.log('🌍 海外株式を取得中...');
      await page.goto(SBI_FOREIGN_PORTFOLIO_URL);
      await page.waitForLoadState('domcontentloaded');
      await this.saveScreenshot(page, '06-foreign-portfolio');
      await this.saveHtml(page, 'foreign-portfolio');
      const foreignHoldings = await this.extractForeignHoldings(page);

      // 4. 全データを統合
      const allHoldings = [...domesticHoldings, ...foreignHoldings];
      console.log(`\n✅ 取得完了: ${allHoldings.length}銘柄\n`);

      return new Portfolio(allHoldings, new Date());
    } finally {
      await this.close();
    }
  }

  private async login(page: Page, credentials: Credentials): Promise<void> {
    try {
      await page.goto(SBI_LOGIN_URL, { timeout: 30000 });
    } catch (error) {
      throw new Error(`SBI証券サイトにアクセスできません: ${error}`);
    }

    await this.saveScreenshot(page, '01-login-page');

    // ログインフォームの存在確認
    const hasLoginForm = await page.locator('input[name="user_id"]').count() > 0;
    if (!hasLoginForm) {
      await this.saveScreenshot(page, '01-no-login-form');
      throw new Error('ログインフォームが見つかりません（メンテナンス中またはサイト構造変更の可能性）');
    }

    // ユーザー名入力
    await page.fill('input[name="user_id"]', credentials.username);

    // パスワード入力
    await page.fill('input[name="user_password"]', credentials.password);

    await this.saveScreenshot(page, '02-credentials-filled');

    // ログインボタンクリック
    await page.click('input[name="ACT_login"]');

    // ログイン完了を待機
    try {
      // ログイン後のページ遷移を待つ（最大30秒）
      await page.waitForURL('**/*/Default*', { timeout: 30000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      await this.saveScreenshot(page, '03-after-login');

      // ログイン失敗メッセージの確認
      const errorMsg = await page.locator('text=/ログインできません|パスワードが正しくありません/').count();
      if (errorMsg > 0) {
        throw new Error('認証情報が正しくありません');
      }
    } catch (error) {
      await this.saveScreenshot(page, '03-login-error');
      throw new Error(`ログイン処理に失敗しました: ${error}`);
    }
  }


  /**
   * デバイス認証完了を待機
   * 初回ログイン時、ユーザーが手動でメール認証を完了するのを待つ
   */
  private async waitForDeviceAuth(page: Page): Promise<void> {
    console.log('⏳ デバイス認証が必要です');
    console.log('   メールまたは認証コードで認証を完了してください');
    console.log('   認証完了後、自動的に処理が続行されます...');

    try {
      // ポートフォリオページへのリダイレクトを待つ（最大5分）
      await page.waitForURL('**/site1.sbisec.co.jp/**', { timeout: 300000 });
      console.log('✅ デバイス認証完了');
    } catch (error) {
      throw new Error('デバイス認証がタイムアウトしました（5分）');
    }
  }

  /**
   * Cookie存在確認
   */
  private async hasCookies(): Promise<boolean> {
    try {
      await Deno.stat(COOKIE_FILE);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cookie保存
   */
  private async saveCookies(): Promise<void> {
    if (!this.context) return;

    const dir = './tmp';
    await Deno.mkdir(dir, { recursive: true });

    const state = await this.context.storageState();
    await Deno.writeTextFile(COOKIE_FILE, JSON.stringify(state, null, 2));
  }

  /**
   * デバッグ用スクリーンショット保存
   */
  private async saveScreenshot(page: Page, name: string): Promise<void> {
    const debugMode = Deno.env.get('DEBUG_SCREENSHOTS') === 'true';
    if (!debugMode) return;

    const dir = './tmp/sbi-scraper-debug';
    try {
      await Deno.mkdir(dir, { recursive: true });
      const path = `${dir}/${name}.png`;
      await page.screenshot({ path, fullPage: true });
      console.log(`📸 Screenshot saved: ${path}`);
    } catch (error) {
      console.warn(`Failed to save screenshot: ${error}`);
    }
  }

  /**
   * デバッグ用HTML保存
   */
  private async saveHtml(page: Page, name: string): Promise<void> {
    const debugMode = Deno.env.get('DEBUG_SCREENSHOTS') === 'true';
    if (!debugMode) return;

    const dir = './tmp/sbi-scraper-debug';
    try {
      await Deno.mkdir(dir, { recursive: true });
      const path = `${dir}/${name}.html`;
      const html = await page.content();
      await Deno.writeTextFile(path, html);
      console.log(`📄 HTML saved: ${path}`);
    } catch (error) {
      console.warn(`Failed to save HTML: ${error}`);
    }
  }

  /**
   * 国内株式・投資信託データを抽出
   * セクション別（特定預り、NISA預り等）にStock/MutualFundを作成
   */
  private async extractDomesticHoldings(page: Page): Promise<Holding[]> {
    const holdings: Holding[] = [];

    // HTMLからセクション情報を取得
    const html = await page.content();

    // セクションパターン: <b>株式（...）</b> or <b>投資信託<br>（金額/...）</b>
    // より柔軟に、<b>タグ内の全テキストを取得
    const sectionPattern = /<b>(株式|投資信託)(?:<br>)?\s*（.+?）<\/b>/gs;
    const sections: Array<{ type: 'stock' | 'mutual_fund'; accountType: AccountType; startIndex: number }> = [];

    let match;
    while ((match = sectionPattern.exec(html)) !== null) {
      const fullMatch = match[0];
      const assetTypeText = match[1]; // "株式" or "投資信託"

      // フルマッチから口座種別を抽出
      // "株式（NISA預り（成長投資枠））" → "NISA預り（成長投資枠）"
      // "投資信託<br>（金額/旧つみたてNISA預り）" → "旧つみたてNISA預り"
      let accountTypeText = '';

      // "（金額/"を削除してから、最後の（...）部分を抽出
      const cleaned = fullMatch
        .replace(/<br\s*\/?>/gi, '')
        .replace(/（金額\//, '（');

      // 最後の（...）を抽出
      const accountMatch = cleaned.match(/（([^（]+)）<\/b>$/);
      if (accountMatch) {
        accountTypeText = accountMatch[1];
      }

      if (!accountTypeText) {
        console.warn(`⚠️ セクション解析失敗: "${fullMatch}"`);
        continue;
      }

      const assetType = assetTypeText === '株式' ? 'stock' : 'mutual_fund';
      const accountType = this.parseAccountType(accountTypeText);

      sections.push({
        type: assetType,
        accountType,
        startIndex: match.index,
      });
    }

    console.log(`\n🔍 セクション検出: ${sections.length}個`);
    sections.forEach((s, i) => console.log(`  ${i + 1}. ${s.type} / ${s.accountType}`));

    // 各セクションのテーブルを抽出
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const nextSection = sections[i + 1];

      // セクション範囲のHTML抽出
      const sectionHtml = nextSection
        ? html.substring(section.startIndex, nextSection.startIndex)
        : html.substring(section.startIndex);

      // このセクションのテーブル行を解析
      const sectionHoldings = this.parseSectionHoldings(
        sectionHtml,
        section.type,
        section.accountType
      );

      holdings.push(...sectionHoldings);
      console.log(`  ✅ ${section.type}/${section.accountType}: ${sectionHoldings.length}銘柄`);
    }

    console.log(`\n📊 国内抽出完了: ${holdings.length}銘柄\n`);
    return holdings;
  }


  /**
   * 口座種別テキストをAccountTypeに変換
   */
  private parseAccountType(text: string): AccountType {
    if (text.includes('特定預り')) return 'specific';
    if (text.includes('一般預り')) return 'general';
    if (text.includes('旧つみたてNISA')) return 'nisa_old_tsumitate';
    if (text.includes('つみたて投資枠')) return 'nisa_tsumitate';
    if (text.includes('成長投資枠')) return 'nisa_growth';
    if (text.includes('NISA預り')) return 'nisa_growth'; // デフォルトでNISA預りは成長投資枠

    console.warn(`⚠️ 未知の口座種別: "${text}" → デフォルト: specific`);
    return 'specific';
  }

  /**
   * セクションHTMLから保有銘柄を解析
   */
  private parseSectionHoldings(
    sectionHtml: string,
    assetType: 'stock' | 'mutual_fund',
    accountType: AccountType
  ): Holding[] {
    const holdings: Holding[] = [];

    // <tr align="right"> のパターンでテーブル行を抽出（国内株式・投資信託）
    const rowPattern = /<tr[^>]*align="right"[^>]*>(.*?)<\/tr>/gs;
    let match;

    while ((match = rowPattern.exec(sectionHtml)) !== null) {
      const rowHtml = match[1];

      // セル内容を抽出
      const cellPattern = /<td[^>]*>(.*?)<\/td>/gs;
      const cells: string[] = [];
      let cellMatch;

      while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
        // HTMLタグを除去してテキストのみ抽出
        // <br>は改行に変換してから削除（スペース区切りになるように）
        const cellText = cellMatch[1]
          .replace(/<br\s*\/?>/gi, ' ')  // <br>をスペースに変換
          .replace(/<[^>]+>/g, '')        // 他のHTMLタグを削除
          .replace(/&nbsp;/g, ' ')
          .trim();
        cells.push(cellText);
      }

      if (cells.length < 3) continue;

      try {
        // デバッグ: 最初の行のみセル内容を表示
        if (holdings.length === 0 && assetType === 'stock') {
          console.log(`  🔍 デバッグ: セル数=${cells.length}`);
          cells.forEach((cell, idx) => console.log(`    セル[${idx}]: "${cell}"`));
        }

        // 銘柄コードと銘柄名を探す（数字4桁以上で始まるセル）
        let tickerCode = '';
        let name = '';
        let stockCellIndex = -1;

        for (let j = 0; j < cells.length; j++) {
          const text = cells[j];

          // 投資信託の場合: 銘柄コードなし、銘柄名のみ
          if (assetType === 'mutual_fund' && text.length > 5 && !text.match(/^\d/) && !text.includes('口')) {
            name = text.trim();
            tickerCode = 'MF-' + Math.random().toString(36).substring(2, 10); // 仮のコード
            stockCellIndex = j;
            break;
          }

          // 株式の場合: パターン1: "ＩＮＰＥＸ1605" (スペースなしでコードが末尾)
          let codeMatch = text.match(/^(.+?)(\d{4,})$/);
          if (codeMatch) {
            name = codeMatch[1].trim();
            tickerCode = codeMatch[2];
            stockCellIndex = j;
            break;
          }
          // パターン2: "1605 ＩＮＰＥＸ" (スペースあり、コードが先)
          codeMatch = text.match(/^(\d{4,})\s+(.+)$/);
          if (codeMatch) {
            tickerCode = codeMatch[1];
            name = codeMatch[2].trim();
            stockCellIndex = j;
            break;
          }
        }

        if (!tickerCode || stockCellIndex === -1) continue;

        // 数値セルを探す（銘柄セルの後ろから）
        // セル内に複数の数値がある場合（100 など）は最初の値のみ取る
        const numbers: number[] = [];
        for (let j = stockCellIndex + 1; j < cells.length; j++) {
          const text = cells[j];

          // 日付形式（--/--/--、YY/MM/DD）をスキップ
          if (text.includes('/') || text.includes('--')) {
            continue;
          }

          // 複数の数値がある場合は最初の値のみ（例: "100" or "1,730 2,675" → ["1,730", "2,675"]）
          // 投資信託の場合は「口」を除去
          const cleanedText = text.replace(/口/g, '');
          const numTexts = cleanedText.split(/\s+/).filter(t => t.length > 0);
          for (const numText of numTexts) {
            const num = this.parseNumber(numText);
            if (!isNaN(num) && num !== 0) {
              numbers.push(num);
            }
          }
        }

        // 最低3つの数値（数量、取得単価、現在値）が必要
        if (numbers.length < 3) {
          console.warn(`  ⚠️ ${tickerCode} ${name}: 数値データ不足（${numbers.length}個）`);
          continue;
        }

        // 最初の3つを使用（数量、取得単価、現在値）
        const [quantity, acquisitionPrice, currentPrice] = numbers;

        // 基本的な妥当性チェック
        if (quantity <= 0 || currentPrice <= 0) {
          console.warn(`  ⚠️ ${tickerCode} ${name}: 無効な数値（数量:${quantity}, 現在値:${currentPrice}）`);
          continue;
        }

        // 取得単価が0の場合は現在値で代替（新規購入など）
        const finalAcquisitionPrice = acquisitionPrice > 0 ? acquisitionPrice : currentPrice;

        // 資産種別に応じてエンティティ作成
        let holding: Holding;
        if (assetType === 'stock') {
          holding = new Stock(
            tickerCode,
            name,
            quantity,
            finalAcquisitionPrice,
            currentPrice,
            accountType
          );
        } else {
          // 投資信託は10,000口単位なので、quantityはそのまま使用
          holding = new MutualFund(
            tickerCode,
            name,
            quantity,
            finalAcquisitionPrice,
            currentPrice,
            accountType
          );
        }

        holdings.push(holding);
      } catch (error) {
        console.warn(`  ⚠️ 行の解析をスキップ: ${error}`);
        continue;
      }
    }

    return holdings;
  }

  /**
   * 海外株式データを抽出
   */
  private async extractForeignHoldings(page: Page): Promise<Holding[]> {
    // TODO: 海外株式ページの構造を確認して実装
    console.log('  → 海外株式の抽出は未実装');
    return [];
  }

  /**
   * 数値文字列をパースして数値に変換
   * カンマ、スペースを除去して解析
   */
  private parseNumber(text: string | null): number {
    if (!text) return 0;
    const cleaned = text.replace(/[,\s]/g, '').replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  private async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = undefined;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }
}
