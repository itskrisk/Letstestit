import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Search,
    MapPin,
    User,
    ShoppingBag,
    ArrowRight,
    Menu,
    X,
    LogOut,
} from 'lucide-react';
import LocationModal from '../../components/marketing/LocationModal';
import ProfileModal from '../../components/ui/shared/ProfileModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';
import { publicApi } from '../../lib/api';

// 1. BRAND PILLARS (Functional FOUNDATIONS)
const SEGMENT_MAP: Record<string, { title: string; subtitle: string; description: string; categories: string[] }> = {
    'kitchen': {
        title: "The Kitchens",
        subtitle: "Fine Dining to Street Eats",
        description: "From Westlands' boutique dining to the legendary food carts of the city center. Delivered with soul.",
        categories: ['All', 'Promotions', 'Fast food', 'Halal', 'Chicken', 'Pizza', 'Local food', 'Burgers', 'Indian']
    },
    'market': {
        title: "The Market",
        subtitle: "Supermarkets & Mama Mboga",
        description: "Full supermarket hauls and fresh produce from local stalls, handled with the respect they deserve.",
        categories: ['All', 'Supermarket', 'Mama Mboga', 'Snacks', 'Alcohol']
    },
    'bakes': {
        title: "Bakes & Blooms",
        subtitle: "Bakeries & Florists",
        description: "Artisan sourdough, delicate pastries, and the city’s most vibrant floral arrangements.",
        categories: ['All', 'Bakery', 'Desserts', 'Tea & coffee', 'Breakfast', 'Florist']
    },
    'apothecary': {
        title: "The Apothecary",
        subtitle: "Health & Hydration",
        description: "Quick, discreet pharmacy essentials and professional-grade water delivery for your home.",
        categories: ['All', 'Pharmacy', 'Wellness', 'Water']
    },
    'general': {
        title: "The Collective",
        subtitle: "Essentials, Elevated.",
        description: "Nairobi's finest selection across all departments, unified in one experience.",
        categories: ['All', 'Promotions', 'Fast food', 'Supermarket', 'Pharmacy', 'Bakery', 'Local food']
    }
};

// 2. CURATION MOODS (Editorial LAYERS)
const MOOD_MAP: Record<string, { name: string; tagline: string; image: string; color: string; letter: string }> = {
    'morning-dew': {
        name: 'Morning Dew',
        tagline: 'The Early Rise',
        image: 'https://images.unsplash.com/photo-1444418185997-1145404873e0?q=80&w=800',
        color: '#4A90E2',
        letter: 'M'
    },
    'street-kings': {
        name: 'Street Kings',
        tagline: 'The Hustle',
        image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800',
        color: '#E63946',
        letter: 'S'
    },
    'kula-fiti': {
        name: 'Kula Fiti',
        tagline: 'The Balance',
        image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?q=80&w=800',
        color: '#2A9D8F',
        letter: 'K'
    },
    'the-vault': {
        name: 'the vault',
        tagline: 'Elite Selection',
        image: 'https://images.unsplash.com/photo-1569701881643-5671578e39a7?q=80&w=800',
        color: '#D4AF37',
        letter: 'V'
    }
};

