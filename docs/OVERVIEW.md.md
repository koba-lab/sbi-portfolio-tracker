# プロジェクト概要

## 目的

SBI証券のポートフォリオデータを自動取得し、MCPサーバー経由でClaudeから参照できるようにする。

## コアバリュー

- 💼 個人が自分の証券情報を管理するためのツール
- 🏠 各自が独立してセルフホストできる設計
- 🔄 データソースを自由に差し替え可能なアーキテクチャ

## システムフロー

```
1. GitHub Actions (cron)
   ↓ 毎日定期実行
2. Playwright
   ↓ SBI証券にログイン・スクレイピング
3. Supabase PostgreSQL
   ↓ データ保存
4. MCP Server
   ↓ API経由でデータ取得
5. Claude
   ↓ ポートフォリオ情報を参照
```

## 技術スタック

### ランタイム・言語

- **Deno 2.x** - モダンなJavaScript/TypeScriptランタイム
- **TypeScript** - 型安全な開発

### ブラウザ自動化

- **Playwright** - クロスブラウザ自動化

### データベース

- **Supabase** - PostgreSQL + REST API
- 将来的に他のDBにも対応可能

### CI/CD

- **GitHub Actions** - スケジュール実行

### アーキテクチャ

- **クリーンアーキテクチャ** - レイヤー分離
- **DDD（ドメイン駆動設計）** - ビジネスロジックの明確化

## 主要なユースケース

### 1. ポートフォリオの自動同期

毎日定時にSBI証券から最新データを取得して保存

### 2. 履歴データの取得

過去のポートフォリオ推移を取得・分析

### 3. MCPサーバー経由での情報提供

Claudeからリアルタイムで証券情報を参照

## 制約事項

### 技術的制約

- SBI証券のページ構造に依存（変更されると動作しない可能性）
- スクレイピング頻度に制限あり
- GitHub Actions の実行時間制限（6時間/job）

### 法的制約

- **個人利用を前提**
- 他人の認証情報を預かる用途での使用は非推奨
- SBI証券の利用規約を遵守

### セキュリティ制約

- 認証情報は GitHub Secrets で管理
- ログに機密情報を出力禁止

## 環境変数

### 必須
```bash
SBI_USER=your_username          # SBI証券のユーザー名
SBI_PASS=your_password          # SBI証券のパスワード
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_service_role_key
```

### オプション
```bash
REPOSITORY_TYPE=supabase        # supabase | postgresql | json
DATABASE_URL=postgresql://...   # PostgreSQL接続文字列（postgresql使用時）
```