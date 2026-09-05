import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LifeBuoy,
    AlertCircle,
    CheckCircle,
    Clock,
    Search,
    MessageSquare,
    User,
    Store,
    X,
    ChevronRight,
    Flag,
    ShieldAlert
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';


export default function Support() {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [warnings, setWarnings] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'TICKETS' | 'WARNINGS'>('TICKETS');
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSupportData = async () => {
            try {
                const [{ data: complaintsData }, { data: warningsData }] = await Promise.all([
                    supabase
                        .from('complaints')
                        .select('*, filed_by_profile:profiles!filed_by(full_name, phone)')
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('warnings')
                        .select('*, issued_to_profile:profiles!issued_to(full_name)')
                        .order('created_at', { ascending: false })
                ]);

                if (complaintsData) setComplaints(complaintsData);
                if (warningsData) setWarnings(warningsData);
            } catch (err) {
                console.error('Support fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSupportData();

        const channel = supabase.channel('admin_support_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => fetchSupportData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'warnings' }, () => fetchSupportData())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const stats = {
        open: complaints.filter(c => c.status === 'OPEN').length,
        critical: warnings.filter(w => w.severity === 'CRITICAL' || w.severity === 'HIGH').length,
        avgResponse: '14 min',
        resolved: complaints.filter(c => c.status === 'RESOLVED').length

    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-3">
                        Incident Command <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">{complaints.length + warnings.length}</span>
                    </h1>
                    <p className="text-sm text-gray-400 font-medium">Real-time resolution & safety monitoring</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 bg-white border border-gray-100 shadow-sm rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
                        <ShieldAlert size={18} /> Safety Protocols
                    </button>
                    <button className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 shadow-lg shadow-black/10 transition-all flex items-center gap-2">
                        <MessageSquare size={18} /> Internal Comms
                    </button>
                </div>
            </div>

            {/* Support KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SupportStat label="Active Complaints" value={stats.open.toString()} sub="Action Required" icon={LifeBuoy} color="red" />
                <SupportStat label="System Warnings" value={stats.critical.toString()} sub="Merchant Risk" icon={AlertCircle} color="orange" />
                <SupportStat label="Avg. Resolution" value={stats.avgResponse} sub="Live Performance" icon={Clock} color="blue" />
                <SupportStat label="Resolved Today" value={stats.resolved.toString()} sub="Completed Ops" icon={CheckCircle} color="emerald" />
            </div>

            {/* Workspace Hub */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-10 border-b border-gray-50 flex flex-col lg:flex-row gap-8 items-center justify-between bg-gray-50/20">
                    <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                        <button
                            onClick={() => setActiveTab('TICKETS')}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'TICKETS' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
                        >
                            Diner Complaints
                        </button>
                        <button
                            onClick={() => setActiveTab('WARNINGS')}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'WARNINGS' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
                        >
                            Merchant Flags
                        </button>
                    </div>

                    <div className="relative w-full lg:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search incidents by ID or User..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-white border border-transparent rounded-2xl text-sm font-medium focus:border-black/5 transition-all outline-none shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1">
                    {activeTab === 'TICKETS' ? (
                        <div className="divide-y divide-gray-50">
                            {complaints.length === 0 ? (
                                <div className="p-20 text-center opacity-20">
                                    <CheckCircle size={64} className="mx-auto mb-6" />
                                    <p className="text-xl font-black italic">No active grievances</p>
                                </div>
                            ) : (
                                complaints.map((c) => (
                                    <IncidentRow
                                        key={c.id}
                                        incident={c}
                                        type="COMPLAINT"
                                        onClick={() => setSelectedIssue({ ...c, type: 'COMPLAINT' })}
                                    />
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {warnings.map((w) => (
                                <IncidentRow
                                    key={w.id}
                                    incident={w}
                                    type="WARNING"
                                    onClick={() => setSelectedIssue({ ...w, type: 'WARNING' })}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Issue Detail Modal */}
            <AnimatePresence>
                {selectedIssue && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedIssue(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[101] overflow-hidden flex flex-col"
                        >
                            <div className="flex-1 overflow-y-auto">
                                <div className={`p-12 border-b border-gray-50 ${selectedIssue.type === 'WARNING' ? 'bg-orange-500' : 'bg-red-500'} text-white relative`}>
                                    <div className="absolute top-0 right-0 p-8">
                                        <button onClick={() => setSelectedIssue(null)} className="p-3 bg-black/10 hover:bg-black/20 rounded-2xl transition-all">
                                            <X size={24} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Incident Report</span>
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[9px] font-black tracking-widest">#{selectedIssue.id.slice(0, 8).toUpperCase()}</span>
                                    </div>
                                    <h2 className="text-4xl font-black tracking-tighter italic uppercase mb-2">{selectedIssue.type === 'COMPLAINT' ? selectedIssue.subject : 'Merchant Policy Violation'}</h2>
                                    <p className="text-lg font-bold opacity-70 tracking-widest">{selectedIssue.type === 'COMPLAINT' ? `Ref Order: ${selectedIssue.orderId}` : `Entity: ${selectedIssue.merchantId}`}</p>
                                </div>

                                <div className="p-12 space-y-10">
                                    <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 italic font-medium text-gray-600 leading-relaxed relative">
                                        <MessageSquare className="absolute -top-4 -left-4 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-300" size={44} />
                                        "{selectedIssue.description || selectedIssue.reason}"
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <ActionTile icon={User} label="Contact Client" sub="Encrypted Direct Line" />
                                        <ActionTile icon={Store} label="Audit Merchant" sub="Review Compliance History" />
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-300">Operational Timeline</h3>
                                        <div className="space-y-6 relative ml-3 border-l-2 border-gray-50 pl-8">
                                            <TimelineItem label="Incident Reported" time="14:02 PM" status="COMPLETE" />
                                            <TimelineItem label="System Auto-Flagged" time="14:03 PM" status="COMPLETE" />
                                            <TimelineItem label="Admin Review Assigned" time="14:15 PM" status="IN_PROGRESS" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 border-t border-gray-100 bg-gray-50 flex gap-4">
                                <button className="flex-1 py-5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all shadow-sm">
                                    Dismiss Flag
                                </button>
                                <button className="flex-1 py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-3">
                                    Resolve Incident <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function SupportStat({ label, value, sub, icon: Icon, color }: any) {
    const colors: any = {
        red: 'bg-red-50 text-red-600 border-red-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };

    return (
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${colors[color]} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                </div>
            </div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black text-black tracking-tighter italic">{value}</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 opacity-60">{sub}</p>
        </div>
    );
}

function IncidentRow({ incident, type, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className="p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-gray-50/50 cursor-pointer group transition-all"
        >
            <div className="flex items-center gap-6 flex-1">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${type === 'WARNING' ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'} group-hover:bg-black group-hover:text-white transition-all`}>
                    {type === 'WARNING' ? <ShieldAlert size={24} /> : <Flag size={24} />}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Reference Ops: {incident.orderId || incident.merchantId}</span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[8px] font-black text-gray-400">#{incident.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <h3 className="text-lg font-black tracking-tight group-hover:text-black transition-colors">{incident.subject || 'Policy Violation Report'}</h3>
                    <p className="text-sm text-gray-400 font-medium truncate w-96">{incident.description || incident.reason}</p>
                </div>
            </div>

            <div className="flex items-center gap-8">
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Status</p>
                    <p className="text-xs font-black text-blue-500 uppercase tracking-widest mt-1 italic">Under Review</p>
                </div>
                <button className="p-4 bg-gray-50 rounded-2xl text-gray-300 group-hover:text-black group-hover:bg-white border border-transparent group-hover:border-gray-100 transition-all">
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}

function ActionTile({ icon: Icon, label, sub }: any) {
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

function TimelineItem({ label, time, status }: any) {
    return (
        <div className="relative">
            <div className="absolute -left-[41px] top-1 w-4 h-4 rounded-full bg-white border-4 border-black" />
            <div>
                <div className="flex items-center gap-3">
                    <p className="font-black text-sm uppercase tracking-tight">{label}</p>
                    <span className="text-[9px] font-black bg-gray-100 px-2 py-0.5 rounded text-gray-400 uppercase tracking-widest">{status}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{time}</p>
            </div>
        </div>
    );
}
