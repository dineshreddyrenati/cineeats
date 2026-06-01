/*
  # Add Restaurant Combo Deal Management

  ## Summary
  Allows restaurant reps to create combo deals when they accept
  a collaboration request from a theater.

  ## Changes
  - Adds INSERT policy for restaurant reps to create combo deals
  - Adds proper policies for restaurant-owned combo deals
*/

-- Drop conflicting policies
DROP POLICY IF EXISTS "Theater reps can manage combo deals" ON combo_deals;
DROP POLICY IF EXISTS "Theater and restaurant reps can update combo deals" ON combo_deals;

-- Theater reps can insert combo deals
CREATE POLICY "Theater reps can insert combo deals"
  ON combo_deals FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM theaters
      WHERE theaters.id = combo_deals.theater_id
      AND theaters.owner_id = auth.uid()
    )
  );

-- Restaurant reps can insert combo deals
CREATE POLICY "Restaurant reps can insert combo deals"
  ON combo_deals FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = combo_deals.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Theater reps can update combo deals for their theaters
CREATE POLICY "Theater reps can update their combo deals"
  ON combo_deals FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM theaters
      WHERE theaters.id = combo_deals.theater_id
      AND theaters.owner_id = auth.uid()
    )
  )
  WITH CHECK (true);

-- Restaurant reps can update combo deals for their restaurants
CREATE POLICY "Restaurant reps can update their combo deals"
  ON combo_deals FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = combo_deals.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (true);
