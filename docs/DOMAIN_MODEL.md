# ドメインモデル仕様

## 概要

SBI証券から取得したポートフォリオデータをドメインモデルとして表現する。

## Entity構成

```
Portfolio
  └── Holding[]
      ├── Stock          # 国内株式
      ├── MutualFund     # 投資信託
      └── ForeignStock   # 海外株式
```

## Entity概要

| Entity       | 役割               | 主要な情報                                     |
| ------------ | ------------------ | ---------------------------------------------- |
| Portfolio    | ポートフォリオ全体 | ユーザーID、保有資産リスト、総評価額、更新日時 |
| Holding      | 保有資産（基底）   | 銘柄コード、銘柄名、数量、取得単価、現在価格   |
| Stock        | 国内株式           | 市場区分、配当利回り                           |
| MutualFund   | 投資信託           | カテゴリ、信託報酬、NISA対象                   |
| ForeignStock | 海外株式           | 国、通貨、為替レート、現地価格                 |

## Repository Interface

| Interface           | 役割                         |
| ------------------- | ---------------------------- |
| PortfolioRepository | ポートフォリオの永続化・取得 |
| NewsRepository      | 関連ニュースの取得           |

## Service Interface

| Interface       | 役割                    |
| --------------- | ----------------------- |
| ScrapingService | SBI証券からのデータ取得 |

## ビジネスルール

- 保有数量は正の数
- リスクレベルは集中度で判定（50%超:HIGH、30%超:MEDIUM）
- 投資信託は10,000口単位で計算
- 海外株式は円建て・現地通貨建て両方を管理

## 拡張計画

- Phase 1: 基本Entity（現在）
- Phase 2: Value Object追加
- Phase 3: Domain Event導入
