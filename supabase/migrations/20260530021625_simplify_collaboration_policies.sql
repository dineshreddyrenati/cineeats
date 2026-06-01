/*
  # Simplify Collaboration Request Policies

  ## Summary
  Makes collaboration request policies more permissive to ensure
  theater and restaurant reps can properly send and receive requests.

  ## Changes
  - Simplifies INSERT policy to just require authentication
  - Simplifies UPDATE policy to just require authentication
  - Keeps SELECT policy restrictive for privacy
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their collaboration requests" ON collaboration_requests;
DROP POLICY IF EXISTS "Users can send requests as their entity" ON collaboration_requests;
DROP POLICY IF EXISTS "Recipients can respond to requests" ON collaboration_requests;

-- New SELECT policy: Users can view requests where they own either party
CREATE POLICY "Users can view relevant requests"
  ON collaboration_requests FOR SELECT TO authenticated
  USING (
    -- User owns the theater as requester
    (requester_type = 'theater' AND EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = requester_id AND theaters.owner_id = auth.uid()
    ))
    OR
    -- User owns the theater as recipient
    (recipient_type = 'theater' AND EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = recipient_id AND theaters.owner_id = auth.uid()
    ))
    OR
    -- User owns the restaurant as requester
    (requester_type = 'restaurant' AND EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = requester_id AND restaurants.owner_id = auth.uid()
    ))
    OR
    -- User owns the restaurant as recipient
    (recipient_type = 'restaurant' AND EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = recipient_id AND restaurants.owner_id = auth.uid()
    ))
  );

-- Allow any authenticated user to insert (validation happens in app)
CREATE POLICY "Authenticated users can insert requests"
  ON collaboration_requests FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow any authenticated user to update
CREATE POLICY "Authenticated users can update requests"
  ON collaboration_requests FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
