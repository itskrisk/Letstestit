import {
    TrendingUp,
    ShoppingBag,
    Bike,
    Store,
    Activity,
    Clock,
    CheckCircle,
    User,
    ArrowRight,
    Package
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminDashboard() {
    const [orders, setOrders] = useState<any[]>([]);
    const [merchants, setMerchants] = useState<any[]>([]);
    const [riders, setRiders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [ordersData, merchantsData, ridersData] = await Promise.all([
                    supabase.from('orders').select('*, customer:profiles!customer_id(full_name, phone)').order('created_at', { ascending: false }).limit(50),
                    supabase.from('merchants').select('id, business_name, type, status, logo_url').order('created_at', { ascending: false }),
                    supabase.from('riders').select('id, is_online, status').order('created_at', { ascending: false })
                ]);

                if (ordersData.data) setOrders(ordersData.data);

                // Map merchants
                if (merchantsData.data) {
                    setMerchants(merchantsData.data.map(m => ({
                        id: m.id,
                        businessName: m.business_name || 'Unnamed',
                        type: m.type || 'Restaurant',
                        status: m.status || 'PENDING',
                        logoUrl: m.logo_url
                    })));
                }

                if (ridersData.data) setRiders(ridersData.data);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();

        // Optional: Add realtime later if needed for dashboard overall metrics
    }, []);

    // Stats
    const totalRevenue = orders.reduce((acc, order) => acc + (order.total || 0), 0);
    const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status));
    const onlineRiders = riders.filter(r => r.is_online);
    const busyRiders = riders.filter(r => r.status === 'ACTIVE' || r.status === 'BUSY');
    const pendingMerchants = merchants.filter(m => m.status === 'PENDING');

    // Sector breakdown
    const sectorStats = {
        Restaurant: merchants.filter(m => m.type === 'Restaurant').length,
        Supermarket: merchants.filter(m => m.type === 'Supermarket').length,
        Pharmacy: merchants.filter(m => m.type === 'Pharmacy').length,
        Water: merchants.filter(m => m.type === 'Water').length,
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-black">Operations Cockpit</h1>
                    <p className="text-sm text-gray-400 font-medium">Real-time system oversight • Nairobi Central Hub</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider text-nowrap">System Status: Optimal</span>
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Gross Revenue"
                    value={`KES ${(totalRevenue / 1000).toFixed(1)}K`}
                    trend="+12.5%"
                    isPositive
                    icon={TrendingUp}
                    color="blue"
                />
                <StatCard
                    title="Active Orders"
                    value={activeOrders.length.toString()}
                    trend={`+${Math.floor(activeOrders.length * 0.2)}`}
                    isPositive
                    icon={ShoppingBag}
                    color="orange"
                />
                <StatCard
                    title="Fleet Capacity"
                    value={`${onlineRiders.length}`}
                    subValue={`${busyRiders.length} Busy`}
                    trend="-1"
                    isPositive={false}
                    icon={Bike}
                    color="purple"
                />
                <StatCard
                    title="Market Network"
                    value={merchants.length.toString()}
                    subValue={`${pendingMerchants.length} Pending`}
                    trend="+2"
                    isPositive
                    icon={Store}
                    color="emerald"
                />
            </div>

            {/* Ops Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Sector Status */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden relative">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-bold text-lg tracking-tight">Sector Health</h3>
                            <p className="text-xs text-gray-400">Distribution of approved partners</p>
                        </div>
                        <Activity className="text-gray-200" size={24} />
                    </div>

                    <div className="space-y-4">
                        {Object.entries(sectorStats).map(([sector, count]) => (
                            <div key={sector}>
                                <div className="flex justify-between text-xs font-bold mb-1.5 uppercase tracking-wider">
                                    <span className="text-gray-500">{sector}</span>
                                    <span className="text-black">{count} Active</span>
                                </div>
                                <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-black rounded-full transition-all duration-1000"
                                        style={{ width: `${(count / merchants.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex -space-x-2">
                            {merchants.slice(0, 3).map((m, i) => (
                                <img key={i} src={m.logoUrl} className="w-8 h-8 rounded-full border-2 border-white object-cover" alt="" />
                            ))}
                            <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-400">
                                +{merchants.length - 3}
                            </div>
                        </div>
                        <button className="text-xs font-bold text-black flex items-center gap-1 hover:gap-2 transition-all">
                            Partner Insights <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

                {/* Logistics Hub */}
                <div className="lg:col-span-2 bg-black rounded-3xl p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-white/10 transition-colors" />

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight">Logistics Snapshot</h3>
                                <p className="text-gray-400 text-sm">Real-time rider geofencing & dispatch status</p>
                            </div>
                            <div className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Zone: Nairobi Core</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 flex-1">
                            <div>
                                <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">On-Duty Riders</div>
                                <div className="text-4xl font-black">{onlineRiders.length}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Active Deliveries</div>
                                <div className="text-4xl font-black">{activeOrders.filter(o => o.status === 'OUT_FOR_DELIVERY').length}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Avg Dispatch</div>
                                <div className="text-4xl font-black tracking-tighter">4.2<span className="text-sm font-medium ml-1">min</span></div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Success Rate</div>
                                <div className="text-4xl font-black">98.2<span className="text-sm font-medium ml-1">%</span></div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <button className="px-6 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors uppercase tracking-widest flex items-center gap-2">
                                <Activity size={16} /> Manage Fleet
                            </button>
                            <button className="px-6 py-3 bg-white/10 border border-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-colors uppercase tracking-widest">
                                Heatmap
                            </button>
                        </div>
                    </div>
                </div>

                {/* Operations Feed */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-xl tracking-tight">Live Operations Feed</h3>
                            <p className="text-xs text-gray-400 font-medium">Monitoring critical flow events</p>
                        </div>
                        <button className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100">Filter View</button>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {orders.slice(0, 5).map((order) => (
                            <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className={`p-3 rounded-2xl ${order.status === 'DELIVERED' ? 'bg-green-50 text-green-600' :
                                        order.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                                            'bg-blue-50 text-blue-600'
                                        }`}>
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-black text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                                            <StatusBadge status={order.status} />
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                            <span className="flex items-center gap-1"><User size={12} /> {order.customer?.full_name || 'Walk-in'}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span>•</span>
                                            <span className="text-black font-bold">KES {order.total?.toLocaleString() || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-black shadow-sm">
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-gray-50/50 border-t border-gray-50">
                        <button className="w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-black hover:text-black transition-all">
                            View All Historical Data
                        </button>
                    </div>
                </div>

                {/* Approvals Standby */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden h-fit">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-bold text-lg tracking-tight">Onboarding Standby</h3>
                            <p className="text-xs text-gray-400">Partners awaiting verification</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <Clock size={16} />
                        </div>
                    </div>

                    {pendingMerchants.length === 0 ? (
                        <div className="py-12 text-center">
                            <CheckCircle size={32} className="mx-auto text-green-200 mb-3" />
                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Queue Clear</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingMerchants.map((merchant) => (
                                <div key={merchant.id} className="p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-orange-200 hover:bg-orange-50/10 transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-gray-100 overflow-hidden shadow-sm">
                                            <img src={merchant.logoUrl} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-black">{merchant.businessName}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{merchant.type}</div>
                                        </div>
                                    </div>
                                    <button className="p-2 bg-white text-black rounded-lg shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            ))}
                            <button className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-lg shadow-black/10">
                                Review Queue
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

function StatCard({ title, value, subValue, trend, isPositive, icon: Icon, color }: any) {
    const colorStyles: any = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        orange: 'text-orange-600 bg-orange-50 border-orange-100',
        purple: 'text-purple-600 bg-purple-50 border-purple-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    };

    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 relative group">
            <div className={`absolute top-6 right-6 p-2 rounded-2xl ${colorStyles[color]} border transition-transform group-hover:scale-110`}>
                <Icon size={20} />
            </div>

            <div className="relative pt-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">{title}</p>
                <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="text-4xl font-black text-black tracking-tight">{value}</h3>
                    <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isPositive ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                        {trend}
                    </div>
                </div>
                {subValue && (
                    <div className="text-xs font-bold text-gray-400/80 uppercase tracking-wider">{subValue}</div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        'CREATED': 'bg-gray-100 text-gray-600',
        'PAYMENT_CONFIRMED': 'bg-blue-50 text-blue-600',
        'PREPARING': 'bg-orange-50 text-orange-600',
        'READY_FOR_PICKUP': 'bg-purple-50 text-purple-600',
        'OUT_FOR_DELIVERY': 'bg-yellow-50 text-yellow-600',
        'DELIVERED': 'bg-green-50 text-green-600',
        'CANCELLED': 'bg-red-50 text-red-600',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-black/5 ${styles[status] || styles['CREATED']}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}
