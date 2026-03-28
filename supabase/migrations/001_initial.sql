CREATE TABLE scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  domain text NOT NULL,
  score_total integer,
  score_crawler_access integer,
  score_structured_data integer,
  score_content_arch integer,
  score_pricing integer,
  score_authority integer,
  score_bing_presence integer,
  score_brand_footprint integer,
  score_details jsonb,
  crawl_status text DEFAULT 'pending',
  job_status text DEFAULT 'pending',
  job_step text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  url text,
  score_id uuid REFERENCES scores(id),
  source text DEFAULT 'score_gate',
  pdf_sent boolean DEFAULT false,
  followup_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  url text NOT NULL,
  stripe_payment_intent_id text UNIQUE NOT NULL,
  amount_cents integer DEFAULT 99700,
  status text DEFAULT 'pending',
  report_url text,
  calendly_booked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  delivered_at timestamptz
);

CREATE TABLE audit_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  domain text NOT NULL,
  chatgpt_queries jsonb,
  claude_queries jsonb,
  citation_share_pct numeric(5,2),
  competitor_1_domain text,
  competitor_1_share_pct numeric(5,2),
  competitor_2_domain text,
  competitor_2_share_pct numeric(5,2),
  bing_indexed boolean,
  bing_page_count integer,
  brave_indexed boolean,
  reddit_mentions integer,
  g2_listed boolean,
  capterra_listed boolean,
  trustpilot_listed boolean,
  pages_audited integer,
  citation_ready_pages integer,
  full_report_json jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  domain text NOT NULL,
  plan text,
  stripe_subscription_id text,
  anthropic_key_encrypted text,
  openai_key_encrypted text,
  query_library jsonb,
  competitors jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE citation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id),
  query text,
  platform text,
  cited boolean,
  competitor_cited text,
  sentiment text,
  raw_response text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX ON citation_results(client_id, created_at);

ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_results ENABLE ROW LEVEL SECURITY;
