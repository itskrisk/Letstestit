import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gift,
    Zap,
    Users,
    TrendingUp,
    Plus,
    Search,
    Clock,
    X,
    ChevronRight,
    Tag,
    Target,
    BarChart3,
    ArrowRight,
    Copy,
    Check
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function Marketing() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);

    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [promos, setPromos] = useState<any[]>([]);

    useEffect(() => {
        const fetchMarketingData = async () => {
            const [{ data: campaignData }, { data: promoData }] = await Promise.all([
                supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
                supabase.from('promo_codes').select('*, campaign:campaigns(name)').order('created_at', { ascending: false })
            ]);
            if (campaignData) setCampaigns(campaignData);
            if (promoData) setPromos(promoData);
        };
        fetchMarketingData();

        const channel = supabase.channel('admin_marketing_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, fetchMarketingData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'promo_codes' }, fetchMarketingData)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-3">
                        Growth Engines <span className="text-xs bg-black text-white px-2 py-1 rounded-full">{campaigns.length} Live</span>
                    </h1>
                    <p className="text-sm text-gray-400 font-medium">Campaign orchestration & conversion optimization</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 bg-white border border-gray-100 shadow-sm rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
                        <BarChart3 size={18} /> Performance Reports
                    </button>
                    <button
                        onClick={() => setIsCreatorOpen(true)}
                        className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 shadow-lg shadow-black/10 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> New Campaign
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MarketingStat label="Active Reach" value="0" sub="Unique Users" icon={Users} color="black" />
                <MarketingStat label="Avg. Conversion" value="0%" sub="No active ops" icon={TrendingUp} color="emerald" />
                <MarketingStat label="Promo Burn" value="KES 0" sub="Budget Utilization" icon={Zap} color="orange" />
                <MarketingStat label="Loyalty Index" value="--/5" sub="User Sentiment" icon={Gift} color="purple" />
            </div>

            {/* Active Campaigns */}
            <div className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-300">Operational Campaigns</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {campaigns.length === 0 ? (
                        <div className="col-span-1 md:col-span-3 p-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem]">
                            <p className="font-bold text-gray-400">No active campaigns.</p>
                        </div>
                    ) : campaigns.map((c) => (
                        <CampaignCard key={c.id} campaign={c} />
                    ))}
                </div>
            </div>

            {/* Promo Code Management */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black tracking-tight italic uppercase">Promo Inventory</h3>
                        <p className="text-sm text-gray-400 font-medium">Track and manage dynamic discount codes</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input
                            type="text"
                            placeholder="Find code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-black/5 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Access Code</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Value Logic</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Utilization</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Expiry</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Operational Status</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {promos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-10 py-12 text-center text-gray-400 font-bold border-b border-gray-50">
                                        No promos available.
                                    </td>
                                </tr>
                            ) : promos.map((p) => (
                                <tr key={p.code} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="px-4 py-2 bg-black text-white rounded-xl font-black text-xs tracking-widest group-hover:scale-105 transition-transform">
                                                {p.code}
                                            </div>
                                            <button className="text-gray-200 hover:text-black transition-colors"><Copy size={14} /></button>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <span className="font-black text-sm tracking-tighter italic">{p.discount}</span>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-sm">{p.usage}</span>
                                            <div className="w-24 h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-black rounded-full" style={{ width: '45%' }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">
                                            <Clock size={12} /> {p.expiry}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <button className="p-3 bg-gray-50 rounded-xl hover:bg-black hover:text-white transition-all">
                                            <ChevronRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Campaign Creator Modal */}
            <AnimatePresence>
                {isCreatorOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreatorOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white rounded-t-[4rem] shadow-2xl z-[101] overflow-hidden flex flex-col border-t border-white/20"
                        >
                            <div className="p-12 pb-6 flex justify-between items-center border-b border-gray-50">
                                <div>
                                    <h2 className="text-4xl font-black tracking-tighter italic uppercase">Engine Setup</h2>
                                    <p className="text-sm text-gray-400 font-medium">Configure a new growth operation</p>
                                </div>
                                <button onClick={() => setIsCreatorOpen(false)} className="p-4 bg-gray-50 rounded-3xl hover:bg-gray-100 transition-all text-gray-400">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 grid grid-cols-2 gap-12">
                                <div className="space-y-10">
                                    <section className="space-y-6">
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-300">1. Core Strategy</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <StrategyOption icon={Zap} label="Flash Sale" active={true} />
                                            <StrategyOption icon={Users} label="Referral" />
                                            <StrategyOption icon={Tag} label="Seasonal" />
                                            <StrategyOption icon={Target} label="Retargeting" />
                                        </div>
                                    </section>

                                    <section className="space-y-6">
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-300">2. Campaign Parameters</h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Operation Name</label>
                                                <input type="text" placeholder="e.g. Easter Weekend Nairobi" className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] text-sm font-bold focus:bg-white focus:border-black/5 outline-none transition-all" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Discount Logic</label>
                                                    <select className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] text-sm font-bold outline-none">
                                                        <option>Percentage (%)</option>
                                                        <option>Flat Value (KES)</option>
                                                        <option>BOGOF</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Value</label>
                                                    <input type="number" placeholder="25" className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] text-sm font-bold outline-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-10">
                                    <section className="space-y-6">
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-300">3. Target Geoframe</h3>
                                        <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center justify-between border-black">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center">
                                                    <Check size={24} />
                                                </div>
                                                <p className="font-black text-lg">All Zones (Nairobi)</p>
                                            </div>
                                            <ChevronRight size={20} className="text-gray-300" />
                                        </div>
                                    </section>

                                    <div className="p-10 bg-black rounded-[3rem] text-white space-y-8 relative overflow-hidden h-[300px]">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/20 rounded-full blur-3xl" />
                                        <h4 className="text-xl font-black italic uppercase relative z-10">Operation Preview</h4>
                                        <div className="space-y-4 relative z-10">
                                            <div className="flex justify-between border-b border-white/10 pb-4">
                                                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Type</span>
                                                <span className="font-bold text-sm">FLASH_SALE</span>
                                            </div>
                                            <div className="flex justify-between border-b border-white/10 pb-4">
                                                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Potential Reach</span>
                                                <span className="font-bold text-sm">~15.5K Diners</span>
                                            </div>
                                            <div className="flex justify-between pb-4">
                                                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Est. Conversion</span>
                                                <span className="font-bold text-sm text-[#D4AF37]">12-14%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-12 pt-6 border-t border-gray-50 bg-gray-50 flex gap-6">
                                <button className="px-10 py-5 bg-white border border-gray-100 rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-white/50 transition-all shadow-sm">
                                    Save as Draft
                                </button>
                                <button className="flex-1 py-5 bg-black text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-4">
                                    Initialize Campaign Flow <ArrowRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function MarketingStat({ label, value, sub, icon: Icon, color }: any) {
    const colors: any = {
        black: 'bg-black text-white',
        emerald: 'bg-emerald-50 text-emerald-600',
        orange: 'bg-orange-50 text-orange-600',
        purple: 'bg-purple-50 text-purple-600'
    };

    return (
        <div className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className={`p-5 rounded-2xl ${colors[color]} group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-2xl font-black text-black tracking-tighter italic">{value}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{sub}</p>
            </div>
        </div>
    );
}

function CampaignCard({ campaign }: any) {
    return (
        <motion.div
            whileHover={{ y: -10 }}
            className={`p-8 rounded-[2.5rem] ${campaign.mesh} text-white shadow-xl relative overflow-hidden group cursor-pointer h-72 flex flex-col justify-between`}
        >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-white/30 transition-all duration-700" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/20">
                        {campaign.type.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{campaign.status}</span>
                    </div>
                </div>
                <h3 className="text-2xl font-black tracking-tight italic uppercase leading-tight group-hover:scale-105 transition-transform origin-left">{campaign.name}</h3>
            </div>

            <div className="relative z-10 flex justify-between items-end border-t border-white/20 pt-6">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Active Reach</p>
                    <p className="text-xl font-black italic">{campaign.reach}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Impact</p>
                    <p className="text-xl font-black italic text-[#D4AF37]">{campaign.conversion}</p>
                </div>
            </div>
        </motion.div>
    );
}

function StrategyOption({ icon: Icon, label, active = false }: any) {
    return (
        <div className={`p-6 rounded-3xl border ${active ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-transparent'} hover:border-black transition-all cursor-pointer flex flex-col items-center gap-4 group`}>
            <Icon size={24} className={active ? 'text-[#D4AF37]' : 'group-hover:text-black transition-colors'} />
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </div>
    );
}
