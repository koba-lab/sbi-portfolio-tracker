#!/bin/bash

echo "🚀 Setting up development environment (running in container)..."

# Deno権限の確認
echo "✅ Deno version:"
deno --version

# Claude Code関連のディレクトリを作成
echo "📁 Creating directories for Claude Code..."
if [ ! -d "/commandhistory" ]; then
    mkdir /commandhistory && touch /commandhistory/.bash_history && chown -R vscode /commandhistory
else
    echo "/commandhistory already exists, skipping creation."
fi
if [ ! -d "/home/vscode/.claude" ]; then
    mkdir -p /home/vscode/.claude && chown -R vscode:vscode /home/vscode/.claude
else
    echo "/home/vscode/.claude already exists, skipping creation."
fi

# 環境変数のチェック（プレースホルダーが残っていないか）
if [ -f .env ]; then
    if grep -q "your_sbi_username\|your_project.supabase.co" .env; then
        echo ""
        echo "⚠️  WARNING: .env contains placeholder values!"
        echo "   Please update .env with your actual credentials before running the app."
        echo ""
    fi
fi

# npm依存関係のインストール
if [ -f "package.json" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

echo "✨ Setup complete!"