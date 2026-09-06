import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Download, RefreshCw, Mail, Phone, MapPin, Calendar, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface WaitlistEntry {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    role: 'CUSTOMER' | 'MERCHANT' | 'RIDER';
    neighborhood?: string;
    created_at: string;
}

export default function AdminWaitlist() {
    const [entries, setEntries] = useState<WaitlistEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'MERCHANT' | 'RIDER'>('ALL');

    const fetchWaitlist = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('waitlist')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Supabase waitlist fetch warning (reading local fallback):', error);
                const local = JSON.parse(localStorage.getItem('muncheez_waitlist') || '[]');
                setEntries(local.map((item: any, index: number) => ({
                    id: `local_${index}`,
                    full_name: item.fullName || item.full_name,
                    email: item.email,
                    phone: item.phone,
                    role: item.role || 'CUSTOMER',
                    neighborhood: item.neighborhood || 'Nairobi',
                    created_at: item.createdAt || item.created_at || new Date().toISOString()
                })));
            } else if (data) {
                setEntries(data as WaitlistEntry[]);
            }
        } catch (e) {
            console.error('Failed to load waitlist entries:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWaitlist();
    }, []);

    const filtered = entries.filter(e => {
        const matchesSearch = e.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.phone?.includes(searchQuery);
        const matchesRole = roleFilter === 'ALL' ? true : e.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const exportToCSV = () => {
        const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Role', 'Neighborhood', 'Joined At'];
        const rows = filtered.map(e => [
            e.id, `"${e.full_name}"`, e.email, e.phone || '', e.role, `"${e.neighborhood || ''}"`, e.created_at
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `muncheez_waitlist_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this entry?')) return;
        try {
            await supabase.from('waitlist').delete().eq('id', id);
            setEntries(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Sparkles className="text-[#4A90E2]" size={24} /> VIP Waitlist & Early Access
                    </h1>
                    <p className="text-sm text-gray-400 font-medium">Review and export priority early access signups for Muncheez platform launch.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchWaitlist}
                        className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg shadow-black/10"
                    >
                        <Download size={16} /> Export CSV ({filtered.length})
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center">
                <div className="relative w-full md:flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm font-medium focus:outline-none focus:border-gray-200 transition-all"
                    />
                </div>
                <div className="flex items-center p-1 bg-gray-100 rounded-xl">
                    {(['ALL', 'CUSTOMER', 'MERCHANT', 'RIDER'] as const).map(r => (
                        <button
                            key={r}
                            onClick={() => setRoleFilter(r)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === r ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Waitlist Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="p-16 text-center">
                        <Sparkles className="mx-auto mb-4 text-gray-200" size={48} />
                        <p className="text-gray-400 font-medium">No waitlist signups found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Role & Region</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Joined Date</th>
                                    <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(entry => (
                                    <tr key={entry.id} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm">
                                                    {entry.full_name?.slice(0, 1).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-900">{entry.full_name}</p>
                                                    <p className="text-xs text-gray-400">{entry.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                                <Phone size={13} className="text-gray-400" /> {entry.phone || '—'}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100">
                                                    {entry.role}
                                                </span>
                                                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                                    <MapPin size={12} /> {entry.neighborhood || 'Nairobi'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs text-gray-500 font-medium">
                                                {new Date(entry.created_at).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete entry"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
