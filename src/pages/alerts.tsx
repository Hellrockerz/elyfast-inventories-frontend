import { useState, useEffect } from 'react';
import { db, type Item } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, Calendar, Package, RefreshCw, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<'stock' | 'expiry'>('stock');

  const lowStockItems = useLiveQuery(
    () => db.items
      .where('status').notEqual('deleted')
      .and(item => item.stockQuantity <= item.lowStockThreshold)
      .toArray()
  );

  const expiringItems = useLiveQuery(
    async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      return await db.items
        .where('status').notEqual('deleted')
        .and(item => !!(item.expiryDate && new Date(item.expiryDate) <= thirtyDaysFromNow))
        .toArray();
    }
  );

  return (
    <div className="min-h-screen bg-transparent text-foreground p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[10%] -left-10 w-64 h-64 bg-red-600/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-[20%] -right-10 w-80 h-80 bg-orange-600/10 rounded-full blur-[120px] -z-10" />

      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground glass">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Alerts & Notifications</h1>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-2xl mb-8 border border-white/5 shadow-inner">
        <button 
          onClick={() => setActiveTab('stock')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'stock' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'}`}
        >
          <Package className="w-4 h-4" /> Low Stock
          {lowStockItems && lowStockItems.length > 0 && <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full ml-1">{lowStockItems.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('expiry')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'expiry' ? 'bg-orange-500 text-white shadow-lg' : 'text-muted-foreground'}`}
        >
          <Calendar className="w-4 h-4" /> Expiry Soon
          {expiringItems && expiringItems.length > 0 && <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full ml-1">{expiringItems.length}</span>}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4 pb-20">
        {activeTab === 'stock' && (
          <>
            {lowStockItems?.map(item => (
              <GlassCard key={item.id} className="p-5 border-red-500/20 bg-red-500/5 transition-all hover:bg-red-500/10 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">Threshold: {item.lowStockThreshold}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-red-500">{item.stockQuantity}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Remaining</p>
                  </div>
                </div>
                <Link href="/inventory" className="flex items-center justify-between text-sm text-primary font-bold bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
                  <span>Add More Stock</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </GlassCard>
            ))}
            {lowStockItems?.length === 0 && (
              <div className="text-center py-20 text-muted-foreground bg-white/5 rounded-3xl border border-dashed border-white/10">
                <Check className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <p className="text-lg font-bold">All stock levels are healthy!</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'expiry' && (
          <>
            {expiringItems?.map(item => {
              const daysLeft = item.expiryDate ? Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
              return (
                <GlassCard key={item.id} className={`p-5 transition-all hover:bg-white/10 border-orange-500/20 bg-orange-500/5`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-3">
                       <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{item.name}</h3>
                          <p className="text-xs text-muted-foreground">Batch: {item.batchNumber || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black ${daysLeft < 7 ? 'text-red-400' : 'text-orange-400'}`}>
                        {daysLeft <= 0 ? 'EXPIRED' : `${daysLeft} Days`}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Left</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-4 pt-4 border-t border-white/5">
                    <span className="text-muted-foreground">Expiry: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</span>
                    <span className="text-muted-foreground">In Stock: {item.stockQuantity}</span>
                  </div>
                </GlassCard>
              );
            })}
            {expiringItems?.length === 0 && (
              <div className="text-center py-20 text-muted-foreground bg-white/5 rounded-3xl border border-dashed border-white/10">
                <Check className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <p className="text-lg font-bold">No items expiring soon!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
