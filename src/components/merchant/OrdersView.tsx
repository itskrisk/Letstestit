import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Package,
    Clock,
    CheckCircle2,
    MoreVertical,
    Printer,
    Truck,
    ShoppingBag
} from 'lucide-react';

interface OrdersViewProps {
    orders: any[];
    onUpdateStatus: (orderId: string, status: any) => void;
}

export default function OrdersView({ orders, onUpdateStatus }: OrdersViewProps) {
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    // Grouping status for the lifecycle tabs
    const tabs = [
        { id: 'all', label: 'All Orders' },
        { id: 'LIVE', label: 'Live' },
        { id: 'HISTORY', label: 'Completed' },
    ];
    const [activeTab, setActiveTab] = useState('all');

    // Simple status derived coloring
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CREATED':
            case 'PAYMENT_CONFIRMED': return 'bg-blue-500';
            case 'PREPARING':
            case 'PACKING': return 'bg-orange-500';
            case 'READY_FOR_PICKUP': return 'bg-purple-500';
            case 'OUT_FOR_DELIVERY': return 'bg-green-500';
            case 'COMPLETED':
            case 'DELIVERED': return 'bg-gray-400';
            default: return 'bg-gray-200';
        }
    };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/10 pb-8">
                <div>
                    <h2 className="text-4xl font-heading font-light tracking-tight text-black">The Order Pass<span className="text-[#D4AF37]">.</span></h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Live Order Management</p>
                </div>

                <div className="flex gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-black text-white'
                                : 'bg-white border border-gray-100 text-gray-400 hover:text-black hover:border-black'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Split View */}
            <div className="grid grid-cols-12 gap-8 items-start">

                {/* Orders List / Feed */}
                <div className="col-span-12 lg:col-span-5 space-y-4">
                    {orders.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200">
                            <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest leading-relaxed"> No incoming orders<br />at the moment.</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <motion.div
                                key={order.id}
                                layoutId={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className={`cursor-pointer p-6 bg-white border-l-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group
                                    ${selectedOrder?.id === order.id ? 'border-[#D4AF37]' : 'border-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-1">#{order.id.slice(-6)}</div>
                                        <div className="font-heading font-bold text-xl">{order.customer.name}</div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter text-white ${getStatusColor(order.status)}`}>
                                        {order.status.replace(/_/g, ' ')}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                                    <div className="flex items-center gap-1"><Clock size={12} /> {order.time_placed || 'Just now'}</div>
                                    <div className="flex items-center gap-1 font-bold text-black font-mono">KES {order.total.toLocaleString()}</div>
                                </div>

                                {/* Items Sneak Peak */}
                                <div className="mt-4 pt-4 border-t border-dashed border-gray-100 italic text-[11px] text-gray-400">
                                    {order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ').slice(0, 45)}...
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Order Detail View */}
                <div className="col-span-12 lg:col-span-7">
                    {selectedOrder ? (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white p-10 shadow-xl border border-gray-100 min-h-[600px] flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-10 pb-10 border-b border-gray-50">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-2">Order Tracking</div>
                                    <h3 className="text-4xl font-heading font-black tracking-tighter">#{selectedOrder.id.slice(-6)}</h3>
                                    <p className="text-gray-400 text-sm mt-1">{selectedOrder.customer.phone}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"><Printer size={20} /></button>
                                    <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"><MoreVertical size={20} /></button>
                                </div>
                            </div>

                            {/* Order Progress / Actions */}
                            <div className="flex items-center gap-4 mb-12 flex-wrap">
                                {['CREATED', 'PAYMENT_CONFIRMED', 'AWAITING_MERCHANT_ACTION'].includes(selectedOrder.status) && (
                                    <button
                                        onClick={() => onUpdateStatus(selectedOrder.id, 'PREPARING')}
                                        className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg"
                                    >
                                        Accept & Start Preparing
                                    </button>
                                )}
                                {['PREPARING', 'PACKING'].includes(selectedOrder.status) && (
                                    <button
                                        onClick={() => onUpdateStatus(selectedOrder.id, 'READY_FOR_PICKUP')}
                                        className="bg-[#D4AF37] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg"
                                    >
                                        Mark as Ready
                                    </button>
                                )}
                                <button className="border border-red-100 text-red-400 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-50 transition-all">
                                    Decline Order
                                </button>
                            </div>

                            {/* Items List */}
                            <div className="space-y-6 flex-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Detailed Items</span>
                                <div className="divide-y divide-gray-50 border-t border-b border-gray-50 py-4">
                                    {selectedOrder.items.map((item: any, i: number) => (
                                        <div key={i} className="py-4 flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg text-xs font-black">
                                                    {item.quantity}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-lg leading-none">{item.name}</span>
                                                    {item.options && <span className="text-[10px] text-gray-400 uppercase mt-1">Mods: {item.options.join(', ')}</span>}
                                                </div>
                                            </div>
                                            <span className="font-mono text-sm font-bold text-gray-400">KES {(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary Footer */}
                            <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                                <div className="flex gap-10">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</span>
                                        <div className="flex items-center gap-2 font-bold text-sm">
                                            <Truck size={14} className="text-[#D4AF37]" /> Delivery
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 text-blue-600">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Payment</span>
                                        <div className="flex items-center gap-2 font-bold text-sm">
                                            <CheckCircle2 size={14} /> M-Pesa Confirmed
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Grand Total</span>
                                    <div className="text-4xl font-heading font-black tracking-tighter">KES {selectedOrder.total.toLocaleString()}</div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[3rem] text-center">
                            <Package size={64} className="text-gray-200 mb-6 drop-shadow-sm" />
                            <h4 className="text-2xl font-heading font-bold tracking-tight text-gray-400">Select an order from the pass<br />to start fulfillment.</h4>
                            <p className="text-xs text-gray-300 font-bold uppercase tracking-[0.2em] mt-8">Orders are secured with Nairobi Soul Logic</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
