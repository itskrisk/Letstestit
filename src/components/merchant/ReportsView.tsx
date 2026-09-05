import {
    TrendingUp,
    TrendingDown,
    Calendar,
    AlertTriangle,
    Users,
    Clock,
    ArrowUpRight
} from 'lucide-react';
import { useMemo } from 'react';
import { MerchantType, Order } from '../../types/schema';

interface ReportsViewProps {
    merchantType: MerchantType;
    orders?: Order[];
}

export default function ReportsView({ merchantType, orders = [] }: ReportsViewProps) {

    // Calculate High Level Metrics
    const { totalSales, avgOrderValue, totalOrders } = useMemo(() => {
        const total = orders.reduce((sum, o) => sum + o.total, 0);
        const count = orders.length;
        return {
            totalSales: total,
            avgOrderValue: count > 0 ? Math.round(total / count) : 0,
            totalOrders: count
        };
    }, [orders]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/10 pb-6">
                <div>
                    <h2 className="text-4xl font-heading font-light tracking-tight text-black">Intelligence<span className="text-[#D4AF37]">.</span></h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">{merchantType} Analytics</p>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded text-xs font-bold uppercase tracking-widest hover:border-black transition-colors">
                        <Calendar size={14} /> This Month
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-colors">
                        Export Data
                    </button>
                </div>
            </div>

            {/* HIGH LEVEL METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Sales', value: `KES ${totalSales.toLocaleString()}`, growth: '+12%', icon: TrendingUp, active: true },
                    { label: 'Avg Order Value', value: `KES ${avgOrderValue.toLocaleString()}`, growth: '-2%', icon: TrendingDown, active: false },
                    { label: 'Active Orders', value: totalOrders.toString(), growth: '+5%', icon: Users, active: false },
                    { label: 'Peak Hour', value: '7:00 PM', growth: 'Fri-Sat', icon: Clock, active: false },
                ].map((stat, i) => (
                    <div key={i} className={`p-6 border ${stat.active ? 'bg-black text-white border-black' : 'bg-white border-gray-200'} rounded-2xl group`}>
                        <div className="flex justify-between items-start mb-4">
                            <stat.icon size={20} className={stat.active ? 'text-[#D4AF37]' : 'text-gray-400'} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${stat.growth.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                                {stat.growth}
                            </span>
                        </div>
                        <h3 className="text-3xl font-mono font-medium mb-1">{stat.value}</h3>
                        <p className={`text-xs font-bold uppercase tracking-widest ${stat.active ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* SPLIT VIEW BASED ON MERCHANT TYPE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 1. SALES TRENDS (Graph Placeholder) */}
                <div className="lg:col-span-2 bg-white border border-gray-200 p-8 rounded-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-heading font-bold text-xl">Revenue Trend</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                <div className="w-2 h-2 bg-black rounded-full" /> Revenue
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                                <div className="w-2 h-2 bg-gray-300 rounded-full" /> Forecast
                            </div>
                        </div>
                    </div>

                    {/* Fake Chart Visualization */}
                    <div className="h-64 flex items-end justify-between gap-2">
                        {[40, 65, 45, 80, 55, 90, 70, 85, 95, 60, 75, 100].map((h, i) => (
                            <div key={i} className="w-full bg-gray-100 rounded-t-lg relative group transition-all hover:bg-[#D4AF37]">
                                <div
                                    className="absolute bottom-0 w-full bg-black rounded-t-lg transition-all duration-500 group-hover:bg-white/20"
                                    style={{ height: `${h}%` }}
                                />
                                <div className="absolute -bottom-6 w-full text-center text-[10px] font-mono text-gray-400">
                                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. SPECIFIC INSIGHTS */}
                <div className="space-y-6">

                    {/* SUPERMARKET SPECIFICS */}
                    {(merchantType === 'Supermarket' || merchantType === 'Pharmacy') && (
                        <>
                            {/* Clearance Management */}
                            <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white rounded-full text-orange-500 shadow-sm"><AlertTriangle size={16} /></div>
                                    <h4 className="font-bold text-orange-900 text-sm uppercase tracking-wide">Clearance Candidates</h4>
                                </div>
                                <p className="text-xs text-orange-700 mb-4">Stock with low turnover in last 30 days.</p>
                                <div className="space-y-2">
                                    {['Imported Cereal (Overstocked)', 'Holiday Chocolates', 'Premium Dog Food'].map((item, i) => (
                                        <div key={i} className="bg-white/50 p-2 rounded text-xs font-mono font-medium text-orange-800 flex justify-between">
                                            <span>{item}</span>
                                            <span className="font-bold text-orange-500">Rec: -30% OFF</span>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-4 py-2 bg-orange-500 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors">
                                    Create Clearance Sale
                                </button>
                            </div>

                            {/* Slow Moving */}
                            <div className="bg-white border border-gray-200 p-6 rounded-2xl">
                                <h4 className="font-heading font-bold text-gray-900 mb-4">Slow Moving Stock</h4>
                                <div className="space-y-3">
                                    {[{ n: 'Imported Cereal', d: '90 days' }, { n: 'Prem. Dog Food', d: '120 days' }].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between pb-3 border-b border-gray-50 last:border-0">
                                            <span className="text-sm font-medium text-gray-700">{item.n}</span>
                                            <span className="text-xs font-mono text-gray-400">{item.d}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* RESTAURANT SPECIFICS */}
                    {(merchantType === 'Restaurant' || merchantType === 'Water' || merchantType === 'Flowers') && (
                        <div className="bg-white border border-gray-200 p-6 rounded-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-heading font-bold text-gray-900">Top Menu Items</h4>
                                <FilterSelect />
                            </div>

                            <div className="space-y-4">
                                {[
                                    { name: 'Ult. Chicken', count: 450, share: 35 },
                                    { name: 'Spicy Fries', count: 320, share: 25 },
                                    { name: 'Cola Zero', count: 210, share: 15 },
                                ].map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1">
                                            <span>{item.name}</span>
                                            <span className="text-gray-400">{item.count} Sold</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-black rounded-full" style={{ width: `${item.share}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PEAK TIMES (Shared) */}
                    <div className="bg-gray-900 text-white p-6 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Clock size={80} /></div>
                        <h4 className="font-bold text-[#D4AF37] uppercase tracking-widest text-xs mb-2">Peak Operations</h4>
                        <div className="text-2xl font-heading font-bold mb-4">Friday, 6 PM - 9 PM</div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            You receive <span className="text-white font-bold">45%</span> of your weekly orders during this window. Ensure staffing is optimized.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}

function FilterSelect() {
    return (
        <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-1">
            This Week <ArrowUpRight size={10} />
        </button>
    )
}

