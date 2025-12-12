-- Create table for club rank registration requests
CREATE TABLE IF NOT EXISTS club_rank_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  club_id UUID REFERENCES clubs(id) NOT NULL, -- Assuming 'clubs' table exists, otherwise change to 'users' if clubs are users
  requested_rank TEXT NOT NULL,
  phone_number TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE club_rank_requests ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own requests
DROP POLICY IF EXISTS "Users can view their own requests" ON club_rank_requests;
CREATE POLICY "Users can view their own requests" ON club_rank_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create requests
DROP POLICY IF EXISTS "Users can create requests" ON club_rank_requests;
CREATE POLICY "Users can create requests" ON club_rank_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Club owners can view requests for their club
DROP POLICY IF EXISTS "Club owners can view requests" ON club_rank_requests;
CREATE POLICY "Club owners can view requests" ON club_rank_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clubs 
      WHERE id = club_rank_requests.club_id 
      AND owner_id = auth.uid()
    )
  );

-- Club owners can update requests (to approve/reject)
DROP POLICY IF EXISTS "Club owners can update requests" ON club_rank_requests;
CREATE POLICY "Club owners can update requests" ON club_rank_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clubs 
      WHERE id = club_rank_requests.club_id 
      AND owner_id = auth.uid()
    )
  );

-- For now, allowing authenticated users to view (you might want to restrict this)
-- CREATE POLICY "Authenticated users can view" ON club_rank_requests FOR SELECT USING (auth.role() = 'authenticated');
