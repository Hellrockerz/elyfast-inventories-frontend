import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LogIn, Smartphone, UserPlus, ShieldCheck, Mail, Building2, Store } from 'lucide-react';
import { cn } from '@/lib/design-system';
import {
  auth,
  GoogleAuthProvider,
  initMessaging,
  getToken
} from '@/lib/firebase';
import {
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [phoneMode, setPhoneMode] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otp, setOtp] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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

  const setupRecaptcha = () => {
    if ((window as any).recaptchaVerifier) return;
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible'
    });
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

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setupRecaptcha();
    const verifier = (window as any).recaptchaVerifier;
    try {
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
    } catch (err) {
      console.error("Phone login failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      await handleAuthSuccess(result.user.uid);
    } catch (err) {
      console.error("OTP verification failed", err);
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
    <div className="min-h-screen bg-transparent text-foreground flex items-center justify-center p-6 relative overflow-hidden">
      {/* Recaptcha Container */}
      <div id="recaptcha-container"></div>

      {/* Background Blobs */}
      <div className="absolute top-[10%] -left-20 w-80 h-80 bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[10%] -right-20 w-96 h-96 bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[130px] -z-10" />

      <GlassCard className="w-full max-w-xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-border relative z-10 transition-all duration-700">
        <div className="text-center mb-10 pt-4">
          <div className="w-full flex items-center justify-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.png" 
              alt="Elyfast Inventories Logo" 
              className="w-full max-w-[480px] h-auto object-contain dark:invert drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]" 
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Elyfast Inventories</h1>
          <p className="text-muted-foreground mt-2">
            {!showRegister ? 'Start your digital shop in seconds' : 'Complete your shop profile'}
          </p>
        </div>

        {!showRegister ? (
          <div className="space-y-6">
            {!phoneMode ? (
              <div className="space-y-4">
                <Button
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 h-12 rounded-xl font-bold flex items-center justify-center space-x-3 shadow-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                  <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
                </Button>
                <Button
                  disabled={loading}
                  onClick={() => setPhoneMode(true)}
                  className="w-full bg-slate-800 border border-white/10 text-white hover:bg-slate-700 h-12 rounded-xl font-bold flex items-center justify-center space-x-3 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>Continue with Phone</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {!confirmationResult ? (
                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <Input
                          placeholder="+91 99999 99999"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus:border-blue-500"
                          type="tel"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 h-12 rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50">
                      {loading ? 'Sending OTP...' : 'Get OTP'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Enter OTP</Label>
                      <Input
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-blue-500 text-center tracking-widest text-xl"
                        maxLength={6}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 h-12 rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50">
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </Button>
                  </form>
                )}
                <button
                  type="button"
                  onClick={() => { setPhoneMode(false); setConfirmationResult(null); }}
                  className="w-full text-muted-foreground text-sm hover:text-foreground py-2"
                >
                  ← Other options
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4 max-h-[400px] overflow-y-auto px-1 pr-2">
            <div className="space-y-2">
              <Label>Shop Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <Input name="shopName" required placeholder="Enter shop name" className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus:border-blue-500" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Full Name / Owner Name</Label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <Input name="ownerName" required placeholder="Enter your name" className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus:border-blue-500" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <Input name="phone" defaultValue={phoneNumber} required placeholder="+91 99999 99999" className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus:border-blue-500" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>GST Number (Optional)</Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <Input name="gst" placeholder="Enter GSTIN" className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus:border-blue-500" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Business Type</Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <select
                  name="businessType"
                  defaultValue="pharmacy"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none text-white disabled:opacity-50"
                  required
                >
                  <option value="pharmacy" className="bg-slate-900">Pharmacy</option>
                  <option value="retail" className="bg-slate-900">Retail / General Store</option>
                  <option value="grocery" className="bg-slate-900">Grocery</option>
                </select>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-blue-600 h-14 rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 mt-4 active:scale-95 transition-all disabled:opacity-50">
              {loading ? 'Creating Shop...' : 'Register Shop'}
            </Button>
          </form>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
          Trusted by 5000+ local shops
        </div>
      </GlassCard>
    </div>
  );
}
