import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Eye,
    Clock,
    ShoppingBag,
    MapPin,
    Calendar,
    Package,
    ArrowRight,
    X,
    CreditCard
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function Orders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

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
                console.error("Error fetching orders:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();

        // Optional: Realtime subscription
        const channel = supabase.channel('admin_orders_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filteredOrders = orders.filter(order => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            order.id.toLowerCase().includes(searchLower) ||
            (order.customer?.full_name || '').toLowerCase().includes(searchLower) ||
            (order.merchant_id || '').toLowerCase().includes(searchLower);

        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Stats
    const stats = {
        total: orders.length,
        active: orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length,
        revenue: orders.reduce((acc, o) => acc + (o.total || 0), 0),
        pending: orders.filter(o => o.status === 'CREATED').length
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-3">
                        Orders Hub <span className="text-xs bg-black text-white px-2 py-1 rounded-full">{orders.length}</span>
                    </h1>
                    <p className="text-sm text-gray-400 font-medium">Real-time order orchestration • Muncheez Operations</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 bg-white border border-gray-100 shadow-sm rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
                        <Filter size={18} /> Export Data
                    </button>
                    <button className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 shadow-lg shadow-black/10 transition-all flex items-center gap-2">
                        <ShoppingBag size={18} /> New Order
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <QuickStat label="Total Orders" value={stats.total.toString()} icon={ShoppingBag} color="blue" />
                <QuickStat label="Live Operations" value={stats.active.toString()} icon={Clock} color="orange" />
                <QuickStat label="Gross Volume" value={`KES ${(stats.revenue / 1000).toFixed(1)}K`} icon={CreditCard} color="emerald" />
                <QuickStat label="Awaiting Action" value={stats.pending.toString()} icon={Package} color="purple" />
            </div>

            {/* Filters & Workspace */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                <div className="p-6 border-b border-gray-50 flex flex-col lg:flex-row gap-6 items-center justify-between">
                    <div className="relative w-full lg:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Find by ID, Client, or Store..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-black/5 transition-all outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                        {['ALL', 'CREATED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${statusFilter === status
                                    ? 'bg-black text-white shadow-md'
                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                    }`}
                            >
                                {status.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Identifier</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operational Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Client</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Merchant</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Value</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center opacity-20">
                                            <Package size={48} className="mb-4" />
                                            <p className="font-bold text-lg italic">No matching operations found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        onClick={() => setSelectedOrder(order)}
                                        className="hover:bg-gray-50 transition-all cursor-pointer group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-8 bg-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div>
                                                    <p className="font-black text-sm tracking-tight">#{order.id.slice(0, 8).toUpperCase()}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-wider mt-1">
                                                        <Clock size={10} /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="font-bold text-sm text-black">{order.customer?.full_name || 'Walk-in'}</p>
                                                <p className="text-[10px] font-medium text-gray-400 uppercase mt-0.5">{order.customer?.phone || 'No phone'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-gray-500 font-bold text-sm">
                                            {order.merchant_id || 'Unknown Merchant'}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="font-black text-sm">KES {order.total?.toLocaleString() || '0'}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-widest">{order.payment_method || 'CASH'}</p>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button className="p-2.5 bg-gray-50 text-gray-300 hover:text-black hover:bg-white border border-transparent hover:border-gray-100 rounded-xl transition-all shadow-sm">
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Showing {filteredOrders.length} of {orders.length} events</p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-not-allowed">Previous</button>
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-black hover:bg-gray-50">Next</button>
                    </div>
                </div>
            </div>

            {/* Order Details Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[101] overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-black text-white">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Order Manifest</span>
                                        <StatusBadge status={selectedOrder.status} />
                                    </div>
                                    <h2 className="text-3xl font-black italic tracking-tighter">#{selectedOrder.id.slice(0, 12).toUpperCase()}</h2>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-12">

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Details</label>
                                        <p className="font-bold text-lg">{selectedOrder.customer?.full_name}</p>
                                        <p className="text-sm font-medium text-gray-500">{selectedOrder.customer?.phone}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Store Entity</label>
                                        <p className="font-bold text-lg">{selectedOrder.merchant_id}</p>
                                        <p className="text-sm font-medium text-gray-500 underline cursor-pointer hover:text-black">View Partner Dashboard</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery Address</label>
                                        <div className="flex items-start gap-2 pt-1 text-gray-700">
                                            <MapPin size={16} className="shrink-0 mt-1 text-red-500" />
                                            <p className="text-sm font-medium leading-relaxed">{selectedOrder.delivery_address || 'Nairobi Central, Kencom Area'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Date</label>
                                        <div className="flex items-center gap-2 pt-1 text-gray-700">
                                            <Calendar size={16} className="text-blue-500" />
                                            <p className="text-sm font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-gray-400">Items Manifest</h3>
                                    <div className="space-y-4">
                                        {(selectedOrder.items || []).map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center font-black text-xs">
                                                        {item.quantity}x
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm tracking-tight">{item.name}</p>
                                                        {item.options && (
                                                            <p className="text-[10px] font-medium text-gray-400 mt-0.5 italic">{item.options.join(', ')}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="font-black text-sm">KES {((item.price || 0) * item.quantity).toLocaleString()}</p>
                                            </div>
                                        ))}
                                        <div className="mt-8 pt-8 border-t border-gray-200 space-y-3">
                                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                <span>Subtotal</span>
                                                <span>KES {selectedOrder.total?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                <span>Delivery Fee</span>
                                                <span className="text-green-600 font-black">FREE PROMO</span>
                                            </div>
                                            <div className="flex justify-between pt-2">
                                                <span className="text-sm font-black uppercase tracking-widest italic">Total Value</span>
                                                <span className="text-2xl font-black tracking-tighter">KES {selectedOrder.total?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Operational Timeline */}
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-gray-400">Order Lifecycle</h3>
                                    <div className="relative space-y-12 pl-3">
                                        <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-gray-100" />

                                        <TimelineStep
                                            title="Order Created"
                                            time={new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            isDone={true}
                                            description="Customer placed order at Nairobi Hub"
                                        />
                                        <TimelineStep
                                            title="Merchant Confirmed"
                                            time="18:45"
                                            isDone={['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedOrder.status)}
                                            description={`${selectedOrder.merchant_id} acknowledged request`}
                                        />
                                        <TimelineStep
                                            title="Logistics Dispatch"
                                            time="18:50"
                                            isDone={['READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedOrder.status)}
                                            description="Rider assigned: Kevin O. (r1)"
                                        />
                                        <TimelineStep
                                            title="Order Picked Up"
                                            time="18:55"
                                            isDone={['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedOrder.status)}
                                            description="Courier has started delivery"
                                        />
                                        <TimelineStep
                                            title="Delivered"
                                            time="--"
                                            isDone={selectedOrder.status === 'DELIVERED'}
                                            description="Final hand-off to customer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex gap-4">
                                <button className="flex-1 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors shadow-sm">
                                    Contact Client
                                </button>
                                <button className="flex-1 py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2">
                                    Manage Support <ArrowRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function QuickStat({ label, value, icon: Icon, color }: any) {
    const colors: any = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        orange: 'text-orange-600 bg-orange-50 border-orange-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        purple: 'text-purple-600 bg-purple-50 border-purple-100'
    };

    return (
        <div className={`p-6 bg-white rounded-[2rem] border border-gray-50 shadow-sm flex items-center justify-between group hover:shadow-md transition-all`}>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-2xl font-black text-black tracking-tight">{value}</p>
            </div>
            <div className={`p-4 rounded-2xl ${colors[color]} group-hover:scale-110 transition-transform`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        'CREATED': 'bg-gray-50 text-gray-500 border-gray-100',
        'PAYMENT_CONFIRMED': 'bg-blue-50 text-blue-600 border-blue-100',
        'ACCEPTED': 'bg-indigo-50 text-indigo-600 border-indigo-100',
        'PREPARING': 'bg-orange-50 text-orange-600 border-orange-100',
        'READY_FOR_PICKUP': 'bg-purple-50 text-purple-600 border-purple-100',
        'RIDER_ASSIGNED': 'bg-indigo-50 text-indigo-600 border-indigo-100',
        'PICKED_UP': 'bg-blue-50 text-blue-600 border-blue-100',
        'OUT_FOR_DELIVERY': 'bg-yellow-50 text-yellow-600 border-yellow-100',
        'DELIVERED': 'bg-green-50 text-green-600 border-green-100',
        'CANCELLED': 'bg-red-50 text-red-600 border-red-100',
    };

    return (
        <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${styles[status] || styles['CREATED']}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}

function TimelineStep({ title, time, isDone, description }: any) {
    return (
        <div className="relative pl-8">
            <div className={`absolute left-[-5px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ring-2 ${isDone ? 'bg-black ring-black/5' : 'bg-gray-200 ring-gray-100'}`} />
            <div className="flex justify-between items-start">
                <div>
                    <p className={`text-sm font-black tracking-tight ${isDone ? 'text-black' : 'text-gray-400'}`}>{title}</p>
                    <p className="text-xs text-gray-400 font-medium mt-1">{description}</p>
                </div>
                <span className="text-[10px] font-black text-gray-300 uppercase">{time}</span>
            </div>
        </div>
    );
}

