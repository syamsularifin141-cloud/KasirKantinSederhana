import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { MenuItem, CartItem } from '../types';
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';

const CATEGORIES = ['semua', 'makanan', 'minuman', 'snack'];

export default function Cashier() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('semua');
  const [paidAmount, setPaidAmount] = useState<number>(0);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setMenuItems(data))
      .catch(err => console.error('Failed to fetch menu items:', err));
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (itemId: number, amount: number) => {
    setCart(prevCart => {
      return prevCart
        .map(item => {
          if (item.id === itemId) {
            return { ...item, quantity: item.quantity + amount };
          }
          return item;
        })
        .filter(item => item.quantity > 0);
    });
  };
  
  const handlePayment = async () => {
    const finalTotal = total;
    if (paidAmount < finalTotal) {
      alert('Uang pembayaran tidak cukup!');
      return;
    }

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total: finalTotal, items: cart }),
      });

      if (response.ok) {
        const change = paidAmount - finalTotal;
        alert(`Pembayaran berhasil! Kembalian Anda: ${formatRupiah(change)}. Terima kasih telah berbelanja.`);
        setCart([]);
        setPaidAmount(0);
      } else {
        alert('Gagal mencatat transaksi.');
      }
    } catch (error) {
      console.error('Failed to record sale:', error);
      alert('Terjadi kesalahan saat mencatat transaksi.');
    }
  };

  const total = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);

  const filteredMenuItems = activeCategory === 'semua'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-3 font-sans">
      {/* Main Content - Menu */}
      <main className="lg:col-span-2 p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-stone-800">Kantin Kejujuran</h1>
          <p className="text-stone-600 mt-1">Pilih menu yang tersedia di bawah ini. <Link to="/login" className="text-sm text-stone-500 hover:underline">(Login Admin)</Link></p>
        </header>

        {/* Category Filters */}
        <div className="flex space-x-2 mb-8 border-b border-stone-300 pb-3">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors capitalize ${
                activeCategory === category
                  ? 'bg-[#5A5A40] text-white'
                  : 'bg-white text-stone-700 hover:bg-stone-200'
              }`}>
              {category}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMenuItems.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col group border border-stone-200">
              <div className="p-2 flex flex-col flex-grow">
                <h3 className="font-semibold text-xs text-stone-800 flex-grow mb-1">{item.name}</h3>
                <p className="text-xs text-stone-500 mb-2">{formatRupiah(item.selling_price)}</p>
                <button 
                  onClick={() => addToCart(item)}
                  className="w-full bg-[#5A5A40] text-white text-xs font-semibold py-1 rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center">
                    <Plus size={12} className="mr-1"/> Tambah
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Sidebar - Cart */}
      <aside className="lg:col-span-1 bg-white p-6 lg:p-8 flex flex-col h-screen lg:sticky top-0">
        <h2 className="text-2xl font-bold font-serif text-stone-800 mb-6">Pesanan Saya</h2>
        
        {cart.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center text-stone-500">
            <ShoppingCart size={48} className="mb-4"/>
            <p className="font-semibold">Keranjang masih kosong</p>
            <p className="text-sm">Tambahkan item dari menu untuk memulai.</p>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto -mr-4 pr-4">
            {cart.map(item => (
              <div key={item.id} className="flex items-center mb-4">
                
                <div className="flex-grow">
                  <p className="font-semibold text-stone-800">{item.name}</p>
                  <p className="text-sm text-stone-500">{formatRupiah(item.selling_price)}</p>
                </div>
                <div className="flex items-center bg-stone-100 rounded-full">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-2 text-stone-600 hover:text-red-500 transition-colors rounded-full">
                    {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                  </button>
                  <span className="px-3 font-semibold text-stone-800">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-2 text-stone-600 hover:text-green-500 transition-colors rounded-full">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-stone-200 pt-6 mt-auto">
            <div className="flex justify-between items-center mb-4">
                <span className="text-stone-600">Subtotal</span>
                <span className="font-semibold text-stone-800">{formatRupiah(total)}</span>
            </div>
             
            <div className="flex justify-between items-center text-xl font-bold mb-4">
                <span className="text-stone-800">Total</span>
                <span className="text-[#5A5A40]">{formatRupiah(total)}</span>
            </div>

            <div className="space-y-2 border-t border-stone-200 pt-4">
                <div className="flex justify-between items-center">
                    <label htmlFor="paidAmount" className="text-stone-600 font-medium">Bayar</label>
                    <input 
                        type="number"
                        id="paidAmount"
                        value={paidAmount || ''}
                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                        className="w-36 text-right font-semibold text-lg text-stone-800 bg-stone-100 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]"
                        placeholder="0"
                    />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-stone-600 font-medium">Kembalian</span>
                    <span className="font-semibold text-lg text-stone-800">{formatRupiah(Math.max(0, paidAmount - total))}</span>
                </div>
            </div>
            <button 
              onClick={handlePayment}
              disabled={cart.length === 0 || paidAmount < total}
              className="w-full bg-[#5A5A40] text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed">
              Bayar Sekarang
            </button>
        </div>
      </aside>
    </div>
  );
}