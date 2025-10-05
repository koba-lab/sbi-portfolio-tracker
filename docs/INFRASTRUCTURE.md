# インフラ実装ガイド

## データベース管理

### マイグレーション

Supabase CLIで管理：

```bash
# 新規マイグレーション作成
supabase migration new [migration_name]

# ローカル適用
supabase db reset

# Prismaスキーマ同期
deno task prisma:pull
```

マイグレーションファイルは `supabase/migrations/` に格納される。

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
holdings: JSON.stringify(holdingsArray); // ❌ 不要
holdings: holdingsArray; // ✅ Supabaseが自動変換

// DB から取得時
const holdings = JSON.parse(data.holdings); // ❌ 不要
const holdings = data.holdings; // ✅ 自動でオブジェクト
```

**日付の扱い**

```typescript
// DB に保存時
updated_at: portfolio.updatedAt.toISOString(); // ✅

// DB から取得時
updatedAt: new Date(data.updated_at); // ✅
```
