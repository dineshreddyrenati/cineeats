/*
  # Voice Notes for Food Customization

  ## Summary
  Adds voice note recording capability for food order customizations.
  Users can record voice notes when ordering food instead of or in addition to text.

  ## New Table
  - `food_order_voice_notes` - Stores voice note metadata and audio file references

  ## Features
  - Store voice note audio as binary data or reference to cloud storage
  - Track recording timestamp, duration, and transcription (if available)
  - Link voice notes to specific food orders
  - Allow multiple voice notes per order
*/

CREATE TABLE IF NOT EXISTS food_order_voice_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_order_id uuid NOT NULL REFERENCES food_orders(id) ON DELETE CASCADE,
  audio_url text NOT NULL,
  duration_seconds integer NOT NULL,
  transcription text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE food_order_voice_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their order voice notes"
  ON food_order_voice_notes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM food_orders
      WHERE food_orders.id = food_order_voice_notes.food_order_id
      AND food_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant can view their order voice notes"
  ON food_order_voice_notes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM food_orders
      JOIN restaurants ON restaurants.id = food_orders.restaurant_id
      WHERE food_orders.id = food_order_voice_notes.food_order_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert voice notes for their orders"
  ON food_order_voice_notes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM food_orders
      WHERE food_orders.id = food_order_voice_notes.food_order_id
      AND food_orders.user_id = auth.uid()
    )
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_voice_notes_order ON food_order_voice_notes(food_order_id);
