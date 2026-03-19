import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { GlassCard } from '@/components/GlassCard';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Clear Firebase session
        await signOut(auth);

        // Clear local storage
        localStorage.clear();

        // Short delay for visual feedback
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } catch (err) {
        console.error("Logout failed", err);
        router.push('/dashboard');
      }
    };

    handleLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 relative overflow-hidden">
      <GlassCard className="w-full max-w-sm p-10 text-center space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl mx-auto flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Signing Out</h1>
          <p className="text-muted-foreground">Cleaning up your session...</p>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Elyfast Inventories</p>
      </GlassCard>
    </div>
  );
}
