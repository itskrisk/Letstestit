import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    ShoppingBag,
    Info,
    Clock,
    Star,

    Minus,
    Trash2,
    X,
    CreditCard,
    Plus,
    Search,
    AlertTriangle,
    Zap,
    Menu,
    User,
    LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useEffect, useState } from 'react';
import KitchenStore from './store-types/KitchenStore';
import PharmacyStore from './store-types/PharmacyStore';
import SupermarketStore from './store-types/SupermarketStore';
import { useAuth } from '../../context/AuthContext';
import ProfileModal from "../../components/ui/shared/ProfileModal";
import { publicApi } from '../../lib/api';

export default function StoreFront() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, profile, signOut } = useAuth();
    const { items: cartItems, addItem, updateQuantity, removeItem, merchantId: cartMerchantId, clearCart, total, itemCount } = useCart();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showConflictModal, setShowConflictModal] = useState<{ product: any } | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [merchant, setMerchant] = useState<any>(null);
    const [merchantProducts, setMerchantProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Load store data from Supabase
    useEffect(() => {
        loadStore();
    }, [id]);

    const loadStore = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const storeResult = await publicApi.getStore(id);
            if (storeResult.data) {
                setMerchant(storeResult.data);
            }
            const productsResult = await publicApi.getStoreProducts(id);
            if (productsResult.data) {
                setMerchantProducts(productsResult.data);
            }
        } catch (err) {
            console.error('Error loading store:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!merchant) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-8 text-center text-white">
                <h1 className="text-2xl font-bold mb-4">Store Not Found</h1>
                <button onClick={() => navigate('/stores')} className="px-6 py-3 bg-[#D4AF37] text-black font-bold rounded-xl">
                    Back to Stores
                </button>
            </div>
        );
    }

    // Delegate rendering to store-type-specific design system if appropriate
    const storeType = merchant.type?.toLowerCase() || 'restaurant';

    if (storeType === 'supermarket') {
        return <SupermarketStore merchant={merchant} products={merchantProducts} />;
    }
    if (storeType === 'pharmacy') {
        return <PharmacyStore merchant={merchant} products={merchantProducts} />;
    }
    if (storeType === 'restaurant' || storeType === 'kitchen') {
        return <KitchenStore merchant={merchant} products={merchantProducts} />;
    }

    // Default Fallback Store View
    const handleAddToCart = (product: any) => {
        if (cartMerchantId && cartMerchantId !== merchant.id && cartItems.length > 0) {
            setShowConflictModal({ product });
            return;
        }
        addItem(product);
    };

    const confirmConflictResolution = () => {
        if (showConflictModal) {
            clearCart();
            addItem(showConflictModal.product);
            setShowConflictModal(null);
        }
    };

    const isClosed = !merchant.is_active;
    const isBlocked = isClosed || merchant.status !== 'APPROVED';

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#D4AF37] selection:text-black relative overflow-x-hidden">
            {/* Ambient Lighting FX */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute top-1/3 right-10 w-80 h-80 bg-blue-600/5 rounded-full blur-[128px] pointer-events-none" />

            {/* Subtle Grid Lines Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* MOBILE MENU DRAWER (US-STYLE UNIVERSAL) */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                            className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[301] p-8 flex flex-col shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-12">
                                <div className="text-2xl font-heading font-black tracking-tighter text-black">
                                    Muncheez<span className="text-[#D4AF37]">.</span>
                                </div>
                                <button onClick={() => setIsMenuOpen(false)} className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-all">
                                    <X size={18} className="text-black" />
                                </button>
                            </div>

                            <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar">
                                {[
                                    { label: 'The Kitchens', path: '/c/stores?v=kitchen', icon: '🍳' },
                                    { label: 'The Market', path: '/c/stores?v=market', icon: '🛒' },
                                    { label: 'Bakes & Blooms', path: '/c/stores?v=bakes', icon: '🥐' },
                                    { label: 'The Apothecary', path: '/c/stores?v=apothecary', icon: '💊' }
                                ].map((link) => (
                                    <button
                                        key={link.label}
                                        onClick={() => { navigate(link.path); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-4 py-4 px-4 hover:bg-black/5 rounded-xl transition-all group"
                                    >
                                        <span className="text-xl">{link.icon}</span>
                                        <span className="text-sm font-black uppercase tracking-widest text-black/80 group-hover:text-black transition-colors">{link.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-auto pt-6 border-t border-black/10">
                                {user ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 px-2">
                                            <div className="w-10 h-10 bg-[#4A90E2]/10 rounded-full flex items-center justify-center border border-[#4A90E2]/20 shrink-0">
                                                {profile?.full_name ? (
                                                    <span className="text-xs font-black text-[#4A90E2]">{profile.full_name.charAt(0).toUpperCase()}</span>
                                                ) : (
                                                    <User size={18} className="text-[#4A90E2]" />
                                                )}
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="text-xs font-black uppercase tracking-wider text-black truncate">
                                                    {profile?.full_name || user.email?.split('@')[0]}
                                                </div>
                                                <div className="text-[10px] font-bold text-[#4A90E2] uppercase tracking-widest">
                                                    {profile?.loyalty_tier || 'Member'}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try { await signOut(); } catch (e) {}
                                                setIsMenuOpen(false);
                                                window.location.href = '/login';
                                            }}
                                            className="w-full py-3 px-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <LogOut size={14} />
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => { setIsMenuOpen(false); navigate('/login'); }}
                                            className="w-full py-3 px-4 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors text-center"
                                        >
                                            Log In
                                        </button>
                                        <button
                                            onClick={() => { setIsMenuOpen(false); navigate('/signup'); }}
                                            className="w-full py-3 px-4 border border-gray-200 text-gray-800 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-black transition-colors text-center"
                                        >
                                            Create Account
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* 🛡️ BRAND HEADER - EDITORIAL V14 (REVALIDATED) */}
            <header className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-100 px-6 h-20">
                <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-xl transition-all border border-gray-100 lg:hidden">
                            <Menu size={20} className="text-black" />
                        </button>
                        <button
                            onClick={() => navigate('/c/stores')}
                            className="group flex items-center gap-4 py-2"
                        >
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-900 text-white rounded-full flex items-center justify-center group-hover:bg-[#D4AF37] transition-all">
                                <ChevronLeft size={20} />
                            </div>
                            <div className="hidden sm:block">
                                <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 group-hover:text-[#D4AF37] transition-colors leading-none mb-1">Return to</span>
                                <span className="block text-sm font-heading font-black tracking-tight leading-none">Marketplace</span>
                            </div>
                        </button>
                    </div>
                    {/* Right side of header (e.g., cart button, profile) */}
                    <div className="flex items-center gap-4">
                        {/* Cart Button */}
                        {!isBlocked && itemCount > 0 && (
                            <button
                                onClick={() => setIsMenuOpen(true)} // Now opens the menu, not cart
                                className="relative w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-[#D4AF37] transition-all"
                            >
                                <ShoppingBag size={20} />
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4AF37] text-gray-900 text-xs font-black rounded-full flex items-center justify-center ring-2 ring-white">
                                    {itemCount}
                                </span>
                            </button>
                        )}
                        {/* Profile Button */}
                        <button
                            onClick={() => setIsProfileOpen(true)}
                            className="w-10 h-10 bg-gray-100 text-[#4A90E2] rounded-full flex items-center justify-center hover:bg-[#4A90E2]/10 transition-all border border-transparent hover:border-[#4A90E2]/20"
                        >
                            {profile?.full_name ? (
                                <span className="text-xs font-black">{profile.full_name.charAt(0).toUpperCase()}</span>
                            ) : (
                                <User size={20} />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Header */}
            <div className="relative h-72 md:h-96 overflow-hidden z-10 pt-20"> {/* Added pt-20 to account for fixed header */}
                <motion.img
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    src={merchant.coverImageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200"}
                    alt={merchant.businessName}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/20 to-black/20" />

                {/* Removed old back button as it's now in the fixed header */}

                <div className="absolute bottom-12 left-8 right-8 z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[2rem] p-1.5 shadow-[0_32px_64px_-16px_rgba(212,175,55,0.25)] ring-4 ring-[#FDFBF7]"
                        >
                            <img src={merchant.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-[1.75rem]" />
                        </motion.div>
                        <div className="flex flex-col">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="inline-flex items-center gap-2 mb-2"
                            >
                                <span className="bg-[#D4AF37] text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">{merchant.type}</span>
                                <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md px-2 py-1 rounded-full shadow-sm">
                                    <Star size={12} className="text-[#D4AF37] fill-[#D4AF37]" />
                                    <span className="text-[10px] font-black">4.8</span>
                                </div>
                            </motion.div>
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-4xl md:text-6xl font-heading font-black tracking-tighter text-gray-900 leading-none"
                            >
                                {merchant.businessName}
                            </motion.h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🟢 LAYER 2: MERCHANT PERSONALITY (Confidence Bar) */}
            <div className="max-w-5xl mx-auto px-8 py-8 z-10 relative">
                <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_12px_48px_-12px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-wrap items-center justify-between gap-8">
                    <div className="flex items-center gap-12 overflow-x-auto no-scrollbar py-2">
                        <div className="flex flex-col gap-1 shrink-0">
                            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.3em]">Arrives In</span>
                            <div className="flex items-center gap-2 font-black">
                                <Clock size={16} /> 25-35 MIN
                            </div>
                        </div>
                        <div className="w-[1px] h-8 bg-gray-100 shrink-0" />
                        <div className="flex flex-col gap-1 shrink-0">
                            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.3em]">Delivery</span>
                            <div className="flex items-center gap-2 font-black">
                                <ShoppingBag size={16} /> KES 150
                            </div>
                        </div>
                        <div className="w-[1px] h-8 bg-gray-100 shrink-0" />
                        <div className="flex flex-col gap-1 shrink-0">
                            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.3em]">Current Vibe</span>
                            <div className="flex items-center gap-2 font-black text-green-600">
                                <Zap size={16} className="fill-green-600" /> ✨ FLOWING
                            </div>
                        </div>
                    </div>

                    <button className="bg-gray-50 hover:bg-gray-100 text-gray-400 p-4 rounded-2xl transition-all">
                        <Info size={20} />
                    </button>
                </div>
            </div>

            {/* Availability Banner */}
            <AnimatePresence>
                {isBlocked && (
                    <div className="max-w-5xl mx-auto px-8 mb-8 z-10 relative">
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="bg-orange-50 border border-orange-100 rounded-3xl px-6 py-4 flex items-center gap-4 text-orange-800"
                        >
                            <AlertTriangle size={20} className="shrink-0" />
                            <div className="text-sm font-bold">
                                {isClosed ? "We're currently catching some sleep. You can browse, but ordering is resting until 8am." : "This legend is still setting up. Check back later to place your first order!"}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Search Sub-Nav */}
            <div className="sticky top-20 z-40 bg-[#FDFBF7]/80 backdrop-blur-xl px-8 py-4 border-b border-gray-100/50"> {/* Adjusted top for fixed header */}
                <div className="max-w-5xl mx-auto relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder={`Find something delicious in ${merchant.businessName}...`}
                        className="w-full bg-white border border-transparent rounded-[1.5rem] py-4 pl-14 pr-6 font-medium shadow-sm focus:ring-2 focus:ring-[#D4AF37]/5 focus:border-[#D4AF37]/20 transition-all"
                    />
                </div>
            </div>

            {/* Profile Modal */}
            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />

            {/* 🔵 LAYER 3: COMMERCE MECHANICS (The Menu) */}
            <div className="max-w-5xl mx-auto px-8 py-12 z-10 relative">
                <RetailGrid
                    items={merchantProducts}
                    isBlocked={isBlocked}
                    cartItems={cartItems}
                    onAdd={(p) => {
                        if (cartMerchantId && cartMerchantId !== merchant.id) {
                            setShowConflictModal({ product: p });
                        } else {
                            addItem(p);
                        }
                    }}
                    onUpdateQty={updateQuantity}
                />
            </div>

            {/* Single-Merchant Modal */}
            <AnimatePresence>
                {showConflictModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl border border-white/20"
                        >
                            <div className="w-20 h-20 bg-orange-100 text-[#D4AF37] rounded-full flex items-center justify-center mb-8 mx-auto ring-8 ring-orange-50">
                                <AlertTriangle size={40} />
                            </div>
                            <h3 className="text-2xl font-heading font-black text-center mb-4 tracking-tight">Wait, Change Stores?</h3>
                            <p className="text-gray-500 text-center text-sm mb-10 leading-relaxed font-medium">
                                Your current selection from another store will be cleared. Ready to start fresh with <span className="text-black font-black">{merchant.businessName}</span>?
                            </p>
                            <div className="space-y-4">
                                <button
                                    onClick={() => {
                                        clearCart();
                                        addItem(showConflictModal.product);
                                        setShowConflictModal(null);
                                    }}
                                    className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#D4AF37] transition-all shadow-xl shadow-gray-200"
                                >
                                    Clear & Add to Cart
                                </button>
                                <button
                                    onClick={() => setShowConflictModal(null)}
                                    className="w-full bg-gray-100 text-gray-500 py-5 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                                >
                                    No, Keep it
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Floating Cart Anchor */}
            {!isBlocked && itemCount > 0 && !isMenuOpen && ( // Changed isCartOpen to isMenuOpen
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-xl z-50 px-4"
                >
                    <button
                        onClick={() => setIsMenuOpen(true)} // Changed setIsCartOpen to setIsMenuOpen
                        className="w-full bg-gray-900 text-white h-20 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] flex items-center justify-between px-10 hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative"
                    >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                        <div className="flex items-center gap-4 relative">
                            <span className="w-8 h-8 bg-[#D4AF37] text-gray-900 rounded-xl flex items-center justify-center text-xs font-black shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                                {itemCount}
                            </span>
                            <span className="font-heading font-black text-lg tracking-tight">Review Order</span>
                        </div>
                        <div className="flex items-center gap-3 font-heading font-black text-xl tracking-tighter relative">
                            <span className="text-[#D4AF37]/50 text-sm font-medium tracking-normal">KES</span>
                            {total.toLocaleString()}
                        </div>
                    </button>
                </motion.div>
            )}

            {/* Cart Drawer */}
            <AnimatePresence>
                {isMenuOpen && ( // Changed isCartOpen to isMenuOpen
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)} // Changed setIsCartOpen to setIsMenuOpen
                            className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[60]"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 inset-x-0 bg-[#FDFBF7] rounded-t-[3rem] z-[70] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-t border-white"
                        >
                            <div className="px-10 pt-10 pb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-4xl font-heading font-black tracking-tighter">Your Bag<span className="text-[#D4AF37]">.</span></h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">{merchant.businessName}</p>
                                </div>
                                <button
                                    onClick={() => setIsMenuOpen(false)} // Changed setIsCartOpen to setIsMenuOpen
                                    className="w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 shadow-sm transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-10 py-6 space-y-8 no-scrollbar">
                                {cartItems.map(item => (
                                    <motion.div
                                        layout
                                        key={item.id}
                                        className="flex gap-6 items-center"
                                    >
                                        <div className="w-20 h-20 bg-white rounded-[1.5rem] overflow-hidden shrink-0 shadow-sm border border-gray-100">
                                            <img src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=100"} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-heading font-black text-lg tracking-tight leading-tight">{item.name}</h4>
                                                <span className="font-black text-gray-900">KES {item.price.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center bg-white border border-gray-100 rounded-[1rem] p-1 shadow-sm">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-400 hover:text-red-500"
                                                    >
                                                        {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                                                    </button>
                                                    <span className="w-10 text-center text-sm font-black">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Plus size={14} className="text-gray-400" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="p-10 bg-white border-t border-gray-100 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        <span>Subtotal</span>
                                        <span>KES {total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        <span>Delivery</span>
                                        <span>KES 150</span>
                                    </div>
                                    <div className="flex justify-between text-2xl font-heading font-black text-gray-900 pt-4 border-t border-gray-100 uppercase tracking-tighter">
                                        <span>Total</span>
                                        <span>KES {(total + 150).toLocaleString()}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/checkout')}
                                    className="w-full bg-gray-900 text-white h-20 rounded-[1.75rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-[#D4AF37] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-gray-200 group"
                                >
                                    <CreditCard size={18} className="group-hover:scale-110 transition-transform" />
                                    <span>Commit Order</span>
                                </button>
                                <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                    Secure Payment via M-Pesa Express<br />A push will be sent to your phone
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

interface ViewProps {
    items: any[];
    isBlocked: boolean;
    cartItems: any[];
    onAdd: (product: any) => void;
    onUpdateQty: (id: string, delta: number) => void;
}



function RetailGrid({ items, isBlocked, cartItems, onAdd, onUpdateQty }: ViewProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map(product => {
                const cartItem = cartItems.find(ci => ci.id === product.id);
                const isOutOfStock = product.stockLevel === 0;

                return (
                    <motion.div
                        key={product.id}
                        whileHover={!isBlocked && !isOutOfStock ? { y: -8 } : {}}
                        className={`bg-white rounded-[2.5rem] border border-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col h-full transition-all ${!isBlocked && !isOutOfStock ? 'hover:border-[#D4AF37]/20 hover:shadow-[0_48px_96px_-32px_rgba(212,175,55,0.15)] group' : 'opacity-80'}`}
                    >
                        <div className="aspect-square bg-[#FDFBF7] rounded-[2rem] mb-6 overflow-hidden relative border border-gray-50 shadow-inner">
                            <img
                                src={product.imageUrl || `https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format`}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />

                            {!isBlocked && !isOutOfStock && (
                                <div className="absolute bottom-3 right-3">
                                    {cartItem ? (
                                        <div className="flex items-center bg-white border border-gray-100 text-gray-900 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 ring-4 ring-white/50">
                                            <button
                                                onClick={() => onUpdateQty(product.id, -1)}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            >
                                                <Minus size={14} className={cartItem.quantity === 1 ? 'text-red-400' : 'text-gray-400'} />
                                            </button>
                                            <span className="w-8 text-center text-xs font-black">{cartItem.quantity}</span>
                                            <button
                                                onClick={() => onUpdateQty(product.id, 1)}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            >
                                                <Plus size={14} className="text-gray-400" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => onAdd(product)}
                                            className="w-12 h-12 bg-white text-gray-900 rounded-2xl flex items-center justify-center shadow-2xl border border-gray-50 hover:bg-gray-900 hover:text-white hover:scale-105 active:scale-95 transition-all ring-4 ring-white/50 group"
                                        >
                                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {isOutOfStock && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center p-6 text-center">
                                    <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">Sold Out</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col flex-1 px-2 pb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{product.sku || 'LEGACY ITEM'}</span>
                            <h3 className="font-heading font-black text-xl tracking-tight mb-3 line-clamp-1 leading-none text-gray-900">{product.name}</h3>
                            <div className="flex items-center justify-between mt-auto">
                                <span className="font-heading font-black text-2xl tracking-tighter text-gray-900">
                                    <span className="text-xs text-gray-400 font-bold tracking-normal mr-1">KES</span>
                                    {product.price.toLocaleString()}
                                </span>
                                {product.stockLevel !== undefined && (
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${product.stockLevel > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                        {product.stockLevel > 0 ? `${product.stockLevel} LOCAL STOCK` : 'Restocking'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

