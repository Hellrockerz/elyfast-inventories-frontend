import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { isPreviewModeActive, exitPreviewMode } from "@/lib/preview-mode";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const [isPreview, setIsPreview] = useState(false);
  const router = useRouter();

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

  const handleExitPreview = async () => {
    await exitPreviewMode();
    setIsPreview(false);
    window.location.href = '/';
  };

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
      <div className={isPreview ? "pt-8" : ""}>
        <Component {...pageProps} />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
