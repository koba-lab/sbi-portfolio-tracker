#!/bin/bash

echo "🔧 Initializing (running on host)..."

# .env ファイルの生成（ホスト側で実行）
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."

    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created"
        echo ""
        echo "⚠️  Please edit .env file with your actual credentials after container starts"
        echo ""
    else
        echo "❌ Error: .env.example not found"
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

# .devcontainer/.env ファイルの生成
if [ ! -f .devcontainer/.env ]; then
    echo "📝 Creating .devcontainer/.env file from .devcontainer/.env.example..."

    if [ -f .devcontainer/.env.example ]; then
        cp .devcontainer/.env.example .devcontainer/.env
        echo "✅ .devcontainer/.env file created"
        echo ""
        echo "⚠️  Please edit .devcontainer/.env file with your DevContainer environment variables"
        echo ""
    else
        echo "⚠️  Warning: .devcontainer/.env.example not found, skipping devcontainer env setup"
    fi
else
    echo "✅ .devcontainer/.env file already exists"
fi