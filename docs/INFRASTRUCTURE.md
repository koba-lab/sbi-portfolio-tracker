# インフラ実装ガイド

## データベース設計

### テーブル構成

#### 1. portfolio_snapshots （保有資産スナップショット）

各保有銘柄を個別の行として保存し、`snapshot_date`でグループ化してPortfolioに復元する。

```sql
CREATE TABLE portfolio_snapshots (
  id UUID PRIMARY KEY,
  ticker_code VARCHAR(20) NOT NULL,
  name TEXT NOT NULL,
  asset_type asset_type NOT NULL,  -- 'stock', 'mutual_fund', 'foreign_stock'
  quantity DECIMAL(15, 4) NOT NULL,
  acquisition_price DECIMAL(15, 2) NOT NULL,
  current_price DECIMAL(15, 2) NOT NULL,
  market_value DECIMAL(15, 2) NOT NULL,
  profit_loss DECIMAL(15, 2) NOT NULL,
  profit_loss_rate DECIMAL(8, 2),
  additional_info JSONB,  -- 資産種別固有の情報
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. news （銘柄関連ニュース）

銘柄に関連するニュース情報を時系列で保存する。

```sql
CREATE TABLE news (
  id UUID PRIMARY KEY,
  ticker_code VARCHAR(20) NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  published_at TIMESTAMPTZ NOT NULL,
  source VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**portfolio_snapshotsとの関係:**
- `ticker_code`で関連付けるが、外部キー制約は設定しない
- 理由: ニュースは保有していない銘柄についても保存する可能性がある
- 1銘柄:Nニュースの関係

### 設計の意図

#### 単一テーブル設計を採用した理由（Phase 1）

- **シンプルさ**: ポートフォリオ全体のメタデータ（total_value等）は計算可能なので専用テーブル不要
- **クエリの単純化**: テーブル結合が不要
- **Phase 1の方針**: 最小限の実装から始める
- **個人利用の規模**: 10-50銘柄 × 365日 × 数年 = 数万件程度なら問題なし

#### スケーラビリティの限界と移行目安

**現在の設計で問題ないケース:**
- データ量: ~50,000レコード（50銘柄 × 3年分）
- クエリパターン: 最新データ取得、特定日のデータ取得
- レスポンス目標: < 200ms

**Phase 2移行が必要になるケース:**
- データ量: 100,000+レコード
- 複雑な集計クエリが頻繁に必要（月次推移、年間パフォーマンス等）
- レスポンス時間が200msを超える

### Phase 2: スケーラビリティ改善策

必要になった時点で以下の改善を段階的に導入：

#### Option A: 集計テーブルの追加

```sql
-- 日次集計テーブル
CREATE TABLE portfolio_daily_summary (
  snapshot_date DATE PRIMARY KEY,
  total_value DECIMAL(15, 2) NOT NULL,
  total_profit_loss DECIMAL(15, 2) NOT NULL,
  total_profit_loss_rate DECIMAL(8, 2),
  holdings_count INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- スクレイピング時に同時に集計を保存
-- 過去データの集計クエリが高速化
```

**メリット:**
- 日次推移グラフ等の集計クエリが高速化
- portfolio_snapshotsは詳細データとして保持

**デメリット:**
- データ冗長性の増加
- 保存時の処理が増える

#### Option B: マテリアライズドビューの活用

```sql
-- PostgreSQLのマテリアライズドビュー
CREATE MATERIALIZED VIEW portfolio_monthly_summary AS
SELECT
  DATE_TRUNC('month', snapshot_date) as month,
  AVG(market_value) as avg_value,
  COUNT(DISTINCT ticker_code) as unique_holdings
FROM portfolio_snapshots
GROUP BY DATE_TRUNC('month', snapshot_date);

-- 定期的にリフレッシュ
REFRESH MATERIALIZED VIEW portfolio_monthly_summary;
```

**メリット:**
- アプリケーションコードの変更不要
- 必要に応じてリフレッシュ可能

**デメリット:**
- Supabase無料枠での制限を確認必要

#### Option C: インデックスの最適化

```sql
-- 複合インデックスで集計クエリを高速化
CREATE INDEX idx_snapshots_date_value
  ON portfolio_snapshots(snapshot_date, market_value);

CREATE INDEX idx_snapshots_date_ticker
  ON portfolio_snapshots(snapshot_date, ticker_code);
```

**現在の実装状況:**
- 単一カラムインデックスのみ（ticker_code, snapshot_date, asset_type）
- 集計クエリが遅くなったら複合インデックスを追加

### 移行判断の指標

```typescript
// アプリケーションでレスポンス時間を監視
const startTime = performance.now();
const portfolio = await repository.findLatest();
const duration = performance.now() - startTime;

if (duration > 200) {
  console.warn('Phase 2 migration may be needed');
}
```

**結論**: Phase 1では単一テーブル設計で開始し、実際のパフォーマンスを測定しながらPhase 2の改善策を導入する。

#### 計算済み値の保存について

`market_value`, `profit_loss`, `profit_loss_rate`は計算可能な値ですが、DBに保存する理由：

- **パフォーマンス**: 過去データの集計クエリで再計算が不要
- **監査**: スクレイピング時点の値を記録
- **冗長性の許容**: ストレージコストより開発のシンプルさを優先

### マイグレーション管理とスキーマ設計方針

#### 【重要】Supabase Migrations主導の設計

このプロジェクトでは**Supabase Migrationsを真実の源（Source of Truth）**とする設計を採用しています。

**ファイルの役割:**
- `supabase/migrations/*.sql` ← **真実の源（手動作成・編集）**
- `prisma/schema.prisma` ← **自動生成専用（手動編集禁止）**

**設計意図:**
1. **Supabaseエコシステムとの統合**: Auth、Storage、Edge Functionsなどのスキーマと一貫性を保つ
2. **SQL直接制御**: CHECK制約、トリガー、関数などPostgreSQLの全機能を活用
3. **型安全性の確保**: Prisma Clientで型安全なDBアクセスを実現（自動生成で常に一致）
4. **単一の真実**: マイグレーションとスキーマの二重管理を回避

#### スキーマ変更ワークフロー

```bash
# 1. SQLマイグレーションファイルを作成
deno task db:migration:new add_user_preferences

# 編集: supabase/migrations/20250111_add_user_preferences.sql
# SQLを直接記述

# 2. ローカルDBに適用（開発環境）
deno task db:migrate  # supabase db reset

# 3. Prismaスキーマを同期（自動生成）
deno task db:pull

# 4. Prisma Clientを再生成
deno task db:generate

# 5. リモートDBに適用（本番環境）
deno task db:migrate:apply  # supabase db push
```

**重要な注意事項:**
- ❌ `prisma/schema.prisma`を直接編集しない
- ❌ `prisma migrate`コマンドは使用しない
- ✅ 常に`supabase migration new`でマイグレーションを作成
- ✅ `db:pull`後は必ず`db:generate`を実行

#### テストDB環境

**ローカル開発:**
- 開発DB: `127.0.0.1:54322/postgres`
- テストDB: `127.0.0.1:54322/test_db` （同じSupabaseローカル環境）

マイグレーションはSupabaseローカル環境の`postgres` DBに適用され、テスト実行時は`.env.test`で`test_db`に接続します。

**マイグレーションファイルの配置:**
- `supabase/migrations/` ← すべてのSQLマイグレーション
- Gitでバージョン管理
- タイムスタンプ順に適用される

#### 代替案との比較

**Prisma Migrate主導（採用しない理由）:**
- ❌ Supabase Auth/Storageスキーマとの統合が複雑
- ❌ PostgreSQL固有機能（トリガー、関数）の表現が困難
- ❌ マイグレーション履歴が`prisma/migrations`とSupabaseで分散
- ✅ スキーマファーストで開発できる（唯一の利点）

**結論**: Supabaseをフル活用するため、SQL主導でマイグレーション管理し、Prismaは型安全性のためのツールとして活用する。

## データマッピングパターン

### Domain → Database

1つのPortfolio Entityを複数のDB行に分解して保存

```typescript
// Infrastructure Layer: PrismaPortfolioRepository.ts

async save(portfolio: Portfolio): Promise<void> {
  // 1つのPortfolio → N個のDB行
  const records = portfolio.holdings.map(holding => ({
    ticker_code: holding.tickerCode,
    name: holding.name,
    asset_type: holding.getAssetType(),
    quantity: holding.quantity,
    acquisition_price: holding.acquisitionPrice,
    current_price: holding.currentPrice,
    market_value: holding.getMarketValue(),
    profit_loss: holding.getProfitLoss(),
    profit_loss_rate: holding.getProfitLossRate(),
    additional_info: this.serializeAdditionalInfo(holding),
    snapshot_date: portfolio.snapshotDate,
  }));

  await this.prisma.portfolioSnapshot.createMany({
    data: records,
  });
}

private serializeAdditionalInfo(holding: Holding): object {
  if (holding instanceof Stock) {
    return { market: holding.market, dividendYield: holding.dividendYield };
  }
  if (holding instanceof ForeignStock) {
    return {
      country: holding.country,
      currency: holding.currency,
      exchangeRate: holding.exchangeRate,
      localPrice: holding.localPrice,
    };
  }
  if (holding instanceof MutualFund) {
    return {
      category: holding.category,
      trustFee: holding.trustFee,
      isNISA: holding.isNISA,
    };
  }
  return {};
}
```

### Database → Domain

複数のDB行を1つのPortfolio Entityに集約

```typescript
// Infrastructure Layer: PrismaPortfolioRepository.ts

async findLatest(): Promise<Portfolio | null> {
  // 最新のsnapshot_dateを取得
  const latestDate = await this.prisma.portfolioSnapshot.findFirst({
    orderBy: { snapshot_date: 'desc' },
    select: { snapshot_date: true },
  });

  if (!latestDate) return null;

  // そのsnapshot_dateの全レコードを取得
  const records = await this.prisma.portfolioSnapshot.findMany({
    where: { snapshot_date: latestDate.snapshot_date },
  });

  // N個のDB行 → 1つのPortfolio
  return this.mapToPortfolio(records, latestDate.snapshot_date);
}

private mapToPortfolio(records: any[], snapshotDate: Date): Portfolio {
  const holdings = records.map(record => {
    switch (record.asset_type) {
      case 'stock':
        return new Stock(
          record.ticker_code,
          record.name,
          record.quantity,
          record.acquisition_price,
          record.current_price,
          record.additional_info?.market,
          record.additional_info?.dividendYield,
        );
      case 'foreign_stock':
        return new ForeignStock(
          record.ticker_code,
          record.name,
          record.quantity,
          record.acquisition_price,
          record.current_price,
          record.additional_info.country,
          record.additional_info.currency,
          record.additional_info.exchangeRate,
          record.additional_info?.localPrice,
        );
      case 'mutual_fund':
        return new MutualFund(
          record.ticker_code,
          record.name,
          record.quantity,
          record.acquisition_price,
          record.current_price,
          record.additional_info?.category,
          record.additional_info?.trustFee,
          record.additional_info?.isNISA,
        );
      default:
        throw new Error(`Unknown asset type: ${record.asset_type}`);
    }
  });

  return new Portfolio(holdings, snapshotDate);
}
```

### 重要なポイント

**snake_case ↔ camelCase 変換**

- DB: `ticker_code`, `current_price`, `snapshot_date`
- Domain: `tickerCode`, `currentPrice`, `snapshotDate`

**JSONB (additional_info) の扱い**

```typescript
// DB に保存時
additional_info: { market: 'Tokyo', dividendYield: 2.5 }  // ✅ Prismaが自動変換

// DB から取得時
const market = record.additional_info?.market;  // ✅ 自動でオブジェクト
```

**日付の扱い**

```typescript
// Prismaは自動的にDate型に変換
snapshot_date: portfolio.snapshotDate  // Date → DB
const date = record.snapshot_date      // DB → Date
```

**asset_type による型の判別**

```typescript
// DBのENUM値からドメインEntityへのマッピング
switch (record.asset_type) {
  case 'stock': return new Stock(...);
  case 'foreign_stock': return new ForeignStock(...);
  case 'mutual_fund': return new MutualFund(...);
}
```
