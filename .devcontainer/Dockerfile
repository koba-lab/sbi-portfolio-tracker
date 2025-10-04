FROM mcr.microsoft.com/devcontainers/base:debian

# Denoをグローバルにインストール
ARG DENO_VERSION=2.5.3
RUN curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh && \
    chmod -R 755 /usr/local/bin/deno
ENV DENO_INSTALL="/usr/local"
ENV PATH="$DENO_INSTALL/bin:$PATH"

# Playwrightのシステム依存ライブラリをインストール
# 注: playwrightパッケージ自体はpostCreateCommandでnpm installされる
RUN apt-get update && apt-get install -y \
    libglib2.0-0t64 \
    libnspr4 \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0t64 \
    libatk-bridge2.0-0t64 \
    libcups2t64 \
    libdrm2 \
    libxcb1 \
    libxkbcommon0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libcairo2 \
    libpango-1.0-0 \
    libatspi2.0-0t64 \
    && rm -rf /var/lib/apt/lists/*

# Claude Codeをdevcontainerで使うための設定
ARG USERNAME=vscode

RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
  && mkdir /commandhistory \
  && touch /commandhistory/.bash_history \
  && chown -R $USERNAME /commandhistory

# Create workspace and config directories and set permissions
RUN mkdir -p /home/vscode/.claude && \
  chown -R vscode:vscode /home/vscode/.claude
