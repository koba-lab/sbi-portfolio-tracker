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

Dev Container の初回起動時に、`.env.example` から `.env` が自動コピーされます。

### 認証情報の設定

生成された `.env` ファイルを編集してください：

コンテナ内で編集:

```
code .env
```

以下のプレースホルダーを実際の値に置き換え：

変更前:

```
SBI_USER=your_sbi_username
SBI_PASS=your_sbi_password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
```

変更後（実際の値）:

```
SBI_USER=actual_username
SBI_PASS=actual_password
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...actual_key
```

### コンテナの再起動

環境変数を反映させるため：

1. `.env` を保存
2. コマンドパレット: `Dev Containers: Rebuild Container`

### 注意事項

- ⚠️ `.env` ファイルは **Gitにコミットしない**
- ✅ `.env.example` はテンプレートとしてコミット
- ✅ `.gitignore` に `.env` が含まれていることを確認

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