import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/data/db';
import { GlassCard } from '@/components/GlassCard';
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { Button } from '@/components/ui/button';

export function DashboardCharts() {
  const [days, setDays] = useState<7 | 30>(7);

  // Data fetching
  const chartData = useLiveQuery(async () => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - days + 1);

    const invoices = await db.cache_sales.where('createdAt').aboveOrEqual(startDate.getTime()).toArray();
    const items = await db.cache_products.toArray();
    const itemCostMap = new Map(items.map(i => [i.id, i.purchasePrice || 0]));

    const invoiceIds = invoices.map(i => i.id);
    const invoiceItems = await db.cache_sale_items.where('invoiceId').anyOf(invoiceIds).toArray();

    // Group by day - Map from Date string to Entry
    // Map preserves insertion order, so we insert chronologically
    const dataMap = new Map<string, { date: string; sales: number; profit: number }>();
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dataMap.set(dateStr, { date: dateStr, sales: 0, profit: 0 });
    }

    for (const inv of invoices) {
      if (inv.status === 'Draft' || inv.status === 'Cancelled' || inv.status === 'deleted') continue;
      
      const invDate = new Date(inv.createdAt);
      const dateStr = invDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const entry = dataMap.get(dateStr);
      if (entry) {
        entry.sales += inv.totalAmount;
        const itemsForInv = invoiceItems.filter(ii => ii.invoiceId === inv.id);
        const cost = itemsForInv.reduce((sum, ii) => sum + (ii.quantity * (itemCostMap.get(ii.itemId) || 0)), 0);
        entry.profit += (inv.totalAmount - cost);
      }
    }

    return Array.from(dataMap.values());
  }, [days]);

  return (
    <GlassCard className="p-6 border-white/5 space-y-6 mt-10">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold">Sales & Profit Overview</h2>
          <p className="text-sm text-muted-foreground">Monitor your revenue and margins over time.</p>
        </div>
        <div className="flex gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setDays(7)}
            className={`rounded-lg px-4 h-8 transition-colors ${days === 7 ? 'bg-white text-slate-900 dark:bg-white/10 dark:text-white shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'}`}
          >
            7 Days
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setDays(30)}
            className={`rounded-lg px-4 h-8 transition-colors ${days === 30 ? 'bg-white text-slate-900 dark:bg-white/10 dark:text-white shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'}`}
          >
            30 Days
          </Button>
        </div>
      </div>

      <div className="h-[350px] w-full mt-4">
        {chartData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888888', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888888', fontSize: 12 }}
                tickFormatter={(val) => `₹${val}`}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(10, 10, 10, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ fontWeight: 'bold' }}
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Area type="monotone" dataKey="sales" name="Sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
        )}
      </div>
    </GlassCard>
  );
}
