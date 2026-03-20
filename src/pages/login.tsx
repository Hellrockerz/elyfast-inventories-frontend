import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';
import { LogIn, Smartphone, UserPlus, ShieldCheck, Mail, Building2, Store, Home, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/design-system';
import Link from 'next/link';
import {
  auth,
  GoogleAuthProvider,
  initMessaging,
  getToken
} from '@/lib/firebase';
import {
  signInWithPopup
} from 'firebase/auth';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Request notification permission on mount
    const setupFCM = async () => {
      const messagingInstance = await initMessaging();
      if (messagingInstance) {
        requestPermission(messagingInstance);
      }
    };
    setupFCM();
  }, []);

  const requestPermission = async (messagingInstance: any) => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messagingInstance, {
          vapidKey: 'BMGc-n425T8RgQgbh-LqvWrZ21-jyLGEe3osYS0fHZM-kM5O12_FM90Y-CLNe_P6FeAVrTihlkqrnCZtdok9NjA'
        });
        console.log('FCM Token:', token);
        localStorage.setItem('fcmToken', token);
      }
    } catch (err) {
      console.warn("FCM Permission denied or failed", err);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleAuthSuccess(result.user.uid);
    } catch (err) {
      console.error("Google login failed", err);
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (uid: string) => {
    setLoading(true);
    setOwnerId(uid);
    try {
      const { data } = await api.get(`/auth/check/${uid}`);

      if (data.exists) {
        localStorage.setItem('shopId', data.shopId);
        localStorage.setItem('shopName', data.shopName);
        localStorage.setItem('ownerName', data.ownerName || 'Shopkeeper');
        // Store subscription info
        if (data.subscriptionStatus) {
          localStorage.setItem('subscriptionStatus', data.subscriptionStatus);
        }
        if (data.subscriptionValidUntil) {
          localStorage.setItem('subscriptionValidUntil', data.subscriptionValidUntil);
        }
        if (data.trialUsed !== undefined) {
          localStorage.setItem('trialUsed', String(data.trialUsed));
        }
        router.push('/dashboard');
      } else {
        setShowRegister(true);
      }
    } catch (err) {
      console.error("Auth check failed", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const shopData = {
      ownerId,
      name: formData.get('shopName'),
      ownerName: formData.get('ownerName'),
      phone: formData.get('phone'),
      gst: formData.get('gst'),
      businessType: formData.get('businessType') || 'pharmacy'
    };

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', shopData);

      if (data.status === 'success') {
        localStorage.setItem('shopId', data.shopId);
        localStorage.setItem('shopName', String(shopData.name));
        localStorage.setItem('ownerName', String(shopData.ownerName) || 'Shopkeeper');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error("Registration failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] text-foreground flex flex-col transition-colors duration-500">
      
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-black/5 dark:border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 md:px-12">
          <Link href="/" className="flex items-center space-x-1 text-slate-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-[10%] -left-20 w-80 h-80 bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-[10%] -right-20 w-96 h-96 bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[130px] -z-10" />

        <GlassCard className="w-full max-w-xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-slate-200 dark:border-white/10 relative z-10 transition-all duration-700 bg-white/70 dark:bg-black/40 backdrop-blur-2xl">
          <div className="text-center mb-10 pt-4">
            <div className="w-full flex items-center justify-center mb-8">
              <div className="w-32 h-32 bg-slate-100 dark:bg-white/5 rounded-2xl p-4 flex items-center justify-center shadow-inner group">
                <Logo className="w-full h-full object-contain dark:invert drop-shadow-[0_5px_15px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110 duration-500" />
              </div>
            </div>
            <p className="text-slate-500 dark:text-gray-400 mt-2">
              {!showRegister ? 'Start your digital shop in seconds' : 'Complete your shop profile'}
            </p>
          </div>

          {!showRegister ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <Button
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 h-12 rounded-xl font-bold flex items-center justify-center space-x-3 shadow-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                  <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 max-h-[400px] overflow-y-auto px-1 pr-2 custom-scrollbar">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-gray-300">Shop Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                  <Input name="shopName" required placeholder="Enter shop name" className="pl-10 h-12 bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-gray-300">Full Name / Owner Name</Label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                  <Input name="ownerName" required placeholder="Enter your name" className="pl-10 h-12 bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-gray-300">Phone Number</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                  <Input name="phone" required placeholder="+91 99999 99999" className="pl-10 h-12 bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-gray-300">GST Number (Optional)</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                  <Input name="gst" placeholder="Enter GSTIN" className="pl-10 h-12 bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-gray-300">Business Type</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                  <select
                    name="businessType"
                    defaultValue="pharmacy"
                    className="w-full h-12 bg-white/50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none text-slate-900 dark:text-white"
                    required
                  >
                    <option value="pharmacy">Pharmacy</option>
                    <option value="retail">Retail / General Store</option>
                    <option value="grocery">Grocery</option>
                  </select>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white h-14 rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 mt-4 active:scale-95 transition-all disabled:opacity-50">
                {loading ? 'Creating Shop...' : 'Register Shop'}
              </Button>
            </form>
          )}

          {/* Footer Info */}
          <div className="mt-8 text-center text-slate-400 dark:text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
            Trusted by 5000+ local shops
          </div>
        </GlassCard>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
