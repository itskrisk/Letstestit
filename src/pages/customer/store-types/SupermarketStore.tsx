import Footer from '../../../components/layout/Footer';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Search, ShoppingBag, Menu, X, User, Zap, Clock, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../../context/CartContext';
import LocationModal from '../../../components/marketing/LocationModal';
import ProfileModal from '../../../components/ui/shared/ProfileModal';
import GlassCart from '../../../components/ui/shared/GlassCart';
import { useAuth } from '../../../context/AuthContext';

interface SupermarketStoreProps {
    merchant: any;
    products: any[];
}

// SVG Curve Component
const BottomCurve = ({ fill }: { fill: string }) => (
    <div className="absolute bottom-[-1px] left-0 w-full leading-[0] z-20 pointer-events-none">
        <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-[40px] md:h-[100px] block" preserveAspectRatio="none">
            <path fill={fill} fillOpacity="1" d="M0,0L48,10C96,20,192,40,288,50C384,60,480,60,576,50C672,40,768,20,864,15C960,10,1056,20,1152,30C1248,40,1344,50,1392,55L1440,60L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z"></path>
        </svg>
    </div>
);

const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03
        }
    }
};

const staggerItem = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
};

export default function SupermarketStore({ merchant = {}, products = [] }: SupermarketStoreProps) {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { addItem, updateQuantity, itemCount, items = [] } = useCart();
    const [selectedCategory, setSelectedCategory] = useState('Featured items');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Shop');
    const [viewingCategoryDeepDive, setViewingCategoryDeepDive] = useState<string | null>(null);

    // Modal & Menu States 
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Taxonomy
    const categoricalTaxonomy = [
        'Shop your list', 'Deals', 'Fruits & Vegetables', 'Bakery', 'Beverages', 'Alcohol',
        'Fresh Food', 'Cleaning & Household', 'Frozen Food', 'Food Cupboard',
        'Delicatessen', 'Beauty & Personal Care', 'Bio & Organic Food', 'Baby Products',
        'Health & Fitness', 'Delicatessen Counter', 'Electronics & Appliances',
        'Pet Supplies', 'Stationery & School Supplies', 'Automotive', 'Home & Garden', 'Kiosk'
    ];

    const availableCategories = Array.from(new Set((products || []).map(p => p.categoryId || 'General')));
    const categories = Array.from(new Set([...categoricalTaxonomy, ...availableCategories]));
    const featuredItems = (products || []).filter(p => p.categoryId === 'Featured items' || p.isFeatured);
    const isManualScrolling = useRef(false);

    useEffect(() => {
        if (viewingCategoryDeepDive) return;
        const observerOptions = { root: null, rootMargin: '-80px 0px -80% 0px', threshold: 0 };
        const handleIntersect = (entries: IntersectionObserverEntry[]) => {
            if (isManualScrolling.current) return;
            const visibleEntry = entries.find(entry => entry.isIntersecting);
            if (visibleEntry) {
                const catName = visibleEntry.target.id.replace('section-', '');
                setSelectedCategory(catName);
            }
        };
        const observer = new IntersectionObserver(handleIntersect, observerOptions);
        categories.forEach(cat => {
            const element = document.getElementById(`section-${cat}`);
            if (element) observer.observe(element);
        });
        return () => observer.disconnect();
    }, [categories, searchTerm, viewingCategoryDeepDive]);

    // Mobile Nav Auto-scroll Logic (Disabled for mobile fluidity)
    /* useEffect(() => {
        if (viewingCategoryDeepDive) return;
        const activeTabEl = document.getElementById(`mobile-nav-${selectedCategory}`);
        if (activeTabEl) activeTabEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [selectedCategory, viewingCategoryDeepDive]); */

    // Handle Scroll to top on Deep Dive
    useEffect(() => {
        if (viewingCategoryDeepDive) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [viewingCategoryDeepDive]);

    const renderProductCard = (product: any, isCarousel: boolean = false) => {
        const cartItem = items.find(i => i.id === product.id);
        const quantity = cartItem ? cartItem.quantity : 0;
        const hasDiscount = product.promo || product.id.includes('discount');
        const oldPrice = hasDiscount ? product.price + 100 : null;

        // Image-First Glass V5: Reference match
        const cardWidth = isCarousel ? 'w-[140px] md:w-[160px]' : 'w-full';
        const cardHeight = 'h-[240px] md:h-[260px]';

        return (
            <motion.div key={product.id} className={`group ${cardWidth} snap-start`} layout>
                {/* SINGLE GLASS CONTAINER */}
                <div className={`bg-white/5 backdrop-blur-lg border-0 rounded-2xl hover:bg-white/10 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-all duration-700 overflow-hidden flex flex-col ${cardHeight} relative`}>

                    {/* Discount Badge */}
                    {hasDiscount && (
                        <div className="absolute top-3 left-3 z-20">
                            <span className="bg-[#D4AF37] text-white text-[8px] font-black px-2.5 py-1 rounded-full shadow-lg">DEAL</span>
                        </div>
                    )}

                    {/* IMAGE AREA - TOP 75% */}
                    <div className="w-full h-[75%] relative overflow-hidden">
                        <img
                            src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />

                        {/* FLOATING WHITE PLUS BUTTON - Bottom Right of Image */}
                        <div className="absolute bottom-3 right-3 z-10">
                            <AnimatePresence mode="wait">
                                {quantity > 0 ? (
                                    <motion.div
                                        key="qty"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex flex-col items-center bg-white text-black rounded-full py-2 w-9 shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
                                    >
                                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, 1); }} className="w-7 h-7 flex items-center justify-center hover:scale-110 transition-transform">
                                            <Plus size={12} strokeWidth={3} />
                                        </button>
                                        <span className="h-5 flex items-center justify-center text-[11px] font-black">{quantity}</span>
                                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, -1); }} className="w-7 h-7 flex items-center justify-center hover:scale-110 transition-transform">
                                            <Minus size={12} strokeWidth={3} />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        key="add"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (quantity >= (merchant.customSettings?.bulkPurchaseLimit || 10)) {
                                                alert(`Limit of ${merchant.customSettings?.bulkPurchaseLimit || 10} per customer.`);
                                                return;
                                            }
                                            addItem(product);
                                        }}
                                        disabled={product.stockLevel === 0 || !product.isAvailable}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all ${(product.stockLevel === 0 || !product.isAvailable)
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-white text-black'
                                            }`}
                                    >
                                        <Plus size={16} strokeWidth={3} />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Out of Stock / Unavailable Overlay */}
                        {/* Out of Stock / Unavailable / Low Stock Overlay */}
                        {(product.stockLevel === 0 || !product.isAvailable) ? (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-[2rem]">
                                <span className="bg-red-500 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg">
                                    {product.stockLevel === 0 ? 'OUT OF STOCK' : 'UNAVAILABLE'}
                                </span>
                            </div>
                        ) : (product.stockLevel > 0 && product.stockLevel <= (merchant.customSettings?.lowStockThreshold || 5)) && (
                            <div className="absolute top-3 left-3 z-20 mt-6">
                                <span className="bg-orange-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full shadow-lg">LOW STOCK</span>
                            </div>
                        )}
                    </div>

                    {/* TEXT AREA - BOTTOM 25% INSIDE GLASS */}
                    <div className="flex-1 px-3 py-3 flex flex-col justify-center">
                        {/* Bold Black Price */}
                        <div className="mb-0.5">
                            {oldPrice && <span className="text-[9px] text-black/20 line-through font-bold mr-1">KES {oldPrice}</span>}
                            <div className="text-[13px] font-black text-black leading-none tracking-tight">
                                KES {product.price.toLocaleString()}
                            </div>
                        </div>
                        {/* Subtle Gray Product Name */}
                        <div className="text-[10px] font-medium text-black/40 line-clamp-2 leading-tight">
                            {product.name}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    if (!merchant || !products) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase text-xs tracking-widest">Loading Market...</div>;

    return (
        <div className="min-h-screen font-sans selection:bg-black selection:text-white relative bg-black">

            {/* HEADER - DYNAMIC BRANDING */}
            <section
                className="relative text-white pt-6 pb-24 px-6 lg:px-12 overflow-hidden"
                style={{ backgroundColor: merchant.branding?.primaryColor || '#4A90E2' }}
            >
                <div className="absolute inset-0 z-[5] opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-overlay" />

                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 mb-2 relative z-30">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsMenuOpen(true)} className="lg:hidden w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 hover:bg-white/20 transition-colors"><Menu size={20} /></button>
                        <div onClick={() => navigate('/')} className="cursor-pointer text-2xl font-heading font-bold tracking-tighter">Muncheez<span className="text-[#D4AF37]">.</span></div>
                    </div>
                    <div className="flex-1 max-w-xl relative">
                        <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                        <input type="text" placeholder="Search the market..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 backdrop-blur-md rounded-full outline-none text-xs placeholder:text-white/20" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center shadow-lg"><ShoppingBag size={18} />{itemCount > 0 && <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white">{itemCount}</span>}</div>
                        <div
                            onClick={() => setIsProfileOpen(true)}
                            className="flex w-10 h-10 bg-white/10 text-white rounded-lg items-center justify-center border border-white/10 cursor-pointer hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
                        >
                            {profile?.full_name ? (
                                <span className="text-xs font-black">{profile.full_name.charAt(0).toUpperCase()}</span>
                            ) : (
                                <User size={18} className="opacity-70" />
                            )}
                        </div>
                    </div>
                </div>

                {/* NAVIGATION TABS (PORTED TO HEADER V17) */}
                <div className="max-w-7xl mx-auto relative z-30 mb-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex gap-10">
                        {['Shop', 'Deals', 'Shop your list'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] relative ${activeTab === tab ? 'text-white' : 'text-white/40'}`}>
                                {tab}{activeTab === tab && <motion.div layoutId="headerTabLine" className="absolute bottom-0 left-0 w-full h-[2px] bg-[#D4AF37]" />}
                            </button>
                        ))}
                    </div>
                    {viewingCategoryDeepDive && (
                        <button onClick={() => setViewingCategoryDeepDive(null)} className="pb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#D4AF37] hover:text-white transition-colors">
                            <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to Store</span>
                        </button>
                    )}
                </div>

                {/* High-End Mobile Menu Overlay (Matching Home Navbar) */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-3xl pt-28 px-8 flex flex-col justify-between pb-12"
                        >
                            {/* Mobile Menu Logo */}
                            <button
                                onClick={() => { setIsMenuOpen(false); navigate('/'); }}
                                className="absolute top-8 left-8 flex items-center gap-2 group text-left"
                            >
                                <span className="font-heading font-bold text-2xl tracking-tighter text-white">
                                    Muncheez<span className="text-[#4A90E2]">.</span>
                                </span>
                            </button>

                            {/* Close Button */}
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="absolute top-8 right-8 p-3 text-white/50 hover:text-white transition-colors"
                            >
                                <X size={28} strokeWidth={1.5} />
                            </button>

                            {/* Category Links with Monospace Numbers */}
                            <div className="flex flex-col gap-6 mt-6">
                                {[
                                    { label: 'The Kitchens', path: '/c/stores?v=kitchen' },
                                    { label: 'The Market', path: '/c/stores?v=market' },
                                    { label: 'Bakes & Blooms', path: '/c/stores?v=bakes' },
                                    { label: 'The Apothecary', path: '/c/stores?v=apothecary' }
                                ].map((link, i) => (
                                    <motion.button
                                        key={link.label}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.1 + (i * 0.04) }}
                                        onClick={() => { navigate(link.path); setIsMenuOpen(false); }}
                                        className="flex items-center gap-4 group text-left"
                                    >
                                        <span className="text-[#4A90E2]/60 font-mono text-xs group-hover:text-[#4A90E2] transition-colors pt-0.5">
                                            0{i + 1}
                                        </span>
                                        <span className="text-lg font-heading font-light tracking-wide text-white group-hover:text-[#4A90E2] transition-colors">
                                            {link.label}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Auth & Profile Actions */}
                            <div className="flex flex-col gap-3 mt-8">
                                {user ? (
                                    <button
                                        onClick={() => { setIsMenuOpen(false); setIsProfileOpen(true); }}
                                        className="w-full py-3.5 px-6 bg-[#4A90E2] text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-between shadow-lg"
                                    >
                                        <span>{profile?.full_name || user.email?.split('@')[0] || 'My Profile'}</span>
                                        <User size={16} />
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => { setIsMenuOpen(false); navigate('/login'); }}
                                            className="w-full py-3.5 text-center text-xs font-bold uppercase tracking-widest bg-white text-black rounded-xl hover:bg-gray-100 transition-all"
                                        >
                                            Log In
                                        </button>
                                        <button
                                            onClick={() => { setIsMenuOpen(false); navigate('/signup'); }}
                                            className="w-full py-3.5 text-center text-xs font-bold uppercase tracking-widest border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all"
                                        >
                                            Create Account
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="max-w-7xl mx-auto relative z-20 mb-8">
                    <motion.h1 key={viewingCategoryDeepDive || 'main'} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-5xl md:text-8xl font-heading font-light tracking-tighter text-white leading-[0.85]">
                        {viewingCategoryDeepDive === 'Almost anything, delivered' ? 'Specials' : (viewingCategoryDeepDive || merchant.name || 'Carrefour')}<span className="text-[#D4AF37]">,</span><br />
                        {viewingCategoryDeepDive ? 'Selection' : (merchant.address?.split(',')[0] || 'Valley Arcade')}<span className="text-[#D4AF37]">.</span>
                    </motion.h1>
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mt-12 text-white/70">
                        <div className="flex items-center gap-3">
                            <Clock size={16} style={{ color: merchant.branding?.secondaryColor || '#D4AF37' }} />
                            <div><span className="block text-[8px] font-black uppercase opacity-40">Arrival</span><span className="text-[10px] font-bold">{merchant.customSettings?.arrivalTime || '11:03 AM'}</span></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Zap size={16} style={{ color: merchant.branding?.secondaryColor || '#D4AF37' }} />
                            <div><span className="block text-[8px] font-black uppercase opacity-40">Priority</span><span className="text-[10px] font-bold">{merchant.customSettings?.priorityLabel || '23 min'}</span></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Star size={16} style={{ color: merchant.branding?.secondaryColor || '#D4AF37' }} />
                            <div><span className="block text-[8px] font-black uppercase opacity-40">Ratings</span><span className="text-[10px] font-bold">{merchant.customSettings?.rating || '4.5 (2k+)'}</span></div>
                        </div>
                    </div>
                </div>

                <BottomCurve fill={merchant.branding?.secondaryColor || "#D4AF37"} />
            </section>

            {/* CONTENT - DYNAMIC SECONDARY COLOR */}
            <section
                className="relative text-gray-900 pb-48 min-h-screen"
                style={{ backgroundColor: merchant.branding?.secondaryColor || '#D4AF37' }}
            >
                <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
                {/* MOBILE nav scroller (Sticky Dock) */}
                <div
                    className="lg:hidden sticky top-0 z-[150] border-b border-black/[0.1] shadow-lg px-6"
                    style={{ backgroundColor: merchant.branding?.secondaryColor || '#D4AF37' }}
                >
                    <div className="flex items-center gap-10 overflow-x-auto no-scrollbar py-6">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                id={`mobile-nav-${cat}`}
                                onClick={() => {
                                    isManualScrolling.current = true;
                                    setSelectedCategory(cat);
                                    if (viewingCategoryDeepDive) setViewingCategoryDeepDive(null);
                                    const element = document.getElementById(`section-${cat}`);
                                    if (element) {
                                        const headerOffset = 72;
                                        const elementPosition = element.getBoundingClientRect().top;
                                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                                    }
                                    setTimeout(() => { isManualScrolling.current = false; }, 1000);
                                }}
                                className={`text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap transition-all relative ${selectedCategory === cat ? 'text-black' : 'text-black/20'}`}
                            >
                                {cat}
                                {selectedCategory === cat && (
                                    <motion.div layoutId="mobileCatLine" className="absolute -bottom-2 left-0 w-full h-[2px] bg-black" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="max-w-[1440px] mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row min-h-screen overflow-visible">

                        {/* DESKTOP SIDEBAR - Hidden in Deep Dive */}
                        {!viewingCategoryDeepDive && (
                            <aside className="hidden lg:block w-[280px] shrink-0 border-r border-black/[0.04]">
                                <div className="sticky top-24 max-h-[calc(100vh-160px)] overflow-y-auto no-scrollbar px-8 py-12">
                                    <span className="text-[9px] font-black uppercase tracking-[0.5em] text-black/20 block mb-10">Aisles</span>
                                    <nav className="space-y-5">
                                        <div className="mb-6 relative">
                                            <Search size={12} className="absolute left-0 top-2.5 text-black/20" />
                                            <input type="text" placeholder="Search aisles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full bg-transparent border-b border-black/10 py-2 pl-6 text-[10px] font-black uppercase tracking-widest outline-none transition-all focus:border-black" />
                                        </div>
                                        {categories.map((cat) => (
                                            <button key={cat} onClick={() => {
                                                isManualScrolling.current = true;
                                                setSelectedCategory(cat);
                                                const el = document.getElementById(`section-${cat}`);
                                                if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
                                                setTimeout(() => { isManualScrolling.current = false; }, 1000);
                                            }} className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.15em] text-left transition-all ${selectedCategory === cat ? 'text-black' : 'text-black/30'}`}>
                                                <span className={`w-1 h-1 rounded-full bg-black ${selectedCategory === cat ? 'scale-100' : 'scale-0'}`} />{cat}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </aside>
                        )}
                        {/* MAIN CATALOG */}
                        <main className="flex-1 lg:pl-16 lg:pr-12 px-6 py-12 lg:py-24 max-w-5xl min-w-0 w-full">

                            <AnimatePresence mode="wait">
                                {viewingCategoryDeepDive ? (
                                    /* DEEP DIVE VIEW */
                                    <motion.div key="deepdive" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-12">
                                        <div className="flex items-center justify-between border-b border-black/10 pb-8 px-1">
                                            <h2 className="text-3xl font-heading font-black tracking-tighter uppercase">{viewingCategoryDeepDive === 'Almost anything, delivered' ? (merchant.customSettings?.specialsTitle || 'Market Specials') : viewingCategoryDeepDive}</h2>
                                            <button onClick={() => setViewingCategoryDeepDive(null)} className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"><X size={24} /></button>
                                        </div>
                                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 md:gap-6">
                                            {products
                                                .filter(p => viewingCategoryDeepDive === 'Almost anything, delivered'
                                                    ? (p.categoryId === 'Featured items' || p.isFeatured)
                                                    : p.categoryId === viewingCategoryDeepDive
                                                )
                                                .map(p => renderProductCard(p, false))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    /* MAIN STORE VIEW */
                                    <motion.div key="mainstore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        {/* HORIZONTAL FEATURED SECTION */}
                                        <div id="section-Almost anything, delivered" className="mb-32">
                                            <div className="flex items-center justify-between mb-8">
                                                <h2 className="text-2xl md:text-3xl font-heading font-black tracking-tight uppercase text-black">{merchant.customSettings?.specialsTitle || 'Market Specials'}</h2>
                                                <button onClick={() => setViewingCategoryDeepDive('Almost anything, delivered')} className="group flex items-center gap-4 py-2 relative">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-black/60 group-hover:text-black transition-colors whitespace-nowrap">
                                                        Explore {merchant.customSettings?.specialsTitle || 'Specials'}
                                                    </span>
                                                    <div className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                                                        <ArrowRight size={14} />
                                                    </div>
                                                </button>
                                            </div>

                                            <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-8 flex-nowrap -mx-2 px-2">
                                                {featuredItems.map((product) => (
                                                    <div key={product.id} className="shrink-0 w-[240px] md:w-[280px] snap-start">
                                                        {renderProductCard(product, true)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* SECTIONS: CATEGORIES (UNIVERSAL BENCHMARK) */}
                                        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-32">
                                            {categories.filter(c => c !== 'Featured items' && c !== 'Almost anything, delivered').map(cat => {
                                                const categoryProducts = products.filter(p => p.categoryId === cat && (searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase())));
                                                const itemsToDisplay = categoryProducts.length > 0 ? categoryProducts.slice(0, 20) : [];

                                                if (itemsToDisplay.length === 0) return null;

                                                return (
                                                    <motion.div key={cat} id={`section-${cat}`} variants={staggerItem} className="scroll-mt-24 pt-2">
                                                        <div
                                                            className="lg:sticky lg:top-0 mb-8 lg:border-b border-black/5 pb-4 lg:backdrop-blur-md -mx-4 px-4 overflow-visible z-10"
                                                            style={{ backgroundColor: `${merchant.branding?.secondaryColor || '#D4AF37'}E6` }}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <h2 className="text-2xl md:text-3xl font-heading font-black tracking-tight uppercase text-black">{cat}</h2>
                                                                <button
                                                                    onClick={() => setViewingCategoryDeepDive(cat)}
                                                                    className="group flex items-center gap-3 py-1 relative"
                                                                >
                                                                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-black/40 group-hover:text-black transition-colors">See all {cat}</span>
                                                                    <ArrowRight size={12} className="text-black/20 group-hover:translate-x-1 transition-all" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                                            {itemsToDisplay.map(product => renderProductCard(product, false))}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </main>
                    </div>
                </div>

                <BottomCurve fill="#000000" />
            </section>

            <Footer />

            <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} onSelectLocation={() => { setIsLocationModalOpen(false); }} />
            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

            {/* NEW GLASS CART (SHARED COMPONENT) */}
            <GlassCart merchant={merchant} />
        </div>
    );
}

