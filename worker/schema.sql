-- Survey Responses Table
CREATE TABLE IF NOT EXISTS responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  region TEXT NOT NULL,
  occupation TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_timestamp ON responses(timestamp);
CREATE INDEX IF NOT EXISTS idx_phone_timestamp ON responses(phone, timestamp);
CREATE INDEX IF NOT EXISTS idx_region ON responses(region);
CREATE INDEX IF NOT EXISTS idx_occupation ON responses(occupation);
