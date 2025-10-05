# 技術選定の背景（Architecture Decision Records）

## なぜこの技術スタックなのか

本ドキュメントでは、技術選定に至った議論と決定理由を記録します。

## 1. Runtime: Deno 2.x

### 検討した選択肢
- Node.js
- Deno
- Bun

### 決定理由
- Supabase Edge FunctionsがDeno互換
- TypeScript標準サポート（設定不要）
- セキュリティ（デフォルトでサンドボックス）
- npm互換性（Deno 2でNode.jsパッケージ使用可能）

### 議論の経緯
当初Node.jsも検討したが、Supabaseとの親和性とTypeScriptの扱いやすさからDenoを選択。「せっかくなので新しい技術に慣れたい」という学習意欲も後押し。

## 2. Web Framework: Fastify + DI Container: TSyringe

### 検討した選択肢
- NestJS（DI内蔵、重い）
- Fastify + TSyringe（軽量、柔軟）
- Hono（超軽量、DI無し）

### 決定理由
- **NestJSは重い**: オーバーヘッドが大きく、MCPサーバーには過剰
- **Fastifyは高速**: パフォーマンス重視
- **TSyringeで拡張性確保**: Microsoft製、軽量、Deno対応確認済み

### 議論の経緯
「Laravelのような全部入りフレームワーク」としてNestJSも検討したが、「重いのは嫌」という要件からFastify+TSyringeの組み合わせを選択。

## 3. ORM: Prisma 6.x

### 検討した選択肢
- Prisma（モダン、人気）
- Drizzle（新興、高速）
- Kysely（SQLビルダー）
- 生SQL

### 決定理由
- 型安全性が高い
- マイグレーション機能充実
- Deno 2サポート（6.x以降）
- Supabase完全対応
- 「イケてる技術」として広く認知

## 4. Architecture: Clean Architecture + 段階的DDD

### 検討した選択肢
- 単純なMVCパターン
- 完全なDDD
- 実用的な妥協案

### 決定理由
- **段階的に複雑性を導入**: 最初はシンプル、必要に応じて深化
- **DDDのベストプラクティスを学習**: 「このプロジェクトを通じて勉強したい」
- **保守性と拡張性**: Repository PatternでORM変更に対応

### 議論の経緯
当初は純粋なDDDを目指したが、「細かい実装まで書き出すとメンテナンス工数が爆上がり」という現実的な観点から、段階的アプローチを採用。

## 5. DI戦略

### 重要な議論
「DIがあればFactoryは不要」という認識の統一：
- FactoryはRuntime時の動的切り替え用（例：支払い方法の選択）
- ORM切り替えは静的な設定変更でDIコンテナで対応

### 依存性の逆転原則
- Domain層は純粋（外部依存なし）
- Application層はDomain層のみ参照
- Infrastructure層がDomainインターフェースを実装
- Presentation層で組み立て

## 6. 環境変数命名

### DATABASE_MIGRATION_URL
- Prismaデフォルトの`DIRECT_URL`は分かりにくい
- 用途を明確にするため`DATABASE_MIGRATION_URL`を採用

## 7. ドキュメント方針

### 決定事項
- **実装詳細は書かない**: 「コードを見れば分かる」
- **メソッド列挙しない**: 「増減時の更新が面倒」
- **概念レベルに留める**: What/Whyを中心に記載

### 理由
仕様書駆動開発において、ドキュメントメンテナンスの負担を最小化しつつ、重要な決定事項と理由を残すため。

## 8. データベースマイグレーション戦略

### 決定：Supabase CLI による自動マイグレーション

#### 運用フロー
```bash
# 1. 新しいマイグレーション作成
supabase migration new create_portfolios_table

# 2. ローカルDBに適用
supabase db reset

# 3. Prismaスキーマを同期
deno task prisma:pull

# 4. 本番環境へデプロイ（CI/CD）
supabase db push --project-ref $SUPABASE_PROJECT_REF
```

#### Prismaの役割
- ORMとしてのみ使用（マイグレーションはSupabase CLI）
- `prisma db pull`で既存DBからスキーマ取得
- `prisma generate`で型生成

## 9. 将来の技術変更シナリオ

### ORM変更（Prisma → Drizzle）
- RepositoryインターフェースはDomain層で維持
- Infrastructure層の実装のみ変更
- DIコンテナの設定を1行変更

### Runtime変更（Deno → Node.js）
- package.jsonへの移行
- importパスの調整
- 基本的なアーキテクチャは維持可能

## まとめ

本プロジェクトの技術選定は以下の価値観に基づく：

1. **実用性**: 過度に複雑にしない
2. **学習機会**: DDDやDenoなど新しい技術への挑戦
3. **保守性**: ドキュメント負担の最小化
4. **拡張性**: 将来の変更に対応できる設計

これらのバランスを取った結果が現在の技術スタックである。