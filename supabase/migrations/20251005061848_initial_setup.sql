-- 資産種別ENUM型
CREATE TYPE asset_type AS ENUM ('stock', 'mutual_fund', 'foreign_stock');

-- ポートフォリオスナップショットテーブル（SBI証券から取得した保有資産データ）
CREATE TABLE portfolio_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker_code VARCHAR(20) NOT NULL,
  name TEXT NOT NULL,
  asset_type asset_type NOT NULL,
  quantity DECIMAL(15, 4) NOT NULL CHECK (quantity > 0),
  acquisition_price DECIMAL(15, 2) NOT NULL,
  current_price DECIMAL(15, 2) NOT NULL,
  market_value DECIMAL(15, 2) NOT NULL,
  profit_loss DECIMAL(15, 2) NOT NULL,
  profit_loss_rate DECIMAL(8, 2),
  additional_info JSONB, -- 資産種別固有の追加情報をJSON形式で格納
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- コメント
COMMENT ON TABLE portfolio_snapshots IS 'SBI証券から取得したポートフォリオスナップショット';
COMMENT ON COLUMN portfolio_snapshots.ticker_code IS '証券コード';
COMMENT ON COLUMN portfolio_snapshots.name IS '銘柄名';
COMMENT ON COLUMN portfolio_snapshots.asset_type IS '資産種別';
COMMENT ON COLUMN portfolio_snapshots.quantity IS '保有数量';
COMMENT ON COLUMN portfolio_snapshots.acquisition_price IS '取得単価';
COMMENT ON COLUMN portfolio_snapshots.current_price IS '現在値';
COMMENT ON COLUMN portfolio_snapshots.market_value IS '評価額';
COMMENT ON COLUMN portfolio_snapshots.profit_loss IS '評価損益';
COMMENT ON COLUMN portfolio_snapshots.profit_loss_rate IS '評価損益率';
COMMENT ON COLUMN portfolio_snapshots.additional_info IS '資産種別固有の追加情報（JSONB）';
COMMENT ON COLUMN portfolio_snapshots.snapshot_date IS 'スナップショット取得日';

-- インデックス設計
CREATE INDEX idx_snapshots_ticker ON portfolio_snapshots(ticker_code);
CREATE INDEX idx_snapshots_date ON portfolio_snapshots(snapshot_date DESC);
CREATE INDEX idx_snapshots_type ON portfolio_snapshots(asset_type);

-- 一意性制約
CREATE UNIQUE INDEX idx_snapshots_unique ON portfolio_snapshots(ticker_code, snapshot_date);