export default function StoreListing() {
    const navigate = useNavigate();
    const { user, profile, signOut } = useAuth();
    const [searchParams] = useSearchParams();
    const activeView = searchParams.get('v') || 'general';
    const activeTag = searchParams.get('tag'); // Get the deep-link tag
    const config = SEGMENT_MAP[activeView] || SEGMENT_MAP.general;

    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Location State
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [userLocation, setUserLocation] = useState('Lavington, Nairobi');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Load stores from Supabase
    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        const result = await publicApi.getStores();
        if (result.data) {
            setStores(result.data);
        }
        setLoading(false);
    };

    const categories = config.categories;
    const isFiltered = searchQuery !== '' || activeCategory !== 'All' || !!activeTag;

    // Scroll Review: Ensure we start at the top when view/tag changes
    // Scroll Review: Ensure we start at the top when view/tag changes
    useEffect(() => {
        window.scrollTo(0, 0);

        // SYNC: If incoming tag from Home, set it as Search Query to match internal behavior
        if (activeTag) {
            const mood = MOOD_MAP[activeTag];
            if (mood) {
                setSearchQuery(mood.name);
            } else {
                setSearchQuery(activeTag.replace(/-/g, ' '));
            }
        } else {
            // IF NO TAG: We are just changing views (e.g. Kitchen -> Market)
            // We MUST clear the search query so the user isn't stuck with "Morning Dew" filter in "The Market"
            setSearchQuery('');
        }
    }, [activeView, activeTag]);

    // Unified Market Data (Wired to Supabase)
    const MARKET_STORES = useMemo(() => {
        return stores.map((m: any) => ({
            id: m.id,
            name: m.business_name,
            promo: m.branding?.promo || '',
            status: 'Open', // TODO: Add operating hours logic
            rating: m.rating ? `${m.rating}` : '--',
            count: m.review_count ? `(${m.review_count})` : '(0)',
            type: m.type,
            departments: m.branding?.departments || ['kitchen'],
            tags: m.branding?.tags || [],
            actionText: 'Order Now',
            image: m.cover_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800',
            isTopRated: m.rating >= 4.5
        }));
    }, [stores]);

    // Filter logic
    const filteredMarketStores = MARKET_STORES.filter((store: any) => {
        // 1. Check if store belongs to the active view (if not 'general')
        const matchesView = activeView === 'general' || store.departments.includes(activeView as any);

        // 2. Check category filter
        const matchesCategory = activeCategory === 'All' || activeCategory === 'Promotions'
            ? (activeCategory === 'Promotions' ? !!store.promo : true)
            : store.type === activeCategory;

        // 3. Check search query
        const lowerCaseSearchQuery = searchQuery.toLowerCase();
        const matchesSearch = store.name.toLowerCase().includes(lowerCaseSearchQuery) ||
            (store.tags && store.tags.some((tag: string) => tag.toLowerCase().includes(lowerCaseSearchQuery)));

        // 4. Check deep-link tag (if present)
        // NOTE: We now handle this via setSearchQuery effect above, so we don't need strict tag filtering here
        // This ensures "Morning Dew" in URL behaves exactly like typing "Morning Dew" or clicking the button
        return matchesView && matchesCategory && matchesSearch;
    });

    // --- Sub-Component: StoreCard ---
    const StoreCard = ({ store, idx }: { store: any, idx: number }) => (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => navigate(`/c/store/${store.id}`)}
            className="group cursor-pointer"
        >
            {/* Glass Container */}
            <div className="relative aspect-[16/10] rounded-[2rem] overflow-hidden mb-4 shadow-2xl group-hover:shadow-black/20 transition-all duration-700">
                <img
                    src={store.image}
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[0.1] group-hover:grayscale-0"
                />

                {/* Dynamic Promo Tag - Minimalist Sliver (No Border) */}
                {store.promo && (
                    <div className="absolute top-4 left-4 z-10">
                        <span className="text-[9px] font-black tracking-widest text-[#D4AF37] uppercase bg-black/40 backdrop-blur-md px-3 py-1 rounded-full">
                            {store.promo}
                        </span>
                    </div>
                )}

                {/* Status Overlay for Closed Stores */}
                {store.status === 'Closed' && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-2xl">
                            Currently Closed
                        </span>
                    </div>
                )}

                {/* Minimalist Action Reveal - Corner Arrow */}
                <div className="absolute bottom-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-black">
                    <ArrowRight size={14} className="text-white group-hover:text-black transition-colors" />
                </div>
            </div>

            {/* Meta Content */}
            <div className="px-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                        {store.isTopRated && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Premium Selection</span>
                        )}
                        <h3 className="text-xl font-heading font-black tracking-tighter leading-tight transition-colors">
                            {store.name}
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-700">
                    <span className={`${store.status.includes('Closed') ? 'text-amber-700' : 'text-green-600'}`}>
                        {store.status}
                    </span>

                    {store.rating !== '--' && (
                        <>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <div className="flex items-center gap-1.5 font-black text-gray-900">
                                <span>{store.rating}</span>
                                <span className="text-gray-400 font-medium">{store.count}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );

    // SVG Curves (Standardized from OurStory.tsx)
    const BottomCurve = ({ fill }: { fill: string }) => (
        <div className="absolute bottom-[-1px] left-0 w-full leading-[0] z-20 pointer-events-none">
            <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-[40px] md:h-[100px] block" preserveAspectRatio="none">
                <path fill={fill} fillOpacity="1" d="M0,0L48,10C96,20,192,40,288,50C384,60,480,60,576,50C672,40,768,20,864,15C960,10,1056,20,1152,30C1248,40,1344,50,1392,55L1440,60L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z"></path>
            </svg>
        </div>
    );

    return (
        <div className="min-h-screen font-sans selection:bg-black selection:text-white overflow-x-hidden relative bg-black">

            {/* 1. HEADER & ORIGIN - BLUE SECTION */}
            <section className="relative bg-[#4A90E2] text-white pt-6 pb-24 px-6 lg:px-12 overflow-hidden">
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

                        {/* Location - Restored (Interactive) */}
                        <div
                            onClick={() => setIsLocationModalOpen(true)}
                            className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-white/10 transition-all"
                        >
                            <MapPin size={12} className="text-[#D4AF37]" />
                            <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">{userLocation}</span>
                        </div>
                    </div>

                    {/* Integrated Search */}
                    <div className="flex-1 max-w-xl relative group">
                        <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            placeholder="Find Nairobi's best..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 backdrop-blur-md rounded-full outline-none focus:bg-white/10 transition-all text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95"><ShoppingBag size={18} /></div>
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

                {/* Atmospheric Title Section */}
                <div className="max-w-7xl mx-auto relative z-20 mb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] block blur-[0.3px]">{config.subtitle}</span>
                            <h1 className="text-4xl md:text-8xl font-heading font-light tracking-tighter text-white leading-none">
                                {config.title}
                            </h1>
                        </div>
                        <p className="text-white/30 text-xs md:text-sm max-w-sm font-medium leading-relaxed opacity-80">
                            {config.description}
                        </p>
                    </div>

                    {/* 2. Integrated Horizontal Switcher - Only visible on segmented views */}
                    {activeView !== 'general' && activeView !== '' && (
                        <div
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                            className="flex items-center gap-8 mt-12 py-4 border-b border-white/5 overflow-x-auto no-scrollbar touch-pan-x"
                        >
                            {['general', 'kitchen', 'market', 'bakes', 'apothecary'].map(id => {
                                const segment = SEGMENT_MAP[id];
                                const isActive = activeView === id || (id === 'general' && activeView === '');
                                return (
                                    <button
                                        key={id}
                                        onClick={() => navigate(id === 'general' ? '/c/stores' : `/c/stores?v=${id}`)}
                                        style={{ WebkitTapHighlightColor: 'transparent' }}
                                        className={`text-[9px] font-black uppercase tracking-[0.4em] transition-all whitespace-nowrap relative py-2 outline-none ${isActive ? 'text-[#D4AF37]' : 'text-white/20 hover:text-white/60'}`}
                                    >
                                        {id === 'general' ? 'The Collective' : segment.title}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activePillar"
                                                className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-[#D4AF37]"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* MOOD SLIDER (Minimalist Discovery Tags) */}
                {activeView === 'kitchen' && (
                    <div className="hidden lg:block max-w-7xl mx-auto relative z-20 pb-16">
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white/20 mr-4">Kitchen Discoveries:</span>
                            {Object.entries(MOOD_MAP).map(([id, mood]) => (
                                <button
                                    key={id}
                                    onClick={() => setSearchQuery(mood.name)}
                                    className={`px-6 py-2 rounded-full border border-white/5 bg-white/5 hover:border-white/20 transition-all group relative overflow-hidden`}
                                >
                                    <div className="flex items-center gap-3 relative z-10">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                                            {mood.name}
                                        </span>
                                        <ArrowRight size={10} className="text-white/20 group-hover:text-[#D4AF37] transition-colors" />
                                    </div>
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                                        style={{ backgroundColor: mood.color }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <BottomCurve fill="#D4AF37" />
            </section>

            {/* 2. CATEGORIES & STORES - YELLOW SECTION */}
            <section className="relative bg-[#D4AF37] text-gray-900 pt-16 pb-48 px-6 lg:px-12 overflow-hidden">
                <div className="absolute inset-0 z-[5] opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-multiply" />

                <div className="max-w-7xl mx-auto relative z-20">
                    {/* Category Filter Pills & Reset */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-black text-white shadow-xl' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Reset Filter UI */}
                        {isFiltered && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => {
                                    setSearchQuery('');
                                    setActiveCategory('All');
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-black/10 hover:bg-black/20 rounded-full transition-all group shrink-0"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">Clear Discovery</span>
                                <X size={14} className="group-hover:rotate-90 transition-transform" />
                            </motion.button>
                        )}
                    </div>

                    {/* Store Grid */}
                    {activeView === 'general' && searchQuery === '' && activeCategory === 'All' ? (
                        <div className="space-y-32">
                            {['kitchen', 'market', 'bakes', 'apothecary'].map((dept: string) => {
                                const deptStores = MARKET_STORES.filter((s: any) => s.departments.includes(dept as any));
                                if (deptStores.length === 0) return null;
                                const segmentConfig = SEGMENT_MAP[dept];

                                return (
                                    <div key={dept} className="space-y-12">
                                        <div className="flex items-end justify-between border-b border-black/10 pb-8">
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-black/20 mb-3 block">{segmentConfig.subtitle}</span>
                                                <h2 className="text-4xl md:text-6xl font-heading font-black tracking-tighter">{segmentConfig.title}</h2>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/c/stores?v=${dept}`)}
                                                className="group flex items-center gap-4 py-2 relative"
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black/60 group-hover:text-black transition-colors">
                                                    Discover Selection
                                                </span>
                                                <div className="relative w-8 h-8 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-black group-hover:border-black transition-all">
                                                    <ArrowRight size={12} className="group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                                            {deptStores.slice(0, 4).map((store: any, idx: number) => (
                                                <StoreCard key={store.id} store={store} idx={idx} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                            <AnimatePresence mode='popLayout'>
                                {filteredMarketStores.map((store: any, idx: number) => (
                                    <StoreCard key={store.id} store={store} idx={idx} />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {filteredMarketStores.length === 0 && (
                        <div className="text-center py-32">
                            <ShoppingBag size={64} className="mx-auto text-black/10 mb-6" />
                            <h3 className="text-3xl font-heading font-black mb-2">No matches found</h3>
                            <p className="text-black/40 font-medium">Try searching for something else or clearing your filters.</p>
                        </div>
                    )}
                </div>

                <BottomCurve fill="#000000" />
            </section>

            <Footer />
        </div>
    );
}
