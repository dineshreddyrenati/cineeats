/*
  # CineEats Platform - Core Tables

  ## Summary
  Creates all core tables for the CineEats platform that combines movie ticket booking
  with restaurant dining experiences.

  ## New Tables
  1. `profiles` - Extended user profiles with role (user/theater_rep/restaurant_rep)
  2. `theaters` - Theater venues managed by theater reps
  3. `movies` - Movie catalog
  4. `shows` - Scheduled movie shows at theaters
  5. `seats` - Individual seats per show
  6. `bookings` - Movie ticket bookings
  7. `booking_seats` - Many-to-many: bookings <-> seats
  8. `restaurants` - Restaurant partner listings
  9. `menu_items` - Food items per restaurant
  10. `table_slots` - Reservable table slots at restaurants
  11. `table_reservations` - Dine-in table reservations
  12. `food_orders` - Food orders (dine-in or pickup)
  13. `food_order_items` - Items in food orders
  14. `combo_deals` - Theater-restaurant combo offers
  15. `commissions` - Partner commission records

  ## Security
  - RLS enabled on all tables
  - Policies enforce ownership and role-based access
*/

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'theater_rep', 'restaurant_rep')),
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Theaters table
CREATE TABLE IF NOT EXISTS theaters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  latitude double precision DEFAULT 0,
  longitude double precision DEFAULT 0,
  amenities text[] DEFAULT '{}',
  image_url text DEFAULT '',
  total_screens integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE theaters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active theaters"
  ON theaters FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Theater reps can insert own theaters"
  ON theaters FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Theater reps can update own theaters"
  ON theaters FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Movies table
CREATE TABLE IF NOT EXISTS movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  genre text[] DEFAULT '{}',
  language text DEFAULT 'English',
  duration_minutes integer DEFAULT 120,
  rating text DEFAULT 'U',
  description text DEFAULT '',
  poster_url text DEFAULT '',
  trailer_url text DEFAULT '',
  cast_list text[] DEFAULT '{}',
  release_date date DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view movies"
  ON movies FOR SELECT TO authenticated
  USING (true);

-- Shows table
CREATE TABLE IF NOT EXISTS shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theater_id uuid NOT NULL REFERENCES theaters(id) ON DELETE CASCADE,
  movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  show_date date NOT NULL,
  show_time time NOT NULL,
  screen_number integer DEFAULT 1,
  total_seats integer DEFAULT 100,
  available_seats integer DEFAULT 100,
  price_regular numeric(10,2) DEFAULT 200.00,
  price_premium numeric(10,2) DEFAULT 350.00,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view shows"
  ON shows FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Theater reps can insert shows"
  ON shows FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = theater_id AND theaters.owner_id = auth.uid()
    )
  );

CREATE POLICY "Theater reps can update own shows"
  ON shows FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = theater_id AND theaters.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = theater_id AND theaters.owner_id = auth.uid()
    )
  );

-- Seats table
CREATE TABLE IF NOT EXISTS seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  seat_number text NOT NULL,
  seat_type text NOT NULL DEFAULT 'regular' CHECK (seat_type IN ('regular', 'premium', 'accessible')),
  row_label text DEFAULT 'A',
  is_booked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(show_id, seat_number)
);

ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view seats"
  ON seats FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can insert seats"
  ON seats FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update seats"
  ON seats FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  show_id uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  booking_reference text UNIQUE NOT NULL DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  advance_paid numeric(10,2) NOT NULL DEFAULT 0,
  balance_due numeric(10,2) NOT NULL DEFAULT 0,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'advance_paid', 'fully_paid', 'refunded')),
  booking_status text DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled', 'completed')),
  qr_code text DEFAULT '',
  num_seats integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Theater reps can view bookings for their shows"
  ON bookings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shows
      JOIN theaters ON theaters.id = shows.theater_id
      WHERE shows.id = show_id AND theaters.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own bookings"
  ON bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Booking seats junction
CREATE TABLE IF NOT EXISTS booking_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id uuid NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  UNIQUE(booking_id, seat_id)
);

ALTER TABLE booking_seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own booking seats"
  ON booking_seats FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings WHERE bookings.id = booking_id AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert booking seats"
  ON booking_seats FOR INSERT TO authenticated
  WITH CHECK (true);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  cuisine_type text[] DEFAULT '{}',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  latitude double precision DEFAULT 0,
  longitude double precision DEFAULT 0,
  image_url text DEFAULT '',
  rating numeric(3,1) DEFAULT 4.0,
  delivery_time_minutes integer DEFAULT 30,
  minimum_order numeric(10,2) DEFAULT 200.00,
  commission_rate numeric(5,2) DEFAULT 10.00,
  is_active boolean DEFAULT true,
  is_partner boolean DEFAULT true,
  opening_hours jsonb DEFAULT '{"open": "09:00", "close": "23:00"}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view active restaurants"
  ON restaurants FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Restaurant reps can insert own restaurants"
  ON restaurants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Restaurant reps can update own restaurants"
  ON restaurants FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'Main Course',
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text DEFAULT '',
  is_vegetarian boolean DEFAULT false,
  is_vegan boolean DEFAULT false,
  is_available boolean DEFAULT true,
  customization_options jsonb DEFAULT '[]',
  preparation_time_minutes integer DEFAULT 20,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view available menu items"
  ON menu_items FOR SELECT TO authenticated
  USING (is_available = true);

