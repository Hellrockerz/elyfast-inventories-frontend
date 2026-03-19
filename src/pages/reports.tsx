import { useState, useEffect } from 'react';
import { db, type Invoice } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Receipt, Calendar, User, IndianRupee } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ReportsPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const invoices = useLiveQuery(
    () => db.invoices.orderBy('createdAt').reverse().toArray()
  );

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

  const viewInvoiceDetails = async (invoice: Invoice) => {
    const items = await db.invoiceItems.where('invoiceId').equals(invoice.id).toArray();
    setSelectedInvoice({ ...invoice, items });
    setIsDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[10%] -left-10 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-[20%] -right-10 w-80 h-80 bg-orange-600/10 rounded-full blur-[120px] -z-10" />

      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground glass">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Sales Report</h1>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <GlassCard className="p-6 border-blue-500/20 bg-blue-600/5 relative overflow-hidden group">
          <TrendingUp className="absolute right-2 bottom-2 w-20 h-20 text-blue-500/30 group-hover:scale-110 transition-transform" />
          <p className="text-xs text-blue-400 uppercase font-bold tracking-widest mb-1">Today&apos;s Sales</p>
          <p className="text-3xl font-black flex items-center relative z-10">
            <IndianRupee className="w-6 h-6 mr-1 text-blue-400" />
            {todaySales?.total.toFixed(2) || '0.00'}
          </p>
        </GlassCard>

        <GlassCard className="p-6 border-purple-500/20 bg-purple-600/5 relative overflow-hidden group">
          <Receipt className="absolute right-2 bottom-2 w-20 h-20 text-purple-500/30 group-hover:scale-110 transition-transform" />
          <p className="text-xs text-purple-400 uppercase font-bold tracking-widest mb-1">Total Bills</p>
          <p className="text-3xl font-black relative z-10">{todaySales?.count || 0}</p>
        </GlassCard>
      </div>

      <h2 className="text-lg font-bold mb-4 px-1">Recent Invoices</h2>

      <div className="space-y-3 pb-20">
        {invoices?.map(inv => (
          <GlassCard
            key={inv.id}
            className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all"
            onClick={() => viewInvoiceDetails(inv)}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-slate-400">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">{inv.invoiceNumber}</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  <span className="mx-2 opacity-30">|</span>
                  <User className="w-3 h-3 mr-1" /> Cash
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-xl text-blue-400">₹{inv.totalAmount.toFixed(2)}</p>
              <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Paid</p>
            </div>
          </GlassCard>
        ))}
        {invoices?.length === 0 && (
          <div className="text-center py-20 text-muted-foreground opacity-50 italic">
            No sales recorded yet.
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="glass border-border text-foreground backdrop-blur-3xl shadow-2xl overflow-hidden p-0">
          <DialogHeader className="p-6 bg-white/5 border-b border-white/5">
            <h2 className="text-xl font-bold">Invoice Details</h2>
            <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
              <span>#{selectedInvoice?.invoiceNumber}</span>
              <span>{selectedInvoice?.createdAt && new Date(selectedInvoice.createdAt).toLocaleString()}</span>
            </div>
          </DialogHeader>
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Customer Info */}
            {(selectedInvoice?.customerPhone || selectedInvoice?.customerEmail) && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Customer Information</p>
                {selectedInvoice.customerPhone && (
                  <div className="flex items-center text-sm">
                    <span className="w-20 text-muted-foreground">Phone:</span>
                    <span className="font-bold">{selectedInvoice.customerPhone}</span>
                  </div>
                )}
                {selectedInvoice.customerEmail && (
                  <div className="flex items-center text-sm">
                    <span className="w-20 text-muted-foreground">Email:</span>
                    <span className="font-bold">{selectedInvoice.customerEmail}</span>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-4">
              {selectedInvoice?.items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground">₹{item.unitPrice} x {item.quantity}</p>
                  </div>
                  <p className="font-medium text-blue-400">₹{item.totalPrice.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4 mt-4">
              <div className="flex justify-between items-center text-xl font-black">
                <span>Grand Total</span>
                <span>₹{selectedInvoice?.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white/5 flex gap-2">
            <Button className="flex-1 bg-primary font-bold h-12 rounded-xl" onClick={() => window.print()}>Print</Button>
            <Button variant="outline" className="flex-1 glass border-white/10 h-12 rounded-xl" onClick={() => setIsDetailsOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
