import Footer from '../../../components/layout/Footer';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Clock, MapPin, Search, ShoppingBag, Menu, X, User, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../../context/CartContext';
import LocationModal from '../../../components/marketing/LocationModal';
import ProfileModal from '../../../components/ui/shared/ProfileModal';
import GlassCart from '../../../components/ui/shared/GlassCart';
import { useAuth } from '../../../context/AuthContext';

interface KitchenStoreProps {
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
            staggerChildren: 0.05
        }
    }
};

const staggerItem = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
};

export default function KitchenStore({ merchant, products }: KitchenStoreProps) {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { addItem, items, updateQuantity, itemCount } = useCart();
    const [selectedCategory, setSelectedCategory] = useState('Featured items');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal & Menu States (Ported from StoreListing)
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [userLocation, setUserLocation] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Group products by category
    const allCategories = Array.from(new Set(products.map(p => p.categoryId || 'General')));
    const categories = [
        ...allCategories.filter(c => c === 'Featured items'),
        ...allCategories.filter(c => c !== 'Featured items').sort()
    ];
    const featuredItems = products.filter(p => p.categoryId === 'Featured items');
    const isManualScrolling = useRef(false);

    // Scroll Spying Logic
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-80px 0px -80% 0px', // Standard sticky nav margin
            threshold: 0
        };

        const handleIntersect = (entries: IntersectionObserverEntry[]) => {
            if (isManualScrolling.current) return;

            const visibleEntry = entries.find(entry => entry.isIntersecting);
            if (visibleEntry) {
                const catName = visibleEntry.target.id.replace('section-', '');
                setSelectedCategory(catName);
            }
        };

        const observer = new IntersectionObserver(handleIntersect, observerOptions);

        // Observe all category sections
        categories.forEach(cat => {
            const element = document.getElementById(`section-${cat}`);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [categories, searchTerm]); // Re-observe if categories change (due to search)

    // Mobile Nav Auto-scroll Logic (Disabled for mobile fluidity)
    /* useEffect(() => {
        const activeTab = document.getElementById(`mobile-nav-${selectedCategory}`);
        if (activeTab) {
            activeTab.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest'
            });
        }
    }, [selectedCategory]); */

    return (
        <div className="min-h-screen font-sans selection:bg-black selection:text-white relative bg-black">

            {/* 1. HEADER & ORIGIN - DYNAMIC BRANDING */}
            <section
                className="relative text-white pt-6 pb-24 px-6 lg:px-12 overflow-hidden"
                style={{ backgroundColor: merchant.branding?.primaryColor || '#4A90E2' }}
            >
                <div className="absolute inset-0 z-[5] opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-overlay" />

                {/* Brand Top Nav */}
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8 mb-16 relative z-30">
                    <div className="flex items-center gap-6">
                        {/* Hamburger for Mobile */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="lg:hidden w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center border border-white/10 transition-colors"
                        >
                            <Menu size={20} />
                        </button>

                        <div onClick={() => navigate('/')} className="cursor-pointer flex items-center gap-2 shrink-0 text-2xl font-heading font-bold tracking-tighter">
                            Muncheez<span className="text-[#D4AF37]">.</span>
                        </div>

                        {/* Location */}
                        <div
                            onClick={() => setIsLocationModalOpen(true)}
                            className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-white/10 transition-all"
                        >
                            <MapPin size={12} className="text-[#D4AF37]" />
                            <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">{userLocation}</span>
                        </div>
                    </div>

                    {/* Integrated Search (Connected to storefront search state) */}
                    <div className="flex-1 max-w-xl relative group">
                        <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            placeholder={`Search in ${merchant?.businessName || 'store'}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 backdrop-blur-md rounded-full outline-none focus:bg-white/10 transition-all text-xs placeholder:text-white/20"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center shadow-lg cursor-pointer">
                            <ShoppingBag size={18} />
                            {itemCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                    {itemCount}
                                </span>
                            )}
                        </div>
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

                {/* Location Modal */}
                <LocationModal
                    isOpen={isLocationModalOpen}
                    onClose={() => setIsLocationModalOpen(false)}
                    onSelectLocation={(loc) => {
                        setUserLocation(loc);
                        setIsLocationModalOpen(false);
                    }}
                />

                {/* Profile Modal */}
                <ProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                />

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

                {/* Atmospheric Title Section */}
                <div className="max-w-7xl mx-auto relative z-20 mb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] block mb-4" style={{ color: merchant.branding?.secondaryColor || '#D4AF37' }}>{merchant.customSettings?.cuisineType || 'THE ART OF FLAVOUR'}</span>
                            <h1 className="text-5xl md:text-8xl font-heading font-light tracking-tighter text-white leading-[0.85]">
                                {merchant.businessName}<span style={{ color: merchant.branding?.secondaryColor || '#D4AF37' }}>.</span>
                            </h1>
                            <div className="flex items-center gap-6 mt-10 text-[11px] font-black uppercase tracking-widest text-white/40">
                                <div className="flex items-center gap-2 uppercase">
                                    <Clock size={12} style={{ color: merchant.branding?.secondaryColor || '#D4AF37' }} /> {merchant.customSettings?.kitchenPrepTimeMin ? `${merchant.customSettings.kitchenPrepTimeMin}m` : '20m'} Prep
                                </div>
                                <div className="flex items-center gap-2 uppercase">
                                    <MapPin size={12} style={{ color: merchant.branding?.secondaryColor || '#D4AF37' }} /> {merchant.address || 'Westlands'}
                                </div>
                                <div className="flex items-center gap-2 uppercase">
                                    <Heart size={12} style={{ color: merchant.branding?.secondaryColor || '#D4AF37' }} /> Artisan
                                </div>
                            </div>
                        </div>
                        <p className="text-white/30 text-xs md:text-sm max-w-sm font-medium leading-relaxed opacity-80">
                            Professional curation of the city's finest flavors. Sourced from authentic kitchens and delivered with zero compromise on quality.
                        </p>
                    </div>
                </div>

                <BottomCurve fill={merchant.branding?.secondaryColor || "#D4AF37"} />
            </section>

            {/* 2. SECONDARY COLOR SECTION */}
            <section
                className="relative text-gray-900 pb-48 min-h-screen"
                style={{ backgroundColor: merchant.branding?.secondaryColor || '#D4AF37' }}
            >
                {/* Subtle Grain Overlay */}
                <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-multiply" />

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

                    {/* LAYOUT CONTAINER: Sidebar + Main Content */}
                    <div className="flex flex-col lg:flex-row min-h-screen overflow-visible">

                        {/* A. NAVIGATION LAYER */}
                        {/* 1. DESKTOP SIDEBAR (Sticky Positioning) */}
                        <aside className="hidden lg:block w-[260px] xl:w-[300px] shrink-0">
                            <div className="sticky top-24 max-h-[calc(100vh-160px)] overflow-y-auto no-scrollbar pl-6 pr-6 xl:pl-12 xl:pr-12 border-r border-black/[0.04] z-20">
                                <div className="flex flex-col py-12">
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-black/20 block mb-12">The Menu</span>
                                    <nav className="space-y-6 flex-1">
                                        {/* Minimalist Search */}
                                        <div className="mb-8 pl-1 relative">
                                            <Search size={14} className="absolute left-1 top-2.5 text-black/20" />
                                            <input
                                                type="text"
                                                placeholder="Search items..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full bg-transparent border-b border-black/10 focus:border-black py-2 pl-7 text-[11px] font-black uppercase tracking-widest placeholder:text-black/20 outline-none transition-all"
                                            />
                                        </div>

                                        {categories.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => {
                                                    isManualScrolling.current = true;
                                                    setSelectedCategory(cat);
                                                    const element = document.getElementById(`section-${cat}`);
                                                    if (element) {
                                                        const isMobile = window.innerWidth < 1024;
                                                        const headerOffset = isMobile ? 72 : 100;
                                                        const elementPosition = element.getBoundingClientRect().top;
                                                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                                                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                                                    }
                                                    // Release manual lock after scroll completes
                                                    setTimeout(() => { isManualScrolling.current = false; }, 1000);
                                                }}
                                                className={`group flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] text-left transition-all ${selectedCategory === cat ? 'text-black' : 'text-black/30 hover:text-black hover:translate-x-1'}`}
                                            >
                                                <span className={`w-1 h-1 rounded-full bg-black transition-transform duration-300 ${selectedCategory === cat ? 'scale-100' : 'scale-0'}`} />
                                                {cat}
                                            </button>
                                        ))}
                                    </nav>

                                    <div className="pt-12 border-t border-black/[0.04]">
                                        <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-all">
                                            <Plus size={14} /> GROUP ORDER
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* 2. DESKTOP SIDEBAR (Sticky Positioning) */}

                        {/* B. MAIN CONTENT LAYER */}
                        <main className="flex-1 lg:pl-16 lg:pr-12 px-6 py-12 lg:py-24 max-w-5xl min-w-0 w-full">

                            {/* SECTION: FEATURED - Horizontal Scroll */}
                            {featuredItems.length > 0 && (
                                <div id="section-Featured items" className="mb-12">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-[12px] font-black uppercase tracking-[0.4em] text-black/20">Featured Selection</span>
                                    </div>

                                    <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-8 flex-nowrap -mx-2 px-2">
                                        {featuredItems.map((product, i) => (
                                            <div key={product.id} className="group flex flex-col gap-4 shrink-0 w-[260px] md:w-[calc(33.333%-0.75rem)] snap-start">
                                                <div className="aspect-[1.6/1] bg-black/[0.02] rounded-2xl overflow-hidden relative border border-black/[0.03]">
                                                    <img
                                                        src={product.imageUrl || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&index=${i}`}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000"
                                                    />
                                                    <button
                                                        onClick={() => addItem(product)}
                                                        className="absolute bottom-3 right-3 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg border border-black/[0.02] hover:bg-black hover:text-white transition-all transform hover:scale-110"
                                                    >
                                                        <Plus size={18} />
                                                    </button>
                                                </div>
                                                <div className="px-1">
                                                    <h3 className="text-base font-heading font-black tracking-tight mb-1 truncate">{product.name}</h3>
                                                    <div className="font-heading font-black text-sm text-black/80">KES {product.price.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SECTIONS: CATEGORIES - THE VISUAL MIRROR (UNIVERSAL PREMIUM) */}
                            <div className="space-y-24">
                                {categories.filter(c => c !== 'Featured items').map(cat => {
                                    const categoryProducts = products.filter(p =>
                                        p.categoryId === cat &&
                                        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
                                    );

                                    if (categoryProducts.length === 0) return null;

                                    return (
                                        <motion.div key={cat} id={`section-${cat}`} variants={staggerItem} className="scroll-mt-24 pt-2">
                                            <div
                                                className="lg:sticky lg:top-0 mb-8 lg:border-b border-black/5 pb-6 lg:backdrop-blur-md -mx-4 px-4 z-10"
                                                style={{ backgroundColor: `${merchant.branding?.secondaryColor || '#D4AF37'}E6` }}
                                            >
                                                <h2 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-black uppercase">{cat}</h2>
                                            </div>

                                            <motion.div
                                                variants={staggerContainer}
                                                initial="hidden"
                                                animate="show"
                                                className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                                            >
                                                {categoryProducts.map(product => {
                                                    const cartItem = items.find(i => i.id === product.id);

                                                    return (
                                                        <motion.div
                                                            key={product.id}
                                                            variants={staggerItem}
                                                            className="group relative bg-black/[0.015] rounded-2xl flex border border-black/[0.04] overflow-hidden hover:bg-white/10 hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all duration-500 min-h-[114px]"
                                                        >
                                                            {/* Product Details (Left) */}
                                                            <div className="flex-1 px-4 py-2.5 min-w-0 flex flex-col justify-center">
                                                                <h4 className="text-base font-heading font-black tracking-tight mb-0.5 line-clamp-1">{product.name}</h4>
                                                                <div className="text-sm font-bold text-gray-900 mb-1">KES {product.price.toLocaleString()}</div>
                                                                {product.preparationTimeMin && (
                                                                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                                                        <Clock size={12} />
                                                                        <span>Ready in {product.preparationTimeMin} min</span>
                                                                    </div>
                                                                )}
                                                                {product.tags && product.tags.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mb-1">
                                                                        {product.tags.map((tag: string) => (
                                                                            <span key={tag} className="text-[8px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                                                {tag}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {product.description && (
                                                                    <p className="text-[11px] text-black/50 font-medium leading-[1.2] line-clamp-2">
                                                                        {product.description}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Product Image (Right Side - Full Height) */}
                                                            <div className="relative shrink-0 w-28 md:w-36 h-full">
                                                                <img
                                                                    src={product.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400"}
                                                                    alt={product.name}
                                                                    className="w-full h-full object-cover"
                                                                />

                                                                {/* Unavailable Overlay */}
                                                                {!product.isAvailable && (
                                                                    <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] flex items-center justify-center">
                                                                        <span className="bg-red-500 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg">
                                                                            UNAVAILABLE
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Floating Controls Overlapping Image */}
                                                                <div className="absolute bottom-2 right-2 z-20">
                                                                    {cartItem ? (
                                                                        <motion.div
                                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                                            animate={{ scale: 1, opacity: 1 }}
                                                                            className="bg-white rounded-full flex items-center shadow-lg border border-black/[0.05] overflow-hidden"
                                                                        >
                                                                            <button
                                                                                onClick={() => updateQuantity(product.id, -1)}
                                                                                className="w-8 h-8 flex items-center justify-center hover:bg-black/5 transition-colors"
                                                                            >
                                                                                <Minus size={12} />
                                                                            </button>
                                                                            <span className="px-1 text-[11px] font-black min-w-[20px] text-center">{cartItem.quantity}</span>
                                                                            <button
                                                                                onClick={() => updateQuantity(product.id, 1)}
                                                                                className="w-8 h-8 flex items-center justify-center hover:bg-black/5 transition-colors"
                                                                            >
                                                                                <Plus size={12} />
                                                                            </button>
                                                                        </motion.div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => addItem(product)}
                                                                            disabled={!product.isAvailable}
                                                                            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg border transition-all transform ${product.isAvailable
                                                                                ? 'bg-white text-black border-black/[0.03] hover:bg-black hover:text-white hover:scale-110 active:scale-95'
                                                                                : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
                                                                                }`}
                                                                        >
                                                                            <Plus size={16} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </motion.div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </main>
                    </div>
                </div>

                <BottomCurve fill="#000000" />
            </section>

            {/* 3. BLACK SECTION - Footer */}
            <Footer />

            {/* 4. NEW GLASS CART (SHARED COMPONENT) */}
            <GlassCart merchant={merchant} />
        </div>
    );
}
