import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';

interface Product {
    id: number;
    name: string;
    purchase_price: number;
    selling_price: number;
    category: string;
    image?: string;
}

interface User {
    id: number;
    username: string;
    role: string;
}

export default function Admin() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [newProduct, setNewProduct] = useState({ name: '', purchase_price: '', selling_price: '', category: 'makanan', image: '' });
    const [newUser, setNewUser] = useState({ username: '', password: '' });
    const [users, setUsers] = useState<User[]>([]);
    const [salesSummary, setSalesSummary] = useState({ totalRevenue: 0, totalCost: 0, totalProfit: 0 });
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
            if (response.ok) {
                alert(`Pengguna ${newUser.username} berhasil didaftarkan!`);
                setNewUser({ username: '', password: '' });
                fetchUsers(); // Refresh user list
            } else {
                const data = await response.json();
                alert(`Gagal mendaftarkan pengguna: ${data.error}`);
            }
        } catch (error) {
            console.error('Error registering user:', error);
            alert('Terjadi kesalahan saat mendaftarkan pengguna.');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const fetchSalesSummary = async () => {
        try {
            const query = new URLSearchParams();
            if (startDate) query.append('startDate', startDate);
            if (endDate) query.append('endDate', endDate);

            const response = await fetch(`/api/sales/summary?${query.toString()}`);
            const data = await response.json();
            setSalesSummary(data);
        } catch (error) {
            console.error('Failed to fetch sales summary:', error);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        console.log('Attempting to delete user with ID:', userId);

        if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
            try {
                const response = await fetch(`/api/users/${userId}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    alert('Pengguna berhasil dihapus.');
                    fetchUsers(); // Refresh user list
                } else {
                    const data = await response.json();
                    console.error('Failed to delete user:', data);
                    alert(`Gagal menghapus pengguna: ${data.error || 'Error tidak diketahui'}`);
                }
            } catch (error) {
                console.error('Failed to delete user:', error);
                alert('Terjadi kesalahan saat menghapus pengguna.');
            }
        }
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const products = results.data.map((row: any) => ({
                        name: row.name,
                        purchase_price: parseFloat(row.purchase_price),
                        selling_price: parseFloat(row.selling_price),
                        category: row.category
                    }));

                    try {
                        const response = await fetch('/api/products/bulk', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ products })
                        });
                        if(response.ok) {
                            alert('Produk berhasil diimpor!');
                            fetchProducts(); // Refresh product list
                        } else {
                            alert('Gagal mengimpor produk.');
                        }
                    } catch (error) {
                        console.error('Failed to import products:', error);
                        alert('Terjadi kesalahan saat mengimpor produk.');
                    }
                }
            });
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchUsers();
        fetchSalesSummary();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newProduct,
                    purchase_price: parseFloat(newProduct.purchase_price),
                    selling_price: parseFloat(newProduct.selling_price),
                }),
            });
            if (response.ok) {
                fetchProducts();
                setNewProduct({ name: '', purchase_price: '', selling_price: '', category: 'makanan', image: '' });
            } else {
                console.error('Failed to add product');
            }
        } catch (error) {
            console.error('Error submitting product:', error);
        }
    };
    
    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(number);
      };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Dasbor Admin</h1>
                <button 
                    onClick={() => navigate('/')}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                    Logout
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-bold mb-4">Laporan Laba</h2>
                <div className="flex items-center gap-4 mb-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                        <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border rounded" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Tanggal Selesai</label>
                        <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border rounded" />
                    </div>
                    <button onClick={fetchSalesSummary} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 self-end">Filter</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-600">Total Pendapatan</h3>
                        <p className="text-3xl font-bold text-green-600">{formatRupiah(salesSummary.totalRevenue)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-600">Total Modal</h3>
                        <p className="text-3xl font-bold text-red-600">{formatRupiah(salesSummary.totalCost)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-600">Laba Bersih</h3>
                        <p className="text-3xl font-bold text-blue-600">{formatRupiah(salesSummary.totalProfit)}</p>
                    </div>
                </div>
            </div>

            {/* Sales Summary */}
            
            
            {/* Add Product Form */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-bold mb-4">Daftar Pengguna Baru</h2>
                <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="username" value={newUser.username} onChange={handleUserInputChange} placeholder="Username" className="p-2 border rounded" required />
                    <input name="password" value={newUser.password} onChange={handleUserInputChange} placeholder="Password" type="password" className="p-2 border rounded" required />
                    <button type="submit" className="bg-green-500 text-white p-2 rounded hover:bg-green-600 md:col-span-2">Daftarkan Pengguna</button>
                </form>

                <h2 className="text-2xl font-bold mb-4 mt-8">Daftar Pengguna</h2>
                <table className="w-full table-auto border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 border">ID</th>
                            <th className="p-2 border">Username</th>
                            <th className="p-2 border">Role</th>
                            <th className="p-2 border">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="p-2 border">{user.id}</td>
                                <td className="p-2 border">{user.username}</td>
                                <td className="p-2 border capitalize">{user.role}</td>
                                <td className="p-2 border text-center">
                                    <button onClick={() => handleDeleteUser(user.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">Hapus</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Tambah Produk Baru</h2>
                    <div className="flex items-center gap-4">
                        <a href="/products_template.csv" download="products_template.csv" className="text-sm text-teal-600 hover:underline">Unduh Template</a>
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 transition-colors"
                        >
                            Impor dari CSV
                        </button>
                    </div>
                    <input 
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".csv"
                        onChange={handleFileImport}
                    />
                </div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="name" value={newProduct.name} onChange={handleInputChange} placeholder="Nama Produk" className="p-2 border rounded" required />
                    <input name="purchase_price" value={newProduct.purchase_price} onChange={handleInputChange} placeholder="Harga Beli (Kolakan)" type="number" className="p-2 border rounded" required />
                    <input name="selling_price" value={newProduct.selling_price} onChange={handleInputChange} placeholder="Harga Jual" type="number" className="p-2 border rounded" required />
                    <select name="category" value={newProduct.category} onChange={handleInputChange} className="p-2 border rounded">
                        <option value="makanan">Makanan</option>
                        <option value="minuman">Minuman</option>
                        <option value="snack">Snack</option>
                    </select>
                    <input name="image" value={newProduct.image} onChange={handleInputChange} placeholder="URL Gambar (Opsional)" className="p-2 border rounded md:col-span-2" />
                    <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 md:col-span-2">Tambah Produk</button>
                </form>
            </div>

            

            {/* Products Table */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Daftar Produk</h2>
                <table className="w-full table-auto border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 border">Nama</th>
                            <th className="p-2 border">Harga Beli</th>
                            <th className="p-2 border">Harga Jual</th>
                            <th className="p-2 border">Kategori</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id}>
                                <td className="p-2 border">{product.name}</td>
                                <td className="p-2 border">{formatRupiah(product.purchase_price)}</td>
                                <td className="p-2 border">{formatRupiah(product.selling_price)}</td>
                                <td className="p-2 border capitalize">{product.category}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
