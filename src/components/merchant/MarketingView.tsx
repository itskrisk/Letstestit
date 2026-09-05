import {
    TrendingUp,
    Users,
    ChevronRight,
    Plus,
    Gift,
    X
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Order } from '../../types/schema';

interface MarketingViewProps {
    orders?: Order[];
}

export default function MarketingView({ orders = [] }: MarketingViewProps) {
    const [isCreating, setIsCreating] = useState(false);

    // Calculate Reach Metrics
    const { uniqueCustomers, totalRevenue } = useMemo(() => {
        const customers = new Set(orders.map(o => o.customer.phone));
        const revenue = orders.reduce((sum, o) => sum + o.total, 0);
        return { uniqueCustomers: customers.size, totalRevenue: revenue };
    }, [orders]);

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/10 pb-8">
                <div>
                    <h2 className="text-4xl font-heading font-light tracking-tight text-black">Growth Lab<span className="text-[#D4AF37]">.</span></h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Promotions & Audience insights</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg"
                >
                    {isCreating ? <X size={16} /> : <Plus size={16} />}
                    {isCreating ? 'Cancel' : 'Create Campaign'}
                </button>
            </div>

            {/* NEW CAMPAIGN FORM (Collapsible) */}
            {isCreating && (
                <div className="bg-gray-50 border border-gray-200 p-8 rounded-3xl animate-in slide-in-from-top-4 fade-in duration-300">
                    <h3 className="font-heading font-bold text-xl mb-6">Launch New Campaign</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Campaign Name</label>
                            <input type="text" placeholder="e.g. Weekend Flash Sale" className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Discount Type</label>
                            <select className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors">
                                <option>Percentage Off (%)</option>
                                <option>Fixed Amount Off (KES)</option>
                                <option>Buy 1 Get 1 Free</option>
                                <option>Free Delivery</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button className="px-8 py-3 bg-[#D4AF37] text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-black hover:text-white transition-colors">
                            Launch Promo
                        </button>
                    </div>
                </div>
            )}

            {/* Campaign HUD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Active Reach', value: uniqueCustomers.toString(), sub: 'Unique Customers', icon: Users, color: 'text-blue-500' },
                    { label: 'Est. LTV', value: `KES ${uniqueCustomers > 0 ? Math.round(totalRevenue / uniqueCustomers).toLocaleString() : 0}`, sub: 'Rev. Per Customer', icon: TrendingUp, color: 'text-green-500' },
                    { label: 'Vouchers Used', value: '182', sub: 'Global Usage', icon: Gift, color: 'text-[#D4AF37]' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                        <stat.icon className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] ${stat.color} group-hover:scale-110 transition-transform`} />
                        <div className="relative z-10">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</span>
                            <div className="text-4xl font-heading font-black tracking-tighter mt-2">{stat.value}</div>
                            <div className="text-xs text-black/40 font-medium mt-1 uppercase tracking-widest">{stat.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* Active Promotions */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b-2 border-black/5 pb-4">
                        <h3 className="text-xl font-heading font-bold uppercase tracking-tight">Active Promos</h3>
                        <span className="text-[10px] font-black uppercase text-gray-300">2 Running</span>
                    </div>

                    {[
                        { name: 'Lunch Rush - 15% Off', type: 'Discount', performance: '+22% Sales', color: 'bg-[#D4AF37]' },
                        { name: 'Happy Hour BOGO', type: 'Buy One Get One', performance: '+34% Reach', color: 'bg-black' },
                    ].map((promo, i) => (
                        <div key={i} className="flex items-center gap-6 p-6 bg-white border border-gray-100 hover:border-black transition-all cursor-pointer group">
                            <div className={`w-12 h-12 flex items-center justify-center text-white font-black text-xl rounded-xl ${promo.color}`}>%</div>
                            <div className="flex-1">
                                <h4 className="font-bold text-lg leading-none">{promo.name}</h4>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">{promo.type}</div>
                            </div>
                            <div className="text-right">
                                <span className="text-green-500 font-bold text-sm">{promo.performance}</span>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mt-1">Direct Impact</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Growth Insights Table */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b-2 border-black/5 pb-4">
                        <h3 className="text-xl font-heading font-bold uppercase tracking-tight">Top Conversions</h3>
                        <span className="text-[10px] font-black uppercase text-gray-300">By Product</span>
                    </div>

                    <div className="bg-white border border-gray-100">
                        {[
                            { item: 'Ultimate Chicken', reach: '1.2k', conv: '18%', rank: 1 },
                            { item: 'Double Cheese', reach: '800', conv: '14%', rank: 2 },
                            { item: 'Spicy Wings', reach: '2.4k', conv: '9%', rank: 3 },
                        ].map((row, i) => (
                            <div key={i} className="flex items-center justify-between p-5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className="font-heading font-black text-[#D4AF37] w-4">#{row.rank}</span>
                                    <span className="font-bold">{row.item}</span>
                                </div>
                                <div className="flex gap-8 items-center">
                                    <div className="text-right">
                                        <div className="text-sm font-bold">{row.conv}</div>
                                        <div className="text-[9px] uppercase font-bold text-gray-400">Conv. Rate</div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-200" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
