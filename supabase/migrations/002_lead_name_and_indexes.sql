ALTER TABLE leads ADD COLUMN IF NOT EXISTS name text;

CREATE INDEX IF NOT EXISTS scores_domain_idx ON scores(domain);
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);
