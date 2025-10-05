# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SBI証券のポートフォリオデータを自動取得し、MCPサーバー経由でClaudeから参照できるようにするシステム。Clean Architecture + 段階的DDDで構築。

### Tech Stack

- **Runtime**: Deno 2.x
- **Framework**: Fastify + TSyringe (DI)
- **ORM**: Prisma 6.x
- **Database**: Supabase PostgreSQL
- **Browser Automation**: Playwright
- **Architecture**: Clean Architecture + 段階的DDD

## Common Commands

### Development
```bash
deno task dev              # Start Fastify development server
deno task scrape          # Run SBI scraper CLI
```

### Testing
```bash
deno task test                # Run all tests (.env.test環境変数を使用)
deno task test:watch         # Watch mode
deno task test:unit          # Unit tests only
deno task test:integration   # Integration tests only
deno task test:coverage      # With coverage report
```

### Database
```bash
deno task db:generate        # Generate Prisma client
deno task db:migrate         # Reset local DB with migrations
deno task db:migrate:apply   # Push schema to remote DB
deno task db:pull            # Pull schema from remote DB
deno task db:studio          # Open Prisma Studio
deno task db:test:setup      # Setup test DB (.env.test使用)
```

### Code Quality
```bash
deno task lint              # Run linter
deno task fmt               # Format code
```

## Architecture

### Layer Structure (Clean Architecture)

```
Presentation → Application → Domain ← Infrastructure
                                ↑
                          (依存性の逆転)
```

- **Domain**: 純粋TypeScript（外部依存なし）。Entity, Repository/Service Interface
- **Application**: UseCase実装。TSyringeでDI
- **Infrastructure**: Prisma, Playwright等の技術的実装
- **Presentation**: Fastify Server, MCP Server, CLI

### Key Directory Structure

```
src/
├── domain/              # ビジネスロジック（純粋TS）
│   ├── entities/       # Portfolio, Holding, Stock等
│   ├── repositories/   # Repository Interface
│   └── services/       # Domain Service Interface
├── application/
│   └── usecases/       # SyncPortfolio, GetPortfolio等
├── infrastructure/
│   ├── config/         # DIContainer.ts（TSyringe設定）
│   ├── prisma/         # schema.prisma, generated/
│   ├── repositories/   # Prisma実装
│   └── scraping/       # Playwright実装
└── presentation/
    ├── server/         # Fastify (index.ts, routes/, plugins/)
    ├── mcp/           # MCP Server
    └── cli/           # GitHub Actions用CLI
```

## Development Guidelines

### Documentation-Driven Development

**実装前に必ずdocs/以下を確認**:
1. `docs/OVERVIEW.md` - プロジェクト目的
2. `docs/ARCHITECTURE.md` - システム設計
3. `docs/DECISIONS.md` - 技術選定の背景
4. `docs/DOMAIN_MODEL.md` - ビジネスロジック
5. `docs/INFRASTRUCTURE.md` - 技術実装詳細

仕様書と実装に差異がある場合は実装前に確認を求める。

### Coding Rules

- **型安全性**: `any`禁止 → `unknown`使用
- **外部ライブラリ**: `npm:`プレフィックス必須
- **Domain層**: 純粋TypeScript（Prisma等の依存禁止）
- **インポート制限**: 各レイヤーの依存関係ルールを遵守（ARCHITECTURE.md参照）

### Progressive Complexity

- Phase 1: 動く最小限の実装
- Phase 2: 必要に応じた改善
- Phase 3: 高度な最適化

**過度な先取り設計を避ける**。Value Object、Domain Eventは将来のPhaseで導入。

### Communication Style

- **簡潔に**: コードで分かることは説明しない
- **要点のみ**: 「なぜ」「何を」を重視、実装詳細の羅列は避ける
- **確認を求める**: 大きな変更や仕様解釈が必要な場合

## Important Notes

### Deno-Specific

- 基本的に`deno task`を使用、`npx`は最小限（Supabase CLI等）
- タスク名は実装技術を隠蔽（`db:migrate` not `supabase:migrate`）
- ファイル生成はCLIコマンド使用（手動作成禁止）

### Testing

- テストファイルは`tests/`配下に配置（`src/`内に`.test.ts`作らない）
- 環境変数: `.env.test`を使用（`env`コマンドで注入）
- DB接続: `postgres-test:5432`（CI/ローカル両対応）

### Environment Variables

- Denoの`--env-file`は既存環境変数を上書きしない仕様
- DevContainerの`env_file`が既存環境変数を設定するため注意
- 優先順位: 既存 > --env-file > デフォルト

## Project-Specific Context

- **個人利用前提**: セルフホスト環境、無料枠重視
- **学習目的**: DDDの段階的習得も目的の一つ
- **依存性**: SBI証券サイト構造に依存（スクレイピング）

---

<!-- FEEDBACK_LOG -->
<!-- 2024-10-05: 初版作成 - 今回の会話を基に基本ルール策定 -->
<!-- 2025-01-05: 【重要】Denoプロジェクトでは基本的にdeno taskを使用、npxは最小限に -->
<!-- 2025-01-05: 【重要】タスク名は実装技術を隠蔽する（×supabase:migrate → ○db:migrate） -->
<!-- 2025-01-05: 【重要】ファイル生成は必ずCLIコマンドを使用（手動作成禁止） -->
<!-- 2025-01-05: 【重要】実装前に必ずドキュメントを確認（思い込み禁止） -->
<!-- 2025-01-05: 【重要】ドメインモデルとDB設計の整合性を常に確認 -->
<!-- 2025-01-05: 【反省】同じミスを繰り返している - このログを必ず確認すること -->

<!-- ===== Deno環境変数とテストの教訓 ===== -->
<!-- 2025-01-05: 【教訓】Denoの--env-fileは既存環境変数を上書きしない仕様 -->
<!-- 2025-01-05: 【教訓】DevContainerのenv_fileが既存環境変数を設定するため注意 -->
<!-- 2025-01-05: 【解決】envコマンドで.env.testを注入する方法を採用 -->
<!-- 2025-01-05: 【重要】コマンドオプションの正確な名前を確認（--env → --env-file） -->
<!-- 2025-01-05: 【重要】環境変数の優先順位：既存 > --env-file > デフォルト -->
<!-- 2025-01-05: 【重要】GitHub Actionsでサービス名を使うにはcontainer実行が必要 -->
<!-- 2025-01-05: 【重要】ドキュメントの公式仕様を必ず確認、推測で実装しない -->
<!-- 2025-01-05: 【重要】テストではpostgres-test:5432で統一（CI/ローカル両対応） -->

<!-- ===== テスト構造の教訓 ===== -->
<!-- 2025-01-05: 【教訓】テストファイルはtests/配下に統一、src/内にテストを作らない -->
<!-- 2025-01-05: 【重要】問題が発生したら必ず教訓をCLAUDE.mdに記録し、次回に活かす -->
<!-- 2025-01-05: 【反省】エラー修正時は原因と対策を必ずドキュメントに残す -->

<!-- ===== ファイル削除の教訓 ===== -->
<!-- 2025-01-05: 【重要】ファイルを削除する前に必ず中身を確認する -->
<!-- 2025-01-05: 【重要】package.jsonはnpxコマンド（supabase CLI等）で必要 -->
<!-- 2025-01-05: 【重要】Denoプロジェクトでもnode_modulesが必要な場合がある -->
<!-- 2025-01-05: 【教訓】削除前に必ず：1.中身確認 2.使用箇所検索 3.影響調査 -->
<!-- FEEDBACK_LOG_END -->
