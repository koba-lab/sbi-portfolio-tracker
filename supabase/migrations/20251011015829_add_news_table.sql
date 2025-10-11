-- News table for storing stock-related news
CREATE TABLE news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker_code VARCHAR(20) NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  published_at TIMESTAMPTZ NOT NULL,
  source VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Comments
COMMENT ON TABLE news IS 'Stock-related news information';
COMMENT ON COLUMN news.ticker_code IS 'Related stock ticker code';
COMMENT ON COLUMN news.title IS 'News title';
COMMENT ON COLUMN news.url IS 'News article URL';
COMMENT ON COLUMN news.published_at IS 'News publication timestamp';
COMMENT ON COLUMN news.source IS 'News source provider';

-- Indexes
CREATE INDEX idx_news_ticker ON news(ticker_code);
CREATE INDEX idx_news_published ON news(published_at DESC);
CREATE INDEX idx_news_ticker_published ON news(ticker_code, published_at DESC);
