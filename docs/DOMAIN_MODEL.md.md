# ドメインモデル仕様

## Entity: Portfolio

ポートフォリオ全体を表現するエンティティ

### プロパティ
```typescript
class Portfolio {
  constructor(
    public readonly userId: string,       // ユーザーID（必須）
    public readonly holdings: Holding[],  // 保有銘柄リスト（必須）
    public readonly updatedAt: Date,      // 更新日時（必須）
    public readonly id?: string           // ID（オプション、DBで生成）
  ) {}
}
```

### メソッド

#### `get totalValue(): number`

全保有銘柄の評価額合計を計算
```typescript
get totalValue(): number {
  return this.holdings.reduce((sum, h) => sum + h.totalValue, 0);
}
```

#### `addHolding(holding: Holding): Portfolio`

新しい銘柄を追加した新しいPortfolioを返す（イミュータブル）
```typescript
addHolding(holding: Holding): Portfolio {
  return new Portfolio(
    this.userId,
    [...this.holdings, holding],
    new Date(),
    this.id
  );
}
```

### ビジネスルール

- `holdings` は空配列も許可（銘柄なしの状態もあり得る）
- `totalValue` は常に 0 以上
- イミュータブル: 変更時は新しいインスタンスを返す

### 配置

`src/domain/entities/Portfolio.ts`

---

## Entity: Holding

個別の保有銘柄を表現するエンティティ

### プロパティ
```typescript
class Holding {
  constructor(
    public readonly symbol: string,        // 銘柄コード（例: "7203"）
    public readonly name: string,          // 銘柄名（例: "トヨタ自動車"）
    public readonly quantity: number,      // 保有数量（正の整数）
    public readonly currentPrice: number   // 現在価格（正の数）
  ) {
    this.validate();
  }
}
```

### メソッド

#### `get totalValue(): number`

評価額を計算（数量 × 価格）
```typescript
get totalValue(): number {
  return this.quantity * this.currentPrice;
}
```

#### `private validate(): void`

バリデーション
```typescript
private validate(): void {
  if (this.quantity <= 0) {
    throw new Error('Quantity must be positive');
  }
  if (this.currentPrice <= 0) {
    throw new Error('Current price must be positive');
  }
  if (!this.symbol || this.symbol.trim() === '') {
    throw new Error('Symbol is required');
  }
}
```

### ビジネスルール

- `quantity` は正の整数のみ
- `currentPrice` は正の数のみ
- `symbol` は空文字列禁止

### 配置

`src/domain/entities/Holding.ts`

---

## Value Object: Credentials

認証情報を表現するバリューオブジェクト

### プロパティ
```typescript
class Credentials {
  constructor(
    public readonly username: string,
    private readonly password: string
  ) {
    this.validate();
  }
}
```

### メソッド

#### `getPassword(): string`

パスワードを取得（カプセル化）

typescript

```typescript
getPassword(): string {
  return this.password;
}
```

#### `private validate(): void`

バリデーション
```typescript
private validate(): void {
  if (!this.username || this.username.trim() === '') {
    throw new Error('Username is required');
  }
  if (!this.password || this.password.trim() === '') {
    throw new Error('Password is required');
  }
}
```

### ビジネスルール

- `username` と `password` は必須
- `password` は private（直接アクセス不可）
- イミュータブル

### 配置

`src/domain/valueObjects/Credentials.ts`

---

## Repository Interface: PortfolioRepository

ポートフォリオデータの永続化を抽象化

### インターフェース定義
```typescript
export interface PortfolioRepository {
  // ポートフォリオを保存
  save(portfolio: Portfolio): Promise<void>;
  
  // 最新のポートフォリオを取得
  findLatest(userId: string): Promise<Portfolio | null>;
  
  // 日付範囲でポートフォリオを取得
  findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Portfolio[]>;
  
  // ポートフォリオを削除
  delete(portfolioId: string): Promise<void>;
}
```

### 実装例

- `SupabasePortfolioRepository` - Supabase実装
- `PostgreSQLPortfolioRepository` - PostgreSQL実装
- `JSONFilePortfolioRepository` - JSONファイル実装

### 配置

`src/domain/repositories/PortfolioRepository.ts`

---

## Service Interface: ScrapingService

スクレイピング処理を抽象化

### インターフェース定義
```typescript
export interface ScrapingService {
  // SBI証券からポートフォリオデータを取得
  scrape(credentials: Credentials): Promise<Portfolio>;
}
```

### 実装例

- `PlaywrightSBIScraper` - Playwright実装

### 配置

`src/domain/repositories/ScrapingService.ts`