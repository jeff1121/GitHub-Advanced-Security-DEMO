CREATE UNIQUE INDEX IF NOT EXISTS one_win_per_player_room ON wins (room_id, player_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_draw_per_room ON draws (room_id, number);
CREATE TABLE IF NOT EXISTS room_bans (
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  PRIMARY KEY (room_id, player_id)
);
