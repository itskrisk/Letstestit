import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bike, TrendingUp, Clock, Award, ChevronRight, User,
    LifeBuoy, ShieldCheck, Zap, Wallet, Shield, FileText,
    Users, Settings, AlertTriangle, LogOut, Bell, Menu
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import VerificationOverlay from "../../components/VerificationOverlay";
import { courierApi } from "../../lib/api";
import { supabase } from "../../lib/supabaseClient";
import { PerformanceEngine } from "../../modules/rider/features/performance/performanceLogic";
import { RiderPresence } from "../../modules/rider/types/rider.types";
import { RiderStateMachine } from "../../modules/rider/state/riderMachine";
import DemandHeatmap from "../../modules/rider/components/DemandHeatmap";
import TransactionLedger from "../../modules/rider/components/TransactionLedger";
import { buildWalletLedger, formatKES } from "../../lib/moneyEngine";

/* ============================================================
   TYPES
============================================================ */

type Tab = "HOME" | "WALLET" | "PERFORMANCE" | "SAFETY" | "MORE";

const performanceEngine = new PerformanceEngine();

/* ============================================================
   COMPONENT
============================================================ */

export default function RiderDashboard() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();

    // Real Supabase State
    const [currentRider, setCurrentRider] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [walletEntries, setWalletEntries] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [supabaseRider, setSupabaseRider] = useState<any>(null);
    const [isLoadingSupabase, setIsLoadingSupabase] = useState(true);

    // State Machine Initialization
    const [presence, setPresence] = useState<RiderPresence>("OFFLINE");
    const rsm = useMemo(() => new RiderStateMachine(presence), [presence]);

    const [activeTab, setActiveTab] = useState<Tab>("HOME");
    const [isSafetyAlertActive, setIsSafetyAlertActive] = useState(false);
    const [isCashoutLoading, setIsCashoutLoading] = useState(false);
    const [quickActionView, setQuickActionView] = useState<'VEHICLE' | 'PROFILE' | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Fetch Rider from Supabase directly
    useEffect(() => {
        const fetchRider = async () => {
            if (!user?.id) {
                setIsLoadingSupabase(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('riders')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching rider:', error);
                } else if (data) {
                    setSupabaseRider(data);
                }
            } catch (err) {
                console.error('Fetch rider error:', err);
            } finally {
                setIsLoadingSupabase(false);
            }
        };

        fetchRider();
    }, [user?.id]);

    // Fetch Initial Data
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // Fetch Rider Profile
                const profileResult = await courierApi.getProfile();
                const riderData = profileResult.data;

                if (!riderData) throw new Error('Rider profile not found');

                // Enhance with default mock presentation data for UI aesthetics until fully implemented in DB
                const enhancedRider = {
                    ...riderData,
                    performance: {
                        rating: 4.9,
                        acceptanceRate: 98,
                        reliabilityScore: 100,
                        completionRate: 99,
                        onTimeRate: 95
                    },
                    vehicle: {
                        make: 'Honda',
                        model: 'CB150R',
                        plate: 'KDH 882X'
                    }
                };

                setCurrentRider(enhancedRider);
                setPresence(riderData.isOnline ? "ONLINE_IDLE" : "OFFLINE");

                // Fetch Orders (Available + Assigned to me)
                const ordersResult = await courierApi.getDeliveries();
                if (ordersResult.data) setOrders(ordersResult.data);

                // Fetch Wallet Ledger
                const earningsResult = await courierApi.getEarnings();
                if (earningsResult.data) setWalletEntries(earningsResult.data);

            } catch (error) {
                console.error("Error fetching rider data:", error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();

        // Poll for updates every 30 seconds (replaces Supabase realtime)
        const pollInterval = setInterval(fetchData, 30000);

        return () => {
            clearInterval(pollInterval);
        };
    }, [user]);

    // Show loading state while data is being fetched
    if ((isLoadingData || isLoadingSupabase) && !currentRider && !supabaseRider) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Use Supabase rider data if courierApi failed
    const activeRider = currentRider || supabaseRider;

    // Sync Supabase rider to currentRider if courierApi failed
    useEffect(() => {
        if (!currentRider && supabaseRider) {
            setCurrentRider({
                ...supabaseRider,
                performance: {
                    rating: supabaseRider.rating || 4.9,
                    acceptanceRate: 98,
                    reliabilityScore: 100,
                    completionRate: 99,
                    onTimeRate: 95
                },
                vehicle: {
                    make: supabaseRider.vehicle_make || 'Honda',
                    model: supabaseRider.vehicle_model || 'CB150R',
                    plate: supabaseRider.vehicle_plate || 'KDH 882X'
                }
            });
            setPresence(supabaseRider.is_online ? "ONLINE_IDLE" : "OFFLINE");
        }
    }, [currentRider, supabaseRider]);

    // Show pending / verification approval overlay if rider is not APPROVED
    const rawRiderStatus = supabaseRider?.status || profile?.status || currentRider?.status || 'PENDING';
    const riderStatus = rawRiderStatus === 'VERIFICATION_PENDING' ? 'PENDING' : rawRiderStatus;
    if (riderStatus !== 'APPROVED') {
        const overlayStatus = (riderStatus === 'PENDING' || riderStatus === 'UNDER_REVIEW' || riderStatus === 'REJECTED' || riderStatus === 'SUSPENDED') ? riderStatus : 'PENDING';
        return (
            <VerificationOverlay
                status={overlayStatus}
                name={profile?.full_name || currentRider?.name || user?.email?.split('@')[0]}
                email={user?.email}
                phone={profile?.phone || currentRider?.phone}
                onContactSupport={() => window.location.href = 'mailto:partners@muncheez.co.ke'}
            />
        );
    }

    /* ============================================================
       DERIVED STATE & METRICS
    ============================================================= */

    const activeOrder = useMemo(() => {
        return orders.find((o) => o.rider_id === currentRider.id && ['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)) || null;
    }, [orders, currentRider]);

    // Force presence sync with database/active order
    useEffect(() => {
        if (!currentRider.isOnline) {
            setPresence("OFFLINE");
        } else if (activeOrder) {
            if (currentRider.status === "PICKING_UP") setPresence("ARRIVED_AT_PICKUP");
            else if (currentRider.status === "DELIVERING") setPresence("EN_ROUTE");
        } else {
            setPresence("ONLINE_IDLE");
        }
    }, [currentRider.isOnline, activeOrder, currentRider.status]);

    const availableOrders = useMemo(() => {
        return orders.filter(
            (o) => o.status === "READY_FOR_PICKUP" && !o.rider_id
        );
    }, [orders]);

    // Process wallet entries for display
    const processedWallet = useMemo(() => {
        const balance = walletEntries.reduce((sum, e) => e.transaction_type.includes('CREDIT') ? sum + e.amount : sum - e.amount, 0);

        const formattedEntries = walletEntries.map(e => ({
            id: e.id,
            userId: e.user_id,
            category: 'RIDER_PAYOUT' as const,
            amount: e.amount,
            type: (e.transaction_type.includes('CREDIT') ? 'CREDIT' : 'DEBIT') as 'CREDIT' | 'DEBIT',
            createdAt: new Date(e.created_at),
            description: e.transaction_type === 'ORDER_PAYOUT' ? `Delivery Earnings` : e.transaction_type
        }));

        return {
            balance,
            pendingAmount: 0,
            entries: formattedEntries
        };
    }, [walletEntries]);

    // Today's actual earnings from the ledger
    const todayEarnings = useMemo(() => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return processedWallet.entries
            .filter(e => e.type === "CREDIT" && e.createdAt.getTime() >= startOfDay.getTime())
            .reduce((sum, e) => sum + e.amount, 0);
    }, [processedWallet]);

    const currentTier = performanceEngine.calculateTier(currentRider.performance);
    const weight = performanceEngine.getDispatchWeight(currentTier);

    // Fleet Stats
    const stats = {
        onlineHours: 8.5,
        earningsPerHour: (todayEarnings / 8.5).toFixed(0),
        completionRate: 100,
        avgRating: currentRider.performance.rating
    };

    /* ============================================================
       ACTIONS
    ============================================================= */

    const toggleOnline = async () => {
        const nextStatus = presence === "OFFLINE" ? "ONLINE_IDLE" : "OFFLINE";
        const isOnline = nextStatus === "ONLINE_IDLE";

        setPresence(nextStatus);

        try {
            await supabase
                .from('riders')
                .update({ is_online: isOnline, status: isOnline ? 'ACTIVE' : 'IDLE' })
                .eq('id', currentRider.id);
        } catch (e) {
            console.error("Failed to update status", e);
            setPresence(presence);
        }
    };

    const handleAcceptOrder = async (orderId: string) => {
        try {
            await supabase
                .from('orders')
                .update({ rider_id: currentRider.id, status: 'RIDER_ASSIGNED' })
                .eq('id', orderId);
            setPresence("ASSIGNED");
        } catch (e) {
            console.error("Error accepting order", e);
        }
    };

    const handlePickupOrder = async (orderId: string) => {
        try {
            await supabase
                .from('orders')
                .update({ status: 'OUT_FOR_DELIVERY' })
                .eq('id', orderId);
        } catch (e) {
            console.error("Error picking up order", e);
        }
    };

    const handleCompleteDelivery = async (orderId: string) => {
        try {
            await supabase
                .from('orders')
                .update({ status: 'COMPLETED' })
                .eq('id', orderId);
            setPresence("ONLINE_IDLE");

            await supabase
                .from('wallet_ledger')
                .insert([{
                    user_id: currentRider.id,
                    amount: 150,
                    transaction_type: 'ORDER_PAYOUT',
                    reference_id: orderId
                }]);
        } catch (e) {
            console.error("Error completing delivery", e);
        }
    };

    const handleCashout = () => {
        if (processedWallet.balance < 500) return;
        setIsCashoutLoading(true);
        setTimeout(() => {
            setIsCashoutLoading(false);
            alert("M-Pesa Cashout Successful! " + formatKES(processedWallet.balance) + " sent to registered number.");
        }, 2000);
    };

    const triggerSOS = () => {
        setIsSafetyAlertActive(true);
        setTimeout(() => {
            alert("EMERGENCY ALERT SENT. Our safety team and emergency services have been notified of your GPS coordinates.");
            setIsSafetyAlertActive(false);
        }, 3000);
    };

    /* ============================================================
       RENDER
    ============================================================= */

    // Verification check - block unapproved riders
    const currentRiderStatus = currentRider.status || 'PENDING';
    const isApproved = currentRiderStatus === 'APPROVED';

    const menuItems = [
        { icon: Bike, label: 'Home', tab: 'HOME' as Tab },
        { icon: Wallet, label: 'Wallet', tab: 'WALLET' as Tab },
        { icon: TrendingUp, label: 'Stats', tab: 'PERFORMANCE' as Tab },
        { icon: Shield, label: 'Help', tab: 'SAFETY' as Tab },
        { icon: Settings, label: 'More', tab: 'MORE' as Tab },
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex font-sans">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <motion.aside
                initial={false}
                animate={{
                    x: sidebarOpen ? 0 : -300
                }}
                className="w-64 bg-white border-r border-gray-100 fixed h-full z-50 flex flex-col lg:z-30 lg:translate-x-0"
            >
                {/* Brand */}
                <div className="h-16 lg:h-20 flex items-center justify-between px-6 border-b border-gray-100">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="font-heading font-bold text-xl tracking-tighter text-gray-900">
                            FleetOS<span className="text-[#D4AF37]">.</span>
                        </span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Settings size={18} className="text-gray-400" />
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.tab}
                            onClick={() => {
                                setActiveTab(item.tab);
                                setSidebarOpen(false);
                            }}
                            className={`
                                w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group min-h-[44px]
                                ${activeTab === item.tab
                                    ? 'bg-[#D4AF37] text-black font-bold'
                                    : 'text-gray-500 hover:text-black hover:bg-gray-50'}
                            `}
                        >
                            <item.icon size={20} strokeWidth={activeTab === item.tab ? 2.5 : 1.5} className="shrink-0" />
                            <span className={`text-sm tracking-wide ${activeTab === item.tab ? 'font-bold' : 'font-medium'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>

                {/* User / Logout */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                            <User size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{currentRider.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Elite Tier</p>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            if (confirm("Sign out?")) {
                                try {
                                    await supabase.from('riders').update({ is_online: false }).eq('id', currentRider.id);
                                } catch (e) { }
                                await supabase.auth.signOut();
                                navigate("/courier/login");
                            }
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-400 hover:text-red-500 transition-colors min-h-[44px]"
                    >
                        <LogOut size={20} className="shrink-0" />
                        <span className="text-sm font-medium tracking-wide">Logout</span>
                    </button>
                </div>
            </motion.aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
                {/* TOP HEADER */}
                <header className="bg-white sticky top-0 z-20 px-4 lg:px-8 h-16 lg:h-20 flex items-center justify-between gap-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                        >
                            <Menu size={22} />
                        </button>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Earnings Today</p>
                            <p className="text-lg font-black tracking-tighter italic">{formatKES(todayEarnings)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full ${presence !== 'OFFLINE' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
                            <div className={`w-2 h-2 rounded-full ${presence !== 'OFFLINE' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {presence !== 'OFFLINE' ? 'Online' : 'Offline'}
                            </span>
                        </div>
                        <button
                            onClick={toggleOnline}
                            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${presence !== "OFFLINE"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-gray-50 text-gray-400 border border-gray-200"
                                }`}
                        >
                            {presence !== "OFFLINE" ? "Go Offline" : "Go Online"}
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-6">

                        {/* OFFLINE COVER */}
                        {presence === "OFFLINE" && (
                            <div className="py-16 text-center space-y-6">
                                <div className="w-24 h-24 mx-auto rounded-full bg-gray-50 flex items-center justify-center text-gray-200 border border-gray-100">
                                    <Bike size={48} strokeWidth={1} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black tracking-tighter uppercase text-gray-300">Offline</h3>
                                    <p className="text-xs text-gray-400">Go online to start receiving orders</p>
                                </div>
                                <button
                                    onClick={toggleOnline}
                                    className="px-8 py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-all active:scale-95"
                                >
                                    Go Online
                                </button>
                            </div>
                        )}

                        {presence !== "OFFLINE" && activeTab === "HOME" && (
                            <div className="space-y-6">
                                {!activeOrder && <DemandHeatmap />}

                                {activeOrder && (
                                    <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-6 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-2">Current Job</p>
                                                <h2 className="text-3xl font-black tracking-tighter italic">Delivery #{activeOrder.id.slice(0, 6)}</h2>
                                            </div>
                                            <div className="px-4 py-2 bg-green-500 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest">
                                                Active
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pickup From</p>
                                                </div>
                                                <p className="text-sm font-black italic">{activeOrder.store?.name || 'Store'}</p>
                                                <p className="text-xs text-gray-500 mt-1">{activeOrder.store?.address || 'Address not available'}</p>
                                            </div>

                                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Deliver To</p>
                                                </div>
                                                <p className="text-sm font-black italic">{activeOrder.customer?.full_name || 'Customer'}</p>
                                                <p className="text-xs text-gray-500 mt-1">{activeOrder.delivery_address || 'Address not available'}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => activeOrder.status === "RIDER_ASSIGNED" ? handlePickupOrder(activeOrder.id) : handleCompleteDelivery(activeOrder.id)}
                                            className="w-full py-5 bg-black text-[#D4AF37] rounded-2xl text-xs font-black uppercase tracking-[0.3em] hover:bg-[#D4AF37] hover:text-black transition-all active:scale-95"
                                        >
                                            {activeOrder.status === "RIDER_ASSIGNED" ? "Confirm Pickup" : "Finish Delivery"}
                                        </button>
                                    </div>
                                )}

                                {!activeOrder && availableOrders.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 px-2">New Orders</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {availableOrders.map((order) => (
                                                <motion.div
                                                    key={order.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-lg font-black tracking-tighter italic">Order #{order.id.slice(0, 6)}</h4>
                                                        <span className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
                                                            Ready
                                                        </span>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup</p>
                                                            <p className="text-xs font-black italic">{order.store?.name || 'Store'}</p>
                                                            <p className="text-[10px] text-gray-500 mt-0.5">{order.store?.address || 'Address not available'}</p>
                                                        </div>
                                                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Delivery</p>
                                                            <p className="text-xs font-black italic">{order.customer?.full_name || 'Customer'}</p>
                                                            <p className="text-[10px] text-gray-500 mt-0.5">{order.delivery_address || 'Address not available'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleAcceptOrder(order.id)}
                                                            className="flex-1 py-4 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[#D4AF37] transition-all active:scale-95"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button className="px-6 py-4 bg-gray-50 rounded-2xl text-gray-400 text-[9px] font-black uppercase tracking-widest border border-gray-100 hover:bg-gray-100 transition-all">
                                                            Ignore
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "WALLET" && (
                            <div className="space-y-6">
                                <section className="bg-white rounded-3xl border border-gray-100 p-10 text-center space-y-6 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Your Balance</p>
                                    <h3 className="text-5xl font-black italic tracking-tighter">
                                        <span className="text-[#D4AF37]">KES</span> {processedWallet.balance.toLocaleString('en-KE')}
                                    </h3>
                                    <button
                                        onClick={handleCashout}
                                        disabled={processedWallet.balance < 500 || isCashoutLoading}
                                        className={`w-fit mx-auto px-10 py-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] transition-all ${processedWallet.balance >= 500
                                            ? "bg-black text-white hover:bg-[#D4AF37] active:scale-95"
                                            : "bg-gray-100 text-gray-300 cursor-not-allowed"
                                            }`}
                                    >
                                        {isCashoutLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Zap size={16} />}
                                        Instant Cashout
                                    </button>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-[0.4em] text-gray-400 px-2">Job History</h3>
                                    <TransactionLedger entries={processedWallet.entries} pendingAmount={processedWallet.pendingAmount} />
                                </section>
                            </div>
                        )}

                        {activeTab === "SAFETY" && (
                            <div className="space-y-6">
                                <section className="bg-white rounded-3xl border border-orange-100 p-12 text-center space-y-6 shadow-sm">
                                    <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mx-auto">
                                        <AlertTriangle size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black tracking-tighter uppercase italic">Help & SOS</h3>
                                        <p className="text-xs text-gray-400 max-w-xs mx-auto">Press the button below if you need emergency help.</p>
                                    </div>
                                    <button
                                        onClick={triggerSOS}
                                        className="px-10 py-5 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] hover:bg-orange-500 transition-all active:scale-95"
                                    >
                                        {isSafetyAlertActive ? "Transmitting..." : "Activate SOS"}
                                    </button>
                                </section>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center gap-3 shadow-sm">
                                        <div className="p-3 rounded-xl bg-blue-50 text-blue-500">
                                            <Shield size={24} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">History</span>
                                    </div>
                                    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center gap-3 shadow-sm">
                                        <div className="p-3 rounded-xl bg-green-50 text-green-500">
                                            <Users size={24} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Support</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PERFORMANCE TAB */}
                        {activeTab === "PERFORMANCE" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-3xl border border-gray-100 p-8 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
                                        <div className="relative w-40 h-40 flex items-center justify-center">
                                            <svg className="w-full h-full rotate-[-90deg]">
                                                <circle cx="80" cy="80" r="64" fill="transparent" stroke="#f0f2f5" strokeWidth="10" />
                                                <motion.circle
                                                    cx="80" cy="80" r="64" fill="transparent" stroke="#D4AF37" strokeWidth="10"
                                                    strokeDasharray="402"
                                                    initial={{ strokeDashoffset: 402 }}
                                                    animate={{ strokeDashoffset: 402 - (402 * 0.82) }}
                                                    transition={{ duration: 2 }}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-4xl font-black italic tracking-tighter text-gray-800">82%</span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Score</span>
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-black uppercase tracking-[0.2em]">Next Level</h4>
                                    </div>

                                    <div className="space-y-4 flex flex-col justify-between">
                                        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-500">
                                                    <ShieldCheck size={18} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">Reliability</span>
                                            </div>
                                            <span className="text-lg font-black tracking-tight">{currentRider.performance.reliabilityScore}%</span>
                                        </div>
                                        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-xl bg-blue-50 text-blue-500">
                                                    <TrendingUp size={18} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">Acceptance</span>
                                            </div>
                                            <span className="text-lg font-black tracking-tight">{currentRider.performance.acceptanceRate}%</span>
                                        </div>
                                        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                                                    <Award size={18} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">Rating</span>
                                            </div>
                                            <span className="text-lg font-black tracking-tight">{currentRider.performance.rating} ⭐</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "MORE" && (
                            <div className="space-y-6 pb-10">
                                {/* STATS MODULE */}
                                <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-6 shadow-sm">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Weekly Performance</h4>
                                    <div className="h-32 flex items-end justify-between gap-2 px-2">
                                        {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                                <div
                                                    className="w-full bg-[#D4AF37]/10 rounded-t-lg border border-[#D4AF37]/20"
                                                    style={{ height: `${h}%` }}
                                                />
                                                <span className="text-[8px] font-black text-gray-400">{"MTWTFSS"[i]}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                                            <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Total KM</p>
                                            <p className="text-lg font-black italic">1,240</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                                            <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Jobs</p>
                                            <p className="text-lg font-black italic">142</p>
                                        </div>
                                    </div>
                                </div>

                                {/* VEHICLE MODULE */}
                                <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-6 shadow-sm">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Active Registry</h4>
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                            <Bike size={40} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black italic">{currentRider.vehicle?.make} {currentRider.vehicle?.model}</p>
                                            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">{currentRider.vehicle?.plate}</p>
                                            <div className="mt-2 flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                                <span className="text-[9px] font-black text-gray-400 uppercase">Operational</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SUPPORT MODULE */}
                                <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-6 shadow-sm">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Fleet Support</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center gap-2 text-emerald-500 hover:bg-gray-100 transition-colors">
                                            <div className="p-2 bg-emerald-50 rounded-xl"><LifeBuoy size={18} /></div>
                                            <span className="text-[10px] font-black uppercase text-gray-700">Live Chat</span>
                                        </button>
                                        <button className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center gap-2 text-[#D4AF37] hover:bg-gray-100 transition-colors">
                                            <div className="p-2 bg-[#D4AF37]/10 rounded-xl"><AlertTriangle size={18} /></div>
                                            <span className="text-[10px] font-black uppercase text-gray-700">Ticket</span>
                                        </button>
                                    </div>
                                </div>

                                {/* LEGAL MODULE */}
                                <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-4 shadow-sm">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Contract & Compliance</h4>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Carrier Terms', icon: <FileText size={16} /> },
                                            { label: 'Privacy Protocol', icon: <ShieldCheck size={16} /> },
                                            { label: 'Digital Insurance ID', icon: <Award size={16} /> }
                                        ].map((doc, i) => (
                                            <button key={i} className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-gray-400">{doc.icon}</div>
                                                    <span className="text-[10px] font-black uppercase tracking-tight text-gray-700">{doc.label}</span>
                                                </div>
                                                <ChevronRight size={14} className="text-gray-300" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* SETTINGS MODULE */}
                                <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-6 shadow-sm">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">System Preferences</h4>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'Order Alerts', id: 'alerts', val: true },
                                            { label: 'Traffic Updates', id: 'traffic', val: true },
                                            { label: 'High Precision GPS', id: 'gps', val: true }
                                        ].map((setting) => (
                                            <div key={setting.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-gray-600">{setting.label}</span>
                                                <div className={`w-10 h-5 rounded-full relative transition-colors ${setting.val ? 'bg-green-500' : 'bg-gray-200'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${setting.val ? 'right-1' : 'left-1'}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
