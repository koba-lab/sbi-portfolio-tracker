# 開発ガイドライン

## コーディング規約

### 命名規則
```typescript
// クラス名: PascalCase
class PortfolioRepository {}
class SyncPortfolioUseCase {}

// 関数名・変数名: camelCase
const getUserPortfolio = () => {};
const totalValue = 100;

// 定数: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT_MS = 30000;

// インターフェース: PascalCase（I プレフィックス不要）
interface PortfolioRepository {}  // ✅
interface IPortfolioRepository {} // ❌

// 型エイリアス: PascalCase
type RepositoryType = 'supabase' | 'postgresql' | 'json';

// プライベートメソッド: 先頭に _ は不要
class Portfolio {
  private validate() {}  // ✅
  private _validate() {} // ❌
}
```

### 型の使い方
```typescript
// any は禁止、unknown を使用
const data: any = {};      // ❌
const data: unknown = {};  // ✅

// null と undefined を明確に区別
interface User {
  name: string;
  email: string | null;      // 明示的に null を許可
  phone?: string;            // undefined（オプション）
}

// アサーション（!）は最小限に
const value = data!.value;              // ❌ できるだけ避ける
const value = data?.value ?? 'default'; // ✅

// 配列・オブジェクトの型定義
const holdings: Holding[] = [];  // ✅
const holdings: Array<Holding>;  // ✅ どちらでもOK

// Record 型の活用
const config: Record<string, string> = {
  supabase: 'url',
  postgresql: 'connection_string',
};
```

### インポートの順序
```typescript
// 1. 標準ライブラリ・外部ライブラリ
import { createClient } from 'npm:@supabase/supabase-js@2';
import { chromium } from 'npm:playwright';

// 2. Domain Layer
import { Portfolio } from '../../domain/entities/Portfolio.ts';
import { Holding } from '../../domain/entities/Holding.ts';

// 3. Application Layer
import { SyncPortfolioUseCase } from '../../application/usecases/SyncPortfolioUseCase.ts';

// 4. Infrastructure Layer
import { SupabasePortfolioRepository } from '../repositories/SupabasePortfolioRepository.ts';

// 5. 型定義のみのインポート
import type { PortfolioRepository } from '../../domain/repositories/PortfolioRepository.ts';
```

### コメント
```typescript
// public メソッドには必ずコメント
/**
 * ポートフォリオを保存する
 * @param portfolio 保存するポートフォリオ
 * @throws {Error} 保存に失敗した場合
 */
async save(portfolio: Portfolio): Promise<void> {
  // 実装
}

// private メソッドはコメント任意（複雑な場合は推奨）
private mapToPortfolio(data: any): Portfolio {
  // DB Record → Domain Entity への変換
}

// TODO コメントを活用
// TODO: エラーハンドリングを改善する
// FIXME: パフォーマンス問題あり
```

## テストの書き方

### テストファイルの配置

```
tests/
├── domain/
│   ├── entities/
│   │   ├── Portfolio.test.ts
│   │   └── Holding.test.ts
│   └── valueObjects/
│       └── Credentials.test.ts
├── application/
│   └── usecases/
│       └── SyncPortfolioUseCase.test.ts
└── infrastructure/
    └── repositories/
        └── SupabasePortfolioRepository.test.ts
```

### テストの書き方
```typescript
// tests/domain/entities/Portfolio.test.ts
import { assertEquals, assertThrows } from 'jsr:@std/assert';
import { describe, it } from 'jsr:@std/testing/bdd';
import { Portfolio } from '../../../src/domain/entities/Portfolio.ts';
import { Holding } from '../../../src/domain/entities/Holding.ts';

describe('Portfolio', () => {
  describe('constructor', () => {
    it('正常にインスタンスを作成できる', () => {
      const holdings = [
        new Holding('7203', 'トヨタ自動車', 100, 2500),
      ];
      const portfolio = new Portfolio('user1', holdings, new Date());
      
      assertEquals(portfolio.userId, 'user1');
      assertEquals(portfolio.holdings.length, 1);
    });
  });

  describe('totalValue', () => {
    it('全保有銘柄の合計評価額を計算できる', () => {
      const holdings = [
        new Holding('7203', 'トヨタ自動車', 100, 2500),    // 250,000
        new Holding('9984', 'ソフトバンクG', 50, 6000),     // 300,000
      ];
      const portfolio = new Portfolio('user1', holdings, new Date());
      
      assertEquals(portfolio.totalValue, 550000);
    });

    it('銘柄がない場合は0を返す', () => {
      const portfolio = new Portfolio('user1', [], new Date());
      
      assertEquals(portfolio.totalValue, 0);
    });
  });

  describe('addHolding', () => {
    it('新しい銘柄を追加した新しいPortfolioを返す', () => {
      const original = new Portfolio('user1', [], new Date());
      const newHolding = new Holding('7203', 'トヨタ自動車', 100, 2500);
      
      const updated = original.addHolding(newHolding);
      
      assertEquals(original.holdings.length, 0);  // 元は変更されない
      assertEquals(updated.holdings.length, 1);   // 新しいインスタンス
    });
  });
});
```

