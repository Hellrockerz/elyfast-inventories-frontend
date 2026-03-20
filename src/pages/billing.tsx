import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GlassCard } from '@/components/GlassCard';
import { ArrowLeft, CreditCard, Gift, CheckCircle, Clock, AlertCircle, Crown, IndianRupee, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';

export default function BillingPage() {
  const router = useRouter();
  const { subscription, loading: subLoading, refresh, isExpired, isWriteBlocked } = useSubscription();
  const [promoCode, setPromoCode] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [pendingTxn, setPendingTxn] = useState<string | null>(null);
  const [pollingPayment, setPollingPayment] = useState(false);

  const shopId = typeof window !== 'undefined' ? localStorage.getItem('shopId') : null;

  // Calculate days remaining
  const daysLeft = subscription.subscriptionValidUntil
    ? Math.max(0, Math.ceil((new Date(subscription.subscriptionValidUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Apply promo code
  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !shopId) return;
    setApplyingPromo(true);
    try {
      const { data } = await api.post('/subscription/apply-promo', {
        shopId,
        code: promoCode.trim(),
      });
      toast.success(data.message || 'Promo code applied!');
      setPromoCode('');
      await refresh();
      window.dispatchEvent(new Event('subscription-updated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply promo code');
    } finally {
      setApplyingPromo(false);
    }
  };

  // Create payment order and open UroPay payment link
  const handlePayNow = async () => {
    if (!shopId) return;
    setCreatingOrder(true);
    try {
      const { data } = await api.post('/subscription/create-order', { shopId });
      setPendingTxn(data.transactionId);

      // Open the UroPay payment link in a new tab
      const paymentUrl = data.paymentLink || 'https://urpy.link/NaggUR';
      window.open(paymentUrl, '_blank');

      toast.info('Payment page opened. Complete the UPI payment and we\'ll activate your subscription automatically.');
      // Start polling for payment status
      startPolling(data.transactionId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setCreatingOrder(false);
    }
  };

  // Poll payment status
  const startPolling = (txnId: string) => {
    setPollingPayment(true);
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/payments/verify/${txnId}`);
        if (data.status === 'success') {
          clearInterval(interval);
          setPollingPayment(false);
          setPendingTxn(null);
          toast.success('Payment confirmed! Your subscription is now active.');
          await refresh();
          window.dispatchEvent(new Event('subscription-updated'));
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setPollingPayment(false);
          setPendingTxn(null);
          toast.error('Payment failed. Please try again.');
        }
      } catch {
        // Polling error, continue
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setPollingPayment(false);
    }, 300000);
  };

  const statusConfig = {
    active: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Active', border: 'border-green-500/20' },
    trialing: { icon: Gift, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Free Trial', border: 'border-blue-500/20' },
    expired: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Expired', border: 'border-red-500/20' },
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Not Activated', border: 'border-amber-500/20' },
  };

  const currentStatus = statusConfig[subscription.subscriptionStatus] || statusConfig.pending;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="min-h-screen bg-transparent text-foreground p-6 pb-24 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[10%] -left-20 w-80 h-80 bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute top-[40%] -right-20 w-60 h-60 bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[100px] -z-10" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center cursor-pointer active:scale-90 transition-transform hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </div>
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tighter">Billing & Subscription</h1>
          <p className="text-muted-foreground text-sm">Manage your plan and promo codes</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Current Plan Status */}
        <GlassCard className={`p-6 ${currentStatus.border}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${currentStatus.bg} flex items-center justify-center`}>
                <StatusIcon className={`w-7 h-7 ${currentStatus.color}`} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Current Plan</p>
                <p className="text-2xl font-black">{currentStatus.label}</p>
                {subscription.subscriptionValidUntil && (
                  <p className={`text-sm font-medium ${isExpired ? 'text-red-400' : 'text-muted-foreground'}`}>
                    {isExpired
                      ? `Expired on ${new Date(subscription.subscriptionValidUntil).toLocaleDateString()}`
                      : `${daysLeft} days remaining`
                    }
                  </p>
                )}
              </div>
            </div>
            {subscription.planType === 'premium' && !isExpired && (
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                <Crown className="w-3 h-3" />
                Premium
              </div>
            )}
          </div>
        </GlassCard>

        {/* Monthly Plan */}
        <GlassCard className="p-6 border-blue-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-bl from-blue-600/10 to-transparent w-40 h-40 rounded-bl-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-blue-500" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-blue-400">Monthly Plan</p>
            </div>
            <div className="flex items-end gap-1 mb-4">
              <IndianRupee className="w-6 h-6 text-blue-500 mb-1" />
              <span className="text-5xl font-black">129</span>
              <span className="text-muted-foreground font-medium mb-1">/month</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Unlimited inventory items</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Create, edit & delete records</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Full invoicing & billing</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Reports & analytics</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Cloud sync across devices</li>
            </ul>
            <Button
              onClick={handlePayNow}
              disabled={creatingOrder || pollingPayment}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-14 rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creatingOrder ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Creating Order...</>
              ) : pollingPayment ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Waiting for Payment...</>
              ) : (
                <><CreditCard className="w-5 h-5" /> Pay ₹129 with UPI</>
              )}
            </Button>
          </div>
        </GlassCard>

        {/* Pending Transaction */}
        {pendingTxn && (
          <GlassCard className="p-5 border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
              <div>
                <p className="font-bold text-sm">Payment Pending</p>
                <p className="text-xs text-muted-foreground">Transaction ID: {pendingTxn}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete the UPI payment. We&apos;ll detect it automatically (may take 30–60 seconds after payment).
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Promo Code Section */}
        {!subscription.trialUsed && (
          <GlassCard className="p-6 border-emerald-500/10">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-emerald-500" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Have a Promo Code?</p>
            </div>
            <div className="flex gap-3">
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="h-12 bg-white/5 border-white/10 rounded-xl font-mono text-lg uppercase tracking-widest"
                maxLength={20}
              />
              <Button
                onClick={handleApplyPromo}
                disabled={applyingPromo || !promoCode.trim()}
                className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold active:scale-95 transition-all disabled:opacity-50"
              >
                {applyingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
              </Button>
            </div>
          </GlassCard>
        )}

        {subscription.trialUsed && (
          <GlassCard className="p-4 border-white/5">
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Promo code already used for this shop
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
