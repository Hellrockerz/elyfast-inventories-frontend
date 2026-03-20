import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GlassCard } from '@/components/GlassCard';
import { ArrowLeft, Users, Gift, CreditCard, Crown, CheckCircle, XCircle, ToggleLeft, ToggleRight, Plus, IndianRupee, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { auth } from '@/lib/firebase';

interface ShopData {
  id: number;
  uuid: string;
  name: string;
  ownerName: string;
  ownerId: string;
  businessType: string;
  subscriptionStatus: string;
  subscriptionValidUntil: string | null;
  planType: string;
  trialUsed: boolean;
  createdAt: string;
}

interface PromoCodeData {
  id: number;
  code: string;
  daysGranted: number;
  usageLimit: number;
  currentUsage: number;
  isActive: boolean;
  createdAt: string;
}

interface PaymentData {
  id: number;
  shopId: number;
  transactionId: string;
  amount: string;
  status: string;
  paymentMethod: string;
  daysGranted: number;
  promoCodeUsed: string | null;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { subscription } = useSubscription();
  const [activeTab, setActiveTab] = useState<'shops' | 'promos' | 'payments'>('shops');
  const [shops, setShops] = useState<ShopData[]>([]);
  const [promos, setPromos] = useState<PromoCodeData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string>('');

  // New promo form
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDays, setNewPromoDays] = useState('60');
  const [newPromoLimit, setNewPromoLimit] = useState('1000');
  const [creatingPromo, setCreatingPromo] = useState(false);

  useEffect(() => {
    const getToken = async () => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        setAuthToken(token);
      }
    };
    getToken();
  }, []);

  useEffect(() => {
    if (!subscription.isAdmin) {
      // Redirect non-admins
      if (!loading) {
        toast.error('Admin access required');
        router.push('/dashboard');
      }
      return;
    }
    fetchData();
  }, [subscription.isAdmin]);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${authToken}` },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shopsRes, promosRes, paymentsRes] = await Promise.all([
        api.get('/admin/shops', getHeaders()),
        api.get('/admin/promo-codes', getHeaders()),
        api.get('/admin/payments', getHeaders()),
      ]);
      setShops(shopsRes.data.shops || []);
      setPromos(promosRes.data.promoCodes || []);
      setPayments(paymentsRes.data.payments || []);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Admin access required');
        router.push('/dashboard');
      } else {
        toast.error('Failed to fetch admin data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePromo = async (id: number) => {
    try {
      await api.put(`/admin/promo-codes/${id}/toggle`, {}, getHeaders());
      toast.success('Promo code toggled');
      fetchData();
    } catch {
      toast.error('Failed to toggle promo code');
    }
  };

  const handleCreatePromo = async () => {
    if (!newPromoCode.trim()) return;
    setCreatingPromo(true);
    try {
      await api.post('/admin/promo-codes', {
        code: newPromoCode.trim(),
        daysGranted: Number(newPromoDays),
        usageLimit: Number(newPromoLimit),
      }, getHeaders());
      toast.success('Promo code created');
      setNewPromoCode('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create promo code');
    } finally {
      setCreatingPromo(false);
    }
  };

  const handleOverrideSubscription = async (shopId: number, action: 'activate' | 'expire') => {
    try {
      const body = action === 'activate'
        ? {
            subscriptionStatus: 'active',
            subscriptionValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            planType: 'premium',
          }
        : { subscriptionStatus: 'expired' };

      await api.put(`/admin/shops/${shopId}/subscription`, body, getHeaders());
      toast.success(`Shop subscription ${action === 'activate' ? 'activated for 30 days' : 'expired'}`);
      fetchData();
    } catch {
      toast.error('Failed to update subscription');
    }
  };

  if (!subscription.isAdmin && !loading) {
    return null;
  }

  const tabs = [
    { key: 'shops', label: 'Shops', icon: Users, count: shops.length },
    { key: 'promos', label: 'Promo Codes', icon: Gift, count: promos.length },
    { key: 'payments', label: 'Payments', icon: CreditCard, count: payments.length },
  ];

  return (
    <div className="min-h-screen bg-transparent text-foreground p-6 pb-24 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[10%] -left-20 w-80 h-80 bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute top-[40%] -right-20 w-60 h-60 bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[100px] -z-10" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center cursor-pointer active:scale-90 transition-transform hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </div>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tighter">Admin Panel</h1>
            <Shield className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-muted-foreground text-sm">Manage users, subscriptions & promo codes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'glass text-muted-foreground hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-white/20' : 'bg-white/5'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* SHOPS TAB */}
          {activeTab === 'shops' && shops.map((shop) => (
            <GlassCard key={shop.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-lg">{shop.name}</p>
                  <p className="text-sm text-muted-foreground">{shop.ownerName || 'No owner name'} • {shop.businessType}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full ${
                      shop.subscriptionStatus === 'active' ? 'bg-green-500/10 text-green-500' :
                      shop.subscriptionStatus === 'trialing' ? 'bg-blue-500/10 text-blue-500' :
                      shop.subscriptionStatus === 'expired' ? 'bg-red-500/10 text-red-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {shop.subscriptionStatus}
                    </span>
                    {shop.subscriptionValidUntil && (
                      <span className="text-xs text-muted-foreground">
                        Until {new Date(shop.subscriptionValidUntil).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOverrideSubscription(shop.id, 'activate')}
                    size="sm"
                    className="bg-green-600 hover:bg-green-500 text-white text-xs h-8"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" /> Activate
                  </Button>
                  <Button
                    onClick={() => handleOverrideSubscription(shop.id, 'expire')}
                    size="sm"
                    variant="destructive"
                    className="text-xs h-8"
                  >
                    <XCircle className="w-3 h-3 mr-1" /> Expire
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}

          {/* PROMOS TAB */}
          {activeTab === 'promos' && (
            <>
              {/* Create Promo */}
              <GlassCard className="p-5 border-emerald-500/10">
                <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-3 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Create New Promo Code
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                    placeholder="CODE"
                    className="h-10 bg-white/5 border-white/10 rounded-lg font-mono uppercase"
                  />
                  <Input
                    value={newPromoDays}
                    onChange={(e) => setNewPromoDays(e.target.value)}
                    placeholder="Days"
                    type="number"
                    className="h-10 bg-white/5 border-white/10 rounded-lg"
                  />
                  <Input
                    value={newPromoLimit}
                    onChange={(e) => setNewPromoLimit(e.target.value)}
                    placeholder="Usage limit"
                    type="number"
                    className="h-10 bg-white/5 border-white/10 rounded-lg"
                  />
                  <Button
                    onClick={handleCreatePromo}
                    disabled={creatingPromo || !newPromoCode.trim()}
                    className="h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                  >
                    {creatingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                  </Button>
                </div>
              </GlassCard>

              {/* Promos List */}
              {promos.map((promo) => (
                <GlassCard key={promo.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${promo.isActive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        <Gift className={`w-5 h-5 ${promo.isActive ? 'text-emerald-500' : 'text-red-500'}`} />
                      </div>
                      <div>
                        <p className="font-bold font-mono text-lg tracking-wider">{promo.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {promo.daysGranted} days • {promo.currentUsage}/{promo.usageLimit} used
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTogglePromo(promo.id)}
                      className="flex items-center gap-2 text-sm font-bold transition-colors"
                    >
                      {promo.isActive ? (
                        <><ToggleRight className="w-8 h-8 text-emerald-500" /> <span className="text-emerald-500 text-xs">Active</span></>
                      ) : (
                        <><ToggleLeft className="w-8 h-8 text-red-500" /> <span className="text-red-500 text-xs">Inactive</span></>
                      )}
                    </button>
                  </div>
                </GlassCard>
              ))}
            </>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && payments.map((payment) => (
            <GlassCard key={payment.id} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm font-bold">{payment.transactionId}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Shop #{payment.shopId} • {payment.paymentMethod.toUpperCase()} • {payment.daysGranted} days
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" />
                    {Number(payment.amount).toFixed(2)}
                  </p>
                  <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full ${
                    payment.status === 'success' ? 'bg-green-500/10 text-green-500' :
                    payment.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
