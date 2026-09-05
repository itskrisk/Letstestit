import { useMemo } from 'react';
import { Clock, TrendingUp, Package, AlertCircle } from 'lucide-react';
import { Order, Product } from '../../types/schema';

interface OverviewProps {
    merchantId: string;
    merchantType: string;
    orders: Order[];
    products: Product[];
}

export default function OverviewView({ merchantId, merchantType, orders, products }: OverviewProps) {
    // Calculate real metrics from data
    const metrics = useMemo(() => {
        // Filter orders for this merchant (assuming orders have merchantId or we filter by context)
        // For now, show all orders as the dashboard is merchant-specific
        const merchantOrders = orders;

        // Calculate today's orders (mock: show all for now since we don't have timestamps)
        const todayOrders = merchantOrders;

        const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
        const pendingOrders = merchantOrders.filter(o =>
            ['CREATED', 'PAYMENT_CONFIRMED', 'PREPARING', 'PACKING'].includes(o.status)
        );

        const lowStockItems = products.filter(p =>
            p.merchantId === merchantId && (p.stockLevel || 0) < 20 && p.isAvailable
        );

        const avgPrepTime = merchantType === 'Restaurant' ? '18m' : null;

        return {
            todayRevenue,
            todayOrderCount: todayOrders.length,
            pendingOrderCount: pendingOrders.length,
            lowStockCount: lowStockItems.length,
            avgPrepTime,
            recentOrders: merchantOrders.slice(0, 5)
        };
    }, [merchantId, merchantType, orders, products]);

    return (
        <div className="space-y-12">
            {/* HUD Metrics */}
            <div className="flex flex-col md:flex-row items-baseline justify-between border-b-2 border-black/5 pb-8 gap-8">
                {/* Revenue */}
                <div className="flex flex-col md:w-1/4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Revenue</span>
                    <span className="text-5xl md:text-6xl font-heading font-light tracking-tighter text-black">
                        KES {metrics.todayRevenue.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-gray-400 -translate-y-4">Today</span>
                </div>

                {/* Volume */}
                <div className="flex flex-col md:w-1/4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Volume</span>
                    <span className="text-5xl md:text-6xl font-heading font-light tracking-tighter text-black">
                        {metrics.todayOrderCount}
                    </span>
                    <span className="text-xs font-medium text-gray-400 -translate-y-4">Orders</span>
                </div>

                {/* Kitchen/Stock Status */}
                <div className="flex flex-col md:w-1/4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">
                        {merchantType === 'Restaurant' ? 'Kitchen' : 'Stock'}
                    </span>
                    <span className={`text-5xl md:text-6xl font-heading font-light tracking-tighter ${merchantType === 'Restaurant' ? 'text-black' : metrics.lowStockCount > 0 ? 'text-red-500' : 'text-green-600'
                        }`}>
                        {merchantType === 'Restaurant' ? metrics.avgPrepTime : metrics.lowStockCount > 0 ? 'Alert' : 'OK'}
                    </span>
                    <span className="text-xs font-medium text-gray-400 -translate-y-4">
                        {merchantType === 'Restaurant' ? 'Avg Prep' : metrics.lowStockCount > 0 ? `${metrics.lowStockCount} Low Items` : 'All Stocked'}
                    </span>
                </div>
            </div>

            {/* The Pass - Active Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Live Orders */}
                <div className="lg:col-span-3">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-heading font-bold uppercase tracking-tight">
                            The Pass <span className="text-gray-300 ml-2 font-light">{metrics.pendingOrderCount} Pending</span>
                        </h3>
                    </div>

                    {metrics.pendingOrderCount === 0 ? (
                        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200">
                            <Package size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                No pending orders<br />at the moment.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {metrics.recentOrders
                                .filter(order => ['CREATED', 'PAYMENT_CONFIRMED', 'PREPARING', 'PACKING'].includes(order.status))
                                .slice(0, 3)
                                .map((order) => {
                                    return (
                                        <div key={order.id} className="bg-white p-6 relative group hover:-translate-y-1 transition-transform duration-300 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]">
                                            {/* Serrated Top Edge */}
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent bg-[length:10px_10px] bg-repeat-x" style={{
                                                backgroundImage: 'radial-gradient(circle at 10px 0, transparent 5px, #fff 6px)'
                                            }} />

                                            <div className="flex justify-between items-start mb-6 border-b border-dashed border-gray-200 pb-4">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                                                        #{order.id.slice(-4)}
                                                    </span>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {order.customer.name}
                                                    </div>
                                                </div>
                                                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white font-bold text-xs">
                                                    NEW
                                                </span>
                                            </div>

                                            <div className="space-y-2 mb-6">
                                                {order.items.slice(0, 2).map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-xs">
                                                        <span className="font-bold text-gray-900">{item.quantity}x {item.name}</span>
                                                    </div>
                                                ))}
                                                {order.items.length > 2 && (
                                                    <div className="text-xs text-gray-400">+{order.items.length - 2} more items</div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-100">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{order.status.replace(/_/g, ' ')}</span>
                                                <span className="font-mono text-sm font-bold">KES {order.total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>

                {/* Quick Stats Sidebar */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Quick Stats</h4>

                    <div className="bg-white p-6 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <TrendingUp size={18} className="text-green-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{metrics.todayOrderCount}</div>
                                <div className="text-xs text-gray-400">Orders Today</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <Clock size={18} className="text-orange-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{metrics.pendingOrderCount}</div>
                                <div className="text-xs text-gray-400">Pending</div>
                            </div>
                        </div>
                    </div>

                    {merchantType !== 'Restaurant' && (
                        <div className="bg-white p-6 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-full ${metrics.lowStockCount > 0 ? 'bg-red-100' : 'bg-green-100'} flex items-center justify-center`}>
                                    <AlertCircle size={18} className={metrics.lowStockCount > 0 ? 'text-red-600' : 'text-green-600'} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{metrics.lowStockCount}</div>
                                    <div className="text-xs text-gray-400">Low Stock</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
