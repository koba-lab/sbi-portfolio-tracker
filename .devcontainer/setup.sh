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

# Playwright ブラウザのインストール
echo "🎭 Installing Playwright browsers..."
npx playwright install chromium
echo "  ✅ Playwright Chromium installed"

# Supabase CLIのインストール（バイナリ版）
echo "🔧 Installing Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "  Downloading Supabase CLI..."
    # アーキテクチャを判定
    ARCH=$(uname -m)
    if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
        SUPABASE_URL="https://github.com/supabase/cli/releases/latest/download/supabase_linux_arm64.tar.gz"
    else
        SUPABASE_URL="https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz"
    fi
    echo "  Detected architecture: $ARCH"
    echo "  Downloading from: $SUPABASE_URL"
    curl -fsSL "$SUPABASE_URL" | sudo tar -xz -C /usr/local/bin
    echo "  ✅ Supabase CLI installed"
else
    echo "  ✅ Supabase CLI already installed"
fi
supabase --version

echo "✨ Setup complete!"