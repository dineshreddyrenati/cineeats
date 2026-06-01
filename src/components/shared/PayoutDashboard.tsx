import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Calendar, Download, Wallet, ArrowUpRight, AlertCircle, CreditCard } from 'lucide-react';
import { supabase, Payout, PartnerEarnings, Payment } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Props {
  partnerType: 'theater' | 'restaurant';
  onBack: () => void;
}

export default function PayoutDashboard({ partnerType, onBack }: Props) {
  const { user } = useAuth();
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<PartnerEarnings[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<{ month: number; year: number } | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const table = partnerType === 'theater' ? 'theaters' : 'restaurants';
    const { data: partner } = await supabase.from(table).select('id').eq('owner_id', user.id).maybeSingle();
    if (!partner) { setLoading(false); return; }
    setPartnerId(partner.id);

    const [earningsRes, payoutsRes] = await Promise.all([
      supabase.from('partner_earnings').select('*').eq('partner_type', partnerType).eq('partner_id', partner.id).order('period_year', { ascending: false }).order('period_month', { ascending: false }),
      supabase.from('payouts').select('*').eq('partner_type', partnerType).eq('partner_id', partner.id).order('created_at', { ascending: false }),
    ]);

    setEarnings((earningsRes.data || []) as PartnerEarnings[]);
    setPayouts((payoutsRes.data || []) as Payout[]);

    // Get recent payments
    const paymentTable = partnerType === 'theater' ? 'bookings' : 'food_orders';
    const idField = partnerType === 'theater' ? 'show_id' : 'restaurant_id';
    if (partnerType === 'theater') {
      const { data: shows } = await supabase.from('shows').select('id').in('theater_id', [partner.id]);
      const showIds = (shows || []).map(s => s.id);
      if (showIds.length > 0) {
        const { data: bookings } = await supabase.from('bookings').select('id').in('show_id', showIds);
        const bookingIds = (bookings || []).map(b => b.id);
        if (bookingIds.length > 0) {
          const { data: payData } = await supabase.from('payments').select('*').in('reference_id', bookingIds).order('created_at', { ascending: false }).limit(20);
          setPayments((payData || []) as Payment[]);
        }
      }
    } else {
      const { data: orders } = await supabase.from('food_orders').select('id').eq('restaurant_id', partner.id);
      const orderIds = (orders || []).map(o => o.id);
      if (orderIds.length > 0) {
        const { data: payData } = await supabase.from('payments').select('*').in('reference_id', orderIds).order('created_at', { ascending: false }).limit(20);
        setPayments((payData || []) as Payment[]);
      }
    }

    setLoading(false);
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentEarnings = earnings.find(e => e.period_month === currentMonth && e.period_year === currentYear);
  const totalPending = earnings.filter(e => e.payout_status === 'pending').reduce((sum, e) => sum + e.payout_amount, 0);
  const totalPaid = payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const formatMonth = (month: number, year: number) => new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Payouts & Revenue</h1>
        <p className="text-gray-400">Track your earnings and payout history</p>
      </div>

      {!partnerId && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-5">
          <p className="text-amber-300 text-sm">Please complete your {partnerType} setup first.</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-900 rounded-xl p-4">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3">
            <DollarSign size={20} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(currentEarnings?.total_revenue || 0)}</p>
          <p className="text-gray-500 text-xs">This Month's Revenue</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4">
          <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp size={20} className="text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(currentEarnings?.total_commission || 0)}</p>
          <p className="text-gray-500 text-xs">Your Commission</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4">
          <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center mb-3">
            <Wallet size={20} className="text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(totalPending)}</p>
          <p className="text-gray-500 text-xs">Pending Payouts</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3">
            <CreditCard size={20} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(totalPaid)}</p>
          <p className="text-gray-500 text-xs">Total Paid Out</p>
        </div>
      </div>

      {/* Payout Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">How Payouts Work</p>
            <p className="text-blue-200/70">Commissions are calculated per booking. Payouts are processed weekly on Fridays. Funds are transferred to your registered bank account within 2-3 business days.</p>
          </div>
        </div>
      </div>

      {/* Monthly Earnings */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3">Monthly Earnings</h3>
        {earnings.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-900 rounded-xl">No earnings data yet.</div>
        ) : (
          <div className="space-y-2">
            {earnings.slice(0, 6).map(e => (
              <div key={e.id} className="bg-gray-900 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-medium">{formatMonth(e.period_month, e.period_year)}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    e.payout_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {e.payout_status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Revenue</p>
                    <p className="text-white font-medium">{formatCurrency(e.total_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Commission</p>
                    <p className="text-emerald-400 font-medium">{formatCurrency(e.total_commission)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Platform Fee</p>
                    <p className="text-gray-400">{formatCurrency(e.platform_fees)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Net Payout</p>
                    <p className="text-white font-semibold">{formatCurrency(e.payout_amount)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Payouts */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3">Recent Payouts</h3>
        {payouts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-900 rounded-xl">No payouts processed yet.</div>
        ) : (
          <div className="space-y-2">
            {payouts.slice(0, 5).map(p => (
              <div key={p.id} className="bg-gray-900 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{formatCurrency(p.amount)}</p>
                  <p className="text-gray-500 text-xs">{new Date(p.payout_period_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(p.payout_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    p.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {p.status}
                  </span>
                  {p.bank_account_last4 && <p className="text-gray-600 text-xs mt-0.5">****{p.bank_account_last4}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-white font-semibold mb-3">Recent Transactions</h3>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-900 rounded-xl">No transactions recorded yet.</div>
        ) : (
          <div className="space-y-2">
            {payments.slice(0, 10).map(p => (
              <div key={p.id} className="bg-gray-900 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center">
                    <ArrowUpRight size={16} className={p.payment_status === 'completed' ? 'text-emerald-400' : 'text-amber-400'} />
                  </div>
                  <div>
                    <p className="text-white text-sm capitalize">{p.payment_type.replace('_', ' ')}</p>
                    <p className="text-gray-500 text-xs">{new Date(p.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${partnerType === 'theater' ? 'text-blue-400' : 'text-emerald-400'}`}>
                    +{formatCurrency(partnerType === 'theater' ? p.theater_commission : p.restaurant_commission)}
                  </p>
                  <p className="text-gray-500 text-xs">From ₹{p.amount}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
