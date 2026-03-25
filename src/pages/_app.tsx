import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { isPreviewModeActive, exitPreviewMode } from "@/lib/preview-mode";
import { useRouter } from "next/router";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { SyncEngine } from "@/data/sync-engine";

export default function App({ Component, pageProps }: AppProps) {
  const [isPreview, setIsPreview] = useState(false);
  const router = useRouter();
  const { isExpired, isWriteBlocked, subscription } = useSubscription();

  // Initialize Sync Engine
  useEffect(() => {
    SyncEngine.start();
  }, []);

  // Cleanup stale service workers in dev mode to prevent 404 spam
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  useEffect(() => {
    setIsPreview(isPreviewModeActive());
  }, [router.pathname]);

  // Listen for 402 subscription-expired events from API interceptor
  useEffect(() => {
    const handleExpired = () => {
      if (subscription.isAdmin) return; // Admins are exempt from redirection
      
      toast.error('Your subscription has expired. Redirecting to billing...', {
        duration: 3000,
      });
      setTimeout(() => {
        router.push('/billing');
      }, 1500);
    };
    window.addEventListener('subscription-expired', handleExpired);
    return () => window.removeEventListener('subscription-expired', handleExpired);
  }, [router, subscription.isAdmin]);

  const handleExitPreview = async () => {
    await exitPreviewMode();
    setIsPreview(false);
    window.location.href = '/';
  };

  // Determine if the banner should show on this page
  const exemptPages = ['/', '/login', '/billing'];
  const showBanner = !exemptPages.includes(router.pathname) && !isPreview;

  // Check if banner is actually visible (expired/pending/warning within 7 days)
  const daysLeft = subscription.subscriptionValidUntil
    ? Math.max(0, Math.ceil((new Date(subscription.subscriptionValidUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isWarning = !isExpired && daysLeft <= 7 && daysLeft > 0;
  const bannerVisible = showBanner && (isExpired || isWriteBlocked || isWarning);

  // padding classes
  const paddingClass = isPreview && bannerVisible ? "pt-20" : isPreview ? "pt-8" : bannerVisible ? "pt-12" : "";

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {isPreview && (
        <div className="fixed top-0 left-0 w-full bg-blue-600 text-white text-xs font-bold text-center py-2 z-[100] flex justify-center items-center gap-4 shadow-lg">
          <span>You are in Preview Mode. Changes are temporary and will not be saved.</span>
          <button onClick={handleExitPreview} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors uppercase tracking-wider text-[10px]">
            Exit Preview
          </button>
        </div>
      )}
      {showBanner && <SubscriptionBanner />}
      <div className={paddingClass}>
        <Component {...pageProps} />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

