import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    User,
    ShoppingBag,
    History,
    Star,
    TrendingUp,
    Phone,
    MapPin,
    ArrowRight,
    X,
    Filter,
    ChevronRight,
    Mail,
    CreditCard,
    MessageSquare,
    Package
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface CustomerSummary {
    id: string;
    name: string;
    phone: string;
    orderCount: number;
    totalSpent: number;
    lastOrder?: any;
    status: 'ACTIVE' | 'FREQUENT' | 'NEW' | 'INACTIVE';
}

export default function Customers() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*, customer:profiles!customer_id(full_name, phone)')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (data) setOrders(data);
            } catch (err) {
                console.error("Customers error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();

        const channel = supabase.channel('admin_customers_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
                fetchOrders();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); }
    }, []);

    // Derive customers from orders
    const customerDirectory = useMemo(() => {
        const directory: Record<string, CustomerSummary> = {};

        orders.forEach(order => {
            const phone = order.customer?.phone || 'Unknown';
            const name = order.customer?.full_name || 'Walk-in Customer';
            const customerId = phone; // Use phone as ID for now
            if (!directory[customerId]) {
                directory[customerId] = {
                    id: customerId,
                    name: name,
                    phone: phone,
                    orderCount: 0,
                    totalSpent: 0,
                    lastOrder: order,
                    status: 'NEW'
                };
            }

            directory[customerId].orderCount += 1;
            directory[customerId].totalSpent += order.total;

            // Track most recent order
            if (new Date(order.created_at || 0) > new Date(directory[customerId].lastOrder?.created_at || 0)) {
                directory[customerId].lastOrder = order;
            }
        });

        // Assign statuses
        Object.values(directory).forEach(customer => {
            if (customer.orderCount >= 10) customer.status = 'FREQUENT';
            else if (customer.orderCount >= 3) customer.status = 'ACTIVE';
            else customer.status = 'NEW';
        });

        return Object.values(directory);
    }, [orders]);

    const filteredCustomers = customerDirectory.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );

    const stats = {
        total: customerDirectory.length,
        avgOrderValue: customerDirectory.reduce((acc, c) => acc + (c.totalSpent / c.orderCount), 0) / customerDirectory.length,
        frequent: customerDirectory.filter(c => c.status === 'FREQUENT').length,
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-3">
                        Client Directory <span className="text-xs bg-black text-white px-2 py-1 rounded-full">{customerDirectory.length}</span>
                    </h1>
                    <p className="text-sm text-gray-400 font-medium">Customer Relationship Management • Nairobi Zone</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 bg-white border border-gray-100 shadow-sm rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
                        <TrendingUp size={18} /> Analytics
                    </button>
                    <button className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 shadow-lg shadow-black/10 transition-all flex items-center gap-2">
                        <Mail size={18} /> Broadcase Blast
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black p-8 rounded-[2rem] text-white flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Total Outreach</p>
                        <p className="text-3xl font-black italic tracking-tighter">{stats.total}</p>
                    </div>
                    <User className="text-white/20" size={40} />
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Avg Ticket/Client</p>
                        <p className="text-3xl font-black tracking-tighter">KES {Math.round(stats.avgOrderValue || 0).toLocaleString()}</p>
                    </div>
                    <ShoppingBag className="text-gray-100" size={40} />
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Muncheez Fam (10+)</p>
                        <p className="text-3xl font-black tracking-tighter">{stats.frequent}</p>
                    </div>
                    <Star className="text-amber-100 fill-amber-100" size={40} />
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col min-h-[500px]">
                <div className="p-8 border-b border-gray-50 flex flex-col lg:flex-row gap-6 items-center justify-between">
                    <div className="relative w-full lg:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Find client by name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] text-sm font-medium focus:bg-white focus:border-black/5 transition-all outline-none"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors">
                        <Filter size={16} /> Advanced Segments
                    </button>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Identity</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Engagement</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Loyalty Tier</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Lifetime Value</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Latest Activity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredCustomers.map((customer) => (
                                <tr
                                    key={customer.id}
                                    onClick={() => setSelectedCustomer(customer)}
                                    className="hover:bg-gray-50 transition-all cursor-pointer group"
                                >
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-black text-sm italic shadow-lg shadow-black/10">
                                                {customer.name.slice(0, 1)}
                                            </div>
                                            <div>
                                                <p className="font-black text-lg tracking-tight group-hover:text-[#D4AF37] transition-colors">{customer.name}</p>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">{customer.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className="inline-flex flex-col items-center">
                                            <span className="font-black text-lg tracking-tight">{customer.orderCount}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Orders</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <StatusBadge status={customer.status} />
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <p className="font-black text-lg tracking-tighter">KES {customer.totalSpent.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Revenue Flow</p>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100">
                                            <History size={14} className="text-gray-300" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">View History</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Customer Details Modal */}
            <AnimatePresence>
                {selectedCustomer && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCustomer(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-3xl bg-white shadow-2xl z-[101] overflow-hidden flex flex-col"
                        >
                            <div className="flex-1 overflow-y-auto">
                                {/* Header */}
                                <div className="p-12 border-b border-gray-50 bg-[#D4AF37] text-black relative">
                                    <div className="absolute top-0 right-0 p-8">
                                        <button onClick={() => setSelectedCustomer(null)} className="p-3 bg-black/10 hover:bg-black/20 rounded-2xl transition-all">
                                            <X size={24} />
                                        </button>
                                    </div>
                                    <div className="mb-8">
                                        <StatusBadge status={selectedCustomer.status} />
                                    </div>
                                    <h2 className="text-5xl font-black tracking-tighter italic uppercase mb-2">{selectedCustomer.name}</h2>
                                    <p className="text-lg font-bold opacity-70 tracking-widest">{selectedCustomer.phone} • Nairobi, Central</p>
                                </div>

                                <div className="p-12 space-y-12">
                                    {/* Action Grid */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <ActionCard icon={MessageSquare} label="Send Message" sub="WhatsApp/SMS Integration" />
                                        <ActionCard icon={CreditCard} label="Wallet Balance" sub="KES 0.00 (Muncheez Credits)" />
                                    </div>

                                    {/* Recent Ops */}
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-8">Purchase Manifest</h3>
                                        <div className="space-y-4">
                                            {orders.filter(o => (o.customer?.phone || 'Unknown') === selectedCustomer.phone).map(order => (
                                                <div key={order.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between hover:border-black transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-white rounded-xl shadow-sm">
                                                            <Package size={20} className="text-gray-300 group-hover:text-black transition-colors" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-sm tracking-tight text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{order.status} • {order.merchant_id}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-sm">KES {order.total.toLocaleString()}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-12 border-t border-gray-100 bg-gray-50/50 flex gap-4">
                                <button className="flex-1 py-5 bg-white border border-gray-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all shadow-sm">
                                    Flag for Fraud
                                </button>
                                <button className="flex-1 py-5 bg-black text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-3">
                                    Issue Promo Code <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatusBadge({ status }: { status: any }) {
    const configs: any = {
        'FREQUENT': 'bg-black text-white border-black',
        'ACTIVE': 'bg-green-50 text-green-600 border-green-100',
        'NEW': 'bg-blue-50 text-blue-600 border-blue-100',
        'INACTIVE': 'bg-gray-100 text-gray-400 border-gray-200'
    };

    return (
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${configs[status]}`}>
            {status} Tier
        </span>
    );
}

function ActionCard({ icon: Icon, label, sub }: any) {
    return (
        <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-black transition-all cursor-pointer flex flex-col gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                <Icon size={24} className="text-black" />
            </div>
            <div>
                <p className="font-black text-lg tracking-tight">{label}</p>
                <p className="text-xs font-medium text-gray-400">{sub}</p>
            </div>
        </div>
    );
}
