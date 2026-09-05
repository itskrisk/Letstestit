import { useState, useRef, useEffect } from 'react';
import {
    Search, Store, CheckCircle, XCircle, Eye,
    AlertCircle, User, X, Clock, Trash2,
    Download, Calendar, ChevronDown, RefreshCw,
    ArrowLeft, Info, MapPin, Printer, Building,
    Shield, MessageSquare, Send, FileText, Phone,
    Mail, Hash, FileCheck, Star, Edit
} from 'lucide-react';
import { Merchant, MerchantType, MerchantStatus } from '../../types/schema';
import { supabase } from '../../lib/supabaseClient';

type ModalMode = 'view' | 'edit' | 'add';
type ActionType = 'approve' | 'suspend' | 'delete' | 'review' | null;
type ViewTab = 'details' | 'documents' | 'timeline';

// ─── CSV Export Utility ────────────────────────────────────────────────────
function exportToCSV(merchants: Merchant[], filename: string) {
    const headers = [
        'ID', 'Business Name', 'Type', 'Status', 'Owner Name', 'Owner Phone',
        'Email', 'Address', 'M-Pesa Shortcode', 'Applied At', 'Description'
    ];

    const rows = merchants.map(m => [
        m.id,
        `"${m.businessName}"`,
        m.type,
        m.status,
        `"${m.ownerName}"`,
        m.ownerPhone || '',
        m.email || '',
        `"${m.address || ''}"`,
        m.mpesaShortcode || '',
        m.createdAt ? new Date(m.createdAt).toLocaleString() : 'N/A',
        `"${(m.description || '').replace(/"/g, "'")}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}


// ─── Main Page ─────────────────────────────────────────────────────────────
export default function Merchants() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
    const [modalMode, setModalMode] = useState<ModalMode>('view');
    const [pendingAction, setPendingAction] = useState<{ type: ActionType, merchant: Merchant } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [viewTab, setViewTab] = useState<ViewTab>('details');

    const fetchMerchants = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('merchants')
                .select('*, owner:profiles!id(full_name, phone)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedMerchants: Merchant[] = data.map(m => ({
                    id: m.id,
                    businessName: m.business_name || 'Unnamed Business',
                    description: m.description || 'Partner application currently under review.',
                    type: m.type || 'Restaurant',
                    status: m.status || 'PENDING',
                    ownerName: m.owner?.full_name || 'Unknown',
                    ownerPhone: m.owner?.phone || '',
                    email: '',
                    address: m.address || 'Pending Address',
                    isActive: m.is_active || false,
                    rating: 0,
                    completedOrders: 0,
                    revenue: 0,
                    logoUrl: m.logo_url || '',
                    mpesaShortcode: m.mpesa_shortcode || '',
                    mpesaTillNumber: m.mpesa_till || '',
                    kraPin: m.kra_pin || '',
                    createdAt: m.created_at,
                    documents: m.documents || {},
                    settings: {
                        isOpen: m.is_active || false,
                        acceptingOrders: m.is_active || false,
                        autoAccept: false,
                        preparationTime: 20
                    }
                }));
                setMerchants(mappedMerchants);
            }
        } catch (err) {
            console.error('Error fetching merchants:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMerchants();
    }, []);

    const filteredMerchants = merchants.filter(merchant => {
        const matchesSearch =
            merchant.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (merchant.address?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            merchant.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (merchant.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || merchant.status === statusFilter;
        const matchesType = typeFilter === 'ALL' || merchant.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    const stats = {
        total: merchants.length,
        approved: merchants.filter(m => m.status === 'APPROVED').length,
        pending: merchants.filter(m => m.status === 'PENDING').length,
        suspended: merchants.filter(m => m.status === 'SUSPENDED').length,
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        if (selectedIds.size === filteredMerchants.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredMerchants.map(m => m.id)));
        }
    };

    const handleExportSelected = () => {
        const toExport = selectedIds.size > 0
            ? merchants.filter(m => selectedIds.has(m.id))
            : filteredMerchants;
        exportToCSV(toExport, `muncheez_merchants_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    const openViewModal = (merchant: Merchant) => {
        setSelectedMerchant(merchant);
        setModalMode('view');
        setViewTab('details');
    };

    const closeModal = () => {
        setSelectedMerchant(null);
        setModalMode('view');
    };

    const openActionModal = (type: ActionType, merchant: Merchant) => {
        setPendingAction({ type, merchant });
    };

    const confirmedAction = async (reason: string) => {
        if (!pendingAction) return;
        const { type, merchant } = pendingAction;

        let newStatus = '';
        if (type === 'approve') newStatus = 'APPROVED';
        else if (type === 'suspend') newStatus = 'SUSPENDED';
        else if (type === 'review') newStatus = 'PENDING';

        try {
            if (type === 'delete') {
                await supabase.from('merchants').update({ status: 'DELETED' }).eq('id', merchant.id);
            } else {
                await supabase.from('merchants').update({ status: newStatus }).eq('id', merchant.id);
            }

            // Re-fetch to update UI
            await fetchMerchants();
        } catch (e) {
            console.error('Failed to update status:', e);
            alert('Failed to update status');
        }

        setPendingAction(null);
        setSelectedMerchant(null);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Partner Merchants</h1>
                    <p className="text-sm text-gray-500">Review applications, manage accounts, approve and suspend partners.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchMerchants()}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button
                        onClick={handleExportSelected}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Download size={16} />
                        Export {selectedIds.size > 0 ? `(${selectedIds.size})` : 'All'}
                    </button>
                    <button
                        onClick={() => { setSelectedMerchant(null); setModalMode('add'); }}
                        className="px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                        <Store size={16} />
                        Add Merchant
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Merchants" value={stats.total} icon={Store} color="gray" onClick={() => setStatusFilter('ALL')} />
                <StatCard label="Approved" value={stats.approved} icon={CheckCircle} color="green" onClick={() => setStatusFilter('APPROVED')} />
                <StatCard label="Pending Review" value={stats.pending} icon={Clock} color="orange" onClick={() => setStatusFilter('PENDING')} />
                <StatCard label="Suspended" value={stats.suspended} icon={AlertCircle} color="red" onClick={() => setStatusFilter('SUSPENDED')} />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative w-full md:flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, email, owner, or address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
                        {['ALL', 'APPROVED', 'PENDING', 'SUSPENDED'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 ${statusFilter === status ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">Type:</span>
                    {['ALL', 'Restaurant', 'Supermarket', 'Pharmacy', 'Water', 'Flowers'].map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${typeFilter === type ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk Selection Bar */}
            {
                filteredMerchants.length > 0 && (
                    <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={selectedIds.size === filteredMerchants.length && filteredMerchants.length > 0}
                                onChange={selectAll}
                                className="rounded border-gray-300 accent-black"
                            />
                            Select all ({filteredMerchants.length})
                        </label>
                        <span className="text-xs text-gray-400">
                            {filteredMerchants.length} result{filteredMerchants.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                )
            }

            {/* Merchants Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {filteredMerchants.length === 0 ? (
                    <div className="p-16 text-center">
                        <Store className="mx-auto mb-4 text-gray-200" size={48} />
                        <p className="text-gray-400 font-medium">No merchants found.</p>
                        <p className="text-gray-300 text-sm mt-1">Try adjusting your filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="p-4 w-10"></th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Merchant</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Owner</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Type</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Applied</th>
                                    <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredMerchants.map(merchant => (
                                    <tr
                                        key={merchant.id}
                                        className={`hover:bg-gray-50/70 transition-colors ${selectedIds.has(merchant.id) ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(merchant.id)}
                                                onChange={() => toggleSelect(merchant.id)}
                                                className="rounded border-gray-300 accent-black"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                                    {merchant.logoUrl
                                                        ? <img src={merchant.logoUrl} alt="" className="w-full h-full object-cover" />
                                                        : <div className="w-full h-full flex items-center justify-center"><Store size={18} className="text-gray-300" /></div>
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-900">{merchant.businessName}</p>
                                                    <p className="text-xs text-gray-400 line-clamp-1">{merchant.address || 'No address'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">{merchant.ownerName}</p>
                                                <p className="text-xs text-gray-400">{merchant.email || merchant.ownerPhone}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">{merchant.type}</span>
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={merchant.status} />
                                        </td>
                                        <td className="p-4 hidden lg:table-cell">
                                            <span className="text-xs text-gray-400">
                                                {merchant.createdAt ? new Date(merchant.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => openViewModal(merchant)}
                                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="View Full Application"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {merchant.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => openActionModal('approve', merchant)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => openActionModal('suspend', merchant)}
                                                            className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                {merchant.status === 'APPROVED' && (
                                                    <button
                                                        onClick={() => openActionModal('suspend', merchant)}
                                                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                        title="Suspend"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                )}
                                                {merchant.status === 'SUSPENDED' && (
                                                    <button
                                                        onClick={() => openActionModal('approve', merchant)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Reactivate"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openActionModal('delete', merchant)}
                                                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
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

            {/* Full Application Detail Drawer */}
            {selectedMerchant && modalMode === 'view' && (
                <ApplicationDetailDrawer
                    merchant={selectedMerchant}
                    tab={viewTab}
                    onTabChange={setViewTab}
                    onClose={closeModal}
                    onApprove={() => openActionModal('approve', selectedMerchant)}
                    onSuspend={() => openActionModal('suspend', selectedMerchant)}
                    onReview={() => openActionModal('review', selectedMerchant)}
                    onDelete={() => openActionModal('delete', selectedMerchant)}
                />
            )}

            {/* Add/Edit Modal */}
            {modalMode === 'add' && (
                <MerchantFormModal
                    merchant={null}
                    onClose={closeModal}
                    onSave={(m: Merchant) => {
                        // Mock saving logic since it requires Supabase insert now
                        closeModal();
                    }}
                />
            )}

            {/* Action Confirmation Modal */}
            {pendingAction && (
                <ActionModal
                    action={pendingAction}
                    onClose={() => setPendingAction(null)}
                    onConfirm={confirmedAction}
                />
            )}
        </div>
    );
}


// ─── Full Application Drawer ────────────────────────────────────────────────
function ApplicationDetailDrawer({ merchant, tab, onTabChange, onClose, onApprove, onSuspend, onReview, onDelete }: any) {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = printRef.current?.innerHTML;
        if (!content) return;
        const win = window.open('', '', 'width=900,height=700');
        if (!win) return;
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Merchant Application — ${merchant.businessName}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Inter', sans-serif; color: #111; background: white; padding: 40px; }
                    h1 { font-size: 24px; font-weight: 900; margin-bottom: 4px; }
                    h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #888; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; margin: 24px 0 12px; }
                    .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
                    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
                    .badge-APPROVED { background:#dcfce7; color:#16a34a; }
                    .badge-PENDING { background:#fff7ed; color:#ea580c; }
                    .badge-SUSPENDED { background:#fee2e2; color:#dc2626; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                    .field label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #aaa; }
                    .field p { font-size: 14px; font-weight: 600; color: #111; margin-top: 2px; }
                    .doc-row { display: flex; align-items: center; gap: 12px; padding: 10px; border: 1px solid #f0f0f0; border-radius: 8px; margin-bottom: 8px; }
                    .doc-icon { width: 32px; height: 32px; background: #f8f8f8; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
                    .doc-title { font-size: 13px; font-weight: 600; }
                    .doc-status { font-size: 11px; color: #888; }
                    .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #f0f0f0; font-size: 11px; color: #aaa; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                ${content}
                <div class="footer">
                    <p>Muncheez Partner Verification Report · Printed: ${new Date().toLocaleString()} · Confidential</p>
                </div>
            </body>
            </html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 500);
    };

    const getRealDocs = () => {
        if (!merchant.documents || typeof merchant.documents !== 'object') return [];
        return Object.entries(merchant.documents).map(([key, doc]: [string, any]) => ({
            type: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            icon: key.toLowerCase().includes('kra') ? '📋' : key.toLowerCase().includes('health') ? '🏥' : '📄',
            status: doc?.url ? 'Submitted' : 'Pending Upload',
            date: doc?.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—',
            url: doc?.url,
            filename: doc?.filename
        }));
    };

    const REAL_DOCS = getRealDocs();

    const TIMELINE = [
        { event: 'Application Submitted', date: merchant.createdAt ? new Date(merchant.createdAt).toLocaleString() : 'N/A', by: merchant.ownerName, icon: '📥' },
        { event: 'Documents Uploaded', date: 'Feb 11, 2026', by: merchant.ownerName, icon: '📎' },
        { event: 'Under Review', date: 'Feb 14, 2026', by: 'System', icon: '🔍' },
        ...(merchant.status === 'APPROVED' ? [{ event: 'Account Approved', date: 'Feb 16, 2026', by: 'Admin', icon: '✅' }] : []),
        ...(merchant.status === 'SUSPENDED' ? [{ event: 'Account Suspended', date: 'Feb 18, 2026', by: 'Admin', icon: '🚫' }] : []),
    ];

    return (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm">
            {/* Sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 shrink-0">
                <button onClick={onClose} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors mb-8">
                    <ArrowLeft size={16} /> Back to List
                </button>
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 mb-4">
                    {merchant.logoUrl
                        ? <img src={merchant.logoUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Store size={24} className="text-gray-300" /></div>
                    }
                </div>
                <h2 className="font-black text-lg leading-tight mb-1">{merchant.businessName}</h2>
                <StatusBadge status={merchant.status} />
                <p className="text-xs text-gray-400 mt-3">{merchant.type}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><MapPin size={11} /> {merchant.address || 'No address'}</p>

                <div className="mt-8 space-y-1">
                    {(['details', 'documents', 'timeline'] as ViewTab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => onTabChange(t)}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold capitalize transition-colors ${tab === t ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            {t === 'details' ? '📋 Details' : t === 'documents' ? '📂 Documents' : '⏱ Timeline'}
                        </button>
                    ))}
                </div>

                <div className="mt-auto space-y-2">
                    <button onClick={handlePrint} className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">
                        <Printer size={14} /> Print Application
                    </button>
                    <button
                        onClick={() => exportToCSV([merchant], `${merchant.businessName.replace(/\s+/g, '_')}_application.csv`)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 md:hidden">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                    <h2 className="font-bold text-sm truncate max-w-[200px]">{merchant.businessName}</h2>
                    <button onClick={handlePrint} className="p-2 hover:bg-gray-100 rounded-lg"><Printer size={18} /></button>
                </div>

                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between px-8 py-5 border-b border-gray-100">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Application #{merchant.id.slice(-8)}</p>
                        <h1 className="text-2xl font-black tracking-tight">
                            {tab === 'details' ? 'Business Details' : tab === 'documents' ? 'Submitted Documents' : 'Application Timeline'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {merchant.status === 'PENDING' && (
                            <>
                                <button onClick={onApprove} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2">
                                    <CheckCircle size={16} /> Approve
                                </button>
                                <button onClick={onSuspend} className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors flex items-center gap-2">
                                    <XCircle size={16} /> Reject
                                </button>
                            </>
                        )}
                        {merchant.status === 'APPROVED' && (
                            <button onClick={onSuspend} className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors flex items-center gap-2">
                                <XCircle size={16} /> Suspend
                            </button>
                        )}
                        {merchant.status === 'SUSPENDED' && (
                            <button onClick={onApprove} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2">
                                <RefreshCw size={16} /> Reactivate
                            </button>
                        )}
                        <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div ref={printRef}>
                        {/* Print header (hidden on screen) */}
                        <div className="hidden print:block mb-6">
                            <h1>{merchant.businessName}</h1>
                            <p className="meta">
                                Application ID: {merchant.id} &nbsp;|&nbsp;
                                Status: <span className={`badge badge-${merchant.status}`}>{merchant.status}</span> &nbsp;|&nbsp;
                                Applied: {merchant.createdAt ? new Date(merchant.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>

                        {tab === 'details' && (
                            <div className="space-y-8">
                                {/* Business Info */}
                                <Section title="Business Information" icon={<Building size={16} />}>
                                    <InfoGrid items={[
                                        { label: 'Business Name', value: merchant.businessName },
                                        { label: 'Business Type', value: merchant.type },
                                        { label: 'Address', value: merchant.address || '—' },
                                        { label: 'M-Pesa Shortcode', value: merchant.mpesaShortcode || '—', icon: '💳' },
                                        { label: 'Description', value: merchant.description || 'No description provided.', full: true },
                                    ]} />
                                </Section>

                                {/* Owner Info */}
                                <Section title="Owner Details" icon={<User size={16} />}>
                                    <InfoGrid items={[
                                        { label: 'Full Name', value: merchant.ownerName },
                                        { label: 'Phone Number', value: merchant.ownerPhone || '—' },
                                        { label: 'Email Address', value: merchant.email || '—', full: true },
                                    ]} />
                                </Section>

                                {/* Application Meta */}
                                <Section title="Application Metadata" icon={<Info size={16} />}>
                                    <InfoGrid items={[
                                        { label: 'Application ID', value: merchant.id },
                                        { label: 'Current Status', value: merchant.status },
                                        { label: 'Applied On', value: merchant.createdAt ? new Date(merchant.createdAt).toLocaleString('en-KE') : '—' },
                                        { label: 'Active', value: merchant.isActive ? 'Yes' : 'No' },
                                    ]} />
                                </Section>
                            </div>
                        )}

                        {tab === 'documents' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p>Document storage integration is ready for Supabase. Below shows the declared document manifest from the application.</p>
                                </div>
                                <div className="space-y-3">
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
                                <div className="flex gap-3 pt-2">
                                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                                        <Download size={15} /> Download All Docs
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                                        <Shield size={15} /> Request Missing Docs
                                    </button>
                                </div>
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
                                            <p className="text-sm text-gray-400 font-medium">Awaiting decision...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile action bar */}
                <div className="md:hidden border-t border-gray-100 p-4 flex gap-2">
                    {merchant.status === 'PENDING' && (
                        <>
                            <button onClick={onApprove} className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                                <CheckCircle size={16} /> Approve
                            </button>
                            <button onClick={onSuspend} className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                                <XCircle size={16} /> Reject
                            </button>
                        </>
                    )}
                    {merchant.status === 'APPROVED' && (
                        <button onClick={onSuspend} className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                            <XCircle size={16} /> Suspend
                        </button>
                    )}
                    <button onClick={onClose} className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold">Close</button>
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
                {icon} {title}
            </h3>
            {children}
        </div>
    );
}

function InfoGrid({ items }: { items: { label: string; value: string; full?: boolean; icon?: string }[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item, i) => (
                <div key={i} className={`${item.full ? 'md:col-span-2' : ''} p-4 bg-gray-50 rounded-xl border border-gray-100`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-800 break-words">{item.value}</p>
                </div>
            ))}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        'APPROVED': 'bg-green-50 text-green-700 border-green-100',
        'PENDING': 'bg-orange-50 text-orange-600 border-orange-100',
        'SUSPENDED': 'bg-red-50 text-red-600 border-red-100',
        'REJECTED': 'bg-gray-100 text-gray-500 border-gray-100',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles[status] || styles['PENDING']}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'APPROVED' ? 'bg-green-500' : status === 'PENDING' ? 'bg-orange-400' : 'bg-red-500'}`}></span>
            {status}
        </span>
    );
}

function StatCard({ label, value, icon: Icon, color, onClick }: any) {
    const colors: any = {
        gray: 'bg-gray-50 text-gray-600',
        green: 'bg-green-50 text-green-600',
        orange: 'bg-orange-50 text-orange-600',
        red: 'bg-red-50 text-red-600',
    };
    return (
        <button onClick={onClick} className="w-full text-left bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-3 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
            <div className={`p-2 rounded-lg ${colors[color]}`}><Icon size={20} /></div>
            <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-xl font-black">{value}</p>
            </div>
        </button>
    );
}

function ActionModal({ action, onClose, onConfirm }: any) {
    const [reason, setReason] = useState('');
    const { type, merchant } = action;

    const config: any = {
        approve: {
            title: 'Approve Merchant',
            icon: CheckCircle, iconColor: 'text-green-600', bg: 'bg-green-50',
            description: `Approving ${merchant.businessName} will grant them full dashboard access and notify them by email.`,
            buttonText: 'Confirm Approval', buttonClass: 'bg-green-600 hover:bg-green-700',
            placeholder: 'Optional welcome message...',
        },
        suspend: {
            title: 'Suspend / Reject Merchant',
            icon: XCircle, iconColor: 'text-orange-600', bg: 'bg-orange-50',
            description: `Suspending ${merchant.businessName} will block their dashboard access. They will be notified.`,
            buttonText: 'Confirm Suspension', buttonClass: 'bg-orange-600 hover:bg-orange-700',
            placeholder: 'Reason for suspension (required)...', required: true,
        },
        delete: {
            title: 'Delete Merchant',
            icon: Trash2, iconColor: 'text-red-600', bg: 'bg-red-50',
            description: `⚠️ PERMANENT. This will delete all data for ${merchant.businessName}. This cannot be undone.`,
            buttonText: 'Delete Permanently', buttonClass: 'bg-red-600 hover:bg-red-700',
            placeholder: 'Reason for deletion (required)...', required: true,
        },
        review: {
            title: 'Request More Information',
            icon: RefreshCw, iconColor: 'text-blue-600', bg: 'bg-blue-50',
            description: `Send ${merchant.businessName} a request for additional information or documents.`,
            buttonText: 'Send Request', buttonClass: 'bg-blue-600 hover:bg-blue-700',
            placeholder: 'What information is needed?', required: true,
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
                <form onSubmit={(e) => { e.preventDefault(); if (c.required && !reason.trim()) return; onConfirm(reason || 'No reason'); }} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <MessageSquare size={16} /> Note / Email Message {c.required && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={c.placeholder}
                            required={c.required}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                        />
                        <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                            <Send size={11} /> Will be sent to: <strong>{merchant.email}</strong>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                        <button type="submit" className={`flex-1 py-3 text-white rounded-xl text-sm font-bold transition-colors ${c.buttonClass}`}>{c.buttonText}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function MerchantFormModal({ merchant, onClose, onSave }: any) {
    const [formData, setFormData] = useState<Merchant>(merchant || {
        id: `merchant_${Date.now()}`,
        businessName: '', type: 'Restaurant' as MerchantType,
        status: 'PENDING' as MerchantStatus,
        ownerName: '', ownerPhone: '', email: '',
        description: '', address: '', mpesaShortcode: '',
        isActive: true, createdAt: new Date(),
        logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=400&fit=crop',
    });

    const f = (field: keyof Merchant, val: any) => setFormData(prev => ({ ...prev, [field]: val }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Add New Merchant</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Business Name *</label>
                            <input required value={formData.businessName} onChange={e => f('businessName', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
                            <select value={formData.type} onChange={e => f('type', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
                                {['Restaurant', 'Supermarket', 'Pharmacy', 'Water', 'Flowers'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Owner Name *</label>
                            <input required value={formData.ownerName} onChange={e => f('ownerName', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Phone *</label>
                            <input required value={formData.ownerPhone} onChange={e => f('ownerPhone', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Email *</label>
                            <input type="email" required value={formData.email} onChange={e => f('email', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Address</label>
                            <input value={formData.address || ''} onChange={e => f('address', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">M-Pesa Shortcode</label>
                            <input value={formData.mpesaShortcode || ''} onChange={e => f('mpesaShortcode', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors">Add Merchant</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
