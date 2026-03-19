import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Moon, Sun, Monitor, LogOut, Shield, Bell, User } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState('Shopkeeper');
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const name = localStorage.getItem('ownerName');
    if (name) setUserName(name);
  }, []);

  // Avoid hydration mismatch
  if (!mounted) return null;

  const themeOptions = [
    { name: 'Light', value: 'light', icon: Sun },
    { name: 'Dark', value: 'dark', icon: Moon },
    { name: 'System', value: 'system', icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-transparent text-foreground p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8 relative z-10">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full glass">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        {/* Profile Section */}
        <GlassCard className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
            {userName[0]}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{userName}</h2>
            <p className="text-muted-foreground">Store Owner</p>
          </div>
        </GlassCard>

        {/* Theme Settings */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-2">Appearance</h3>
          <GlassCard className="p-0 overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-border">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`flex flex-col items-center justify-center py-6 transition-all ${theme === option.value
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                >
                  <option.icon className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">{option.name}</span>
                  {theme === option.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  )}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* General Settings */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-2">General</h3>
          <GlassCard className="p-0 divide-y divide-border overflow-hidden">
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Notifications</span>
              </div>
              <div className="w-10 h-5 bg-primary/20 rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-primary rounded-full" />
              </div>
            </button>
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-emerald-500" />
                <span className="font-medium">Security & Privacy</span>
              </div>
              <ArrowLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
            </button>
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Account Details</span>
              </div>
              <ArrowLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
            </button>
          </GlassCard>
        </div>

        {/* Danger Zone */}
        <div className="pt-4">
          <Link href="/logout">
            <Button variant="destructive" className="w-full h-14 rounded-2xl flex items-center justify-center space-x-2 font-bold shadow-lg shadow-destructive/20">
              <LogOut className="w-5 h-5" />
              <span>Logout from Elyfast</span>
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Elyfast Inventories v1.0.0 • Made with ❤️ for local businesses
        </p>
      </div>
    </div>
  );
}
