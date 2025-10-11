# システムアーキテクチャ

## 技術スタック

| カテゴリ           | 技術                           | 選定理由                                                          |
| ------------------ | ------------------------------ | ----------------------------------------------------------------- |
| Runtime            | Deno 2.x                       | TypeScript標準サポート、セキュリティ、Supabase Edge Functions互換 |
| Web Framework      | Fastify                        | 高速、軽量、プラグイン豊富                                        |
| DI Container       | TSyringe                       | Microsoft製、軽量、デコレータベース、Deno対応確認済み             |
| ORM                | Prisma 6.x                     | 型安全、マイグレーション機能、Deno対応                            |
| Database           | Supabase PostgreSQL            | 無料枠、リアルタイム機能、認証機能                                |
| Browser Automation | Playwright                     | 安定性、TypeScript対応                                            |
| MCP SDK            | @modelcontextprotocol/sdk      | Claude連携の公式SDK                                               |
| Architecture       | Clean Architecture + 段階的DDD | 保守性、テスタビリティ、段階的な複雑性導入                        |
| CI/CD              | GitHub Actions                 | 無料枠、統合が容易                                                |

## レイヤー構成（クリーンアーキテクチャ）

```
┌─────────────────────────────────────┐
│     Presentation Layer              │
│  - Fastify Server (REST API)        │
│  - MCP Server (Claude連携)          │
│  - CLI (GitHub Actions用)           │
└────────────┬────────────────────────┘
             ↓ 依存
┌─────────────────────────────────────┐
│     Application Layer               │
│  - UseCase (ビジネスフロー)          │
│  - TSyringe DIコンテナで注入        │
└────────────┬────────────────────────┘
             ↓ 依存
┌─────────────────────────────────────┐
│     Domain Layer (純粋なTS)          │
│  - Entity (ビジネスモデル)           │
│  - Repository Interface             │
│  - Service Interface                │
└────────────△────────────────────────┘
             ↑ 実装（依存性の逆転）
┌─────────────────────────────────────┐
│     Infrastructure Layer            │
│  - Prisma (ORM実装)                 │
│  - Playwright (スクレイピング実装)   │
│  - 外部API連携                      │
└─────────────────────────────────────┘
```

## 依存関係のルール

### 依存の方向

```
Presentation → Application → Domain ← Infrastructure
```

### レイヤーごとのインポート制限

| レイヤー       | インポート可能           | インポート禁止                   |
| -------------- | ------------------------ | -------------------------------- |
| Domain         | なし（純粋なTypeScript） | すべての外部ライブラリ           |
| Application    | Domain層のみ             | Infrastructure層、外部ライブラリ |
| Infrastructure | Domain層、外部ライブラリ | Application層                    |
| Presentation   | すべて                   | -                                |

## ディレクトリ構成

```
src/
├── domain/                    # ドメイン層（ビジネスロジック）
│   ├── entities/             # エンティティ
│   │   ├── Portfolio.ts      # ポートフォリオ
│   │   ├── Holding.ts        # 保有銘柄（基底）
│   │   ├── Stock.ts          # 国内株式
│   │   ├── MutualFund.ts     # 投資信託
│   │   └── ForeignStock.ts   # 海外株式
│   ├── valueObjects/         # 値オブジェクト（将来拡張用）
│   │   └── .gitkeep
│   ├── repositories/         # リポジトリインターフェース
│   │   ├── PortfolioRepository.ts
│   │   └── NewsRepository.ts
│   └── services/             # ドメインサービスインターフェース
│       └── ScrapingService.ts
│
├── application/              # アプリケーション層（ユースケース）
│   └── usecases/
│       ├── portfolio/
│       │   ├── SyncPortfolioUseCase.ts    # ポートフォリオ同期
│       │   ├── GetPortfolioUseCase.ts     # ポートフォリオ取得
│       │   └── AnalyzeRiskUseCase.ts      # リスク分析
│       └── news/
│           └── GetRelatedNewsUseCase.ts   # 関連ニュース取得
│
├── infrastructure/           # インフラ層（技術的実装）
│   ├── config/
│   │   ├── DIContainer.ts   # TSyringe設定
│   │   └── env.ts           # 環境変数
│   ├── prisma/
│   │   ├── schema.prisma    # Prismaスキーマ
│   │   └── generated/       # Prisma Client（自動生成）
│   ├── repositories/
│   │   ├── PrismaPortfolioRepository.ts
│   │   └── NewsAPIRepository.ts
│   ├── scraping/
│   │   └── SBIScraper.ts
│   └── mcp/
│       └── MCPToolRegistry.ts
│
└── presentation/             # プレゼンテーション層（UI/API）
    ├── server/
    │   ├── index.ts         # HTTPサーバー起動
    │   ├── plugins/
    │   │   ├── di.plugin.ts # TSyringe統合
    │   │   └── auth.plugin.ts
    │   └── routes/
    │       ├── portfolio.routes.ts
    │       └── health.routes.ts
    ├── mcp/
    │   └── index.ts         # MCPサーバー実装
    └── cli/
        └── scraper.ts       # GitHub Actions用エントリポイント
```

