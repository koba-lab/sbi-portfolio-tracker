# SBI証券ポートフォリオトラッカー

このプロジェクトは、SBI証券のポートフォリオデータを自動取得し、MCPサーバー経由でClaudeから参照できるようにするツールです。

## 技術スタック

- **Runtime**: Deno 2.x
- **Language**: TypeScript
- **Browser Automation**: Playwright
- **Database**: Supabase (PostgreSQL)
- **CI/CD**: GitHub Actions
- **Architecture**: クリーンアーキテクチャ + DDD

## 重要なドキュメント

開発前に必ず読んでください：

1. `docs/OVERVIEW.md` - プロジェクト概要と目的
2. `docs/ARCHITECTURE.md` - システム構成とレイヤー設計
3. `docs/DOMAIN_MODEL.md` - ドメインモデルの詳細仕様
4. `docs/INFRASTRUCTURE.md` - インフラ層の実装ガイド
5. `docs/DEVELOPMENT.md` - 開発ガイドラインとコーディング規約

## 実装順序

**必ずこの順序で実装してください：**

1. **Domain Layer** - Entity, ValueObject, Interface
2. **Application Layer** - UseCase
3. **Infrastructure Layer** - Repository実装, Scraper実装
4. **Presentation Layer** - エントリーポイント

## アーキテクチャルール

### 依存関係

```
Presentation -> Application -> Domain <- Infrastructure
```

- ✅ Infrastructure から Domain への依存: OK
- ❌ Domain から Infrastructure への依存: 禁止
- 依存性注入を使って疎結合を保つ

### Domain Layer の制約

- 外部ライブラリのインポート禁止
- 純粋なビジネスロジックのみ
- インターフェースのみ定義、実装は Infrastructure

## 禁止事項

- ❌ Domain Layer に外部ライブラリをインポート
- ❌ `any` 型の使用（`unknown` を使用）
- ❌ 認証情報のハードコード
- ❌ `console.log` での機密情報出力

## Deno 固有のルール

```typescript
// npm パッケージは npm: プレフィックス必須
import { chromium } from 'npm:playwright';
import { createClient } from 'npm:@supabase/supabase-js@2';
```

```bash
# deno.json のタスクを活用
deno task dev
deno task test
deno task lint
```