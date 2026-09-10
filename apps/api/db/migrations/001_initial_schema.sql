-- Enable pgcrypto extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 玩家 (Players)
CREATE TABLE IF NOT EXISTS players (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname      TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  avatar_path   TEXT,
  password_hash TEXT,
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  last_ip       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 房間 (Rooms)
CREATE TABLE IF NOT EXISTS rooms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             CHAR(6) UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  host_player_id   UUID REFERENCES players(id),
  status           TEXT NOT NULL DEFAULT 'waiting',
  draw_interval_ms INT NOT NULL DEFAULT 5000,
  settings         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. 房間成員與其卡片 (Room Players)
CREATE TABLE IF NOT EXISTS room_players (
  room_id    UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id  UUID REFERENCES players(id) ON DELETE CASCADE,
  card       JSONB NOT NULL,
  marked     JSONB NOT NULL DEFAULT '[]',
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, player_id)
);

-- 4. 抽號紀錄 (Draws)
CREATE TABLE IF NOT EXISTS draws (
  id         BIGSERIAL PRIMARY KEY,
  room_id    UUID REFERENCES rooms(id) ON DELETE CASCADE,
  sequence   INT NOT NULL,
  number     INT NOT NULL,
  phrase     TEXT,
  drawn_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, sequence)
);

-- 5. 得獎紀錄 (Wins)
CREATE TABLE IF NOT EXISTS wins (
  id         BIGSERIAL PRIMARY KEY,
  room_id    UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id  UUID REFERENCES players(id),
  line_type  TEXT NOT NULL,
  score      INT NOT NULL,
  verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. 聊天訊息 (Chat Messages)
CREATE TABLE IF NOT EXISTS chat_messages (
  id         BIGSERIAL PRIMARY KEY,
  room_id    UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id  UUID REFERENCES players(id),
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. 稽核紀錄 (Audit Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  actor      TEXT,
  action     TEXT NOT NULL,
  payload    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
