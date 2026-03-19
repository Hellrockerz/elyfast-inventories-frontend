import { useState, useEffect, type ChangeEvent } from 'react';
import { db, type Item } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, ArrowLeft, Edit2, Trash2, PackagePlus, Calendar, Hash, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ItemService } from '@/lib/item-service';
import { addStockMovement } from '@/lib/stock-service';

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [shopId, setShopId] = useState('default-shop');
  
  const [newItem, setNewItem] = useState<Partial<Item>>({
    name: '',
    sellingPrice: 0,
    purchasePrice: 0,
    stockQuantity: 0,
    lowStockThreshold: 5,
    expiryDate: undefined,
    batchNumber: '',
  });

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState({ itemId: '', quantity: 1, itemName: '' });

  useEffect(() => {
    const storedShopId = localStorage.getItem('shopId');
    if (storedShopId) setShopId(storedShopId);
  }, []);

  const items = useLiveQuery(
    () => db.items
      .where('status').notEqual('deleted')
      .and(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .toArray(),
    [searchTerm]
  );

  const handleAddItem = async () => {
    if (!newItem.name) {
      toast.error("Item name is required");
      return;
    }
    
    if (newItem.sellingPrice === undefined || newItem.sellingPrice === null) {
      toast.error("Selling price is required");
      return;
    }

    const id = crypto.randomUUID();
    const item: Item = {
      id,
      shopId,
      name: newItem.name,
      sellingPrice: Number(newItem.sellingPrice),
      purchasePrice: Number(newItem.purchasePrice || 0),
      stockQuantity: Number(newItem.stockQuantity || 0),
      lowStockThreshold: Number(newItem.lowStockThreshold || 5),
      expiryDate: newItem.expiryDate ? new Date(newItem.expiryDate) : undefined,
      batchNumber: newItem.batchNumber || '',
      status: 'active',
    };

    try {
      await ItemService.addItem(item);
      setIsAddOpen(false);
      resetForm();
      toast.success("Item added successfully");
    } catch (error) {
      console.error("Failed to add item:", error);
      toast.error("Failed to save item");
    }
  };

  const handleEditItem = async () => {
    if (!editingItem || !editingItem.name) return;

    try {
      await ItemService.updateItem(editingItem);
      setIsEditOpen(false);
      setEditingItem(null);
      toast.success("Item details updated");
    } catch (error) {
      console.error("Failed to update item:", error);
      toast.error("Failed to update item");
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    toast(`Delete "${name}"?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Confirm",
        onClick: async () => {
          try {
            await ItemService.deleteItem(id, shopId);
            toast.success("Item deleted");
          } catch (error) {
            console.error("Failed to delete item:", error);
            toast.error("Failed to delete item");
          }
        }
      }
    });
  };

  const handleUpdateStock = async () => {
    const { itemId, quantity } = stockAdjustment;
    if (!itemId || !quantity) return;

    try {
      await addStockMovement(shopId, itemId, Number(quantity), 'restock');
      setIsStockOpen(false);
      setStockAdjustment({ itemId: '', quantity: 1, itemName: '' });
      toast.success("Stock quantity updated");
    } catch (error) {
      console.error("Failed to update stock:", error);
      toast.error("Failed to update stock");
    }
  };

  const resetForm = () => {
    setNewItem({ 
      name: '', 
      sellingPrice: 0, 
      purchasePrice: 0, 
      stockQuantity: 0, 
      lowStockThreshold: 5,
      expiryDate: undefined,
      batchNumber: ''
    });
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[15%] -right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-[110px] -z-10" />
      <div className="absolute bottom-[20%] -left-10 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] -z-10" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground glass">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Inventory</h1>
          </div>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger
            render={
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20">
                <Plus className="w-5 h-5 mr-2" /> Add Item
              </Button>
            }
          />
          <DialogContent className="glass border-border text-foreground backdrop-blur-3xl shadow-2xl max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Add New Item</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label>Item Name *</Label>
                <Input 
                  placeholder="Enter item name"
                  className="bg-white/5 border-white/10 h-11" 
                  value={newItem.name} 
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Selling Price (₹) *</Label>
                <Input 
                  type="number" 
                  className="bg-white/5 border-white/10 h-11"
                  value={newItem.sellingPrice || ''}
                  onChange={(e) => setNewItem({...newItem, sellingPrice: Number(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label>Purchase Price (₹)</Label>
                <Input 
                  type="number" 
                  className="bg-white/5 border-white/10 h-11"
                  value={newItem.purchasePrice || ''}
                  onChange={(e) => setNewItem({...newItem, purchasePrice: Number(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label>Current Stock</Label>
                <Input 
                  type="number" 
                  className="bg-white/5 border-white/10 h-11"
                  value={newItem.stockQuantity || ''}
                  onChange={(e) => setNewItem({...newItem, stockQuantity: Number(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label>Low Stock Alert Level</Label>
                <Input 
                  type="number" 
                  className="bg-white/5 border-white/10 h-11"
                  value={newItem.lowStockThreshold || ''}
                  onChange={(e) => setNewItem({...newItem, lowStockThreshold: Number(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Expiry Date</Label>
                <Input 
                  type="date" 
                  className="bg-white/5 border-white/10 h-11"
                  value={newItem.expiryDate ? new Date(newItem.expiryDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value ? new Date(e.target.value) : undefined})}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Hash className="w-4 h-4" /> Batch Number</Label>
                <Input 
                  placeholder="B-001"
                  className="bg-white/5 border-white/10 h-11"
                  value={newItem.batchNumber}
                  onChange={(e) => setNewItem({...newItem, batchNumber: e.target.value})}
                />
              </div>

              <Button className="w-full bg-blue-600 h-12 col-span-1 md:col-span-2 mt-2 font-bold text-lg" onClick={handleAddItem}>Save Product</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="glass border-border text-foreground backdrop-blur-3xl shadow-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label>Item Name *</Label>
                <Input 
                  className="bg-white/5 border-white/10 h-11" 
                  value={editingItem.name} 
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Selling Price (₹) *</Label>
                <Input 
                  type="number" 
                  className="bg-white/5 border-white/10 h-11"
                  value={editingItem.sellingPrice}
                  onChange={(e) => setEditingItem({...editingItem, sellingPrice: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Purchase Price (₹)</Label>
                <Input 
                  type="number" 
                  className="bg-white/5 border-white/10 h-11"
                  value={editingItem.purchasePrice || 0}
                  onChange={(e) => setEditingItem({...editingItem, purchasePrice: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Low Stock Level</Label>
                <Input 
                  type="number" 
                  className="bg-white/5 border-white/10 h-11"
                  value={editingItem.lowStockThreshold}
                  onChange={(e) => setEditingItem({...editingItem, lowStockThreshold: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Batch Number</Label>
                <Input 
                  className="bg-white/5 border-white/10 h-11"
                  value={editingItem.batchNumber || ''}
                  onChange={(e) => setEditingItem({...editingItem, batchNumber: e.target.value})}
                />
              </div>
              <Button className="w-full bg-blue-600 h-12 col-span-1 md:col-span-2 mt-2 font-bold" onClick={handleEditItem}>Update Details</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Update Dialog */}
      <Dialog open={isStockOpen} onOpenChange={setIsStockOpen}>
        <DialogContent className="glass border-border text-foreground backdrop-blur-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle>Update Stock: {stockAdjustment.itemName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantity to Add (Use negative to remove)</Label>
              <Input 
                type="number" 
                className="bg-white/5 border-white/10 h-12 text-2xl text-center"
                value={stockAdjustment.quantity}
                onChange={(e) => setStockAdjustment({...stockAdjustment, quantity: Number(e.target.value)})}
              />
            </div>
            <Button className="w-full bg-green-600 h-12 font-bold text-lg" onClick={handleUpdateStock}>Update Stock</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input 
          className="pl-10 h-12 glass border-border rounded-xl focus:border-blue-500"
          placeholder="Search items by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Items List */}
      <div className="space-y-3 pb-20">
        {items?.map((item) => (
          <GlassCard key={item.id} className="p-4 border-white/5 hover:bg-white/5 transition-colors group">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-lg font-bold truncate group-hover:text-blue-400 transition-colors">
                    {item.name}
                  </h3>
                  {item.serverId ? (
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-black border border-blue-500/20">
                      #{item.serverId}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 text-[10px] font-black border border-orange-500/20 animate-pulse">
                      SYNC PENDING
                    </span>
                  )}
                  {item.stockQuantity <= item.lowStockThreshold && (
                    <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" /> LOW STOCK
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                  <span className="text-blue-400 font-bold">₹{item.sellingPrice}</span>
                  <span className="opacity-30">|</span>
                  <span className={item.stockQuantity <= item.lowStockThreshold ? 'text-orange-400 font-medium' : ''}>
                    Stock: <span className="font-bold">{item.stockQuantity}</span>
                  </span>
                  {item.expiryDate && (
                    <>
                      <span className="opacity-30">|</span>
                      <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider">
                        <Calendar className="w-3 h-3" /> Exp: {new Date(item.expiryDate).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="glass border-white/10 text-green-400 hover:text-green-300 h-9 w-9 rounded-lg"
                  onClick={() => {
                    setStockAdjustment({ itemId: item.id, quantity: 1, itemName: item.name });
                    setIsStockOpen(true);
                  }}
                >
                  <PackagePlus className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-400 hover:text-white h-9 w-9"
                  onClick={() => {
                    setEditingItem(item);
                    setIsEditOpen(true);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-400/50 hover:text-red-400 h-9 w-9"
                  onClick={() => handleDeleteItem(item.id, item.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}
        {items?.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            No items found. Add some products to get started!
          </div>
        )}
      </div>
    </div>
  );
}
