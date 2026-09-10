#!/usr/bin/env bash
set -euo pipefail

# BingoBlitz Database Seeder
# Populates PostgreSQL with 20 demo players and historical games

DATABASE_URL="${DATABASE_URL:-postgres://bingo:bingo@localhost:5432/bingo}"

echo "==> Seeding BingoBlitz Demo Data..."

# SQL Script to seed players, rooms, and wins
psql "$DATABASE_URL" << 'EOF' || true
-- 1. Insert Demo Players
INSERT INTO players (id, nickname, email, is_admin) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Alice_Champion', 'alice@example.com', false),
  ('11111111-1111-1111-1111-111111111102', 'Bob_FastCaller', 'bob@example.com', false),
  ('11111111-1111-1111-1111-111111111103', 'Charlie_Lucky7', 'charlie@example.com', false),
  ('11111111-1111-1111-1111-111111111104', 'David_BingoKing', 'david@example.com', false),
  ('11111111-1111-1111-1111-111111111105', 'Eva_StarPlayer', 'eva@example.com', false),
  ('11111111-1111-1111-1111-111111111106', 'Frank_CloudNinja', 'frank@example.com', false),
  ('11111111-1111-1111-1111-111111111107', 'Grace_SecurityPro', 'grace@example.com', true),
  ('11111111-1111-1111-1111-111111111108', 'Helen_CodeMaster', 'helen@example.com', false),
  ('11111111-1111-1111-1111-111111111109', 'Ivan_DevOpsLead', 'ivan@example.com', false),
  ('11111111-1111-1111-1111-111111111110', 'Judy_SecurityAuditor', 'judy@example.com', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Demo Rooms
INSERT INTO rooms (id, code, name, status, draw_interval_ms) VALUES
  ('22222222-2222-2222-2222-222222222201', 'DEMO01', '售前震撼大亂鬥 #1', 'finished', 3000),
  ('22222222-2222-2222-2222-222222222202', 'LUCKY8', '幸運連線挑戰賽', 'finished', 4000),
  ('22222222-2222-2222-2222-222222222203', 'GHAS01', 'GitHub 安全高峰會專屬房', 'waiting', 3000)
ON CONFLICT (code) DO NOTHING;

-- 3. Insert Historical Wins for Leaderboard
INSERT INTO wins (room_id, player_id, line_type, score, verified) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'full', 1700, true),
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'row', 200, true),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111103', 'diag', 300, true),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111104', 'col', 100, true);
EOF

echo "==> Seeding completed successfully!"
echo "==> Demo Room URL: http://localhost:5173/room/GHAS01"
