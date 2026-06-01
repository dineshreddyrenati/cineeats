import { useEffect, useState } from 'react';
import { ArrowLeft, Send, Check, AlertCircle, MessageSquare, Building2, UtensilsCrossed, Percent, DollarSign, CheckCircle } from 'lucide-react';
import { supabase, CollaborationRequest, DealNegotiation, ComboDeal } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Props {
  request: CollaborationRequest;
  restaurantId: string;
  onBack: () => void;
}

export default function RestaurantDealNegotiation({ request, restaurantId, onBack }: Props) {
  const { user } = useAuth();
  const [negotiations, setNegotiations] = useState<DealNegotiation[]>([]);
  const [comboDeal, setComboDeal] = useState<ComboDeal | null>(null);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    proposed_discount_percentage: 15,
    proposed_commission_split: { theater: 70, restaurant: 30 },
    offer_type: 'per_person' as 'per_person' | 'per_family' | 'flat',
    min_ticket_count: 2,
    max_party_size: 4,
    terms: '',
    is_final_offer: false,
  });

  useEffect(() => { loadData(); }, [request.id]);

  const loadData = async () => {
    const [negRes, dealRes] = await Promise.all([
      supabase.from('deal_negotiations').select('*').eq('collaboration_request_id', request.id).order('created_at'),
      supabase.from('combo_deals').select('*').eq('collaboration_request_id', request.id).maybeSingle(),
    ]);
    setNegotiations((negRes.data || []) as DealNegotiation[]);
    setComboDeal((dealRes.data as ComboDeal) || null);

    if (negRes.data && negRes.data.length > 0) {
      const latest = negRes.data[negRes.data.length - 1];
      setForm({
        proposed_discount_percentage: latest.proposed_discount_percentage,
        proposed_commission_split: latest.proposed_commission_split,
        offer_type: latest.offer_type,
        min_ticket_count: latest.min_ticket_count,
        max_party_size: latest.max_party_size,
        terms: latest.terms || '',
        is_final_offer: false,
      });
    }
  };

  const sendProposal = async () => {
    setSending(true);
    const { error } = await supabase.from('deal_negotiations').insert({
      collaboration_request_id: request.id,
      sender_type: 'restaurant',
      proposed_discount_percentage: form.proposed_discount_percentage,
      proposed_commission_split: form.proposed_commission_split,
      offer_type: form.offer_type,
      min_ticket_count: form.min_ticket_count,
      max_party_size: form.max_party_size,
      terms: form.terms,
      is_final_offer: form.is_final_offer,
    });

    if (error) {
      console.error('Error sending proposal:', error);
      alert('Failed to send proposal: ' + error.message);
    } else {
      loadData();
    }
    setSending(false);
  };

  // Accept a final offer from theater - creates the deal
  const acceptFinalOffer = async (neg: DealNegotiation) => {
    if (!request.requester_theater && !request.recipient_theater) return;

    const theaterId = request.requester_theater?.id || request.recipient_theater?.id;

    // First check if a deal already exists for this collaboration
    const { data: existingDeal } = await supabase
      .from('combo_deals')
      .select('*')
      .eq('collaboration_request_id', request.id)
      .maybeSingle();

    let deal;
    let error;

    if (existingDeal) {
      // Update existing deal
      const result = await supabase
        .from('combo_deals')
        .update({
          discount_percentage: neg.proposed_discount_percentage,
          commission_split: neg.proposed_commission_split,
          offer_type: neg.offer_type,
          max_party_size: neg.max_party_size,
          min_ticket_count: neg.min_ticket_count,
          terms_conditions: neg.terms,
          theater_approved: true,
          restaurant_approved: true,
          is_active: true,
        })
        .eq('id', existingDeal.id)
        .select()
        .single();
      deal = result.data;
      error = result.error;
    } else {
      // Create new deal
      const result = await supabase.from('combo_deals').insert({
        theater_id: theaterId,
        restaurant_id: restaurantId,
        title: `Movie & Dining Combo`,
        description: 'Exclusive combo deal - save on tickets and food!',
        discount_percentage: neg.proposed_discount_percentage,
        commission_split: neg.proposed_commission_split,
        offer_type: neg.offer_type,
        max_party_size: neg.max_party_size,
        min_ticket_count: neg.min_ticket_count,
        terms_conditions: neg.terms,
        collaboration_request_id: request.id,
        theater_approved: true,
        restaurant_approved: true,
        is_active: true,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }).select().single();
      deal = result.data;
      error = result.error;
    }

    if (!error && deal) {
      setComboDeal(deal);
      loadData();
    } else if (error) {
      console.error('Error creating/updating deal:', error);
    }
  };

  const approveDeal = async () => {
    if (!comboDeal) return;
    await supabase.from('combo_deals').update({ restaurant_approved: true, is_active: true }).eq('id', comboDeal.id);
    loadData();
  };

  const latestNegotiation = negotiations[negotiations.length - 1];
  const isFullyApproved = comboDeal?.theater_approved && comboDeal?.restaurant_approved;
  const canCreateDeal = !comboDeal && latestNegotiation?.is_final_offer && latestNegotiation?.sender_type === 'theater';
  const canApproveDeal = comboDeal && !comboDeal.restaurant_approved;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-5 text-sm">
        <ArrowLeft size={16} /> Back to Collaboration Center
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Negotiate Combo Deal</h1>
        <p className="text-gray-400">Discuss terms with your theater partner</p>
      </div>

      {/* Partner Info */}
      <div className="bg-gray-900 rounded-xl p-4 mb-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <Building2 size={20} className="text-blue-400" />
        </div>
        <div>
          <p className="text-white font-semibold">{request.requester_theater?.name || request.recipient_theater?.name}</p>
          <p className="text-gray-500 text-sm">Theater</p>
        </div>
        <div className="text-gray-600 text-2xl mx-2">×</div>
        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
          <UtensilsCrossed size={20} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-white font-semibold">{request.requester_restaurant?.name || request.recipient_restaurant?.name}</p>
          <p className="text-gray-500 text-sm">Restaurant</p>
        </div>
      </div>

      {/* Deal Status Banner */}
      {isFullyApproved && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-5 flex items-center gap-3">
          <CheckCircle className="text-emerald-400" size={24} />
          <div>
            <p className="text-emerald-400 font-bold text-lg">Deal is LIVE!</p>
            <p className="text-emerald-300/70 text-sm">This combo offer is now visible to customers and ready for bookings.</p>
          </div>
        </div>
      )}

      {/* Accept Final Offer Section */}
      {canCreateDeal && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-amber-400" />
            <div>
              <p className="text-amber-300 font-bold text-lg">Final Offer from Theater!</p>
              <p className="text-amber-200/70 text-sm">Review and accept to activate the combo deal.</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Customer Discount</p>
                <p className="text-white font-bold text-xl">{latestNegotiation.proposed_discount_percentage}%</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Offer Type</p>
                <p className="text-white font-medium capitalize">{latestNegotiation.offer_type.replace('_', ' ')}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Min Tickets</p>
                <p className="text-white font-medium">{latestNegotiation.min_ticket_count}+</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Your Share</p>
                <p className="text-white font-medium">{latestNegotiation.proposed_commission_split.restaurant}%</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => acceptFinalOffer(latestNegotiation)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-lg"
          >
            Accept & Activate Deal
          </button>
        </div>
      )}

      {/* Approve Deal Section */}
      {canApproveDeal && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={20} className="text-emerald-400" />
            <p className="text-emerald-300 font-bold">Deal Awaiting Your Approval</p>
          </div>
          <p className="text-emerald-200/70 text-sm mb-4">The theater has created this deal. Approve to make it visible to customers.</p>
          <button onClick={approveDeal} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl">
            Approve Deal
          </button>
        </div>
      )}

      {/* Negotiation History */}
      <div className="mb-5">
        <h3 className="text-white font-semibold mb-3">Negotiation History</h3>
        {negotiations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-900 rounded-xl">
            <MessageSquare size={24} className="mx-auto mb-2 text-gray-700" />
            <p>No proposals yet. Send your first offer below.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {negotiations.map(neg => (
              <div key={neg.id} className={`rounded-xl p-4 ${neg.sender_type === 'restaurant' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-medium ${neg.sender_type === 'restaurant' ? 'text-emerald-400' : 'text-blue-400'}`}>
                    {neg.sender_type === 'restaurant' ? 'Your Proposal' : 'Theater Proposal'}
                  </span>
                  <div className="flex items-center gap-2">
                    {neg.is_final_offer && <span className="text-amber-400 text-xs font-bold bg-amber-500/20 px-2 py-0.5 rounded">FINAL OFFER</span>}
                    <span className="text-gray-600 text-xs">{new Date(neg.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="bg-gray-900/50 rounded-lg p-2">
                    <p className="text-gray-500 text-xs">Discount</p>
                    <p className="text-white font-bold">{neg.proposed_discount_percentage}%</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-2">
                    <p className="text-gray-500 text-xs">Type</p>
                    <p className="text-white font-medium capitalize text-xs">{neg.offer_type.replace('_', ' ')}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-2">
                    <p className="text-gray-500 text-xs">Theater/Rest</p>
                    <p className="text-white font-medium text-xs">{neg.proposed_commission_split.theater}% / {neg.proposed_commission_split.restaurant}%</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-2">
                    <p className="text-gray-500 text-xs">Min Tickets</p>
                    <p className="text-white font-medium">{neg.min_ticket_count}+</p>
                  </div>
                </div>
                {neg.terms && <p className="text-gray-400 text-xs mt-2 bg-gray-900/50 rounded-lg p-2">"{neg.terms}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proposal Form */}
      {!isFullyApproved && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-white font-semibold mb-4">Send New Proposal</h3>

          {/* Discount Slider */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <Percent size={14} className="text-amber-400" /> Customer Discount
              </label>
              <span className="text-white font-bold text-lg">{form.proposed_discount_percentage}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="5"
              value={form.proposed_discount_percentage}
              onChange={e => setForm(p => ({ ...p, proposed_discount_percentage: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Commission Split */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <DollarSign size={14} className="text-emerald-400" /> Revenue Split
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                <p className="text-blue-400 text-xs mb-1">Theater Share</p>
                <p className="text-white text-xl font-bold">{form.proposed_commission_split.theater}%</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                <p className="text-emerald-400 text-xs mb-1">Your Share (Restaurant)</p>
                <p className="text-white text-xl font-bold">{form.proposed_commission_split.restaurant}%</p>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={form.proposed_commission_split.restaurant}
              onChange={e => setForm(p => ({
                ...p,
                proposed_commission_split: { theater: 100 - parseInt(e.target.value), restaurant: parseInt(e.target.value) }
              }))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Min Tickets</label>
              <select value={form.min_ticket_count} onChange={e => setForm(p => ({ ...p, min_ticket_count: parseInt(e.target.value) }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm">
                {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}+ tickets</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Offer Type</label>
              <select value={form.offer_type} onChange={e => setForm(p => ({ ...p, offer_type: e.target.value as any }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm capitalize">
                <option value="per_person">Per Person</option>
                <option value="per_family">Per Family</option>
                <option value="flat">Flat Discount</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1.5">Additional Terms</label>
            <textarea value={form.terms} onChange={e => setForm(p => ({ ...p, terms: e.target.value }))} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm resize-none" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mb-4">
            <input type="checkbox" checked={form.is_final_offer} onChange={e => setForm(p => ({ ...p, is_final_offer: e.target.checked }))} className="w-4 h-4 accent-amber-500" />
            <span className="text-amber-400 text-sm font-medium">Mark as Final Offer (they must accept or decline)</span>
          </label>

          <button onClick={sendProposal} disabled={sending} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
            {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} /> Send Proposal</>}
          </button>
        </div>
      )}
    </div>
  );
}
