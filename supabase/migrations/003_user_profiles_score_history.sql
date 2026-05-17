ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS measurement_window_ends_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders(email);

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  name text,
  company text,
  website text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  domain text NOT NULL,
  order_id uuid REFERENCES orders(id),
  run_number integer NOT NULL DEFAULT 1,
  citation_claude double precision NOT NULL,
  citation_chatgpt double precision NOT NULL,
  comp1_domain text,
  comp1_share double precision,
  comp2_domain text,
  comp2_share double precision,
  query_results jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS score_history_user_id_created_at_idx
  ON score_history(user_id, created_at);

CREATE INDEX IF NOT EXISTS score_history_order_id_run_number_idx
  ON score_history(order_id, run_number);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_history ENABLE ROW LEVEL SECURITY;
