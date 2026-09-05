import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    XCircle,
    Clock,
    Store,
    Bike,
    User,
    Search,
    Filter,
    FileText,
    ExternalLink,
    AlertTriangle
} from 'lucide-react';

type Tab = 'merchants' | 'riders';
type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ALL';

interface Merchant {
    id: string;
    business_name: string;
    type: string;
    status: string;
    logo_url?: string;
    description?: string;
    address?: string;
    kra_pin?: string;
    health_permit?: string;
    mpesa_till?: string;
    documents?: Record<string, string> | null;
    created_at: string;
}

interface Rider {
    id: string;
    vehicle_type: string;
    status: string;
    is_online: boolean;
    vehicle_plate?: string;
    has_id_doc: boolean;
    has_license: boolean;
    has_logbook: boolean;
    has_helmet: boolean;
    has_thermal_bag: boolean;
    has_vest: boolean;
    documents?: Record<string, string> | null;
    created_at: string;
}

export default function Approvals() {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('merchants');
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<Status>('PENDING');
    const [processing, setProcessing] = useState<string | null>(null);
    const [expandedMerchant, setExpandedMerchant] = useState<string | null>(null);
    const [expandedRider, setExpandedRider] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [activeTab, statusFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'merchants') {
                const { data, error } = await supabase
                    .from('merchants')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (data) {
                    let filtered = data;
                    if (statusFilter !== 'ALL') {
                        filtered = data.filter((m: any) => m.status === statusFilter);
                    }
                    if (searchQuery) {
                        filtered = filtered.filter((m: any) =>
                            m.business_name?.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                    }
                    setMerchants(filtered as Merchant[]);
                }
            } else {
                const { data, error } = await supabase
                    .from('riders')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (data) {
                    let filtered = data;
                    if (statusFilter !== 'ALL') {
                        filtered = data.filter((r: any) => r.status === statusFilter);
                    }
                    if (searchQuery) {
                        filtered = filtered.filter((r: any) =>
                            r.vehicle_type?.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                    }
                    setRiders(filtered as Rider[]);
                }
            }
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        setProcessing(id);
        try {
            const table = activeTab === 'merchants' ? 'merchants' : 'riders';
            const { error } = await supabase
                .from(table)
                .update({ status: 'APPROVED', is_active: activeTab === 'merchants' ? true : undefined })
                .eq('id', id);

            if (error) throw error;
            await loadData();
        } catch (err) {
            console.error('Error approving:', err);
            alert('Failed to approve. Please try again.');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (id: string) => {
        setProcessing(id);
        try {
            const table = activeTab === 'merchants' ? 'merchants' : 'riders';
            const { error } = await supabase
                .from(table)
                .update({ status: 'REJECTED' })
                .eq('id', id);

            if (error) throw error;
            await loadData();
        } catch (err) {
            console.error('Error rejecting:', err);
            alert('Failed to reject. Please try again.');
        } finally {
            setProcessing(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-100 text-amber-700';
            case 'APPROVED': return 'bg-green-100 text-green-700';
            case 'REJECTED': return 'bg-red-100 text-red-700';
            case 'SUSPENDED': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const renderDocumentLink = (url: string | undefined, label: string) => {
        if (!url) return null;
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
            >
                <FileText size={16} />
                <span>{label}</span>
                <ExternalLink size={14} />
            </a>
        );
    };

    const renderMerchantDocuments = (merchant: Merchant) => {
        const docs = merchant.documents || {};
        const docEntries = Object.entries(docs);
        
        if (docEntries.length === 0) {
            return (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertTriangle size={16} />
                    <span>No documents uploaded</span>
                </div>
            );
        }

        const getDocLabel = (key: string) => {
            const labels: Record<string, string> = {
                kra_pin: 'KRA PIN',
                health_permit: 'Health Permit',
                business_license: 'Business License',
            };
            return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        };

        return (
            <div className="flex flex-wrap gap-2 mt-3">
                {docEntries.map(([key, url]) => (
                    <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-all"
                    >
                        <FileText size={14} />
                        {getDocLabel(key)}
                        <ExternalLink size={12} />
                    </a>
                ))}
            </div>
        );
    };

    const renderRiderDocuments = (rider: Rider) => {
        const docs = rider.documents || {};
        const docEntries = Object.entries(docs);

        if (docEntries.length === 0) {
            return (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertTriangle size={16} />
                    <span>No documents uploaded</span>
                </div>
            );
        }

        const getDocLabel = (key: string) => {
            const labels: Record<string, string> = {
                id_doc: 'ID Document',
                license: 'Driver\'s License',
                logbook: 'Logbook',
                good_conduct: 'Good Conduct',
                insurance: 'Insurance',
            };
            return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        };

        return (
            <div className="flex flex-wrap gap-2 mt-3">
                {docEntries.map(([key, url]) => (
                    <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-all"
                    >
                        <FileText size={14} />
                        {getDocLabel(key)}
                        <ExternalLink size={12} />
                    </a>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black tracking-tight text-black mb-2">Approvals</h1>
                    <p className="text-gray-500 font-medium">Review and manage merchant and rider applications</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('merchants')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
                            activeTab === 'merchants'
                                ? 'bg-black text-white shadow-lg'
                                : 'bg-white text-gray-400 hover:bg-gray-50'
                        }`}
                    >
                        <Store size={16} className="inline mr-2" />
                        Merchants
                    </button>
                    <button
                        onClick={() => setActiveTab('riders')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
                            activeTab === 'riders'
                                ? 'bg-black text-white shadow-lg'
                                : 'bg-white text-gray-400 hover:bg-gray-50'
                        }`}
                    >
                        <Bike size={16} className="inline mr-2" />
                        Riders
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ALL'] as Status[]).map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                                    statusFilter === status
                                        ? 'bg-black text-white'
                                        : 'bg-white text-gray-400 hover:bg-gray-50'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {activeTab === 'merchants' && merchants.map((merchant) => (
                                <motion.div
                                    key={merchant.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                                {merchant.logo_url ? (
                                                    <img src={merchant.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <Store size={24} className="text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{merchant.business_name}</h3>
                                                <p className="text-sm text-gray-500">{merchant.type}</p>
                                                {merchant.description && (
                                                    <p className="text-xs text-gray-400 mt-1 max-w-md truncate">{merchant.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${getStatusColor(merchant.status)}`}>
                                                {merchant.status}
                                            </span>

                                            {merchant.status === 'PENDING' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApprove(merchant.id)}
                                                        disabled={processing === merchant.id}
                                                        className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all disabled:opacity-50"
                                                    >
                                                        <CheckCircle2 size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(merchant.id)}
                                                        disabled={processing === merchant.id}
                                                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all disabled:opacity-50"
                                                    >
                                                        <XCircle size={20} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Documents Section */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => setExpandedMerchant(expandedMerchant === merchant.id ? null : merchant.id)}
                                            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black transition-all"
                                        >
                                            <FileText size={16} />
                                            <span>Documents & Details</span>
                                            <span className="text-xs text-gray-400">
                                                ({expandedMerchant === merchant.id ? 'Hide' : 'Show'})
                                            </span>
                                        </button>

                                        {expandedMerchant === merchant.id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-3 p-4 bg-gray-50 rounded-xl"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Business Info</p>
                                                        <div className="space-y-1 text-sm">
                                                            <p><span className="text-gray-500">Address:</span> {merchant.address || 'Not provided'}</p>
                                                            <p><span className="text-gray-500">M-Pesa Till:</span> {merchant.mpesa_till || 'Not provided'}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Documents</p>
                                                        {renderMerchantDocuments(merchant)}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {activeTab === 'riders' && riders.map((rider) => (
                                <motion.div
                                    key={rider.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                                <Bike size={24} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{rider.vehicle_type} Rider</h3>
                                                <p className="text-sm text-gray-500">
                                                    {rider.is_online ? 'Online' : 'Offline'} • {rider.status}
                                                </p>
                                                {rider.vehicle_plate && (
                                                    <p className="text-xs text-gray-400 mt-1">Plate: {rider.vehicle_plate}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${getStatusColor(rider.status)}`}>
                                                {rider.status}
                                            </span>

                                            {rider.status === 'PENDING' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApprove(rider.id)}
                                                        disabled={processing === rider.id}
                                                        className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all disabled:opacity-50"
                                                    >
                                                        <CheckCircle2 size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(rider.id)}
                                                        disabled={processing === rider.id}
                                                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all disabled:opacity-50"
                                                    >
                                                        <XCircle size={20} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Documents Section */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => setExpandedRider(expandedRider === rider.id ? null : rider.id)}
                                            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black transition-all"
                                        >
                                            <FileText size={16} />
                                            <span>Documents & Equipment</span>
                                            <span className="text-xs text-gray-400">
                                                ({expandedRider === rider.id ? 'Hide' : 'Show'})
                                            </span>
                                        </button>

                                        {expandedRider === rider.id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-3 p-4 bg-gray-50 rounded-xl"
                                            >
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Verified Documents & Equipment</p>
                                                {renderRiderDocuments(rider)}
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {(activeTab === 'merchants' && merchants.length === 0) && (
                            <div className="text-center py-20">
                                <Store size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-medium">No merchants found</p>
                            </div>
                        )}

                        {(activeTab === 'riders' && riders.length === 0) && (
                            <div className="text-center py-20">
                                <Bike size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-medium">No riders found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
