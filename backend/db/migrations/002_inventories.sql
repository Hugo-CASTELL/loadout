CREATE TABLE inventories (
  steam_id TEXT PRIMARY KEY,
  inventory JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX inventories_expires_at_idx ON inventories (expires_at);
