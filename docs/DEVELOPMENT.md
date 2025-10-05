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

### 主要なタスク
```bash
# 開発サーバー起動
deno task dev

# テスト実行
deno task test

# DBセットアップ
deno task db:generate  # Prismaクライアント生成
deno task db:push      # スキーマ反映
deno task db:migrate   # マイグレーション

# テスト用DBセットアップ
deno task db:test:setup

# その他
deno task lint         # リンター
deno task fmt          # フォーマッター
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

### テスト環境
- **ローカル**: DevContainer内のPostgreSQL（localhost:5432）
- **CI**: GitHub ActionsのPostgreSQLサービス

### テストファイル配置
```
src/
├── domain/
│   └── entities/
│       ├── Holding.ts
│       └── Holding.test.ts      # ユニットテスト
└── tests/
    └── integration/
        └── api.test.ts          # 統合テスト
```

### セットアップ
```bash
# DevContainerを使用している場合、PostgreSQLは自動起動
# テスト用DBのセットアップ
deno task db:test:setup
```

### 実行方法
```bash
# 全テスト実行
deno task test

# ユニットテストのみ
deno task test:unit

# 統合テストのみ
deno task test:integration

# カバレッジ付き
deno task test:coverage

# ファイル監視モード
deno task test:watch
```

### テスト用環境変数
`.env.test`にテスト用の設定が記載されています：
- `DATABASE_URL`: localhost:5432のPostgreSQL
- その他: ダミー値で設定済み

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
      "program": "${workspaceFolder}/src/presentation/server/index.ts",
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