## 依存性注入（DI）の仕組み

### TSyringe設定

```typescript
// src/infrastructure/config/DIContainer.ts
import 'reflect-metadata';
import { container } from 'tsyringe';

export function configureDI() {
  // Singleton登録
  container.registerSingleton('PrismaClient', PrismaClient);

  // Repository登録
  container.register('PortfolioRepository', {
    useClass: PrismaPortfolioRepository,
  });

  // Service登録
  container.register('ScrapingService', {
    useClass: SBIScraper,
  });

  return container;
}
```

### UseCase実装

```typescript
// src/application/usecases/portfolio/SyncPortfolioUseCase.ts
import { inject, injectable } from 'tsyringe';

@injectable()
export class SyncPortfolioUseCase {
  constructor(
    @inject('PortfolioRepository') private readonly repository: PortfolioRepository,
    @inject('ScrapingService') private readonly scraper: ScrapingService,
  ) {}

  async execute(credentials: Credentials): Promise<void> {
    // インターフェースを通じて実装を使用
    const portfolio = await this.scraper.scrape(credentials);
    await this.repository.save(portfolio);
  }
}
```

### Fastify統合

```typescript
// src/presentation/server/plugins/di.plugin.ts
export default fp(async (fastify) => {
  fastify.decorate('container', container);

  fastify.addHook('onRequest', async (request) => {
    request.diContainer = container.createChildContainer();
  });
});
```

## データフロー

### 1. スクレイピングフロー

```
GitHub Actions (Cron)
    ↓
CLI Entry Point
    ↓
SyncPortfolioUseCase ← [DI: Repository, Scraper]
    ↓
SBIScraper
    ↓ スクレイピング
SBI証券サイト
    ↓ データ取得
PrismaPortfolioRepository
    ↓ 永続化
Supabase PostgreSQL
```

### 2. API/MCPフロー

```
Claude / HTTPクライアント
    ↓
Fastify Server / MCP Server
    ↓
GetPortfolioUseCase ← [DI: Repository]
    ↓
PrismaPortfolioRepository
    ↓ クエリ
Supabase PostgreSQL
    ↓ データ返却
JSON Response
```

## 段階的DDD移行戦略

### Phase 1: シンプルなEntity（現在）

- 基本的なクラスとメソッド
- 最小限のビジネスロジック
- Repositoryパターンの導入

### Phase 2: Value Object導入（将来）

- Money, StockCode等の値オブジェクト
- より厳密な型安全性
- ビジネスルールの強化

### Phase 3: 完全なDDD（最終形）

- Aggregate設計
- Domain Event
- Specification Pattern

## セキュリティ考慮事項

### 認証・認可

- MCPサーバー: APIキー認証
- Fastify API: Bearer Token認証
- 環境変数での機密情報管理

### データ保護

- SBI証券認証情報: GitHub Secrets
- データベース接続: 環境変数
- ログ出力: 機密情報のマスキング

## デプロイメント構成

### 開発環境

```bash
deno task dev  # Fastify + MCP起動
```

### 本番環境

- **GitHub Actions**: 日次スクレイピング
- **Supabase**: データベース（無料枠）
- **Render/Railway**: MCPサーバーホスティング（無料枠）

## パフォーマンス目標

- API応答時間: < 200ms
- スクレイピング実行時間: < 5分
- データベースクエリ: < 50ms
- 同時接続数: 10（個人利用想定）
