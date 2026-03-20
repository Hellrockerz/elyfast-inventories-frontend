import React from 'react';
import Link from 'next/link';
import { AlertCircle, CreditCard } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { isPreviewModeActive } from '@/lib/preview-mode';

export const SubscriptionBanner: React.FC = () => {
  const { isExpired, isWriteBlocked, subscription, loading } = useSubscription();

  if (loading || (!isExpired && !isWriteBlocked)) return null;

  // Don't show banner in preview mode
  if (isPreviewModeActive()) return null;

  // Don't show banner on billing or login pages (handled by router)
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path === '/billing' || path === '/login' || path === '/') return null;
  }

  const daysLeft = subscription.subscriptionValidUntil
    ? Math.max(0, Math.ceil((new Date(subscription.subscriptionValidUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Show warning if expiring in < 7 days
  const isWarning = !isExpired && daysLeft <= 7 && daysLeft > 0;

  if (isExpired || subscription.subscriptionStatus === 'pending') {
    return (
      <div className="fixed top-0 left-0 w-full bg-gradient-to-r from-red-600 to-red-500 text-white text-xs sm:text-sm font-bold text-center py-2.5 z-[100] flex flex-wrap justify-center items-center gap-2 sm:gap-3 px-4 shadow-lg animate-in slide-in-from-top">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>
          {subscription.subscriptionStatus === 'pending'
            ? 'Activate your subscription to start using all features.'
            : 'Your subscription has expired. You can view records but cannot create or edit.'}
        </span>
        <Link
          href="/billing"
          className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors uppercase tracking-wider text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0"
        >
          <CreditCard className="w-3 h-3" />
          Subscribe Now
        </Link>
      </div>
    );
  }

  if (isWarning) {
    return (
      <div className="fixed top-0 left-0 w-full bg-gradient-to-r from-amber-600 to-orange-500 text-white text-xs sm:text-sm font-bold text-center py-2.5 z-[100] flex flex-wrap justify-center items-center gap-2 sm:gap-3 px-4 shadow-lg">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Your subscription expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. Renew now to avoid interruption.</span>
        <Link
          href="/billing"
          className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors uppercase tracking-wider text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0"
        >
          <CreditCard className="w-3 h-3" />
          Renew
        </Link>
      </div>
    );
  }

  return null;
};
