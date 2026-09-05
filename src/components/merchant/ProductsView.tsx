import { useState } from 'react';
import {
    Search,
    Plus,
    Edit3,
    Trash2,
    Barcode,
    X,
    Save,
    UploadCloud
} from 'lucide-react';
import { Product, MerchantType } from '../../types/schema';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductsViewProps {
    merchantId: string;
    merchantType: MerchantType;
    products: Product[];
    onAddProduct: (product: Product) => void;
    onUpdateProduct: (id: string, product: Partial<Product>) => void;
    onDeleteProduct: (id: string) => void;
}

export default function ProductsView({
    merchantId,
    merchantType,
    products,
    onAddProduct,
    onUpdateProduct,
    onDeleteProduct
}: ProductsViewProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenModal = (product?: Product) => {
        setEditingProduct(product || null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 pb-6">
                <div>
                    <h2 className="text-3xl lg:text-4xl font-heading font-light tracking-tight text-black">Inventory<span className="text-[#D4AF37]">.</span></h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">{merchantType} Catalog</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 lg:px-6 py-3 bg-black text-white hover:bg-[#D4AF37] hover:text-black transition-all text-xs font-bold uppercase tracking-widest min-h-[44px]"
                    >
                        <Plus size={14} /> Add New Item
                    </button>
                </div>
            </div>

            {/* UNIFIED INVENTORY VIEW */}
            <UnifiedInventoryView
                merchantType={merchantType}
                products={filteredProducts}
                onEdit={handleOpenModal}
                onDelete={onDeleteProduct}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            {/* Product Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <ProductModal
                        merchantId={merchantId}
                        merchantType={merchantType}
                        product={editingProduct}
                        onClose={() => setIsModalOpen(false)}
                        onSave={(p: Partial<Product>) => {
                            if (editingProduct) {
                                onUpdateProduct(editingProduct.id, p);
                            } else {
                                onAddProduct({ ...p, id: `p-${Math.random().toString(36).substr(2, 9)}`, merchantId } as Product);
                            }
                            setIsModalOpen(false);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ==========================================
// UNIFIED INVENTORY VIEW (Pharmacy Replica)
// ==========================================
function UnifiedInventoryView({ products, onEdit, onDelete, searchQuery, setSearchQuery, merchantType }: any) {
    return (
        <div className="space-y-8">
            {/* Tools Panel */}
            <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="relative w-full lg:w-96 group">
                    <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[black] transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="SEARCH SKU / PRODUCT..."
                        className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-gray-200 text-sm font-mono focus:outline-none focus:border-black transition-colors placeholder:text-gray-300 uppercase tracking-wider"
                    />
                </div>
            </div>

            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden lg:block bg-white border border-gray-100 shadow-sm overflow-hidden rounded-xl">
                {/* Header */}
                <div className="flex items-center gap-3 px-3 py-2.5 border-b border-black bg-gray-50/50 text-[9px] font-black uppercase tracking-wider text-gray-400">
                    <div className="w-8 shrink-0">Img</div>
                    <div className="w-[180px] shrink-0">Product / SKU</div>
                    <div className="w-20 shrink-0">Category</div>
                    <div className="w-20 shrink-0">Stock</div>
                    <div className="w-16 shrink-0 text-right">Price</div>
                    <div className="w-16 shrink-0 text-right">Action</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-50">
                    {products.map((item: Product) => (
                        <div key={item.id} className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-50/50 transition-colors group">
                            {/* Image */}
                            <div className="w-8 h-8 shrink-0 bg-gray-50 rounded-md overflow-hidden border border-gray-100">
                                <img
                                    src={item.imageUrl || (merchantType === 'Restaurant' ? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=100" : "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=100")}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                                />
                            </div>

                            {/* Info */}
                            <div className="w-[180px] shrink-0 min-w-0">
                                <div className="font-heading font-bold text-gray-900 text-[11px] leading-tight truncate">{item.name}</div>
                                <div className="font-mono text-[8px] text-gray-400 mt-0.5 flex items-center gap-1">
                                    <Barcode size={8} /> {item.sku || 'N/A'}
                                </div>
                            </div>

                            {/* Category */}
                            <div className="w-20 shrink-0 truncate">
                                <span className="text-[8px] font-bold uppercase tracking-tight text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {item.categoryId || 'General'}
                                </span>
                            </div>

                            {/* Stock / Availability (Unified HUD) */}
                            <div className="w-20 shrink-0">
                                <div className="flex items-center justify-between text-[8px] font-bold mb-0.5">
                                    <span className={(item.stockLevel || 0) < 20 && item.isAvailable !== false ? 'text-red-500' : 'text-green-600'}>
                                        {item.isAvailable === false ? 'OFF' : (item.stockLevel || 0) < 20 ? 'LOW' : 'OK'}
                                    </span>
                                    <span className="font-mono text-gray-400">{item.stockLevel || 0}</span>
                                </div>
                                <div className="h-0.5 bg-gray-100 w-full overflow-hidden rounded-full">
                                    <div
                                        className={`h-full ${item.isAvailable === false || (item.stockLevel || 0) < 20 ? 'bg-red-500' : 'bg-black'} transition-all`}
                                        style={{ width: `${item.isAvailable === false ? 0 : Math.min(item.stockLevel || 0, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Price */}
                            <div className="w-16 shrink-0 text-right">
                                <div className="font-mono text-[10px] font-bold text-gray-900">{item.price.toLocaleString()}</div>
                            </div>

                            {/* Action */}
                            <div className="w-16 shrink-0 flex justify-end gap-1">
                                <button onClick={() => onEdit(item)} className="p-1 hover:bg-[#D4AF37] hover:text-black text-gray-300 rounded transition-colors"><Edit3 size={12} /></button>
                                <button onClick={() => onDelete(item.id)} className="p-1 hover:bg-red-500 hover:text-white text-gray-300 rounded transition-colors"><Trash2 size={12} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Card View - Visible on mobile/tablet only */}
            <div className="lg:hidden space-y-3">
                {products.map((item: Product) => (
                    <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <div className="flex gap-4">
                            {/* Image */}
                            <div className="w-20 h-20 shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                <img
                                    src={item.imageUrl || (merchantType === 'Restaurant' ? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200" : "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200")}
                                    className="w-full h-full object-cover"
                                    alt={item.name}
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-heading font-bold text-base text-gray-900 mb-1 truncate">{item.name}</h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold uppercase tracking-tight text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                        {item.categoryId || 'General'}
                                    </span>
                                    {item.sku && (
                                        <span className="font-mono text-xs text-gray-400 flex items-center gap-1">
                                            <Barcode size={10} /> {item.sku}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="font-mono text-lg font-bold text-gray-900">KES {item.price.toLocaleString()}</div>
                                    <div className="flex items-center gap-1 text-xs font-bold">
                                        <span className={(item.stockLevel || 0) < 20 && item.isAvailable !== false ? 'text-red-500' : 'text-green-600'}>
                                            {item.isAvailable === false ? 'UNAVAILABLE' : (item.stockLevel || 0) < 20 ? 'LOW STOCK' : `${item.stockLevel} in stock`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => onEdit(item)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-[#D4AF37] hover:text-black text-gray-700 rounded-lg transition-all font-bold text-sm min-h-[44px]"
                            >
                                <Edit3 size={14} /> Edit
                            </button>
                            <button
                                onClick={() => onDelete(item.id)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-red-500 hover:text-white text-gray-700 rounded-lg transition-all font-bold text-sm min-h-[44px]"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {products.length === 0 && (
                <div className="py-10 text-center text-gray-400 text-[8px] font-bold uppercase tracking-widest">
                    Empty Category.
                </div>
            )}
        </div>
    );
}

// ==========================================
// 3. PRODUCT MODAL (compact & Responsive)
// ==========================================
function ProductModal({ product, onClose, onSave, merchantType }: any) {
    const [formData, setFormData] = useState<Partial<Product>>(product || {
        name: '',
        price: 0,
        description: '',
        categoryId: merchantType === 'Restaurant' ? 'Mains' : 'General',
        isAvailable: true,
        isFeatured: false,
        tags: [],
        preparationTimeMin: undefined,
        isPrescriptionRequired: false,
        stockLevel: 100,
        sku: '',
        imageUrl: ''
    });

    // Smart Category Lists
    const categories = merchantType === 'Restaurant'
        ? ['Starters', 'Mains', 'Burgers', 'Pizza', 'Sushi', 'Desserts', 'Beverages', 'Alcohol', 'Sides', 'Kids Meal', 'Signature Dishes', 'Breakfast', 'Lunch Offers', 'Featured items']
        : merchantType === 'Supermarket'
            ? ['Fruits & Vegetables', 'Bakery', 'Dairy & Eggs', 'Meat & Seafood', 'Beverages', 'Alcohol', 'Fresh Food', 'Cleaning & Household', 'Frozen Food', 'Food Cupboard', 'Delicatessen', 'Beauty & Personal Care', 'Bio & Organic Food', 'Baby Products', 'Health & Fitness', 'Electronics & Appliances', 'Pet Supplies', 'Stationery', 'Home & Garden', 'Kiosk', 'Deals', 'Featured items']
            : ['Medicine', 'Wellness', 'First Aid', 'Vitamins & Supplements', 'Sexual Health', 'Baby & Child', 'Personal Care', 'Skin Care', 'Medical Devices', 'Featured items'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white w-full max-w-lg lg:max-w-2xl rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Header - Compact */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white text-black shrink-0">
                    <div>
                        <h3 className="text-base font-heading font-black tracking-tight">
                            {product ? 'EDIT ITEM' : 'NEW ENTRY'}
                        </h3>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]">Catalog Protocol</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Body - DENSE GRID */}
                <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
                    <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">

                        {/* LEFT COL: Image & Key Toggles (Visuals) */}
                        <div className="lg:w-1/3 flex flex-row lg:flex-col gap-4 lg:gap-3">
                            {/* Image Upload - Square & Modern */}
                            <div className="w-24 h-24 lg:w-full lg:h-auto lg:aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 relative group overflow-hidden hover:border-[#D4AF37] transition-colors shrink-0">
                                {formData.imageUrl ? (
                                    <>
                                        <img src={formData.imageUrl} className="w-full h-full object-cover" />
                                        <button
                                            onClick={(e) => { e.preventDefault(); setFormData({ ...formData, imageUrl: '' }) }}
                                            className="absolute top-1 right-1 lg:top-2 lg:right-2 bg-white/90 p-1 lg:p-1.5 rounded-full text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                                        <UploadCloud size={16} className="mb-1 lg:mb-2" />
                                        <span className="text-[7px] lg:text-[8px] font-bold uppercase tracking-widest text-center leading-tight">Upload<br className="lg:hidden" /> Image</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const url = URL.createObjectURL(file);
                                            setFormData({ ...formData, imageUrl: url });
                                        }
                                    }}
                                />
                            </div>

                            {/* Toggles - Stacked for density */}
                            <div className="space-y-2 flex-1 pt-1 lg:pt-0">
                                <label className="flex items-center justify-between p-2 lg:p-2.5 bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 cursor-pointer transition-all">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Available</span>
                                    <input
                                        type="checkbox"
                                        checked={formData.isAvailable}
                                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                        className="w-3.5 h-3.5 accent-black"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-2 lg:p-2.5 bg-yellow-50/50 rounded-lg border border-transparent hover:border-yellow-200 cursor-pointer transition-all">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-yellow-700">Featured</span>
                                    <input
                                        type="checkbox"
                                        checked={formData.isFeatured}
                                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                        className="w-3.5 h-3.5 accent-yellow-500"
                                    />
                                </label>
                                {merchantType === 'Pharmacy' && (
                                    <label className="flex items-center justify-between p-2 lg:p-2.5 bg-red-50/50 rounded-lg border border-transparent hover:border-red-200 cursor-pointer transition-all">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-red-700">Rx Required</span>
                                        <input
                                            type="checkbox"
                                            checked={formData.isPrescriptionRequired}
                                            onChange={(e) => setFormData({ ...formData, isPrescriptionRequired: e.target.checked })}
                                            className="w-3.5 h-3.5 accent-red-500"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COL: Data Forms */}
                        <div className="lg:w-2/3 space-y-4">
                            {/* Name & SKU */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Product Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-2 bg-gray-50 rounded-lg border border-transparent focus:bg-white focus:border-black outline-none font-bold text-xs"
                                        placeholder="Item Name"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">SKU</label>
                                    <input
                                        type="text"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="w-full p-2 bg-gray-50 rounded-lg border border-transparent focus:bg-white focus:border-black outline-none font-mono text-[10px]"
                                        placeholder="ID-000"
                                    />
                                </div>
                            </div>

                            {/* Price & Category */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Price (KES)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="w-full p-2 bg-gray-50 rounded-lg border border-transparent focus:bg-white focus:border-black outline-none font-bold font-mono text-xs"
                                    />
                                </div>
                                <div className="space-y-1 relative">
                                    <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Category / Aisle</label>
                                    <input
                                        type="text"
                                        list="cat-list"
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="w-full p-2 bg-gray-50 rounded-lg border border-transparent focus:bg-white focus:border-black outline-none font-bold text-xs"
                                        placeholder="Select or Type..."
                                    />
                                    <datalist id="cat-list">
                                        {categories.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                            </div>

                            {/* Type Specifics */}
                            <div className="grid grid-cols-2 gap-3">
                                {(merchantType === 'Restaurant') && (
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Prep Time (Min)</label>
                                        <input
                                            type="number"
                                            value={formData.preparationTimeMin || ''}
                                            onChange={(e) => setFormData({ ...formData, preparationTimeMin: Number(e.target.value) })}
                                            className="w-full p-2 bg-gray-50 rounded-lg border border-transparent focus:bg-white focus:border-black outline-none font-bold text-xs"
                                            placeholder="20"
                                        />
                                    </div>
                                )}
                                {(merchantType === 'Supermarket' || merchantType === 'Pharmacy') && (
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Stock Level</label>
                                        <input
                                            type="number"
                                            value={formData.stockLevel}
                                            onChange={(e) => setFormData({ ...formData, stockLevel: Number(e.target.value) })}
                                            className="w-full p-2 bg-gray-50 rounded-lg border border-transparent focus:bg-white focus:border-black outline-none font-bold text-xs"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2 bg-gray-50 rounded-lg border border-transparent focus:bg-white focus:border-black outline-none text-xs min-h-[60px]"
                                    placeholder="Item details..."
                                />
                            </div>

                            {/* Tags */}
                            {merchantType === 'Restaurant' && (
                                <div className="space-y-2">
                                    <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Dietary Tags</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['Vegan', 'Vegetarian', 'Gluten-Free', 'Spicy', 'Halal'].map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => {
                                                    const tags = formData.tags || [];
                                                    setFormData({
                                                        ...formData,
                                                        tags: tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]
                                                    });
                                                }}
                                                className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all border ${(formData.tags || []).includes(tag)
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-black'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Footer - Floating Actions */}
                <div className="p-4 border-t border-gray-50 flex gap-3 bg-white shrink-0">
                    <button
                        onClick={() => onSave(formData)}
                        className="flex-1 py-2.5 bg-black text-white hover:bg-[#D4AF37] hover:text-black transition-all rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Save size={14} /> SAVE ENTRY
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
