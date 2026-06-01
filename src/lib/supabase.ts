import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'user' | 'theater_rep' | 'restaurant_rep';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string;
  avatar_url: string;
  created_at: string;
}

export interface Theater {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  image_url: string;
  total_screens: number;
  is_active: boolean;
  created_at: string;
}

export interface Movie {
  id: string;
  title: string;
  genre: string[];
  language: string;
  duration_minutes: number;
  rating: string;
  description: string;
  poster_url: string;
  trailer_url: string;
  cast_list: string[];
  release_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Show {
  id: string;
  theater_id: string;
  movie_id: string;
  show_date: string;
  show_time: string;
  screen_number: number;
  total_seats: number;
  available_seats: number;
  price_regular: number;
  price_premium: number;
  is_active: boolean;
  theater?: Theater;
  movie?: Movie;
}

export interface Seat {
  id: string;
  show_id: string;
  seat_number: string;
  seat_type: 'regular' | 'premium' | 'accessible';
  row_label: string;
  is_booked: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  show_id: string;
  booking_reference: string;
  total_amount: number;
  advance_paid: number;
  balance_due: number;
  payment_status: 'pending' | 'advance_paid' | 'fully_paid' | 'refunded';
  booking_status: 'confirmed' | 'cancelled' | 'completed';
  qr_code: string;
  num_seats: number;
  created_at: string;
  payment_id?: string;
  combo_deal_id?: string;
  show?: Show;
}

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  cuisine_type: string[];
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  image_url: string;
  rating: number;
  delivery_time_minutes: number;
  minimum_order: number;
  commission_rate: number;
  is_active: boolean;
  is_partner: boolean;
  opening_hours: { open: string; close: string };
  created_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_available: boolean;
  customization_options: CustomizationOption[];
  preparation_time_minutes: number;
}

export interface CustomizationOption {
  name: string;
  choices: string[];
  required: boolean;
}

export interface TableSlot {
  id: string;
  restaurant_id: string;
  table_number: string;
  capacity: number;
  slot_date: string;
  slot_time: string;
  is_reserved: boolean;
}

export interface TableReservation {
  id: string;
  user_id: string;
  restaurant_id: string;
  table_slot_id: string | null;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  special_requests: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  linked_booking_id: string | null;
  created_at: string;
  restaurant?: Restaurant;
}

export interface FoodOrder {
  id: string;
  user_id: string;
  restaurant_id: string;
  order_type: 'dine_in' | 'pickup';
  table_reservation_id: string | null;
  order_status: 'placed' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total_amount: number;
  advance_paid: number;
  balance_due: number;
  payment_status: 'pending' | 'advance_paid' | 'fully_paid' | 'refunded';
  special_instructions: string;
  estimated_ready_time: string | null;
  linked_booking_id: string | null;
  order_reference: string;
  created_at: string;
  payment_id?: string;
  combo_deal_id?: string;
  restaurant?: Restaurant;
  items?: FoodOrderItem[];
}

export interface FoodOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  customizations: Record<string, string>;
  subtotal: number;
  menu_item?: MenuItem;
}

export interface ComboDeal {
  id: string;
  theater_id: string;
  restaurant_id: string;
  title: string;
  description: string;
  discount_percentage: number;
  min_ticket_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  terms_conditions: string;
  collaboration_request_id?: string;
  theater_approved: boolean;
  restaurant_approved: boolean;
  commission_split: { theater: number; restaurant: number };
  offer_type: 'per_person' | 'per_family' | 'flat';
  max_party_size: number;
  total_bookings: number;
  total_revenue: number;
  theater?: Theater;
  restaurant?: Restaurant;
}

export interface Payment {
  id: string;
  payment_type: 'ticket_booking' | 'food_order' | 'combo_booking';
  reference_id: string;
  user_id: string;
  amount: number;
  platform_fee: number;
  theater_commission: number;
  restaurant_commission: number;
  commission_rate: number;
  payment_method: 'card' | 'upi' | 'netbanking' | 'wallet';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id: string;
  created_at: string;
  completed_at?: string;
  combo_deal_id?: string;
}

export interface Payout {
  id: string;
  partner_type: 'theater' | 'restaurant';
  partner_id: string;
  amount: number;
  payout_period_start: string;
  payout_period_end: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transaction_reference: string;
  bank_account_last4: string;
  created_at: string;
  processed_at?: string;
}

export interface PartnerEarnings {
  id: string;
  partner_type: 'theater' | 'restaurant';
  partner_id: string;
  period_month: number;
  period_year: number;
  total_revenue: number;
  total_commission: number;
  platform_fees: number;
  payout_amount: number;
  payout_status: 'pending' | 'paid' | 'partial';
  created_at: string;
  updated_at: string;
}

export interface FoodOrderVoiceNote {
  id: string;
  food_order_id: string;
  audio_url: string;
  duration_seconds: number;
  transcription: string;
  created_at: string;
}

export interface CollaborationRequest {
  id: string;
  requester_type: 'theater' | 'restaurant';
  requester_id: string;
  recipient_type: 'theater' | 'restaurant';
  recipient_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
  message: string;
  created_at: string;
  updated_at: string;
  responded_at?: string;
  requester_theater?: Theater;
  requester_restaurant?: Restaurant;
  recipient_theater?: Theater;
  recipient_restaurant?: Restaurant;
}

export interface DealNegotiation {
  id: string;
  collaboration_request_id: string;
  sender_type: 'theater' | 'restaurant';
  proposed_discount_percentage: number;
  proposed_commission_split: { theater: number; restaurant: number };
  offer_type: 'per_person' | 'per_family' | 'flat';
  min_ticket_count: number;
  max_party_size: number;
  terms: string;
  is_final_offer: boolean;
  created_at: string;
}

export interface Commission {
  id: string;
  restaurant_id: string;
  food_order_id: string | null;
  commission_amount: number;
  commission_rate: number;
  order_total: number;
  status: 'pending' | 'paid' | 'disputed';
  period_month: number | null;
  period_year: number | null;
  paid_at: string | null;
  created_at: string;
}
