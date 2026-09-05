import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, AlertTriangle } from 'lucide-react';

const PORTAL_LINKS: Record<string, { label: string; path: string }> = {
    customer: { label: 'Customer App', path: '/login' },
    courier: { label: 'Rider Terminal', path: '/courier/login' },
    admin: { label: 'Admin Console', path: '/admin/login' },
};

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
    const { user, profile, loading, signOut } = useAuth();

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const roles = profile?.roles || (profile?.role ? [profile.role] : [user?.user_metadata?.role || 'user']);
    const isMerchant = roles.includes('merchant') || user?.user_metadata?.role === 'merchant';
    const primaryRole = roles[0] || user?.user_metadata?.role || profile?.role || 'user';

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (e) {
            console.error('Sign out error:', e);
        } finally {
            localStorage.clear();
            window.location.href = '/partner/login';
        }
    };

    // If user is logged in but NOT a merchant — show a hard wall
    if (user && profile && !isMerchant) {
        const portal = PORTAL_LINKS[primaryRole];
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 border border-amber-100">
                    <AlertTriangle size={32} className="text-[#D4AF37]" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">
                    Access Denied
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
                    Partner Portal Only
                </h1>
                <p className="text-gray-500 text-sm max-w-xs mb-8">
                    You are logged in as a <strong className="text-gray-800 capitalize">{primaryRole}</strong>.
                    The Partner Portal is exclusively for registered business partners.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    {portal && (
                        <Link
                            to={portal.path}
                            className="px-6 py-3 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#D4AF37] hover:text-black transition-all"
                        >
                            Go to {portal.label}
                        </Link>
                    )}
                    <button
                        onClick={handleSignOut}
                        className="px-6 py-3 border border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-widest rounded-xl hover:border-gray-400 hover:text-gray-800 transition-all flex items-center gap-2 justify-center"
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
