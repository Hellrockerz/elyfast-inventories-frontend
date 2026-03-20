import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GlassCard } from '@/components/GlassCard';
import { ShoppingCart, Package, BarChart2, Settings, LogOut, Bell, IndianRupee, AlertCircle } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSync } from '@/hooks/useSync';
import { DashboardCharts } from '@/components/DashboardCharts';

export default function Dashboard() {
  const [userName, setUserName] = useState('Shopkeeper');
  const [shopName, setShopName] = useState('Elyfast Inventories');
  const [shopId, setShopId] = useState<string | undefined>(undefined);
  const router = useRouter();

  // Initialize sync hook with shopId for reconciliation
  useSync(shopId);

  useEffect(() => {
    const name = localStorage.getItem('ownerName');
    const sName = localStorage.getItem('shopName');
    const sId = localStorage.getItem('shopId');
    if (name) setUserName(name);
    if (sName) setShopName(sName);
    if (sId) setShopId(sId);
  }, []);

  const todaySales = useLiveQuery(
    async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayInvoices = await db.invoices
        .where('createdAt')
        .above(today)
        .toArray();

      return {
        total: todayInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0),
        count: todayInvoices.length
      };
    }
  );

  const lowStockCount = useLiveQuery(
    () => db.items
      .where('status').notEqual('deleted')
      .and(item => item.stockQuantity <= item.lowStockThreshold)
      .count()
  );

  const expiringSoonCount = useLiveQuery(
    async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return await db.items
        .where('status').notEqual('deleted')
        .and(item => !!(item.expiryDate && new Date(item.expiryDate) <= thirtyDaysFromNow))
        .count();
    }
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      router.push('/');
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const actions = [
    { title: 'Sell', icon: ShoppingCart, href: '/sell', color: 'bg-blue-600' },
    { title: 'Inventory', icon: Package, href: '/inventory', color: 'bg-indigo-600' },
    { title: 'Reports', icon: BarChart2, href: '/reports', color: 'bg-emerald-600' },
    { title: 'Alerts', icon: Bell, href: '/alerts', color: 'bg-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-transparent text-foreground p-6 pb-24 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[10%] -left-20 w-80 h-80 bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute top-[40%] -right-20 w-60 h-60 bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-[20%] w-96 h-96 bg-emerald-600/5 dark:bg-emerald-600/10 rounded-full blur-[130px] -z-10" />

      {/* Header */}
      <div className="flex justify-between items-center mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">
              {shopName}
            </h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Welcome back, {userName}
          </p>
        </div>
      </div>
        <div className="flex items-center space-x-3">
          <Link href="/settings">
            <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center cursor-pointer active:scale-90 transition-transform hover:bg-white/5">
              <Settings className="w-6 h-6 text-foreground/80" />
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center cursor-pointer active:scale-95 transition-transform hover:bg-red-500/20"
          >
            <LogOut className="w-6 h-6 text-red-400" />
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <Link href="/reports" className="block">
          <GlassCard className="p-5 border-blue-500/10 bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer group">
            <p className="text-[10px] uppercase font-bold tracking-widest text-blue-400 mb-1">Today&apos;s Revenue</p>
            <p className="text-3xl font-black flex items-center">
              <IndianRupee className="w-5 h-5 mr-1 text-blue-500/50" />
              {(todaySales?.total ?? 0).toFixed(2)}
            </p>
            <div className="mt-2 flex items-center text-[10px] font-bold text-muted-foreground group-hover:text-blue-400 transition-colors">
              VIEW DETAILS <BarChart2 className="w-3 h-3 ml-1" />
            </div>
          </GlassCard>
        </Link>
        <Link href="/alerts" className="block">
          <GlassCard className="p-5 border-orange-500/10 bg-orange-500/5 hover:bg-orange-500/10 transition-colors cursor-pointer group">
            <p className="text-[10px] uppercase font-bold tracking-widest text-orange-400 mb-1">Critical Alerts</p>
            <p className="text-3xl font-black text-orange-500">
              {(lowStockCount || 0) + (expiringSoonCount || 0)}
            </p>
            <div className="mt-2 flex items-center text-[10px] font-bold text-muted-foreground group-hover:text-orange-400 transition-colors">
              CHECK ITEMS <AlertCircle className="w-3 h-3 ml-1" />
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Grid Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link href={action.href} key={action.title}>
            <GlassCard className="flex flex-col items-center justify-center py-8 space-y-3 active:scale-95 transition-transform cursor-pointer hover:bg-white/5 border-white/5">
              <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center shadow-xl shadow-${action.color.split('-')[1]}-500/20`}>
                <action.icon className="w-7 h-7 text-white" />
              </div>
              <span className="font-bold tracking-tight">{action.title}</span>
            </GlassCard>
          </Link>
        ))}
      </div>

      <DashboardCharts />

      {/* Sync Status Overlay */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="px-5 py-2.5 rounded-full glass backdrop-blur-2xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 shadow-2xl">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span>Local Sync Active</span>
        </div>
      </div>
    </div>
  );
}
