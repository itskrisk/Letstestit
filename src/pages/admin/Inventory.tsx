import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Package,
    Plus,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Tag,
    Store,
    ArrowRight,
    X,
    ChevronRight,
    Boxes,
    Layers,
    TrendingUp
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Product } from '../../types/schema';

export default function Inventory() {
    const [products, setProducts] = useState<any[]>([]);
    const [merchants, setMerchants] = useState<any[]>([]);

    useEffect(() => {
        const fetchMerchants = async () => {
            const { data } = await supabase.from('profiles').select('*').eq('role', 'merchant');
            if (data) {
                setMerchants(data.map(m => ({
                    id: m.id,
                    businessName: m.business_name || m.full_name || 'Partner',
                })));
            }
        };
        fetchMerchants();
    }, []);
    const [searchQuery, setSearchQuery] = useState('');
    const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMerchant = merchantFilter === 'ALL' || product.merchantId === merchantFilter;
        return matchesSearch && matchesMerchant;
    });

    const stats = {
        total: products.length,
        outOfStock: products.filter(p => (p.stockLevel || 0) <= 5).length,
        totalValue: products.reduce((acc, p) => acc + (p.price * (p.stockLevel || 50)), 0),
        merchants: merchants.length
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-3">
                        Global Catalog <span className="text-xs bg-black text-white px-2 py-1 rounded-full">{products.length}</span>
                    </h1>
                    <p className="text-sm text-gray-400 font-medium">Multi-tenant inventory orchestration • Muncheez Network</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 bg-white border border-gray-100 shadow-sm rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
                        <Layers size={18} /> Bulk Upload
                    </button>
                    <button className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 shadow-lg shadow-black/10 transition-all flex items-center gap-2">
                        <Plus size={18} /> Add Global Product
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InventoryStat label="Total SKU Count" value={stats.total.toString()} icon={Package} color="black" />
                <InventoryStat label="Low Stock Alert" value={stats.outOfStock.toString()} icon={AlertTriangle} color="red" />
                <InventoryStat label="Asset Valuation" value={`KES ${(stats.totalValue / 1000).toFixed(1)}K`} icon={TrendingUp} color="emerald" />
                <InventoryStat label="Partner Stores" value={stats.merchants.toString()} icon={Store} color="blue" />
            </div>

            {/* Catalog Management */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-8 border-b border-gray-50 flex flex-col lg:flex-row gap-6 items-center justify-between bg-gray-50/20">
                    <div className="relative w-full lg:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Find products by name or SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-white border border-transparent rounded-2xl text-sm font-medium focus:border-black/5 transition-all outline-none shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <select
                            value={merchantFilter}
                            onChange={(e) => setMerchantFilter(e.target.value)}
                            className="bg-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-100 shadow-sm outline-none focus:border-black transition-colors appearance-none cursor-pointer pr-10"
                        >
                            <option value="ALL">All Partners</option>
                            {merchants.map(m => (
                                <option key={m.id} value={m.id}>{m.businessName}</option>
                            ))}
                        </select>
                        <button className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-400 hover:text-black transition-colors">
                            <Boxes size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-10">
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            merchant={merchants.find(m => m.id === product.merchantId)}
                            onClick={() => setSelectedProduct(product)}
                        />
                    ))}
                </div>
            </div>

            {/* Product Details Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white shadow-2xl z-[101] rounded-[3rem] overflow-hidden flex flex-col border border-white/20"
                        >
                            <div className="flex-1 overflow-y-auto">
                                <div className="h-64 bg-gray-100 relative group">
                                    {selectedProduct.imageUrl ? (
                                        <img src={selectedProduct.imageUrl} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                            <Package size={80} />
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setSelectedProduct(null)}
                                        className="absolute top-6 right-6 p-4 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-2xl text-white transition-all shadow-lg"
                                    >
                                        <X size={24} />
                                    </button>
                                    <div className="absolute bottom-6 left-6 flex gap-2">
                                        <span className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">
                                            {selectedProduct.categoryId || 'UNSPECIFIED'}
                                        </span>
                                        {selectedProduct.isFeatured && (
                                            <span className="px-4 py-2 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">
                                                Featured Item
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-10 space-y-8">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h2 className="text-3xl font-black tracking-tighter uppercase italic">{selectedProduct.name}</h2>
                                            <p className="text-2xl font-black text-black tracking-tighter italic">KES {selectedProduct.price.toLocaleString()}</p>
                                        </div>
                                        <p className="text-gray-500 font-medium">{selectedProduct.description || 'No description available for this global entity.'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Availability</p>
                                            <div className="flex items-center gap-2">
                                                {selectedProduct.isAvailable ? (
                                                    <>
                                                        <CheckCircle className="text-green-500" size={16} />
                                                        <span className="font-bold text-sm">Live in Catalog</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="text-red-500" size={16} />
                                                        <span className="font-bold text-sm">Deactivated</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock Level</p>
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-sm tracking-widest">{selectedProduct.stockLevel || 0} Units</span>
                                                <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-black rounded-full" style={{ width: `${Math.min(100, (selectedProduct.stockLevel || 0))}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-black rounded-3xl text-white flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                                <Store size={24} className="text-[#D4AF37]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Merchant Provider</p>
                                                <p className="font-bold text-lg">{merchants.find(m => m.id === selectedProduct.merchantId)?.businessName || 'Unknown Partner'}</p>
                                            </div>
                                        </div>
                                        <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 border-t border-gray-100 bg-gray-50 flex gap-4">
                                <button className="flex-1 py-5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-sm">
                                    Edit Catalog Info
                                </button>
                                <button className="flex-1 py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-3">
                                    Sync Inventory <ArrowRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function InventoryStat({ label, value, icon: Icon, color }: any) {
    const colors: any = {
        black: 'bg-black text-white',
        red: 'bg-red-50 text-red-600 border-red-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100'
    };

    return (
        <div className="p-6 bg-white rounded-3xl border border-gray-50 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
            <div className={`p-4 rounded-2xl ${colors[color]} group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-black tracking-tighter">{value}</p>
            </div>
        </div>
    );
}

function ProductCard({ product, merchant, onClick }: { product: Product, merchant?: any, onClick: () => void }) {
    const isLowStock = (product.stockLevel || 0) <= 10;

    return (
        <motion.div
            whileHover={{ y: -8 }}
            onClick={onClick}
            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 cursor-pointer hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col h-full"
        >
            <div className="absolute top-0 right-0 p-4">
                <div className={`p-3 rounded-2xl shadow-sm ${product.isAvailable ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} border border-white`}>
                    <Tag size={16} fill="currentColor" />
                </div>
            </div>

            <div className="w-20 h-20 bg-gray-50 rounded-3xl mb-8 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:bg-white transition-colors">
                {product.imageUrl ? (
                    <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                    <Package size={32} className="text-gray-200" />
                )}
            </div>

            <div className="mb-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{product.categoryId || 'General'}</p>
                <h3 className="font-black text-xl tracking-tight mb-2 group-hover:text-[#D4AF37] transition-colors">{product.name}</h3>
                <div className="flex items-center gap-2 opacity-50">
                    <Store size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest truncate">{merchant?.businessName || 'Merchant'}</span>
                </div>
            </div>

            <div className="mt-auto pt-8 border-t border-gray-50 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 italic">Value Entry</p>
                    <p className="font-black text-lg tracking-tighter italic">KES {product.price.toLocaleString()}</p>
                </div>
                <div className={`text-right ${isLowStock ? 'text-red-500' : 'text-gray-400'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest italic mb-1">In Stock</p>
                    <p className="font-black text-sm">{product.stockLevel || 0}</p>
                </div>
            </div>

            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all transition-duration-500">
                <ChevronRight size={24} className="text-[#D4AF37]" />
            </div>
        </motion.div>
    );
}
