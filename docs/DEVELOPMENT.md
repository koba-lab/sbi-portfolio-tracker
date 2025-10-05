# 開発ガイド

## 環境構築

### 必要なツール
- Deno 2.x
- Docker (Supabase Local用)
- Git

### セットアップ
```bash
# リポジトリクローン
git clone https://github.com/yourusername/sbi-portfolio-tracker
cd sbi-portfolio-tracker

# 環境変数設定
cp .env.example .env
# DevContainer使用時は以下も必要
cp .devcontainer/.env.example .devcontainer/.env
# 各.envファイルを編集

# 依存関係インストール
deno cache src/main.ts

# Prisma設定
deno task db:generate
deno task db:push
```

## 開発コマンド

### deno.json タスク
```json
{
  "tasks": {
    "dev": "deno run -A --watch src/presentation/fastify/server.ts",
    "scrape": "deno run -A src/presentation/cli/scraper.ts",
    "test": "deno test -A",
    "lint": "deno lint",
    "fmt": "deno fmt",
    "db:generate": "deno run -A npm:prisma generate",
    "db:push": "deno run -A npm:prisma db push",
    "db:migrate": "deno run -A npm:prisma migrate dev"
  }
}
```

## コーディング規約

### 基本方針
- TypeScriptの型を最大限活用
- any型の使用禁止（unknown推奨）
- エラーは適切に型付けして処理

### 命名規則
- ファイル名: PascalCase（クラス）、camelCase（その他）
- クラス/インターフェース: PascalCase
- 変数/関数: camelCase
- 定数: UPPER_SNAKE_CASE

### インポート順序
1. 外部ライブラリ
2. Domain層
3. Application層
4. Infrastructure層
5. 相対パス

## Git運用

### ブランチ戦略
- `main`: 本番環境
- `feature/*`: 新機能
- `fix/*`: バグ修正
- `docs/*`: ドキュメント

### コミットメッセージ
```
type(scope): subject

- feat: 新機能
- fix: バグ修正
- docs: ドキュメント
- refactor: リファクタリング
- test: テスト
- chore: その他
```

## テスト

### テストファイル配置
```
src/
└── domain/
    ├── entities/
    │   ├── Portfolio.ts
    │   └── Portfolio.test.ts  # 同じディレクトリに配置
```

### 実行方法
```bash
# 全テスト実行
deno task test

# 特定ファイルのみ
deno test src/domain/entities/Portfolio.test.ts

# カバレッジ付き
deno test --coverage
```

## デバッグ

### VSCode設定
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Deno",
      "runtimeExecutable": "deno",
      "runtimeArgs": ["run", "-A", "--inspect-brk"],
      "program": "${workspaceFolder}/src/presentation/fastify/server.ts",
      "attachSimplePort": 9229
    }
  ]
}
```

### ログレベル
環境変数`LOG_LEVEL`で制御：
- `debug`: 詳細ログ
- `info`: 通常ログ
- `warn`: 警告のみ
- `error`: エラーのみ

## リリースフロー

1. feature/fixブランチで開発
2. Pull Request作成
3. テスト通過確認
4. mainにマージ
5. GitHub Actionsで自動デプロイ

## トラブルシューティング

### よくある問題

**Prisma生成エラー**
```bash
# キャッシュクリア
rm -rf src/infrastructure/prisma/generated
deno task db:generate
```

**Denoキャッシュ問題**
```bash
# キャッシュクリア
deno cache --reload src/main.ts
```

**Playwrightエラー**
```bash
# ブラウザバイナリインストール
deno run -A npm:playwright install chromium
```