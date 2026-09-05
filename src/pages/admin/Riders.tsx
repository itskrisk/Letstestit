import { useState, useRef, useEffect } from 'react';
import {
    Bike, Search, Activity, Package, Star,
    X, CheckCircle, Shield, Download, Printer,
    AlertCircle, User, FileText, Calendar,
    XCircle, ArrowLeft, ChevronDown, Trash2, RefreshCw,
    Eye
} from 'lucide-react';
import { Rider } from '../../types/schema';
import { supabase } from '../../lib/supabaseClient';

type ActionType = 'approve' | 'suspend' | 'offboard' | null;
type DrawerTab = 'details' | 'documents' | 'performance' | 'timeline';

// ─── CSV Export Utility ────────────────────────────────────────────────────
function exportRidersToCSV(riders: Rider[], filename: string) {
    const headers = [
        'ID', 'Name', 'Phone', 'Vehicle Type', 'Status', 'Online',
        'Make', 'Model', 'Plate', 'Rating', 'Acceptance Rate',
        'Completion Rate', 'Total Earnings', 'Wallet Balance'
    ];
    const rows = riders.map(r => [
        r.id, `"${r.name}"`, r.phone,
        r.vehicleType, r.status, r.isOnline ? 'Yes' : 'No',
        r.vehicle?.make || '', r.vehicle?.model || '', r.vehicle?.plate || '',
        r.performance?.rating || '', r.performance?.acceptanceRate || '',
        r.performance?.completionRate || '', r.earnings?.total || 0,
        r.wallet?.balance || 0
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}


// ─── Main Page ─────────────────────────────────────────────────────────────
export default function Riders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'PENDING'>('ALL');
    const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
    const [pendingAction, setPendingAction] = useState<{ type: ActionType; rider: Rider } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [drawerTab, setDrawerTab] = useState<DrawerTab>('details');

    const fetchRiders = async () => {
        setIsLoading(true);
        try {
            const [{ data: riderData, error: riderError }, { data: orderData, error: orderError }] = await Promise.all([
                supabase
                    .from('riders')
                    .select('*, profile:profiles!id(full_name, phone)')
                    .order('created_at', { ascending: false }),
                supabase.from('orders').select('*').not('status', 'in', '("DELIVERED","CANCELLED")')
            ]);

            if (riderError) throw riderError;
            if (orderError) throw orderError;

            if (orderData) {
                setOrders(orderData);
            }

            if (riderData) {
                const mappedRiders: Partial<Rider>[] = riderData.map(r => ({
                    id: r.id,
                    name: r.profile?.full_name || 'Unnamed Courier',
                    phone: r.profile?.phone || '',
                    vehicleType: r.vehicle_type || 'Motorbike',
                    status: r.status || 'PENDING',
                    isOnline: r.is_online || false,
                    currentOrderId: undefined,
                    documents: r.documents || {},
                    performance: {
                        rating: r.rating || 5.0,
                        acceptanceRate: 100,
                        completionRate: 100,
                        reliabilityScore: 100,
                        onTimeRate: 100,
                        ordersToday: 0,
                        totalOrders: r.total_orders || 0
                    },
                    earnings: { today: 0, weekly: 0, total: 0 },
                    wallet: { balance: 0, pending: 0 },
                    vehicle: {
                        make: r.vehicle_make || 'Unknown',
                        model: r.vehicle_model || 'Unknown',
                        plate: r.vehicle_plate || 'Unknown'
                    }
                }));

                // Map active orders to riders
                mappedRiders.forEach(r => {
                    const activeOrder = orderData?.find(o => o.rider_id === r.id);
                    if (activeOrder) {
                        r.currentOrderId = activeOrder.id;
                        r.status = 'BUSY';
                    }
                });

                setRiders(mappedRiders as Rider[]);
            }
        } catch (e) {
            console.error('Failed to load riders', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRiders();

        const channel = supabase.channel('admin_riders_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'riders' }, () => fetchRiders())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchRiders())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleActionConfirm = async (reason: string) => {
        if (!pendingAction) return;
        const { type, rider } = pendingAction;

        let newStatus = '';
        if (type === 'approve') newStatus = 'APPROVED';
        else if (type === 'suspend') newStatus = 'SUSPENDED';
        else if (type === 'offboard') newStatus = 'DELETED';
        else return;

        try {
            await supabase.from('riders').update({ status: newStatus }).eq('id', rider.id);
            await fetchRiders();
        } catch (e) {
            console.error('Action failed:', e);
            alert('Failed to update status');
        }
        setPendingAction(null);
        setSelectedRider(null);
    };

    const filteredRiders = riders.filter(rider => {
        const matchesSearch = rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rider.phone?.includes(searchQuery) ||
            rider.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === 'ALL' ? true :
                statusFilter === 'ONLINE' ? rider.isOnline :
                    statusFilter === 'OFFLINE' ? !rider.isOnline :
                        statusFilter === 'PENDING' ? !rider.isOnline : true; // PENDING = not yet active
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: riders.length,
        online: riders.filter(r => r.isOnline).length,
        busy: riders.filter(r => r.status === 'BUSY').length,
        avgRating: riders.length
            ? (riders.reduce((acc, r) => acc + (r.performance?.rating || 0), 0) / riders.length).toFixed(1)
            : '—',
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleExport = () => {
        const toExport = selectedIds.size > 0
            ? riders.filter(r => selectedIds.has(r.id))
            : filteredRiders;
        exportRidersToCSV(toExport, `muncheez_riders_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Fleet & Courier Management</h1>
                    <p className="text-sm text-gray-400 font-medium">Review applications, manage verification, and monitor active riders.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchRiders}
                        className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Download size={16} /> Export {selectedIds.size > 0 ? `(${selectedIds.size})` : 'All'}
                    </button>
                    <button className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 shadow-lg shadow-black/10 transition-all flex items-center gap-2">
                        <Bike size={18} /> Onboard Rider
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <RiderStat label="Total Fleet" value={stats.total.toString()} icon={Bike} color="black" onClick={() => setStatusFilter('ALL')} />
                <RiderStat label="On-Duty" value={stats.online.toString()} icon={Activity} color="green" onClick={() => setStatusFilter('ONLINE')} />
                <RiderStat label="Active Drops" value={stats.busy.toString()} icon={Package} color="blue" onClick={() => setStatusFilter('OFFLINE')} />
                <RiderStat label="Avg. Rating" value={`⭐ ${stats.avgRating}`} icon={Shield} color="amber" onClick={() => setStatusFilter('ALL')} />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center">
                <div className="relative w-full md:flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm font-medium focus:outline-none focus:border-gray-200 transition-all"
                    />
                </div>
                <div className="flex items-center p-1 bg-gray-100 rounded-xl">
                    {(['ALL', 'ONLINE', 'OFFLINE', 'PENDING'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk selector row */}
            {filteredRiders.length > 0 && (
                <div className="flex items-center justify-between px-1">
                    <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={selectedIds.size === filteredRiders.length && filteredRiders.length > 0}
                            onChange={() => {
                                if (selectedIds.size === filteredRiders.length) setSelectedIds(new Set());
                                else setSelectedIds(new Set(filteredRiders.map(r => r.id)));
                            }}
                            className="rounded border-gray-300 accent-black"
                        />
                        Select all ({filteredRiders.length})
                    </label>
                    <span className="text-xs text-gray-400">{filteredRiders.length} rider{filteredRiders.length !== 1 ? 's' : ''}</span>
                </div>
            )}

            {/* Riders Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {filteredRiders.length === 0 ? (
                    <div className="p-16 text-center">
                        <Bike className="mx-auto mb-4 text-gray-200" size={48} />
                        <p className="text-gray-400 font-medium">No riders found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="p-4 w-10"></th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Rider</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Vehicle</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Rating</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Earnings</th>
                                    <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredRiders.map(rider => (
                                    <tr
                                        key={rider.id}
                                        className={`hover:bg-gray-50/70 transition-colors ${selectedIds.has(rider.id) ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(rider.id)}
                                                onChange={() => toggleSelect(rider.id)}
                                                className="rounded border-gray-300 accent-black"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${rider.isOnline ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                    <Bike size={17} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-900">{rider.name}</p>
                                                    <p className="text-xs text-gray-400">{rider.phone || rider.id.slice(-8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">{rider.vehicleType}</p>
                                                <p className="text-xs text-gray-400">{rider.vehicle?.plate || '—'}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${rider.isOnline ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${rider.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                    {rider.status || (rider.isOnline ? 'Online' : 'Offline')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden lg:table-cell">
                                            <span className="flex items-center gap-1 text-sm font-semibold">
                                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                                {rider.performance?.rating?.toFixed(1) || '—'}
                                            </span>
                                        </td>
                                        <td className="p-4 hidden lg:table-cell">
                                            <span className="text-sm font-semibold text-gray-700">
                                                KES {(rider.earnings?.total || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => { setSelectedRider(rider); setDrawerTab('details'); }}
                                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="View Full Profile"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                                {!rider.isOnline && (
                                                    <button
                                                        onClick={() => setPendingAction({ type: 'approve', rider })}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Activate"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                                {rider.isOnline && (
                                                    <button
                                                        onClick={() => setPendingAction({ type: 'suspend', rider })}
                                                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                        title="Suspend"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setPendingAction({ type: 'offboard', rider })}
                                                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Offboard"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Rider Application Detail Drawer */}
            {selectedRider && (
                <RiderDetailDrawer
                    rider={selectedRider}
                    tab={drawerTab}
                    onTabChange={setDrawerTab}
                    activeOrder={orders?.find(o => o.id === selectedRider.currentOrderId)}
                    onClose={() => setSelectedRider(null)}
                    onApprove={() => setPendingAction({ type: 'approve', rider: selectedRider })}
                    onSuspend={() => setPendingAction({ type: 'suspend', rider: selectedRider })}
                    onOffboard={() => setPendingAction({ type: 'offboard', rider: selectedRider })}
                />
            )}

            {/* Action Confirmation Modal */}
            {pendingAction && (
                <RiderActionModal
                    action={pendingAction}
                    onClose={() => setPendingAction(null)}
                    onConfirm={handleActionConfirm}
                />
            )}
        </div>
    );
}


// ─── Rider Detail Drawer ───────────────────────────────────────────────────
function RiderDetailDrawer({ rider, tab, onTabChange, activeOrder, onClose, onApprove, onSuspend, onOffboard }: any) {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = printRef.current?.innerHTML;
        if (!content) return;
        const win = window.open('', '', 'width=900,height=700');
        if (!win) return;
        win.document.write(`
            <!DOCTYPE html><html><head>
            <title>Rider Application — ${rider.name}</title>
            <style>
                * { margin:0; padding:0; box-sizing:border-box; }
                body { font-family: sans-serif; color:#111; background: white; padding: 40px; }
                h1 { font-size: 24px; font-weight: 900; margin-bottom: 4px; }
                h2 { font-size: 13px; font-weight: 700; text-transform:uppercase; letter-spacing:.05em; color:#888; border-bottom: 2px solid #f0f0f0; padding-bottom:8px; margin: 24px 0 12px; }
                .meta { font-size:12px; color:#666; margin-bottom: 24px; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .field label { font-size:10px; font-weight:700; text-transform:uppercase; color:#aaa; }
                .field p { font-size:14px; font-weight:600; color:#111; margin-top:2px; }
                .doc-row { display:flex; align-items:center; gap:12px; padding:10px; border:1px solid #f0f0f0; border-radius:8px; margin-bottom:8px; }
                .footer { margin-top:40px; padding-top:16px; border-top:2px solid #f0f0f0; font-size:11px; color:#aaa; }
            </style>
            </head><body>
            ${content}
            <div class="footer"><p>Muncheez Fleet Verification Report · Printed: ${new Date().toLocaleString()} · Confidential</p></div>
            </body></html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 500);
    };

    const getRealDocs = () => {
        if (!rider.documents || typeof rider.documents !== 'object') return [];
        return Object.entries(rider.documents).map(([key, doc]: [string, any]) => ({
            type: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            icon: key.toLowerCase().includes('id') ? '🪪' : key.toLowerCase().includes('license') ? '📋' : key.toLowerCase().includes('logbook') ? '📄' : '📎',
            status: doc?.url ? 'Submitted' : 'Pending Upload',
            date: doc?.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—',
            url: doc?.url,
            filename: doc?.filename
        }));
    };

    const REAL_DOCS = getRealDocs();

    const TIMELINE = [
        { event: 'Application Submitted', date: 'Feb 10, 2026', by: rider.name, icon: '📥' },
        { event: 'Documents Uploaded', date: 'Feb 13, 2026', by: rider.name, icon: '📎' },
        { event: 'Background Check Initiated', date: 'Feb 14, 2026', by: 'System', icon: '🔍' },
        { event: 'Training Module Completed', date: 'Feb 15, 2026', by: rider.name, icon: '🎓' },
        ...(rider.isOnline ? [{ event: 'Account Activated', date: 'Feb 17, 2026', by: 'Admin', icon: '✅' }] : []),
    ];

    return (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm">
            {/* Sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 shrink-0">
                <button onClick={onClose} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors mb-8">
                    <ArrowLeft size={16} /> Back to List
                </button>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border-2 ${rider.isOnline ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                    <Bike size={28} />
                </div>
                <h2 className="font-black text-lg leading-tight mb-1">{rider.name}</h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border w-fit ${rider.isOnline ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${rider.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    {rider.status || (rider.isOnline ? 'Active' : 'Offline')}
                </span>
                <p className="text-xs text-gray-400 mt-3">{rider.vehicleType}</p>
                <p className="text-xs text-gray-400 mt-1">{rider.phone}</p>

                <div className="mt-8 space-y-1">
                    {(['details', 'documents', 'performance', 'timeline'] as DrawerTab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => onTabChange(t)}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold capitalize transition-colors ${tab === t ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            {t === 'details' ? '👤 Details' : t === 'documents' ? '📂 Documents' : t === 'performance' ? '📊 Performance' : '⏱ Timeline'}
                        </button>
                    ))}
                </div>

                <div className="mt-auto space-y-2">
                    <button onClick={handlePrint} className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">
                        <Printer size={14} /> Print Application
                    </button>
                    <button
                        onClick={() => exportRidersToCSV([rider], `${rider.name.replace(/\s+/g, '_')}_profile.csv`)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Rider Profile #{rider.id.slice(-8)}</p>
                        <h1 className="text-2xl font-black tracking-tight capitalize">{tab}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {!rider.isOnline && (
                            <button onClick={onApprove} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2">
                                <CheckCircle size={16} /> Activate
                            </button>
                        )}
                        {rider.isOnline && (
                            <button onClick={onSuspend} className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors flex items-center gap-2">
                                <XCircle size={16} /> Suspend
                            </button>
                        )}
                        <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div ref={printRef}>
                        {tab === 'details' && (
                            <div className="space-y-8">
                                <Section title="Rider Information" icon="👤">
                                    <InfoGrid items={[
                                        { label: 'Full Name', value: rider.name },
                                        { label: 'Phone Number', value: rider.phone || '—' },
                                        { label: 'Vehicle Type', value: rider.vehicleType },
                                        { label: 'Current Status', value: rider.status || 'N/A' },
                                    ]} />
                                </Section>
                                <Section title="Vehicle Information" icon="🚗">
                                    <InfoGrid items={[
                                        { label: 'Make', value: rider.vehicle?.make || '—' },
                                        { label: 'Model', value: rider.vehicle?.model || '—' },
                                        { label: 'Plate Number', value: rider.vehicle?.plate || '—' },
                                    ]} />
                                </Section>
                                <Section title="Wallet & Earnings" icon="💰">
                                    <InfoGrid items={[
                                        { label: "Today's Earnings", value: `KES ${(rider.earnings?.today || 0).toLocaleString()}` },
                                        { label: 'Weekly Earnings', value: `KES ${(rider.earnings?.weekly || 0).toLocaleString()}` },
                                        { label: 'Total Earnings', value: `KES ${(rider.earnings?.total || 0).toLocaleString()}` },
                                        { label: 'Wallet Balance', value: `KES ${(rider.wallet?.balance || 0).toLocaleString()}` },
                                    ]} />
                                </Section>
                            </div>
                        )}

                        {tab === 'documents' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p>Document storage links are ready for Supabase Storage integration. Below is the declared document manifest.</p>
                                </div>
                                {REAL_DOCS.length > 0 ? REAL_DOCS.map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-xl shadow-sm">
                                                {doc.icon}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{doc.type}</p>
                                                <p className="text-xs text-gray-400">Submitted: {doc.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${doc.status === 'Submitted' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {doc.status}
                                            </span>
                                            {doc.url && (
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-lg transition-colors" title="View Document">
                                                    <Eye size={15} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
                                        <AlertCircle size={18} className="shrink-0" />
                                        <p>No documents uploaded yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === 'performance' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Star Rating', value: `${rider.performance?.rating?.toFixed(1) || '—'} / 5.0`, icon: '⭐' },
                                        { label: 'Acceptance Rate', value: `${rider.performance?.acceptanceRate || 0}%`, icon: '✅' },
                                        { label: 'Completion Rate', value: `${rider.performance?.completionRate || 0}%`, icon: '🏁' },
                                        { label: 'On-Time Rate', value: `${rider.performance?.onTimeRate || 0}%`, icon: '⏰' },
                                        { label: 'Reliability Score', value: `${rider.performance?.reliabilityScore || 0}`, icon: '🛡️' },
                                    ].map((kpi, i) => (
                                        <div key={i} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                                            <p className="text-3xl mb-2">{kpi.icon}</p>
                                            <p className="text-xl font-black">{kpi.value}</p>
                                            <p className="text-xs text-gray-400 font-semibold mt-1">{kpi.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {activeOrder && (
                                    <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                                        <p className="text-xs font-black uppercase tracking-widest text-blue-500 mb-2">Active Order</p>
                                        <p className="font-bold">#{activeOrder.id.slice(0, 12).toUpperCase()}</p>
                                        <p className="text-sm text-gray-500 mt-1">Status: {activeOrder.status}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === 'timeline' && (
                            <div className="relative">
                                <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-100"></div>
                                <div className="space-y-6">
                                    {TIMELINE.map((event, i) => (
                                        <div key={i} className="flex gap-4 relative">
                                            <div className="w-10 h-10 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center text-lg z-10 flex-shrink-0 shadow-sm">
                                                {event.icon}
                                            </div>
                                            <div className="flex-1 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                                <p className="font-bold text-sm">{event.event}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={11} /> {event.date}</span>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1"><User size={11} /> {event.by}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex gap-4 relative">
                                        <div className="w-10 h-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-full flex items-center justify-center z-10 flex-shrink-0">
                                            <ChevronDown size={16} className="text-gray-300" />
                                        </div>
                                        <div className="flex-1 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
                                            <p className="text-sm text-gray-400 font-medium">Awaiting next action...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer actions */}
                <div className="border-t border-gray-100 p-4 flex gap-2">
                    <button onClick={onOffboard} className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2">
                        <Trash2 size={15} /> Offboard
                    </button>
                    <div className="flex-1" />
                    <button onClick={onClose} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
}


// ─── Helper Components ─────────────────────────────────────────────────────
function Section({ title, icon, children }: any) {
    return (
        <div>
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                <span>{icon}</span> {title}
            </h3>
            {children}
        </div>
    );
}

function InfoGrid({ items }: { items: { label: string; value: string; full?: boolean }[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item, i) => (
                <div key={i} className={`${item.full ? 'md:col-span-2' : ''} p-4 bg-gray-50 rounded-xl border border-gray-100`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                </div>
            ))}
        </div>
    );
}

function RiderActionModal({ action, onClose, onConfirm }: any) {
    const [reason, setReason] = useState('');
    const { type, rider } = action;

    const config: any = {
        approve: {
            title: 'Activate Rider', icon: CheckCircle, iconColor: 'text-green-600', bg: 'bg-green-50',
            description: `Activating ${rider.name} will grant them fleet access and mark them as ready for orders.`,
            buttonText: 'Confirm Activation', buttonClass: 'bg-green-600 hover:bg-green-700',
            placeholder: 'Optional onboarding note...', required: false,
        },
        suspend: {
            title: 'Suspend Rider', icon: XCircle, iconColor: 'text-orange-600', bg: 'bg-orange-50',
            description: `Suspending ${rider.name} will remove them from the active fleet pool immediately.`,
            buttonText: 'Confirm Suspension', buttonClass: 'bg-orange-600 hover:bg-orange-700',
            placeholder: 'Reason for suspension (required)...', required: true,
        },
        offboard: {
            title: 'Offboard Rider', icon: Trash2, iconColor: 'text-red-600', bg: 'bg-red-50',
            description: `⚠️ Offboarding ${rider.name} will permanently remove them from the platform.`,
            buttonText: 'Confirm Offboarding', buttonClass: 'bg-red-600 hover:bg-red-700',
            placeholder: 'Reason for offboarding (required)...', required: true,
        },
    };

    const c = config[type];
    const Icon = c.icon;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4 mb-3">
                        <div className={`p-3 rounded-xl ${c.bg}`}><Icon className={c.iconColor} size={24} /></div>
                        <h2 className="text-xl font-bold">{c.title}</h2>
                    </div>
                    <p className="text-sm text-gray-600">{c.description}</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); if (c.required && !reason.trim()) return; onConfirm(reason); }} className="p-6 space-y-4">
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder={c.placeholder}
                        required={c.required}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none resize-none"
                    />
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                        <button type="submit" className={`flex-1 py-3 text-white rounded-xl text-sm font-bold ${c.buttonClass}`}>{c.buttonText}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function RiderStat({ label, value, icon: Icon, color, onClick }: any) {
    const colors: any = {
        black: 'bg-black text-white',
        green: 'bg-green-50 text-green-600',
        blue: 'bg-blue-50 text-blue-600',
        amber: 'bg-amber-50 text-amber-600',
    };
    return (
        <button onClick={onClick} className="w-full text-left p-5 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer">
            <div className={`p-3 rounded-xl ${colors[color]}`}><Icon size={22} /></div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-black tracking-tighter">{value}</p>
            </div>
        </button>
    );
}
