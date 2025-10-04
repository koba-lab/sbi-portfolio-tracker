# インフラ実装ガイド

## データベーススキーマ

### Supabase SQL

Supabase の SQL Editor で以下を実行：
```sql
-- ポートフォリオテーブル作成
create table portfolios (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  holdings jsonb not null,
  total_value numeric not null,
  updated_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- インデックス作成（検索の高速化）
create index idx_portfolios_user_id on portfolios(user_id);
create index idx_portfolios_updated_at on portfolios(updated_at desc);

-- Row Level Security（RLS）を有効化
alter table portfolios enable row level security;

-- サービスロールからのアクセスを許可
create policy "Allow service role access"
  on portfolios
  for all
  using (auth.role() = 'service_role');
```

### PostgreSQL（Supabase以外）

生のPostgreSQLを使う場合：
```sql
-- 上記と同じテーブル構造
-- ただし auth.role() の部分は不要
create table portfolios (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  holdings jsonb not null,
  total_value numeric not null,
  updated_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

create index idx_portfolios_user_id on portfolios(user_id);
create index idx_portfolios_updated_at on portfolios(updated_at desc);
```

## データマッピングパターン

### Domain → Database

Domain の Entity を DB レコードに変換
```typescript
// Infrastructure Layer: SupabasePortfolioRepository.ts

async save(portfolio: Portfolio): Promise<void> {
  // Domain Entity → DB Record
  const dbRecord = {
    user_id: portfolio.userId,
    holdings: portfolio.holdings.map(h => ({
      symbol: h.symbol,
      name: h.name,
      quantity: h.quantity,
      current_price: h.currentPrice,
    })),
    total_value: portfolio.totalValue,
    updated_at: portfolio.updatedAt.toISOString(),
  };

  const { error } = await this.client
    .from('portfolios')
    .upsert(dbRecord);

  if (error) {
    throw new Error(`Failed to save: ${error.message}`);
  }
}
```

### Database → Domain

DB レコードを Domain の Entity に変換
```typescript
// Infrastructure Layer: SupabasePortfolioRepository.ts

async findLatest(userId: string): Promise<Portfolio | null> {
  const { data, error } = await this.client
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  // DB Record → Domain Entity
  return this.mapToPortfolio(data);
}

private mapToPortfolio(data: any): Portfolio {
  // holdings を Holding Entity に変換
  const holdings = data.holdings.map((h: any) =>
    new Holding(h.symbol, h.name, h.quantity, h.current_price)
  );

  return new Portfolio(
    data.user_id,
    holdings,
    new Date(data.updated_at),
    data.id
  );
}
```

### 重要なポイント

**snake_case ↔ camelCase 変換**

- DB: `user_id`, `current_price`, `updated_at`
- Domain: `userId`, `currentPrice`, `updatedAt`

**JSONB の扱い**
```typescript
// DB に保存時
holdings: JSON.stringify(holdingsArray)  // ❌ 不要
holdings: holdingsArray                  // ✅ Supabaseが自動変換

// DB から取得時
const holdings = JSON.parse(data.holdings)  // ❌ 不要
const holdings = data.holdings              // ✅ 自動でオブジェクト
```

**日付の扱い**
```typescript
// DB に保存時
updated_at: portfolio.updatedAt.toISOString()  // ✅

// DB から取得時
updatedAt: new Date(data.updated_at)  // ✅
```
