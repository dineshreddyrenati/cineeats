import { useEffect, useState } from 'react';
import { Users, Mail, Send, CheckCircle, XCircle, MessageSquare, Clock, ArrowLeft, ChevronRight } from 'lucide-react';
import { supabase, Theater, Restaurant, CollaborationRequest, DealNegotiation, ComboDeal } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import DealNegotiationPanel from './DealNegotiationPanel';

interface Props {
  onBack: () => void;
}

export default function CollaborationCenter({ onBack }: Props) {
  const { user } = useAuth();
  const [theater, setTheater] = useState<Theater | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'new'>('incoming');
  const [selectedRequest, setSelectedRequest] = useState<CollaborationRequest | null>(null);
  const [newRequest, setNewRequest] = useState({ restaurant_id: '', message: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setError(null);

    const { data: theaterData, error: theaterError } = await supabase
      .from('theaters')
      .select('*')
      .eq('owner_id', user!.id)
      .maybeSingle();

    if (theaterError) {
      console.error('Error loading theater:', theaterError);
      setError('Failed to load theater data');
      return;
    }

    setTheater(theaterData);

    // Load restaurants regardless of theater status
    const { data: restaurantsData, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true);

    if (restaurantsError) {
      console.error('Error loading restaurants:', restaurantsError);
    } else {
      setRestaurants(restaurantsData || []);
    }

    // Only load requests if theater exists
    if (theaterData) {
      const { data: requestsData, error: requestsError } = await supabase
        .from('collaboration_requests')
        .select('*')
        .or(`and(requester_type.eq.theater,requester_id.eq.${theaterData.id}),and(recipient_type.eq.theater,recipient_id.eq.${theaterData.id})`)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error loading requests:', requestsError);
        setError('Failed to load collaboration requests');
      } else if (requestsData) {
        // Fetch related theater and restaurant data for each request
        const enrichedRequests = await Promise.all(
          requestsData.map(async (req: any) => {
            let requesterTheater, requesterRestaurant, recipientTheater, recipientRestaurant;

            if (req.requester_type === 'theater') {
              const { data } = await supabase.from('theaters').select('*').eq('id', req.requester_id).maybeSingle();
              requesterTheater = data;
            } else {
              const { data } = await supabase.from('restaurants').select('*').eq('id', req.requester_id).maybeSingle();
              requesterRestaurant = data;
            }

            if (req.recipient_type === 'theater') {
              const { data } = await supabase.from('theaters').select('*').eq('id', req.recipient_id).maybeSingle();
              recipientTheater = data;
            } else {
              const { data } = await supabase.from('restaurants').select('*').eq('id', req.recipient_id).maybeSingle();
              recipientRestaurant = data;
            }

            return { ...req, requester_theater: requesterTheater, requester_restaurant: requesterRestaurant, recipient_theater: recipientTheater, recipient_restaurant: recipientRestaurant };
          })
        );
        setRequests((enrichedRequests || []) as CollaborationRequest[]);
      }
    }
  };

  const sendRequest = async () => {
    if (!theater || !newRequest.restaurant_id) {
      setError('Please select a restaurant');
      return;
    }

    setSending(true);
    setError(null);

    const { error: insertError } = await supabase.from('collaboration_requests').insert({
      requester_type: 'theater',
      requester_id: theater.id,
      recipient_type: 'restaurant',
      recipient_id: newRequest.restaurant_id,
      message: newRequest.message,
      status: 'pending',
    });

    if (insertError) {
      console.error('Error sending request:', insertError);
      setError('Failed to send collaboration request: ' + insertError.message);
    } else {
      setSuccess('Collaboration request sent successfully!');
      setNewRequest({ restaurant_id: '', message: '' });
      setActiveTab('outgoing');
      setTimeout(() => setSuccess(null), 3000);
      loadData();
    }

    setSending(false);
  };

  const respondRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    setError(null);

    const { error: updateError } = await supabase
      .from('collaboration_requests')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error responding to request:', updateError);
      setError('Failed to respond to request: ' + updateError.message);
      return;
    }

    // If accepted, automatically open negotiation panel
    if (status === 'accepted') {
      await loadData();
      const acceptedReq = requests.find(r => r.id === requestId);
      if (acceptedReq) setSelectedRequest(acceptedReq);
    } else {
      loadData();
    }
  };

  const withdrawRequest = async (requestId: string) => {
    setError(null);

    const { error: updateError } = await supabase
      .from('collaboration_requests')
      .update({ status: 'withdrawn' })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error withdrawing request:', updateError);
      setError('Failed to withdraw request: ' + updateError.message);
    } else {
      loadData();
    }
  };

  const incomingRequests = requests.filter(r => r.recipient_type === 'theater' && r.recipient_id === theater?.id && r.status === 'pending');
  const outgoingRequests = requests.filter(r => r.requester_type === 'theater' && r.requester_id === theater?.id);
  const activeRequests = requests.filter(r => r.status === 'accepted');

  if (selectedRequest) {
    return (
      <DealNegotiationPanel
        request={selectedRequest}
        theaterId={theater!.id}
        onBack={() => { setSelectedRequest(null); loadData(); }}
      />
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-5 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Collaboration Center</h1>
        <p className="text-gray-400">Partner with restaurants for exclusive combo deals</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5 flex items-center gap-3">
          <XCircle size={20} className="text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-5 flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-400" />
          <p className="text-emerald-400 text-sm">{success}</p>
        </div>
      )}

      {!theater && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-5">
          <p className="text-amber-300 text-sm">Please set up your theater first in Theater Setup.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-white">{incomingRequests.length}</p>
          <p className="text-gray-500 text-xs">Incoming Requests</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-white">{outgoingRequests.filter(r => r.status === 'pending').length}</p>
          <p className="text-gray-500 text-xs">Pending Sent</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-400">{activeRequests.length}</p>
          <p className="text-gray-500 text-xs">Active Partnerships</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { id: 'incoming', label: 'Incoming' },
          { id: 'outgoing', label: 'My Requests' },
          { id: 'new', label: 'Send Request' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setError(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Incoming Requests */}
      {activeTab === 'incoming' && (
        incomingRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Mail size={32} className="mx-auto mb-3 text-gray-700" />
            <p>No pending collaboration requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {incomingRequests.map(req => (
              <div key={req.id} className="bg-gray-900 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold">Restaurant Partnership Request</p>
                    <p className="text-gray-500 text-sm">From {req.requester_restaurant?.name || 'Unknown Restaurant'}</p>
                    <p className="text-gray-600 text-xs mt-1">{new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full text-xs font-medium">
                      <Clock size={10} /> Pending
                    </span>
                  </div>
                </div>
                {req.message && (
                  <p className="text-gray-400 text-sm bg-gray-800 rounded-lg p-3 mb-3">"{req.message}"</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => respondRequest(req.id, 'accepted')}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    <CheckCircle size={14} /> Accept & Negotiate
                  </button>
                  <button
                    onClick={() => respondRequest(req.id, 'declined')}
                    className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    <XCircle size={14} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Outgoing Requests */}
      {activeTab === 'outgoing' && (
        outgoingRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Send size={32} className="mx-auto mb-3 text-gray-700" />
            <p>No requests sent yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {outgoingRequests.map(req => {
              const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
                pending: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Pending' },
                accepted: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Accepted' },
                declined: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Declined' },
                withdrawn: { color: 'text-gray-400', bg: 'bg-gray-700', label: 'Withdrawn' },
              };
              const status = statusConfig[req.status] || statusConfig.pending;
              return (
                <div key={req.id} className="bg-gray-900 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{req.recipient_restaurant?.name || 'Unknown Restaurant'}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1 ${status.bg} ${status.color} px-2 py-1 rounded-full text-xs font-medium`}>
                        {status.label}
                      </span>
                      {req.status === 'accepted' && (
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                        >
                          <MessageSquare size={12} /> Negotiate
                        </button>
                      )}
                      {req.status === 'pending' && (
                        <button
                          onClick={() => withdrawRequest(req.id)}
                          className="text-gray-500 hover:text-red-400 text-xs"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                  {req.message && <p className="text-gray-400 text-sm mt-2 bg-gray-800 rounded-lg p-2">"{req.message}"</p>}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* New Request Form */}
      {activeTab === 'new' && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-white font-semibold mb-4">Send Collaboration Request to Restaurant</h3>
          {!theater ? (
            <p className="text-amber-400 text-sm">You need to set up your theater first before sending requests.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Select Restaurant</label>
                <select
                  value={newRequest.restaurant_id}
                  onChange={e => setNewRequest(p => ({ ...p, restaurant_id: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Choose a restaurant partner</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name} - {r.city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Message (optional)</label>
                <textarea
                  value={newRequest.message}
                  onChange={e => setNewRequest(p => ({ ...p, message: e.target.value }))}
                  placeholder="Introduce your theater and why you'd like to partner..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
          {theater && (
            <button
              onClick={sendRequest}
              disabled={sending || !newRequest.restaurant_id}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Send size={16} /> Send Collaboration Request</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
