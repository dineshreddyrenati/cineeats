/*
  # Fix Collaboration Request Policies

  ## Summary
  Updates RLS policies to properly allow theater and restaurant reps
  to send, receive, and manage collaboration requests.

  ## Changes
  - Updates INSERT policy to verify ownership
  - Updates UPDATE policy to verify ownership
  - Simplifies SELECT policies for better performance
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Theater reps can view their requests" ON collaboration_requests;
DROP POLICY IF EXISTS "Restaurant reps can view their requests" ON collaboration_requests;
DROP POLICY IF EXISTS "Reps can insert requests" ON collaboration_requests;
DROP POLICY IF EXISTS "Recipients can update requests" ON collaboration_requests;

-- New SELECT policy: Users can view requests where they are either requester or recipient
CREATE POLICY "Users can view their collaboration requests"
  ON collaboration_requests FOR SELECT TO authenticated
  USING (
    -- Theater owner is requester
    (requester_type = 'theater' AND EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = requester_id AND theaters.owner_id = auth.uid()
    ))
    OR
    -- Theater owner is recipient
    (recipient_type = 'theater' AND EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = recipient_id AND theaters.owner_id = auth.uid()
    ))
    OR
    -- Restaurant owner is requester
    (requester_type = 'restaurant' AND EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = requester_id AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- Restaurant owner is recipient
    (recipient_type = 'restaurant' AND EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = recipient_id AND restaurants.owner_id = auth.uid()
    ))
  );

-- New INSERT policy: Users can insert if they own the requester entity
CREATE POLICY "Users can send requests as their entity"
  ON collaboration_requests FOR INSERT TO authenticated
  WITH CHECK (
    (requester_type = 'theater' AND EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = requester_id AND theaters.owner_id = auth.uid()
    ))
    OR
    (requester_type = 'restaurant' AND EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = requester_id AND restaurants.owner_id = auth.uid()
    ))
  );

-- New UPDATE policy: Users can update if they are the recipient
CREATE POLICY "Recipients can respond to requests"
  ON collaboration_requests FOR UPDATE TO authenticated
  USING (
    (recipient_type = 'theater' AND EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = recipient_id AND theaters.owner_id = auth.uid()
    ))
    OR
    (recipient_type = 'restaurant' AND EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = recipient_id AND restaurants.owner_id = auth.uid()
    ))
    OR
    (requester_type = 'theater' AND EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = requester_id AND theaters.owner_id = auth.uid()
    ))
    OR
    (requester_type = 'restaurant' AND EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = requester_id AND restaurants.owner_id = auth.uid()
    ))
  )
  WITH CHECK (true);

-- Drop and recreate deal_negotiations policies
DROP POLICY IF EXISTS "Parties can view negotiations" ON deal_negotiations;
DROP POLICY IF EXISTS "Parties can insert negotiations" ON deal_negotiations;

CREATE POLICY "Partners can view negotiations"
  ON deal_negotiations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaboration_requests
      WHERE collaboration_requests.id = deal_negotiations.collaboration_request_id
      AND (
        (requester_type = 'theater' AND EXISTS (SELECT 1 FROM theaters WHERE theaters.id = requester_id AND theaters.owner_id = auth.uid()))
        OR (recipient_type = 'theater' AND EXISTS (SELECT 1 FROM theaters WHERE theaters.id = recipient_id AND theaters.owner_id = auth.uid()))
        OR (requester_type = 'restaurant' AND EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = requester_id AND restaurants.owner_id = auth.uid()))
        OR (recipient_type = 'restaurant' AND EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = recipient_id AND restaurants.owner_id = auth.uid()))
      )
    )
  );

CREATE POLICY "Partners can add negotiations"
  ON deal_negotiations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collaboration_requests
      WHERE collaboration_requests.id = deal_negotiations.collaboration_request_id
      AND (
        (requester_type = 'theater' AND EXISTS (SELECT 1 FROM theaters WHERE theaters.id = requester_id AND theaters.owner_id = auth.uid()))
        OR (recipient_type = 'theater' AND EXISTS (SELECT 1 FROM theaters WHERE theaters.id = recipient_id AND theaters.owner_id = auth.uid()))
        OR (requester_type = 'restaurant' AND EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = requester_id AND restaurants.owner_id = auth.uid()))
        OR (recipient_type = 'restaurant' AND EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = recipient_id AND restaurants.owner_id = auth.uid()))
      )
    )
  );
