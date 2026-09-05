import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, AlertTriangle } from 'lucide-react';

const PORTAL_LINKS: Record<string, { label: string; path: string }> = {
    customer: { label: 'Customer App', path: '/login' },
    merchant: { label: 'Partner Portal', path: '/partner/login' },
    admin: { label: 'Admin Console', path: '/admin/login' },
};

export default function CourierLayout({ children }: { children: React.ReactNode }) {
    const { user, profile, loading, signOut } = useAuth();

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const roles = profile?.roles || (profile?.role ? [profile.role] : [user?.user_metadata?.role || 'user']);
    const isCourier = roles.includes('courier') || user?.user_metadata?.role === 'courier';
    const primaryRole = roles[0] || user?.user_metadata?.role || profile?.role || 'user';

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (e) {
            console.error('Sign out error:', e);
        } finally {
            localStorage.clear();
            window.location.href = '/courier/login';
        }
    };

    // If user is logged in but NOT a courier — show a hard wall
    if (user && profile && !isCourier) {
        const portal = PORTAL_LINKS[primaryRole];
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-8 text-center font-sans">
                <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#D4AF37]/20">
                    <AlertTriangle size={32} className="text-[#D4AF37]" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37] mb-3">
                    Access Denied
                </p>
                <h1 className="text-2xl font-black tracking-tight text-white mb-2 uppercase">
                    Wrong Terminal
                </h1>
                <p className="text-gray-400 text-sm max-w-xs mb-8">
                    You are logged in as a <strong className="text-white capitalize">{primaryRole}</strong>.
                    The FleetOS Terminal is exclusively for registered Couriers.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    {portal && (
                        <Link
                            to={portal.path}
                            className="px-6 py-3 bg-[#D4AF37] text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all"
                        >
                            Go to {portal.label}
                        </Link>
                    )}
                    <button
                        onClick={handleSignOut}
                        className="px-6 py-3 border border-white/10 text-gray-400 text-xs font-black uppercase tracking-widest rounded-xl hover:border-white/30 hover:text-white transition-all flex items-center gap-2 justify-center"
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
