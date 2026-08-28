CREATE TABLE users (
  steam_id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE loadouts (
  id SERIAL PRIMARY KEY,
  steam_id TEXT NOT NULL REFERENCES users (steam_id),

  name TEXT NOT NULL,
  description TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE loadout_items (
  id SERIAL PRIMARY KEY,

  loadout_id INTEGER NOT NULL
    REFERENCES loadouts(id)
      ON DELETE CASCADE,

  weapon TEXT NOT NULL,

  skin_name TEXT NOT NULL,

  paint_index INTEGER,
  float_value REAL,
  pattern INTEGER,

  stickers JSONB
);