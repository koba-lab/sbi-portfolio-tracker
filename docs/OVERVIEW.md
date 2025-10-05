# プロジェクト概要

## 目的

SBI証券のポートフォリオデータを自動取得し、MCPサーバー経由でClaudeから参照できるようにすることで、AIによる資産形成戦略の立案を支援する。

## 主要機能

- **データ収集**: SBI証券から日次でポートフォリオデータを自動取得（株式・投資信託・海外株式）
- **データ提供**: MCPサーバー経由でClaudeに情報提供、リモートアクセス対応
- **分析支援**: 評価額・損益確認、リスクレベル評価、資産配分の可視化

## システム構成

```
GitHub Actions (日次)
   ↓ Playwright
SBI証券
   ↓ スクレイピング
Supabase PostgreSQL
   ↓ Prisma ORM
Fastify + MCP Server
   ↓ API認証
Claude
```

## 技術スタック

| カテゴリ           | 技術選定                 |
| ------------------ | ------------------------ |
| Runtime            | Deno 2.x                 |
| Web Framework      | Fastify                  |
| DI Container       | TSyringe                 |
| ORM                | Prisma 6.x               |
| Database           | Supabase PostgreSQL      |
| Browser Automation | Playwright               |
| Architecture       | Clean Architecture + DDD |

## ユースケース

### AIとの連携

- 「現在のポートフォリオを教えて」→ 最新情報を取得
- 「リスク分析して」→ 集中度や損益率を分析
- 「投資戦略を提案して」→ 過去データを基にAIが提案
- 「関連ニュースを調べて」→ 保有銘柄のニュース取得

## 環境変数

### 必須

```bash
# Database
DATABASE_URL=...                  # Pooler経由接続
DATABASE_MIGRATION_URL=...        # マイグレーション用直接接続

# SBI証券
SBI_USERNAME=...
SBI_PASSWORD=...

# MCP認証（リモートアクセス用）
MCP_API_KEY=...
```

## 制約事項

- **個人利用前提**: セルフホスト環境での運用
- **更新頻度**: 日次更新（リアルタイムではない）
- **依存性**: SBI証券のサイト構造に依存

## ロードマップ

- Phase 1: 基本機能実装（現在）
- Phase 2: Value Object導入、ニュース連携強化
- Phase 3: Domain Event、他証券対応
