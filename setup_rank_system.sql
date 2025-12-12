-- SABO Arena Rank System Setup (CORRECTED)
-- Based on app/lib/core/constants/ranking_constants.dart

-- Drop table to ensure clean slate and correct schema
DROP TABLE IF EXISTS rank_system CASCADE;

-- Ensure table exists with correct schema
CREATE TABLE rank_system (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_code TEXT UNIQUE NOT NULL,
  rank_name TEXT NOT NULL,
  rank_name_vi TEXT,
  elo_min INTEGER,
  elo_max INTEGER,
  rank_color TEXT,
  rank_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear existing data (redundant after DROP but good for safety if I remove DROP later)
TRUNCATE TABLE rank_system;

-- Insert rank definitions
INSERT INTO rank_system (rank_code, rank_name, rank_name_vi, elo_min, elo_max, rank_color, rank_order, created_at) VALUES

-- Beginner Ranks
('K', 'Beginner', 'Người mới', 1000, 1099, '#8B4513', 1, NOW()),
('K+', 'Apprentice', 'Học việc', 1100, 1199, '#A0522D', 2, NOW()),

-- Worker Ranks
('I', 'Worker Level 3', 'Thợ 3', 1200, 1299, '#CD853F', 3, NOW()),
('I+', 'Worker Level 2', 'Thợ 2', 1300, 1399, '#D2691E', 4, NOW()),
('H', 'Worker Level 1', 'Thợ 1', 1400, 1499, '#B8860B', 5, NOW()),
('H+', 'Senior Worker', 'Thợ chính', 1500, 1599, '#DAA520', 6, NOW()),

-- Skilled Ranks
('G', 'Skilled Worker', 'Thợ giỏi', 1600, 1699, '#FFD700', 7, NOW()),
('G+', 'Master Worker', 'Thợ cả', 1700, 1799, '#FFA500', 8, NOW()),

-- Expert Ranks
('F', 'Expert', 'Chuyên gia', 1800, 1899, '#FF4500', 9, NOW()),
('E', 'Master', 'Cao thủ', 1900, 1999, '#FF0000', 10, NOW()),

-- Legend Ranks
('D', 'Legend', 'Huyền Thoại', 2000, 2099, '#800080', 11, NOW()),
('C', 'Champion', 'Vô địch', 2100, 2199, '#4B0082', 12, NOW());

-- Update existing players to have proper ranks based on ELO
UPDATE users SET 
  rank = CASE 
    WHEN elo_rating >= 2100 THEN 'C'
    WHEN elo_rating >= 2000 THEN 'D'
    WHEN elo_rating >= 1900 THEN 'E'
    WHEN elo_rating >= 1800 THEN 'F'
    WHEN elo_rating >= 1700 THEN 'G+'
    WHEN elo_rating >= 1600 THEN 'G'
    WHEN elo_rating >= 1500 THEN 'H+'
    WHEN elo_rating >= 1400 THEN 'H'
    WHEN elo_rating >= 1300 THEN 'I+'
    WHEN elo_rating >= 1200 THEN 'I'
    WHEN elo_rating >= 1100 THEN 'K+'
    ELSE 'K'
  END
WHERE role = 'player' AND elo_rating IS NOT NULL;
