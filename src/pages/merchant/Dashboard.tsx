import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, ShoppingBag, UtensilsCrossed, BarChart3,
    Settings, LogOut, Menu, Bell, Users, Truck, Wallet,
    Megaphone, HelpCircle, Power, Plus, ChevronDown, ShieldAlert
} from 'lucide-react';
import OrdersView from "../../components/merchant/OrdersView";
import ProductsView from "../../components/merchant/ProductsView";
import CustomersView from "../../components/merchant/CustomersView";
import DeliveriesView from "../../components/merchant/DeliveriesView";
import PaymentsView from "../../components/merchant/PaymentsView";
import MarketingView from "../../components/merchant/MarketingView";
import ReportsView from "../../components/merchant/ReportsView";
import SettingsView from "../../components/merchant/SettingsView";
import HelpView from "../../components/merchant/HelpView";
import OverviewView from "../../components/merchant/OverviewView";
import VerificationOverlay from "../../components/VerificationOverlay";

import { useMockDatabase } from "../../context/MockDatabaseContext";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function MerchantDashboard() {
    const navigate = useNavigate();
    const { user, profile, signOut } = useAuth();
    const { merchants, orders,
        updateOrderStatus,
        updateMerchantSettings,
        getMerchantProducts,
        addProduct,
        updateProduct,
        deleteProduct
    } = useMockDatabase();

    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeSection, setActiveSection] = useState('Overview');
    const [supabaseMerchant, setSupabaseMerchant] = useState<any>(null);
    const [isLoadingSupabase, setIsLoadingSupabase] = useState(true);

    // Fetch merchant from Supabase
    useEffect(() => {
        const fetchMerchant = async () => {
            if (!user?.id) {
                setIsLoadingSupabase(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('merchants')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching merchant:', error);
                } else if (data) {
                    setSupabaseMerchant(data);
                }
            } catch (err) {
                console.error('Fetch merchant error:', err);
            } finally {
                setIsLoadingSupabase(false);
            }
        };

        fetchMerchant();
    }, [user?.id]);

    // Refresh merchant data periodically to pick up approval changes
    useEffect(() => {
        if (!user?.id || isApproved) return;

        const interval = setInterval(async () => {
            try {
                const { data, error } = await supabase
                    .from('merchants')
                    .select('status, is_active')
                    .eq('id', user.id)
                    .single();

                if (data && !error) {
                    setSupabaseMerchant(prev => prev ? { ...prev, ...data } : prev);
                }
            } catch (err) {
                // Silently fail - user can manually refresh
            }
        }, 5000); // Poll every 5 seconds when pending

        return () => clearInterval(interval);
    }, [user?.id, isApproved]);

    // Derived: Active Merchant (Prefer real DB profile, fallback to mock state)
    const [activeMerchantId, setActiveMerchantId] = useState<string | null>(profile?.id || localStorage.getItem('activeMerchantId') || (merchants.length > 0 ? merchants[0].id : null));

    useEffect(() => {
        if (!activeMerchantId && merchants.length > 0) {
            setActiveMerchantId(merchants[0].id);
        }
    }, [merchants, activeMerchantId]);

    // Update activeMerchantId when Supabase merchant is loaded
    useEffect(() => {
        if (supabaseMerchant?.id && !activeMerchantId) {
            setActiveMerchantId(supabaseMerchant.id);
        }
    }, [supabaseMerchant, activeMerchantId]);

    const activeBusiness = useMemo(() => {
        if (supabaseMerchant) {
            return supabaseMerchant;
        }
        if (user && profile?.roles?.includes('merchant')) {
            const found = merchants.find(m => m.id === profile.id);
            if (found) return found;
            return {
                id: profile.id,
                businessName: profile.full_name || 'My Merchant Store',
                status: profile.status || 'PENDING',
                type: (profile as any)?.merchant_type || 'Restaurant'
            };
        }
        return merchants.find(m => m.id === activeMerchantId) || merchants[0] || null;
    }, [merchants, activeMerchantId, profile, user, supabaseMerchant]);

    // Filtered data for this merchant
    const merchantOrders = useMemo(() =>
        activeMerchantId ? orders.filter(o => o.merchantId === activeMerchantId) : [],
        [orders, activeMerchantId]);

    const merchantProducts = useMemo(() =>
        activeMerchantId ? getMerchantProducts(activeMerchantId) : [],
        [getMerchantProducts, activeMerchantId]);

    // Derived State
    const actionRequiredCount = merchantOrders.filter(o => ['CREATED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status)).length;

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const merchantType = activeBusiness?.type || 'Merchant';

    // Block non-approved merchants from dashboard operations
    const rawStatus = supabaseMerchant?.status || profile?.status || activeBusiness?.status || 'PENDING';
    const merchantStatus = rawStatus === 'VERIFICATION_PENDING' ? 'PENDING' : rawStatus;
    const isApproved = merchantStatus === 'APPROVED';

    // Polymorphic Labels based on Merchant Type
    const getProductLabel = () => {
        const type = profile?.merchant_type || activeBusiness?.type;
        if (type?.toLowerCase() === 'restaurant') return 'Menu / Items';
        if (type?.toLowerCase() === 'supermarket') return 'Inventory / SKUs';
        if (type?.toLowerCase() === 'pharmacy') return 'Medicine / Stock';
        return 'Products / Inventory';
    };

    const handleLogout = async () => {
        localStorage.removeItem('activeMerchantId');
        await signOut();
        navigate('/partner/login');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Overview' },
        { icon: ShoppingBag, label: 'Orders', badge: actionRequiredCount > 0 ? actionRequiredCount.toString() : undefined },
        { icon: UtensilsCrossed, label: getProductLabel() },
        { icon: Users, label: 'Customers' },
        { icon: Truck, label: 'Deliveries' },
        { icon: Wallet, label: 'Payments & Earnings' },
        { icon: Megaphone, label: 'Marketing' },
        { icon: BarChart3, label: 'Reports' },
        { icon: Settings, label: 'Settings' },
        { icon: HelpCircle, label: 'Help' },
    ];

    // Show loading state while data is being fetched
    if (isLoadingSupabase && !activeBusiness && merchants.length === 0 && orders.length === 0) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-gray-500">Accessing dashboard...</p>
                </div>
            </div>
        );
    }

    // If still no business data after loading, show empty state
    if (!activeBusiness) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="text-center max-w-md">
                    <p className="text-lg font-bold text-gray-900 mb-2">No Business Found</p>
                    <p className="text-sm text-gray-500 mb-4">You don't have an active merchant profile yet. Please contact support or complete your onboarding.</p>
                    <button onClick={() => navigate('/partner/signup')} className="px-6 py-3 bg-[#D4AF37] text-black text-sm font-bold rounded-xl">
                        Complete Onboarding
                    </button>
                </div>
            </div>
        );
    }

    // Strict Blocking: If merchant is NOT approved, show the Waiting for Approval screen
    if (!isApproved) {
        return (
            <VerificationOverlay
                status={(merchantStatus === 'VERIFICATION_PENDING' ? 'PENDING' : merchantStatus) as 'PENDING' | 'UNDER_REVIEW' | 'REJECTED' | 'SUSPENDED'}
                name={profile?.full_name || activeBusiness?.ownerName || activeBusiness?.businessName}
                email={user?.email || activeBusiness?.email}
                onContactSupport={() => window.location.href = 'mailto:partners@muncheez.co.ke'}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex font-sans">

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Mobile Drawer / Desktop Fixed */}
            <motion.aside
                initial={false}
                animate={{
                    x: sidebarOpen ? 0 : -300
                }}
                className="w-64 bg-white border-r border-gray-100 fixed h-full z-50 flex flex-col lg:z-30"
            >
                {/* Brand */}
                <div className="h-16 lg:h-20 flex items-center justify-between px-6 border-b border-gray-100">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="font-heading font-bold text-xl tracking-tighter text-gray-900">
                            Muncheez<span className="text-[#D4AF37]">.</span>
                        </span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Power size={18} className="text-gray-400" />
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setActiveSection(item.label);
                                if (window.innerWidth < 1024) {
                                    setSidebarOpen(false);
                                }
                            }}
                            className={`
                                w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group min-h-[44px]
                                ${activeSection === item.label
                                    ? 'bg-[#D4AF37] text-black font-bold'
                                    : 'text-gray-500 hover:text-black hover:bg-gray-50'}
                            `}
                        >
                            <item.icon size={20} strokeWidth={activeSection === item.label ? 2.5 : 1.5} className="shrink-0" />
                            <span className={`text-sm tracking-wide ${activeSection === item.label ? 'font-bold' : 'font-medium'}`}>
                                {item.label}
                            </span>
                            {item.badge && (
                                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* User / Logout */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-400 hover:text-red-500 transition-colors min-h-[44px]"
                    >
                        <LogOut size={20} className="shrink-0" />
                        <span className="text-sm font-medium tracking-wide">Logout</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 transition-all duration-300 min-h-screen flex flex-col">

                {/* Topbar */}
                <header className="h-16 lg:h-20 bg-white sticky top-0 z-20 px-4 lg:px-8 flex items-center justify-between gap-2 lg:gap-4 border-b border-gray-100">
                    {/* Left: Hamburger + Outlet Selector */}
                    <div className="flex items-center gap-3 lg:gap-6 flex-1 relative z-10">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-black transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                            <Menu size={22} />
                        </button>

                        <div className="flex items-center gap-3 relative">
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] lg:text-[10px] uppercase font-bold text-gray-400 tracking-wider">Business</span>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-1 lg:gap-2 font-heading font-bold text-black leading-none group text-left hover:text-[#D4AF37] transition-colors text-sm lg:text-base truncate"
                                >
                                    <span className="truncate max-w-[120px] lg:max-w-none">{activeBusiness.businessName}</span>
                                    <ChevronDown size={14} className="text-gray-300 transition-transform duration-200 shrink-0" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                </button>
                            </div>

                            {/* DROPDOWN MENU */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 mt-4 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50">
                                    <div className="px-3 py-2 border-b border-gray-50 mb-2">
                                        <p className="text-[10px] font-bold uppercase text-gray-400">Select Business</p>
                                    </div>
                                    {merchants.map((biz) => (
                                        <button
                                            key={biz.id}
                                            onClick={() => {
                                                setActiveMerchantId(biz.id);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`
                                                w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-colors
                                                ${activeBusiness.id === biz.id ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-700'}
                                            `}
                                        >
                                            <div>
                                                <div className="font-bold text-sm leading-none">{biz.businessName}</div>
                                                <div className={`text-[10px] uppercase font-bold mt-1 ${activeBusiness.id === biz.id ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                                                    {biz.type}
                                                </div>
                                            </div>
                                            {activeBusiness.id === biz.id && <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="hidden lg:flex items-center gap-4 ml-6 pl-6 border-l border-gray-100">
                            {actionRequiredCount > 0 && (
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    {actionRequiredCount} New Orders
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                0 Riders Waiting
                            </div>
                        </div>
                    </div>

                    {/* Right: Online Toggle, Notifs, Profile */}
                    <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                        {/* Online Toggle */}
                        <button
                            onClick={() => updateMerchantSettings(activeBusiness.id, { isActive: !activeBusiness.isActive })}
                            className={`flex items-center gap-2 lg:gap-3 px-2 lg:px-1.5 py-1.5 lg:pr-4 rounded-full transition-all group min-h-[44px] ${(activeBusiness as any).isActive ? 'bg-green-100 hover:bg-green-200' : 'bg-red-100 hover:bg-red-200'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-colors ${(activeBusiness as any).isActive ? 'bg-[#00A082]' : 'bg-red-600'
                                }`}>
                                <Power size={14} strokeWidth={3} />
                            </div>
                            <span className={`hidden lg:inline text-xs font-bold uppercase tracking-wider ${(activeBusiness as any).isActive ? 'text-green-800' : 'text-red-800'}`}>
                                {(activeBusiness as any).isActive ? 'Online' : 'Offline'}
                            </span>
                        </button>

                        <div className="h-8 w-[1px] bg-gray-200 hidden lg:block" />

                        {/* Notifications */}
                        <button className="relative p-2 text-gray-400 hover:text-black transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>

                        {/* Profile Dropdown */}
                        <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-bold text-gray-900 leading-none">{activeBusiness.businessName}</div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{activeBusiness.ownerName}</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-transparent group-hover:border-[#D4AF37] transition-all overflow-hidden text-gray-400 flex items-center justify-center">
                                <img
                                    src="https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=200"
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content Area */}
                <div className="flex-1 p-4 lg:p-8 overflow-y-auto overflow-x-hidden bg-[#FDFBF7] relative">
                    <div className="max-w-7xl mx-auto relative z-10">

                        {activeSection === 'Orders' ? (
                            <OrdersView
                                orders={merchantOrders}
                                onUpdateStatus={updateOrderStatus}
                            />
                        ) : activeSection === getProductLabel() ? (
                            <ProductsView
                                merchantId={activeBusiness.id}
                                merchantType={merchantType}
                                products={merchantProducts}
                                onAddProduct={addProduct}
                                onUpdateProduct={updateProduct}
                                onDeleteProduct={deleteProduct}
                            />
                        ) : activeSection === 'Customers' ? (
                            <CustomersView orders={merchantOrders} />
                        ) : activeSection === 'Deliveries' ? (
                            <DeliveriesView orders={merchantOrders} />
                        ) : activeSection === 'Payments & Earnings' ? (
                            <PaymentsView orders={merchantOrders} />
                        ) : activeSection === 'Marketing' ? (
                            <MarketingView orders={merchantOrders} />
                        ) : activeSection === 'Reports' ? (
                            <ReportsView merchantType={merchantType} orders={merchantOrders} />
                        ) : activeSection === 'Settings' ? (
                            <SettingsView merchant={activeBusiness} onUpdate={updateMerchantSettings} />
                        ) : activeSection === 'Help' ? (
                            <HelpView />
                        ) : (
                            /* Overview Content */
                            <OverviewView
                                merchantId={activeBusiness.id}
                                merchantType={merchantType}
                                orders={merchantOrders}
                                products={merchantProducts}
                            />)}
                    </div>
                </div>

            </main>
        </div>
    );
}
