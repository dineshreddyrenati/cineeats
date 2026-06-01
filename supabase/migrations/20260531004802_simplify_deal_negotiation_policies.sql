/*
  # Simplify Deal Negotiations Policies

  ## Summary
  Simplifies the RLS policies for deal_negotiations to ensure
  proposals can be sent from both theater and restaurant sides.

  ## Changes
  - Drops complex policies
  - Adds simple authenticated user policies
*/

DROP POLICY IF EXISTS "Partners can add negotiations" ON deal_negotiations;
DROP POLICY IF EXISTS "Partners can view negotiations" ON deal_negotiations;

-- Allow any authenticated user to view negotiations
CREATE POLICY "Authenticated users can view negotiations"
  ON deal_negotiations FOR SELECT TO authenticated
  USING (true);

-- Allow any authenticated user to add negotiations
CREATE POLICY "Authenticated users can add negotiations"
  ON deal_negotiations FOR INSERT TO authenticated
  WITH CHECK (true);
