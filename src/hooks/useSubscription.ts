import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { auth } from '@/lib/firebase';

export interface SubscriptionInfo {
  subscriptionStatus: 'pending' | 'trialing' | 'active' | 'expired';
  subscriptionValidUntil: string | null;
  planType: 'free' | 'premium';
  trialUsed: boolean;
  isAdmin: boolean;
}

const DEFAULT_SUB: SubscriptionInfo = {
  subscriptionStatus: 'pending',
  subscriptionValidUntil: null,
  planType: 'free',
  trialUsed: false,
  isAdmin: false,
};

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo>(DEFAULT_SUB);
  const [loading, setLoading] = useState(true);

  const isExpired = !subscription.isAdmin && (subscription.subscriptionStatus === 'expired' ||
    (subscription.subscriptionValidUntil &&
      new Date(subscription.subscriptionValidUntil) < new Date() &&
      subscription.subscriptionStatus !== 'active'));

  const isWriteBlocked = !subscription.isAdmin && (isExpired || subscription.subscriptionStatus === 'pending');

  const fetchSubscription = useCallback(async () => {
    const shopId = localStorage.getItem('shopId');
    if (!shopId) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get(`/subscription/status/${shopId}`);
      
      // Check admin claim from Firebase token
      let isAdmin = false;
      try {
        const user = auth.currentUser;
        if (user) {
          const tokenResult = await user.getIdTokenResult();
          isAdmin = !!tokenResult.claims.admin;
        }
      } catch {
        // Ignore admin check errors
      }

      setSubscription({
        subscriptionStatus: data.subscriptionStatus,
        subscriptionValidUntil: data.subscriptionValidUntil,
        planType: data.planType,
        trialUsed: data.trialUsed,
        isAdmin,
      });
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Listen for subscription updates (e.g., after payment)
  useEffect(() => {
    const handler = () => fetchSubscription();
    window.addEventListener('subscription-updated', handler);
    return () => window.removeEventListener('subscription-updated', handler);
  }, [fetchSubscription]);

  return {
    subscription,
    loading,
    isExpired: !!isExpired,
    isWriteBlocked: !!isWriteBlocked,
    refresh: fetchSubscription,
  };
}
