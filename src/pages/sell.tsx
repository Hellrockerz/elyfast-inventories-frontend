import { useState, useEffect, type ChangeEvent } from 'react';
import { db, type Item } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Minus, Trash2, ArrowLeft, Check, ShoppingCart, Printer, MessageCircle, X, User } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface BillItem extends Item {
  billingQuantity: number;
}

export default function SellPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [shopId, setShopId] = useState('default-shop');
  const [shopName, setShopName] = useState('My Shop');
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  useEffect(() => {
    const sId = localStorage.getItem('shopId');
    const sName = localStorage.getItem('shopName');
    if (sId) setShopId(sId);
    if (sName) setShopName(sName);
  }, []);

  // Real-time search in IndexedDB
  const searchResults = useLiveQuery(
    async () => {
      if (!searchTerm) return [];
      const results = await db.items
        .where('status').notEqual('deleted')
        .and(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (item.barcode ? item.barcode.includes(searchTerm) : false)
        )
        .limit(5)
        .toArray();
      setSelectedIndex(0);
      return results;
    },
    [searchTerm]
  );

  const addToBill = (item: Item) => {
    const existing = billItems.find(i => i.id === item.id);
    if (existing) {
      setBillItems(billItems.map(i => 
        i.id === item.id ? { ...i, billingQuantity: i.billingQuantity + 1 } : i
      ));
    } else {
      setBillItems([...billItems, { ...item, billingQuantity: 1 }]);
    }
    setSearchTerm('');
    setSelectedIndex(0);
  };

  const calculateTotal = () => {
    return billItems.reduce((acc, item) => acc + (item.sellingPrice * item.billingQuantity), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!searchResults || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      addToBill(searchResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      setSearchTerm('');
    }
  };

  const handleCheckout = async () => {
    if (billItems.length === 0) {
      toast.error("Bill is empty! Add items before completing the sale.");
      return;
    }

    const invoiceId = crypto.randomUUID();
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const invoice = {
      id: invoiceId,
      shopId,
      invoiceNumber,
      customerPhone: customerPhone || undefined,
      customerEmail: customerEmail || undefined,
      totalAmount: calculateTotal(),
      discountAmount: 0,
      taxAmount: 0,
      paymentMethod: 'cash',
      createdAt: new Date(),
      status: 'active',
    };

    const invoiceItemsData = billItems.map(item => ({
      id: crypto.randomUUID(),
      invoiceId,
      itemId: item.id,
      itemName: item.name,
      quantity: item.billingQuantity,
      unitPrice: item.sellingPrice,
      totalPrice: item.sellingPrice * item.billingQuantity,
    }));

    await db.transaction('rw', [db.invoices, db.invoiceItems, db.stockMovements, db.items, db.syncQueue], async () => {
      await db.invoices.add(invoice);
      
      for (const invItem of invoiceItemsData) {
        await db.invoiceItems.add(invItem);

        // Record stock movement
        await db.stockMovements.add({
          id: crypto.randomUUID(),
          shopId,
          itemId: invItem.itemId,
          quantityChange: -invItem.quantity,
          reason: 'sale',
          referenceId: invoiceId,
          createdAt: new Date(),
        });

        // Update local items table
        const localItem = await db.items.get(invItem.itemId);
        if (localItem) {
          await db.items.update(invItem.itemId, {
            stockQuantity: localItem.stockQuantity - invItem.quantity
          });
        }
      }

      // Sync op
      await db.syncQueue.add({
        id: invoiceId,
        shopId,
        deviceId: 'browser-main',
        operationType: 'create_invoice',
        resourceType: 'invoices',
        payload: { invoice, items: invoiceItemsData },
        status: 'pending',
        createdAt: Date.now(),
      });
    });

    setLastInvoice({ ...invoice, items: invoiceItemsData });
    setIsSuccessOpen(true);
    setBillItems([]);
    setCustomerPhone('');
    setCustomerEmail('');
  };

  const clearBill = () => {
    // Clears bill instantly for a faster POS workflow, without confirm blocking
    setBillItems([]);
    setCustomerPhone('');
    setCustomerEmail('');
  };

  const shareWhatsApp = () => {
    if (!lastInvoice) return;
    const text = `*Invoice from ${shopName}*\nNo: ${lastInvoice.invoiceNumber}\nTotal: ₹${lastInvoice.totalAmount}\n\nItems:\n${lastInvoice.items.map((i: any) => `- ${i.itemName} x${i.quantity}: ₹${i.totalPrice}`).join('\n')}\n\nThank you for shopping!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground p-4 relative overflow-hidden print:p-0">
      {/* Non-print area */}
      <div className="print:hidden">
        {/* Background Blobs */}
        <div className="absolute top-[5%] -left-10 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-[10%] -right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px] -z-10" />

        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground glass">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold font-heading">New Sale</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{shopName}</p>
          </div>
        </div>

        {/* Search Section */}
        <div className="relative mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input 
              className="pl-10 h-14 glass border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-lg"
              placeholder="Search items or scan barcode..."
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          {/* Search Results */}
          {searchTerm && (
            <GlassCard className="absolute top-full left-0 right-0 z-50 mt-2 p-2 max-h-80 overflow-y-auto overflow-x-hidden shadow-2xl border-white/10">
              {searchResults?.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`flex justify-between items-center p-4 rounded-xl cursor-pointer transition-colors ${index === selectedIndex ? 'bg-primary/20 shadow-md border border-primary/30' : 'hover:bg-primary/10'}`}
                  onClick={() => addToBill(item)}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-bold text-lg truncate">{item.name}</p>
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${item.stockQuantity <= 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/10 text-green-400/80'}`}>
                        {item.stockQuantity} in stock
                      </span>
                      {item.barcode && <span className="text-[10px] text-muted-foreground opacity-50 font-mono truncate">#{item.barcode}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-blue-400 text-xl">₹{item.sellingPrice}</p>
                    <Button size="sm" variant={index === selectedIndex ? 'default' : 'outline'} className="h-7 px-3 rounded-lg mt-1 border-white/5 font-bold">
                      {index === selectedIndex ? 'Add (Enter)' : 'Add +'}
                    </Button>
                  </div>
                </div>
              ))}
              {searchResults?.length === 0 && (
                <div className="p-8 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Search className="w-8 h-8 text-muted-foreground opacity-30" />
                  </div>
                  <p className="text-muted-foreground mb-4">No items matching &quot;{searchTerm}&quot;</p>
                  <Link href="/inventory">
                    <Button variant="secondary" className="rounded-xl"><Plus className="w-4 h-4 mr-2" /> Add to Inventory</Button>
                  </Link>
                </div>
              )}
            </GlassCard>
          )}
        </div>

        {/* Customer Information (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              className="pl-10 glass border-white/5 rounded-xl h-11"
              placeholder="Customer Phone (Optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              className="pl-10 glass border-white/5 rounded-xl h-11"
              placeholder="Customer Email (Optional)"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Bill Items */}
        <div className="space-y-4 mb-32 overflow-y-auto max-h-[60vh] pb-10">
          {billItems.length === 0 ? (
            <div className="text-center py-20 text-slate-500 opacity-30 select-none">
              <ShoppingCart className="w-20 h-20 mx-auto mb-4" />
              <p className="text-xl font-bold">Bill is empty</p>
            </div>
          ) : (
            billItems.map(item => (
              <GlassCard key={item.id} className="p-4 flex justify-between items-center border-white/5 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex-1">
                  <p className="font-bold text-lg">{item.name}</p>
                  <p className="text-xs text-muted-foreground">₹{item.sellingPrice} per unit</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                    <button 
                      className="p-3 hover:bg-white/10 transition-colors"
                      onClick={() => setBillItems(billItems.map(i => i.id === item.id ? { ...i, billingQuantity: Math.max(1, i.billingQuantity - 1) } : i))}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-lg">{item.billingQuantity}</span>
                    <button 
                      className="p-3 hover:bg-white/10 transition-colors"
                      onClick={() => {
                        if (item.billingQuantity >= item.stockQuantity) {
                          toast.warning(`Only ${item.stockQuantity} in stock. Proceeding anyway.`);
                        }
                        setBillItems(billItems.map(i => i.id === item.id ? { ...i, billingQuantity: i.billingQuantity + 1 } : i));
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-400/50 hover:text-red-400 ml-2"
                    onClick={() => setBillItems(billItems.filter(i => i.id !== item.id))}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {/* Checkout Bar */}
        {billItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-6 z-50">
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/60 to-transparent -z-10 px-4" />
            <div className="max-w-4xl mx-auto p-2 bg-white dark:bg-slate-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden flex items-stretch border border-black/10 dark:border-white/10 backdrop-blur-3xl">
              <Button 
                type="button"
                variant="ghost" 
                className="px-8 h-auto rounded-2xl text-red-500 dark:text-red-400 hover:!bg-red-50 dark:hover:!bg-red-500/10 font-bold transition-all"
                onClick={clearBill}
              >
                Cancel
              </Button>
              
              <div className="flex-1 flex justify-between items-center px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">TOTAL BILL</span>
                  <div className="flex items-baseline text-slate-900 dark:text-white">
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-500 mr-2">₹</span>
                    <span className="text-4xl font-black tracking-tighter">{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  className="h-16 px-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-2xl shadow-xl shadow-blue-600/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-blue-400/20"
                  onClick={handleCheckout}
                >
                  Complete Sale
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Success Modal */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="glass border-border text-foreground backdrop-blur-3xl shadow-2xl p-0 overflow-hidden print:hidden">
          <div className="bg-green-500/20 p-8 text-center relative">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-500/30">
              <Check className="w-12 h-12 text-white stroke-[3px]" />
            </div>
            <h2 className="text-2xl font-bold">Sale Completed!</h2>
            <p className="text-muted-foreground">Invoice #{lastInvoice?.invoiceNumber}</p>
            <button 
              onClick={() => setIsSuccessOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="text-2xl font-black">₹{lastInvoice?.totalAmount?.toFixed(2)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-14 rounded-xl border-white/10 glass font-bold text-lg"
                onClick={printInvoice}
              >
                <Printer className="w-5 h-5 mr-2" /> Print
              </Button>
              <Button 
                variant="outline" 
                className="h-14 rounded-xl border-white/10 glass font-bold text-lg text-emerald-400"
                onClick={shareWhatsApp}
              >
                <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-14 rounded-xl border-white/10 glass font-bold text-lg text-blue-400"
                onClick={() => toast.info("PDF download starting...")}
              >
                Download PDF
              </Button>
              <Button 
                className="w-full h-14 bg-primary rounded-xl font-bold text-lg"
                onClick={() => setIsSuccessOpen(false)}
              >
                New Sale
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print-only Invoice Layout */}
      {lastInvoice && (
        <div className="hidden print:block text-black bg-white min-h-screen p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold uppercase">{shopName}</h1>
            <p className="text-gray-600">Tax Invoice / Bill of Supply</p>
          </div>
          
          <div className="flex justify-between border-b pb-4 mb-4">
            <div>
              <p className="font-bold text-xl">Invoice: #{lastInvoice.invoiceNumber}</p>
              <p className="text-sm text-gray-500">Date: {new Date(lastInvoice.createdAt).toLocaleString()}</p>
            </div>
            {(lastInvoice.customerPhone || lastInvoice.customerEmail) && (
              <div className="text-right text-sm">
                <p className="font-bold opacity-30 uppercase text-[10px]">Customer Info</p>
                {lastInvoice.customerPhone && <p>{lastInvoice.customerPhone}</p>}
                {lastInvoice.customerEmail && <p>{lastInvoice.customerEmail}</p>}
              </div>
            )}
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2">Item</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lastInvoice.items.map((item: any) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2 font-medium">{item.itemName}</td>
                  <td className="py-2 text-right">x{item.quantity}</td>
                  <td className="py-2 text-right">₹{item.unitPrice}</td>
                  <td className="py-2 text-right">₹{item.totalPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end pr-0">
            <div className="w-64 space-y-2">
              <div className="flex justify-between border-t border-black pt-2 font-black text-2xl">
                <span>Grand Total</span>
                <span>₹{lastInvoice.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="mt-20 text-center text-gray-400 italic">
            <p>Thank you for shopping with us!</p>
            <p className="text-xs uppercase tracking-widest mt-2">Generated by Elyfast Stocks</p>
          </div>
        </div>
      )}
    </div>
  );
}