### モックの使い方
```typescript
// tests/application/usecases/SyncPortfolioUseCase.test.ts
import { spy } from 'jsr:@std/testing/mock';
import type { PortfolioRepository } from '../../../src/domain/repositories/PortfolioRepository.ts';
import type { ScrapingService } from '../../../src/domain/repositories/ScrapingService.ts';

describe('SyncPortfolioUseCase', () => {
  it('スクレイピング後にリポジトリに保存する', async () => {
    // モックリポジトリ
    const mockRepository: PortfolioRepository = {
      save: spy(async () => {}),
      findLatest: spy(async () => null),
      findByDateRange: spy(async () => []),
      delete: spy(async () => {}),
    };

    // モックスクレイパー
    const mockScraper: ScrapingService = {
      scrape: spy(async () => 
        new Portfolio('user1', [], new Date())
      ),
    };

    const useCase = new SyncPortfolioUseCase(mockRepository, mockScraper);
    await useCase.execute(credentials);

    // save が呼ばれたことを確認
    assertEquals(mockRepository.save.calls.length, 1);
  });
});
```

### テストの実行
```bash
# すべてのテストを実行
deno test --allow-all

# 特定のファイルのみ
deno test tests/domain/entities/Portfolio.test.ts --allow-all

# カバレッジ付き
deno test --allow-all --coverage=coverage

# カバレッジレポート生成
deno coverage coverage --lcov > coverage.lcov
```

## Git ワークフロー（GitHub Flow）

### ブランチ戦略

```
main                                    # 常にデプロイ可能な状態
  ├─ feature/add-portfolio-entity       # 新機能
  ├─ feature/implement-scraper          # 新機能
  ├─ fix/scraping-timeout               # バグ修正
  └─ docs/update-architecture           # ドキュメント
```

**ルール**:

- `main` ブランチは常にデプロイ可能
- すべての作業は `main` から分岐
- 完成したら Pull Request を作成
- レビュー後に `main` にマージ
- マージしたらすぐにデプロイ可能

### ブランチ命名規則

```bash
# 新機能
feature/short-description

# バグ修正
fix/bug-description

# ドキュメント
docs/update-readme

# リファクタリング
refactor/improve-error-handling

# その他
chore/update-dependencies
```

### コミットメッセージ

**フォーマット**:

```
type(scope): subject

body (optional)
```

**type の種類**:

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: その他（依存関係更新など）

**例**:

```bash
# 良い例
feat(domain): add Portfolio entity

Portfolioエンティティを追加
- totalValueの計算メソッドを実装
- addHoldingメソッドを実装

# 悪い例
add portfolio  # ❌ type と scope がない
feat: 色々修正  # ❌ 具体性がない
```

### 作業フロー

```bash
# 1. main から feature ブランチを作成
git checkout main
git pull origin main
git checkout -b feature/add-portfolio-entity

# 2. 実装・コミット
git add src/domain/entities/Portfolio.ts
git commit -m "feat(domain): add Portfolio entity"

# 3. テスト追加
git add tests/domain/entities/Portfolio.test.ts
git commit -m "test(domain): add Portfolio entity tests"

# 4. 定期的に main の変更を取り込む（コンフリクト防止）
git checkout main
git pull origin main
git checkout feature/add-portfolio-entity
git rebase main  # または git merge main

# 5. Push
git push origin feature/add-portfolio-entity

# 6. GitHub で Pull Request 作成
# - Base: main
# - Compare: feature/add-portfolio-entity
# - レビュアーをアサイン（個人開発なら省略可）

# 7. マージ後、ブランチ削除
git checkout main
git pull origin main
git branch -d feature/add-portfolio-entity
```

### Pull Request のチェックリスト

- [ ]  テストがすべて通る（`deno test`）
- [ ]  Lint エラーがない（`deno lint`）
- [ ]  フォーマット済み（`deno fmt`）
- [ ]  型チェック通過（`deno check src/**/*.ts`）
- [ ]  コミットメッセージが規約に従っている
- [ ]  関連するドキュメントを更新した
- [ ]  `main` の最新変更を取り込んだ

### マージ戦略

**Squash and Merge を推奨**:

- 複数のコミットを1つにまとめる
- `main` の履歴がクリーンに保たれる
```bash
# GitHub の "Squash and merge" ボタンを使用
# または CLI で:
git checkout main
git merge --squash feature/add-portfolio-entity
git commit -m "feat(domain): add Portfolio entity"
```

### コミット前のチェック
```bash
# フォーマット
deno fmt

# Lint
deno lint

# 型チェック
deno check src/**/*.ts

# テスト
deno test --allow-all
```

### ホットフィックス（緊急のバグ修正）
```bash
# main から直接分岐
git checkout main
git pull origin main
git checkout -b fix/critical-bug

# 修正してすぐに PR
git add .
git commit -m "fix: resolve critical bug"
git push origin fix/critical-bug

# レビューを最小限にして即マージ
```