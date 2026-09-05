import {
    Bike,
    Phone,
    AlertTriangle,
    RefreshCw,
    Package
} from 'lucide-react';
import { Order } from '../../types/schema';

interface DeliveriesViewProps {
    orders?: Order[];
}

export default function DeliveriesView({ orders = [] }: DeliveriesViewProps) {

    // Filter active deliveries (Rider Assigned, Picked Up, Out for Delivery)
    const activeDeliveries = orders.filter(o =>
        ['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
    );

    // Filter issues (Failed, Declined, Cancelled)
    const deliveryIssues = orders.filter(o =>
        ['FAILED', 'DECLINED', 'CANCELLED'].includes(o.status)
    );

    // Filter awaiting pickup (Ready)
    const readyForPickup = orders.filter(o => o.status === 'READY_FOR_PICKUP');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/10 pb-6">
                <div>
                    <h2 className="text-4xl font-heading font-light tracking-tight text-black">Logistics<span className="text-[#D4AF37]">.</span></h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Live Delivery Tracking</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-black text-white px-4 py-2 rounded flex items-center gap-3">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-widest">{activeDeliveries.length} Active Riders</span>
                    </div>
                </div>
            </div>

            {/* LIVE DELIVERIES GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. MOCK ACTIVE DELIVERY (If no real active orders, show this demo card for UI vibe) */}
                {activeDeliveries.length === 0 && (
                    <div className="bg-white border border-gray-200 p-6 relative group overflow-hidden">
                        {/* Status Stripe */}
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />

                        <div className="flex justify-between items-start mb-6 pl-4">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-1 block">In Transit</span>
                                <h3 className="text-2xl font-heading font-bold text-gray-900">DEMO #8823</h3>
                            </div>
                            <div className="text-right">
                                <span className="block text-4xl font-heading font-light text-gray-900">08<span className="text-sm font-bold text-gray-400 ml-1">MIN</span></span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">ETA To Customer</span>
                            </div>
                        </div>

                        <div className="pl-4 space-y-6">
                            {/* Rider Info */}
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Bike size={24} className="text-gray-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-900">Kevin Mwangi</div>
                                    <div className="text-xs text-gray-500 font-mono">Motorbike • KME 456J</div>
                                </div>
                                <button className="p-3 border border-gray-200 rounded-full hover:bg-black hover:text-white transition-colors">
                                    <Phone size={16} />
                                </button>
                            </div>

                            {/* Route Info */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                                        <div className="w-0.5 h-8 bg-gray-200" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Pickup</p>
                                        <p className="text-sm font-medium text-gray-900">Westlands Branch</p>
                                        <p className="text-xs text-green-600 font-mono mt-0.5">12:30 PM • COMPLETED</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500 ring-4 ring-green-100" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Dropoff</p>
                                        <p className="text-sm font-medium text-gray-900">Yaya Center, Kilimani</p>
                                        <p className="text-xs text-gray-400 font-mono mt-0.5">Est. 12:45 PM</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ACTIVE DELIVERIES FROM DATA */}
                {activeDeliveries.map(order => (
                    <div key={order.id} className="bg-white border border-gray-200 p-6 relative group overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                        <div className="flex justify-between items-start mb-6 pl-4">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-1 block">
                                    {order.status === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : 'Rider Assigned'}
                                </span>
                                <h3 className="text-xl font-heading font-bold text-gray-900">Order #{order.id.slice(-4)}</h3>
                            </div>
                            <div className="text-right">
                                <span className="block text-4xl font-heading font-light text-gray-900">~15<span className="text-sm font-bold text-gray-400 ml-1">MIN</span></span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Est. Arrival</span>
                            </div>
                        </div>
                        <div className="pl-4">
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-6">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Bike size={24} className="text-gray-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-900">Assigned Rider</div>
                                    <div className="text-xs text-gray-500 font-mono">Tracking ID: {order.id.slice(0, 8)}</div>
                                </div>
                            </div>
                            <div className="text-sm text-gray-600">
                                Customer: <span className="font-bold">{order.customer.name}</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                Location: {order.delivery_address || 'N/A'}
                            </div>
                        </div>
                    </div>
                ))}

                {/* ISSUES (Failed/Delayed) */}
                {deliveryIssues.map(order => (
                    <div key={order.id} className="bg-white border border-gray-200 p-6 relative group overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                        <div className="flex justify-between items-start mb-6 pl-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle size={14} className="text-red-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 block">Issue Detected</span>
                                </div>
                                <h3 className="text-xl font-heading font-bold text-gray-900">Order #{order.id.slice(-4)}</h3>
                            </div>
                            <div className="text-right">
                                <span className="block text-4xl font-heading font-light text-red-500">{order.status}</span>
                            </div>
                        </div>
                        <div className="pl-4">
                            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                <h4 className="font-bold text-red-900 text-sm mb-1">Attention Needed</h4>
                                <p className="text-xs text-red-700 leading-relaxed mb-4">
                                    Delivery was {order.status.toLowerCase()}. Please contact customer or support.
                                </p>
                                <button className="w-full py-3 bg-white border border-red-200 text-red-600 rounded text-xs font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-2">
                                    <RefreshCw size={14} /> Resolve Issue
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* READY FOR PICKUP */}
            {readyForPickup.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-4">Ready for Pickup</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {readyForPickup.map(order => (
                            <div key={order.id} className="bg-white p-4 border border-gray-200 shadow-sm flex items-center gap-4">
                                <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <div className="font-bold">Order #{order.id.slice(-4)}</div>
                                    <div className="text-xs text-gray-500">Waiting for Rider Assignment</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
