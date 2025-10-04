# システムアーキテクチャ

## レイヤー構成（クリーンアーキテクチャ）

```
┌─────────────────────────────────────┐
│     Presentation Layer              │
│  - GitHub Actions エントリーポイント │
│  - MCP Server                       │
│  - CLI（将来実装）                   │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│     Application Layer               │
│  - SyncPortfolioUseCase             │
│  - GetPortfolioHistoryUseCase       │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│     Domain Layer (外部依存なし)      │
│  - Portfolio (Entity)               │
│  - Holding (Entity)                 │
│  - Credentials (Value Object)       │
│  - PortfolioRepository (Interface)  │
│  - ScrapingService (Interface)      │
└────────────△────────────────────────┘
             │ 依存性の逆転
┌────────────┴────────────────────────┐
│     Infrastructure Layer            │
│  - PlaywrightSBIScraper             │
│  - SupabasePortfolioRepository      │
│  - PostgreSQLPortfolioRepository    │
│  - JSONFilePortfolioRepository      │
└─────────────────────────────────────┘
```

## 依存関係のルール

```
Presentation -> Application -> Domain <- Infrastructure
```

**重要**: Infrastructure は Domain に依存するが、Domain は Infrastructure に依存しない（**依存性の逆転原則**）

## ディレクトリ構成

```
src/
├── domain/                    # ドメイン層（外部依存なし）
│   ├── entities/
│   │   ├── Portfolio.ts
│   │   └── Holding.ts
│   ├── valueObjects/
│   │   └── Credentials.ts
│   └── repositories/
│       ├── PortfolioRepository.ts
│       └── ScrapingService.ts
│
├── application/               # ユースケース層
│   └── usecases/
│       ├── SyncPortfolioUseCase.ts
│       └── GetPortfolioHistoryUseCase.ts
│
├── infrastructure/            # インフラ層（実装）
│   ├── scraping/
│   │   └── PlaywrightSBIScraper.ts
│   ├── repositories/
│   │   ├── SupabasePortfolioRepository.ts
│   │   ├── PostgreSQLPortfolioRepository.ts
│   │   └── JSONFilePortfolioRepository.ts
│   └── config/
│       └── dependencies.ts
│
└── presentation/              # プレゼンテーション層
    ├── github-actions/
    │   └── scraper.ts
    └── mcp/
        └── server.ts
```

## データフロー

### スクレイピングフロー

```
GitHub Actions (cron trigger)
  ↓
scraper.ts (Presentation)
  ↓
SyncPortfolioUseCase (Application)
  ↓ ← Credentials
PlaywrightSBIScraper (Infrastructure)
  ↓ → SBI証券サイト
  ↓ ← Portfolio data
SupabasePortfolioRepository (Infrastructure)
  ↓
Supabase Database
```

### データ取得フロー

```
Claude
  ↓
MCP Server (Presentation)
  ↓
GetPortfolioHistoryUseCase (Application)
  ↓
SupabasePortfolioRepository (Infrastructure)
  ↓
Supabase Database
  ↓
Portfolio[] (JSON)
```

## レイヤー別の責務

### Domain Layer

**責務**: ビジネスロジックの定義

- Entity: ビジネス概念のモデル化
- Value Object: 不変な値の表現
- Repository Interface: データ永続化の抽象化
- Service Interface: 外部サービスの抽象化

**制約**:

- 外部ライブラリの使用禁止
- 他のレイヤーへの依存禁止
- 純粋なTypeScriptのみ

### Application Layer

**責務**: ユースケースの実装

- ビジネスフローの制御
- Domainオブジェクトの組み立て
- トランザクション境界の定義

**依存**:

- Domain Layer のみに依存

### Infrastructure Layer

**責務**: 技術的な実装

- Repository Interface の実装
- Service Interface の実装
- 外部ライブラリの使用
- データベース・APIとの通信

**依存**:

- Domain Layer に依存（インターフェースの実装）
- 外部ライブラリに依存

### Presentation Layer

**責務**: エントリーポイント

- ユーザー入力の受け取り
- 依存性注入の設定
- Application Layer の呼び出し

**依存**:

- Application Layer に依存
- Infrastructure Layer の具象クラスをDI

## 依存性注入（DI）

### 設定ファイル
```typescript
// src/infrastructure/config/dependencies.ts

export function createPortfolioRepository(
  type: 'supabase' | 'postgresql' | 'json'
): PortfolioRepository {
  switch (type) {
    case 'supabase':
      return new SupabasePortfolioRepository(/*...*/);
    case 'postgresql':
      return new PostgreSQLPortfolioRepository(/*...*/);
    case 'json':
      return new JSONFilePortfolioRepository(/*...*/);
  }
}
```

### エントリーポイントでの使用
```typescript
// src/presentation/github-actions/scraper.ts

const repository = createPortfolioRepository('supabase');
const scraper = new PlaywrightSBIScraper();
const useCase = new SyncPortfolioUseCase(repository, scraper);

await useCase.execute(credentials);
```