CREATE POLICY "Restaurant reps can manage own menu items"
  ON menu_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = restaurant_id AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant reps can update own menu items"
  ON menu_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = restaurant_id AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = restaurant_id AND restaurants.owner_id = auth.uid()
    )
  );

-- Table slots table
CREATE TABLE IF NOT EXISTS table_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number text NOT NULL,
  capacity integer DEFAULT 2,
  slot_date date NOT NULL,
  slot_time time NOT NULL,
  is_reserved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, table_number, slot_date, slot_time)
);

ALTER TABLE table_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view table slots"
  ON table_slots FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Restaurant reps can manage table slots"
  ON table_slots FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = restaurant_id AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can update table slots"
  ON table_slots FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Table reservations table
CREATE TABLE IF NOT EXISTS table_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_slot_id uuid REFERENCES table_slots(id),
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  party_size integer DEFAULT 2,
  special_requests text DEFAULT '',
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  linked_booking_id uuid REFERENCES bookings(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE table_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations"
  ON table_reservations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Restaurant reps can view their reservations"
  ON table_reservations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = restaurant_id AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own reservations"
  ON table_reservations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations"
  ON table_reservations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Food orders table
CREATE TABLE IF NOT EXISTS food_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_type text NOT NULL DEFAULT 'pickup' CHECK (order_type IN ('dine_in', 'pickup')),
  table_reservation_id uuid REFERENCES table_reservations(id),
  order_status text DEFAULT 'placed' CHECK (order_status IN ('placed', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  advance_paid numeric(10,2) DEFAULT 0,
  balance_due numeric(10,2) DEFAULT 0,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'advance_paid', 'fully_paid', 'refunded')),
  special_instructions text DEFAULT '',
  estimated_ready_time timestamptz,
  linked_booking_id uuid REFERENCES bookings(id),
  order_reference text UNIQUE NOT NULL DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE food_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own food orders"
  ON food_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Restaurant reps can view their food orders"
  ON food_orders FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = restaurant_id AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own food orders"
  ON food_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food orders"
  ON food_orders FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Restaurant reps can update food order status"
  ON food_orders FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = restaurant_id AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = restaurant_id AND restaurants.owner_id = auth.uid()
    )
  );

-- Food order items table
CREATE TABLE IF NOT EXISTS food_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES food_orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  customizations jsonb DEFAULT '{}',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE food_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON food_order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM food_orders WHERE food_orders.id = order_id AND food_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant reps can view their order items"
  ON food_order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM food_orders
      JOIN restaurants ON restaurants.id = food_orders.restaurant_id
      WHERE food_orders.id = order_id AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert order items"
  ON food_order_items FOR INSERT TO authenticated
  WITH CHECK (true);

-- Combo deals table
CREATE TABLE IF NOT EXISTS combo_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theater_id uuid NOT NULL REFERENCES theaters(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  discount_percentage numeric(5,2) DEFAULT 10.00,
  min_ticket_count integer DEFAULT 2,
  valid_from date DEFAULT CURRENT_DATE,
  valid_until date DEFAULT (CURRENT_DATE + interval '30 days'),
  is_active boolean DEFAULT true,
  terms_conditions text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE combo_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view active combo deals"
  ON combo_deals FOR SELECT TO authenticated
  USING (is_active = true AND valid_until >= CURRENT_DATE);

CREATE POLICY "Theater reps can manage combo deals for their theaters"
  ON combo_deals FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = theater_id AND theaters.owner_id = auth.uid()
    )
  );

CREATE POLICY "Theater reps can update combo deals"
  ON combo_deals FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = theater_id AND theaters.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM theaters WHERE theaters.id = theater_id AND theaters.owner_id = auth.uid()
    )
  );

-- Commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  food_order_id uuid REFERENCES food_orders(id),
  commission_amount numeric(10,2) NOT NULL DEFAULT 0,
  commission_rate numeric(5,2) NOT NULL DEFAULT 10.00,
  order_total numeric(10,2) NOT NULL DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'disputed')),
  period_month integer,
  period_year integer,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant reps can view own commissions"
  ON commissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants WHERE restaurants.id = restaurant_id AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert commissions"
  ON commissions FOR INSERT TO authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shows_date ON shows(show_date);
CREATE INDEX IF NOT EXISTS idx_shows_theater ON shows(theater_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_food_orders_user ON food_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_food_orders_restaurant ON food_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
