# Dev Container 設定

このプロジェクトはDev Containerを使用して開発環境を構築します。

## 必要なもの

- Docker Desktop
- Visual Studio Code
- Dev Containers拡張機能

## 起動方法

### 1. VS Codeでリポジトリを開く

### 2. コマンドパレットを開く

`Ctrl+Shift+P` (Windows/Linux) または `Cmd+Shift+P` (Mac)

### 3. 「Dev Containers: Reopen in Container」を選択

初回は数分かかります（Dockerイメージのダウンロード + セットアップ）

## 含まれる環境

- **Deno 2.1.4** - JavaScript/TypeScriptランタイム
- **Playwright** - ブラウザ自動化（Chromium）
- **Git** - バージョン管理
- **GitHub CLI** - GitHub操作

## インストール済み拡張機能

- **Deno for VS Code** - Deno公式拡張
- **Claude Code** - AI支援開発

## 環境変数の設定

### 自動生成（初回起動時）

Dev Container の初回起動時に、以下のファイルが自動生成されます：

- `.env` （アプリケーション用） - `.env.example` からコピー
- `.devcontainer/.env` （DevContainer用） - `.devcontainer/.env.example` からコピー

### アプリケーション環境変数の設定

`.env` ファイルを編集：

```bash
code .env
```

必要な値を設定：

- `DATABASE_URL` - Supabase接続文字列（Pooler経由）
- `DATABASE_MIGRATION_URL` - Supabase接続文字列（Migration用）
- `SBI_USERNAME` - SBI証券のユーザー名
- `SBI_PASSWORD` - SBI証券のパスワード
- その他、詳細は`.env.example`参照

### DevContainer環境変数の設定

`.devcontainer/.env` ファイルを編集：

```bash
code .devcontainer/.env
```

必要に応じて設定：

- `CONTEXT7_API_KEY` - Context7 MCP APIキー
- その他DevContainer固有の環境変数

### コンテナの再起動

環境変数を反映させるため：

1. 各`.env`ファイルを保存
2. コマンドパレット: `Dev Containers: Rebuild Container`

### 注意事項

- ⚠️ `.env` と `.devcontainer/.env` は **Gitにコミットしない**
- ✅ `*.env.example` はテンプレートとしてコミット
- ✅ `.gitignore` で適切に除外されていることを確認

## 開発開始

コンテナが起動したら：

バージョン確認:

```
deno --version
```

タスク実行:

```
deno task dev
```

テスト実行:

```
deno task test
```

Lint:

```
deno task lint
```

フォーマット:

```
deno task fmt
```

## トラブルシューティング

### Playwrightが動かない

ブラウザを再インストール:

```
deno run --allow-all npm:playwright install chromium
```

### 権限エラー

init.sh, setup.sh に実行権限がない場合:

```
chmod +x .devcontainer/init.sh
chmod +x .devcontainer/setup.sh
```

### コンテナを再ビルド

1. コマンドパレット: `Dev Containers: Rebuild Container`
2. または: `Dev Containers: Rebuild Container Without Cache`

## Claude Code の使い方

コンテナ起動後、Claude Code拡張が自動的に有効になります：

1. サイドバーのClaude Codeアイコンをクリック
2. APIキーを設定（初回のみ）
3. チャットで開発タスクを指示

例:

```
CLAUDE.md と docs/ を読んで、Domain Layer から実装を始めてください
```

## ポート転送

- **8000**: アプリケーションのデフォルトポート

ローカルから `http://localhost:8000` でアクセス可能
