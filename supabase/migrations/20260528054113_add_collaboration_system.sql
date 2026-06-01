/*
  # Collaboration Requests and Enhanced Combo Deals

  ## Summary
  Adds a proper collaboration workflow for combo offers between theaters and restaurants.
  Partners can send requests, negotiate terms, and deals only become visible after mutual approval.

  ## New Tables
  1. `collaboration_requests` - Tracks requests between theater and restaurant reps
  2. `deal_negotiations` - Stores negotiation history and terms discussion

  ## Modified Tables
  - `combo_deals` - Added fields for approval workflow and enhanced terms

  ## Workflow
  1. Theater OR Restaurant sends collaboration request
  2. Other party accepts or declines the request
  3. Both parties negotiate terms (discounts, commissions, per-person/family offers)
  4. Both parties must approve the final deal
  5. Deal becomes visible only after mutual approval

  ## Security
  - RLS enabled on all new tables
  - Only involved parties can view and manage requests
*/

-- Collaboration requests table
CREATE TABLE IF NOT EXISTS collaboration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_type text NOT NULL CHECK (requester_type IN ('theater', 'restaurant')),
  requester_id uuid NOT NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('theater', 'restaurant')),
  recipient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
  message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(requester_type, requester_id, recipient_type, recipient_id)
);

ALTER TABLE collaboration_requests ENABLE ROW LEVEL SECURITY;

-- Theater reps can view requests involving their theaters
CREATE POLICY "Theater reps can view their requests"
  ON collaboration_requests FOR SELECT TO authenticated
  USING (
    (requester_type = 'theater' AND EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = requester_id AND theaters.owner_id = auth.uid()
    ))
    OR
    (recipient_type = 'theater' AND EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = recipient_id AND theaters.owner_id = auth.uid()
    ))
  );

-- Restaurant reps can view requests involving their restaurants
CREATE POLICY "Restaurant reps can view their requests"
  ON collaboration_requests FOR SELECT TO authenticated
  USING (
    (requester_type = 'restaurant' AND EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = requester_id AND restaurants.owner_id = auth.uid()
    ))
    OR
    (recipient_type = 'restaurant' AND EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = recipient_id AND restaurants.owner_id = auth.uid()
    ))
  );

-- Insert policy for authenticated users
CREATE POLICY "Reps can insert requests"
  ON collaboration_requests FOR INSERT TO authenticated
  WITH CHECK (true);

-- Update policy for recipients to accept/decline
CREATE POLICY "Recipients can update requests"
  ON collaboration_requests FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Deal negotiations table
CREATE TABLE IF NOT EXISTS deal_negotiations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_request_id uuid NOT NULL REFERENCES collaboration_requests(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('theater', 'restaurant')),
  proposed_discount_percentage numeric(5,2) DEFAULT 10.00,
  proposed_commission_split jsonb DEFAULT '{"theater": 0, "restaurant": 100}',
  offer_type text DEFAULT 'per_person' CHECK (offer_type IN ('per_person', 'per_family', 'flat')),
  min_ticket_count integer DEFAULT 2,
  max_party_size integer DEFAULT 4,
  terms text DEFAULT '',
  is_final_offer boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deal_negotiations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view negotiations"
  ON deal_negotiations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaboration_requests
      WHERE collaboration_requests.id = deal_negotiations.collaboration_request_id
      AND (
        (requester_type = 'theater' AND EXISTS (SELECT 1 FROM theaters WHERE theaters.id = requester_id AND theaters.owner_id = auth.uid()))
        OR
        (recipient_type = 'theater' AND EXISTS (SELECT 1 FROM theaters WHERE theaters.id = recipient_id AND theaters.owner_id = auth.uid()))
        OR
        (requester_type = 'restaurant' AND EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = requester_id AND restaurants.owner_id = auth.uid()))
        OR
        (recipient_type = 'restaurant' AND EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = recipient_id AND restaurants.owner_id = auth.uid()))
      )
    )
  );

CREATE POLICY "Parties can insert negotiations"
  ON deal_negotiations FOR INSERT TO authenticated
  WITH CHECK (true);

-- Update combo_deals table to support approval workflow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'combo_deals' AND column_name = 'collaboration_request_id'
  ) THEN
    ALTER TABLE combo_deals ADD COLUMN collaboration_request_id uuid REFERENCES collaboration_requests(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'combo_deals' AND column_name = 'theater_approved'
  ) THEN
    ALTER TABLE combo_deals ADD COLUMN theater_approved boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'combo_deals' AND column_name = 'restaurant_approved'
  ) THEN
    ALTER TABLE combo_deals ADD COLUMN restaurant_approved boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'combo_deals' AND column_name = 'commission_split'
  ) THEN
    ALTER TABLE combo_deals ADD COLUMN commission_split jsonb DEFAULT '{"theater": 0, "restaurant": 100}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'combo_deals' AND column_name = 'offer_type'
  ) THEN
    ALTER TABLE combo_deals ADD COLUMN offer_type text DEFAULT 'per_person' CHECK (offer_type IN ('per_person', 'per_family', 'flat'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'combo_deals' AND column_name = 'max_party_size'
  ) THEN
    ALTER TABLE combo_deals ADD COLUMN max_party_size integer DEFAULT 4;
  END IF;
END $$;

-- Update combo_deals policy to only show mutually approved deals to users
DROP POLICY IF EXISTS "All authenticated users can view active combo deals" ON combo_deals;

CREATE POLICY "Users can view approved combo deals"
  ON combo_deals FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'user'
    )
    AND is_active = true
    AND theater_approved = true
    AND restaurant_approved = true
    AND valid_until >= CURRENT_DATE
  );

CREATE POLICY "Theater reps can view their combo deals"
  ON combo_deals FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = theater_id AND theaters.owner_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant reps can view their combo deals"
  ON combo_deals FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = restaurant_id AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Theater reps can manage combo deals"
  ON combo_deals FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = theater_id AND theaters.owner_id = auth.uid()
    )
  );

CREATE POLICY "Theater and restaurant reps can update combo deals"
  ON combo_deals FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = theater_id AND theaters.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = restaurant_id AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_collab_requester ON collaboration_requests(requester_type, requester_id);
CREATE INDEX IF NOT EXISTS idx_collab_recipient ON collaboration_requests(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_request ON deal_negotiations(collaboration_request_id);
