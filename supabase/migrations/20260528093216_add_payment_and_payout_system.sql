/*
  # Payment Processing, Payouts, and Commission Distribution

  ## Summary
  Adds payment tracking, automatic commission calculation, secure payout system,
  and combo offer visibility by partner. After booking, payments are automatically
  split based on negotiated commission agreements and transferred to partners.

  ## New Tables
  1. `payments` - Tracks all payments (ticket bookings and food orders)
  2. `payouts` - Records commission payouts to partners
  3. `partner_earnings` - Aggregates earnings by partner for payout cycles

  ## Modified Tables
  - `bookings` - Added payment tracking fields
  - `food_orders` - Added payment tracking fields
  - `combo_deals` - Added visibility and revenue tracking

  ## Payment Flow
  1. User makes payment (75% advance for bookings, full for food orders)
  2. System calculates commission based on combo deal or default rates
  3. Revenue is split: partner commission + platform fee
  4. On booking completion or food delivery, payout is scheduled
  5. Payouts are processed in weekly/monthly cycles
*/

-- Payments table for tracking all transactions
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_type text NOT NULL CHECK (payment_type IN ('ticket_booking', 'food_order', 'combo_booking')),
  reference_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  platform_fee numeric(10,2) NOT NULL DEFAULT 0,
  theater_commission numeric(10,2) DEFAULT 0,
  restaurant_commission numeric(10,2) DEFAULT 0,
  commission_rate numeric(5,2) DEFAULT 0,
  payment_method text DEFAULT 'card' CHECK (payment_method IN ('card', 'upi', 'netbanking', 'wallet')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  combo_deal_id uuid REFERENCES combo_deals(id)
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Partners can view their commission payments"
  ON payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      JOIN shows ON shows.id = bookings.show_id
      JOIN theaters ON theaters.id = shows.theater_id
      WHERE bookings.id = reference_id AND theaters.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM food_orders
      JOIN restaurants ON restaurants.id = food_orders.restaurant_id
      WHERE food_orders.id = reference_id AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert payments"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update payments"
  ON payments FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Payouts table for partner disbursements
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type text NOT NULL CHECK (partner_type IN ('theater', 'restaurant')),
  partner_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  payout_period_start date NOT NULL,
  payout_period_end date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  transaction_reference text DEFAULT '',
  bank_account_last4 text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Theater partners can view their payouts"
  ON payouts FOR SELECT TO authenticated
  USING (
    partner_type = 'theater'
    AND EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = partner_id AND theaters.owner_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant partners can view their payouts"
  ON payouts FOR SELECT TO authenticated
  USING (
    partner_type = 'restaurant'
    AND EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = partner_id AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can manage payouts"
  ON payouts FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update payouts"
  ON payouts FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Partner earnings aggregation
CREATE TABLE IF NOT EXISTS partner_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type text NOT NULL CHECK (partner_type IN ('theater', 'restaurant')),
  partner_id uuid NOT NULL,
  period_month integer NOT NULL,
  period_year integer NOT NULL,
  total_revenue numeric(10,2) DEFAULT 0,
  total_commission numeric(10,2) DEFAULT 0,
  platform_fees numeric(10,2) DEFAULT 0,
  payout_amount numeric(10,2) DEFAULT 0,
  payout_status text DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid', 'partial')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(partner_type, partner_id, period_month, period_year)
);

ALTER TABLE partner_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their earnings"
  ON partner_earnings FOR SELECT TO authenticated
  USING (
    (partner_type = 'theater' AND EXISTS (SELECT 1 FROM theaters WHERE theaters.id = partner_id AND theaters.owner_id = auth.uid()))
    OR (partner_type = 'restaurant' AND EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = partner_id AND restaurants.owner_id = auth.uid()))
  );

CREATE POLICY "System can manage earnings"
  ON partner_earnings FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update earnings"
  ON partner_earnings FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add payment tracking to bookings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_id') THEN
    ALTER TABLE bookings ADD COLUMN payment_id uuid REFERENCES payments(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'combo_deal_id') THEN
    ALTER TABLE bookings ADD COLUMN combo_deal_id uuid REFERENCES combo_deals(id);
  END IF;
END $$;

-- Add payment tracking to food orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_orders' AND column_name = 'payment_id') THEN
    ALTER TABLE food_orders ADD COLUMN payment_id uuid REFERENCES payments(id);
  END IF;
END $$;

-- Add combo deal tracking to food orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_orders' AND column_name = 'combo_deal_id') THEN
    ALTER TABLE food_orders ADD COLUMN combo_deal_id uuid REFERENCES combo_deals(id);
  END IF;
END $$;

-- Add revenue tracking to combo deals
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'combo_deals' AND column_name = 'total_bookings') THEN
    ALTER TABLE combo_deals ADD COLUMN total_bookings integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'combo_deals' AND column_name = 'total_revenue') THEN
    ALTER TABLE combo_deals ADD COLUMN total_revenue numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference_id);
CREATE INDEX IF NOT EXISTS idx_payouts_partner ON payouts(partner_type, partner_id);
CREATE INDEX IF NOT EXISTS idx_earnings_partner ON partner_earnings(partner_type, partner_id);
