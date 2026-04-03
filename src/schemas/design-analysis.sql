-- PostgreSQL schema for devsigner design analysis data
-- Run this to create the table for storing analyze_url results

CREATE TABLE IF NOT EXISTS design_analyses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url           TEXT NOT NULL,
  analyzed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  page_title    TEXT,
  viewport      JSONB NOT NULL,          -- { width, height }

  -- Colors
  colors        JSONB NOT NULL,          -- full colors object
  dominant_color TEXT,
  background_color TEXT,
  text_color    TEXT,
  accent_color  TEXT,
  color_scheme  TEXT CHECK (color_scheme IN ('light', 'dark', 'mixed')),
  color_count   INTEGER,

  -- Typography
  typography    JSONB NOT NULL,          -- full typography object
  heading_font  TEXT,
  body_font     TEXT,
  type_scale_ratio NUMERIC(5,3),

  -- Spacing
  spacing       JSONB NOT NULL,          -- full spacing object
  grid_aligned_pct INTEGER,
  base_unit     INTEGER,
  density       TEXT CHECK (density IN ('spacious', 'balanced', 'compact')),

  -- Layout
  layout        JSONB NOT NULL,          -- full layout object
  max_width     INTEGER,
  has_sidebar   BOOLEAN,
  has_hero      BOOLEAN,
  has_sticky_header BOOLEAN,
  column_count  INTEGER,

  -- Shapes
  shapes        JSONB NOT NULL,          -- full shapes object
  corner_style  TEXT CHECK (corner_style IN ('sharp', 'subtle', 'rounded', 'pill')),
  shadow_style  TEXT CHECK (shadow_style IN ('none', 'subtle', 'medium', 'dramatic')),

  -- Overall
  design_personality TEXT,
  estimated_industry TEXT,
  visual_weight TEXT CHECK (visual_weight IN ('light', 'medium', 'heavy')),
  complexity_score INTEGER,
  tags          TEXT[],

  -- Full JSON (for flexibility)
  raw_analysis  JSONB NOT NULL,

  -- Indexing
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analyses_url ON design_analyses (url);
CREATE INDEX IF NOT EXISTS idx_analyses_personality ON design_analyses (design_personality);
CREATE INDEX IF NOT EXISTS idx_analyses_industry ON design_analyses (estimated_industry);
CREATE INDEX IF NOT EXISTS idx_analyses_color_scheme ON design_analyses (color_scheme);
CREATE INDEX IF NOT EXISTS idx_analyses_density ON design_analyses (density);
CREATE INDEX IF NOT EXISTS idx_analyses_corner_style ON design_analyses (corner_style);
CREATE INDEX IF NOT EXISTS idx_analyses_tags ON design_analyses USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_analyses_analyzed_at ON design_analyses (analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_raw ON design_analyses USING GIN (raw_analysis);

-- Useful queries:
--
-- All analyses for a URL:
--   SELECT * FROM design_analyses WHERE url LIKE '%stripe.com%' ORDER BY analyzed_at DESC;
--
-- Find all "Warm Professional" designs:
--   SELECT url, dominant_color, heading_font, body_font FROM design_analyses WHERE design_personality = 'Warm Professional';
--
-- Average color count by industry:
--   SELECT estimated_industry, AVG(color_count) FROM design_analyses GROUP BY estimated_industry;
--
-- Find designs with similar color scheme:
--   SELECT url, dominant_color, accent_color FROM design_analyses WHERE color_scheme = 'dark' AND corner_style = 'subtle';
--
-- Trending border radius by date:
--   SELECT DATE(analyzed_at), corner_style, COUNT(*) FROM design_analyses GROUP BY DATE(analyzed_at), corner_style ORDER BY 1 DESC;
