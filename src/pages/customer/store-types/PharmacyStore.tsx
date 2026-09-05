import Footer from '../../../components/layout/Footer';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Clock, MapPin, Search, ShoppingBag, Menu, X, User, Heart, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../../context/CartContext';
import LocationModal from '../../../components/marketing/LocationModal';
import ProfileModal from '../../../components/ui/shared/ProfileModal';
import GlassCart from '../../../components/ui/shared/GlassCart';
import { useAuth } from '../../../context/AuthContext';

interface PharmacyStoreProps {
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

export default function PharmacyStore({ merchant, products }: PharmacyStoreProps) {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { addItem, updateQuantity, items, itemCount } = useCart();
    const [selectedCategory, setSelectedCategory] = useState('Featured items');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal & Menu States 
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [userLocation, setUserLocation] = useState('Lavington, Nairobi');
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
            rootMargin: '-80px 0px -80% 0px',
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
        categories.forEach(cat => {
            const element = document.getElementById(`section-${cat}`);
            if (element) observer.observe(element);
        });
        return () => observer.disconnect();
    }, [categories, searchTerm]);

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
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="lg:hidden w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center border border-white/10 transition-colors"
                        >
                            <Menu size={20} />
                        </button>

                        <div onClick={() => navigate('/')} className="cursor-pointer flex items-center gap-2 shrink-0 text-2xl font-heading font-bold tracking-tighter">
                            Muncheez<span className="text-[#D4AF37]">.</span>
                        </div>

                        <div
                            onClick={() => setIsLocationModalOpen(true)}
                            className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-white/10 transition-all"
                        >
                            <MapPin size={12} className="text-[#D4AF37]" />
                            <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">{userLocation}</span>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl relative group">
                        <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            placeholder={merchant.customSettings?.searchPlaceholder || "Search health & wellness..."}
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
                            className="hidden sm:flex w-10 h-10 bg-white/10 text-white rounded-lg items-center justify-center border border-white/10 cursor-pointer hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
                        >
                            {profile?.full_name ? (
                                <span className="text-xs font-black">{profile.full_name.charAt(0).toUpperCase()}</span>
                            ) : (
                                <User size={18} className="opacity-70" />
                            )}
                        </div>
                    </div>
                </div>

                <LocationModal
                    isOpen={isLocationModalOpen}
                    onClose={() => setIsLocationModalOpen(false)}
                    onSelectLocation={(loc) => { setUserLocation(loc); setIsLocationModalOpen(false); }}
                />

                <ProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                />

                {/* MOBILE MENU DRAWER (US-STYLE REDESIGN) */}
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

                                <div className="mt-auto pt-8 border-t border-black/5">
                                    <div className="flex items-center gap-4 mb-4 px-4">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center border"
                                            style={{
                                                backgroundColor: `${merchant.branding?.primaryColor || '#4A90E2'}1A`,
                                                borderColor: `${merchant.branding?.primaryColor || '#4A90E2'}33`
                                            }}
                                        >
                                            {profile?.full_name ? (
                                                <span className="text-xs font-black" style={{ color: merchant.branding?.primaryColor || '#4A90E2' }}>{profile.full_name.charAt(0).toUpperCase()}</span>
                                            ) : (
                                                <User size={18} style={{ color: merchant.branding?.primaryColor || '#4A90E2' }} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-black/80">
                                                {profile?.full_name || 'Adventurer'}
                                            </div>
                                            <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: merchant.branding?.primaryColor || '#4A90E2' }}>
                                                {profile?.loyalty_tier || 'Standard'} Tier
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Atmospheric Title Section */}
                <div className="max-w-7xl mx-auto relative z-20 mb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] block mb-4" style={{ color: merchant.branding?.secondaryColor || '#D4AF37' }}>{merchant.customSettings?.storeTagline || 'The Apothecary'}</span>
                            {merchant.customSettings?.pharmacistName && (
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Pharmacist: {merchant.customSettings.pharmacistName} <span className="text-white/30">{merchant.customSettings?.pharmacistLicense ? `(Lic #${merchant.customSettings.pharmacistLicense})` : ''}</span></span>
                                </div>
                            )}
                            <h1 className="text-5xl md:text-8xl font-heading font-light tracking-tighter text-white leading-[0.85]">
                                {merchant?.businessName || 'PHARMACY'}<span style={{ color: merchant.branding?.secondaryColor || '#D4AF37' }}>.</span>
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 mt-10 text-[11px] font-black uppercase tracking-widest text-white/40">
                                {merchant.customSettings?.showTrustedCare !== false && (
                                    <div className="flex items-center gap-2 uppercase">
                                        <Heart size={12} style={{ color: merchant.branding?.secondaryColor || '#D4AF37' }} /> Trusted Care
                                    </div>
                                )}
                                {merchant.customSettings?.showAvailability !== false && (
                                    <div className="flex items-center gap-2 uppercase">
                                        <Clock size={12} style={{ color: merchant.branding?.secondaryColor || '#D4AF37' }} /> 24/7 Availability
                                    </div>
                                )}
                                {merchant.customSettings?.acceptInsurance && (
                                    <div className="flex items-center gap-2 uppercase">
                                        <CreditCard size={12} style={{ color: merchant.branding?.secondaryColor || '#D4AF37' }} /> Insurance Accepted
                                    </div>
                                )}
                                {merchant.customSettings?.showCardAccepted !== false && !merchant.customSettings?.acceptInsurance && (
                                    <div className="flex items-center gap-2 uppercase">
                                        <CreditCard size={12} style={{ color: merchant.branding?.secondaryColor || '#D4AF37' }} /> Card Accepted
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-white/30 text-xs md:text-sm max-w-sm font-medium leading-relaxed opacity-80">
                            {merchant.customSettings?.atmosphericDescription || 'Expertly curated health and wellness essentials. From life-saving medicines to premium personal care, delivered with speed and discretion.'}
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
                    <div className="flex flex-col lg:flex-row min-h-screen overflow-visible">

                        {/* DESKTOP SIDEBAR */}
                        <aside className="hidden lg:block w-[260px] xl:w-[300px] shrink-0">
                            <div className="sticky top-24 max-h-[calc(100vh-160px)] overflow-y-auto no-scrollbar pl-6 pr-6 xl:pl-12 xl:pr-12 border-r border-black/[0.04] z-20">
                                <div className="flex flex-col py-12">
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-black/20 block mb-12">Inventory</span>

                                    <nav className="space-y-6 flex-1">
                                        {/* Minimalist Sidebar Search */}
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
                                                        const headerOffset = 100;
                                                        const elementPosition = element.getBoundingClientRect().top;
                                                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                                                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                                                    }
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
                                            <Plus size={14} /> GROUP DISPENSARY
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* MAIN CONTENT */}

                        {/* MAIN CONTENT */}
                        <main className="flex-1 lg:pl-16 lg:pr-12 px-6 py-12 lg:py-24 max-w-5xl min-w-0 w-full">

                            {/* FEATURED items */}
                            {featuredItems.length > 0 && !searchTerm && (
                                <div id="section-Featured items" className="mb-12">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-[12px] font-black uppercase tracking-[0.4em] text-black/20">Apothecary Deals</span>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-8 flex-nowrap -mx-2 px-2">
                                        {featuredItems.map((product) => (
                                            <div key={product.id} className="group flex flex-col gap-4 shrink-0 w-[260px] md:w-[calc(33.333%-0.75rem)] snap-start">
                                                <div className="aspect-[1.6/1] bg-black/[0.02] rounded-2xl overflow-hidden relative border border-black/[0.1]">
                                                    <img
                                                        src={product.imageUrl || `https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800`}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000"
                                                    />
                                                    <button
                                                        onClick={() => addItem(product)}
                                                        className="absolute bottom-3 right-3 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:bg-black hover:text-white transition-all transform hover:scale-110"
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

                            {/* CATEGORIES (UNIVERSAL PREMIUM) */}
                            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-24">
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                                {categoryProducts.map(product => {
                                                    const cartItem = (items as any[] || []).find(i => i.id === product.id);

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
                                                                {product.isPrescriptionRequired && (
                                                                    <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-md mb-1 w-fit">
                                                                        <span className="text-[9px] font-black uppercase">⚕️ Rx Required</span>
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
                                                                    src={product.imageUrl || "https://images.unsplash.com/photo-1547489432-cf93fa6c71ee?q=80&w=400"}
                                                                    alt={product.name}
                                                                    className="w-full h-full object-cover"
                                                                />

                                                                {/* Out of Stock Overlay */}
                                                                {(product.stockLevel === 0 || !product.isAvailable) && (
                                                                    <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] flex items-center justify-center">
                                                                        <span className="bg-red-500 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg">
                                                                            {product.stockLevel === 0 ? 'OUT OF STOCK' : 'UNAVAILABLE'}
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
                                                                            disabled={product.stockLevel === 0 || !product.isAvailable}
                                                                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border transition-all transform ${(product.stockLevel === 0 || !product.isAvailable)
                                                                                ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
                                                                                : 'bg-white text-black border-black/[0.03] hover:bg-black hover:text-white hover:scale-110 active:scale-95'
                                                                                }`}
                                                                        >
                                                                            <Plus size={18} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </main>
                    </div>
                </div>

                <BottomCurve fill="#000000" />
            </section>

            <Footer />

            {/* NEW GLASS CART (SHARED COMPONENT) */}
            <GlassCart merchant={merchant} />
        </div>
    );
}
