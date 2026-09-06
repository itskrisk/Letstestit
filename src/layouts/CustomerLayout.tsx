import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, AlertTriangle } from 'lucide-react';

const PORTAL_LINKS: Record<string, { label: string; path: string }> = {
    merchant: { label: 'Partner Portal', path: '/partner/login' },
    courier: { label: 'Rider Terminal', path: '/courier/login' },
    admin: { label: 'Admin Console', path: '/admin/login' },
};

export default function CustomerLayout() {
    const { user, profile, loading, signOut } = useAuth();

    // Still loading auth state — don't flash anything yet
    if (loading) return null;

    const roles = profile?.roles || (profile?.role ? [profile.role] : []);
    const isCustomer = roles.includes('customer');
    const primaryRole = roles[0] || profile?.role || 'user';

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (e) {
            console.error('Sign out error:', e);
        } finally {
            // Preserve cookie preferences, remove app-specific items
            const cookiePrefs = localStorage.getItem('muncheez_cookie_preferences');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('muncheez_admin_master');
            localStorage.removeItem('activeMerchantId');
            localStorage.removeItem('muncheez_user_addresses');
            localStorage.removeItem('muncheez_favorites');
            localStorage.removeItem('muncheez_notification_settings');
            localStorage.removeItem('muncheez_neighborhood');
            localStorage.removeItem('muncheez_delivery_notes');
            if (cookiePrefs) {
                localStorage.setItem('muncheez_cookie_preferences', cookiePrefs);
            }
            window.location.href = '/login';
        }
    };

    // If user is logged in but NOT a customer — show a hard wall
    if (user && profile && !isCustomer) {
        const portal = PORTAL_LINKS[primaryRole];
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                    <AlertTriangle size={32} className="text-amber-500" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
                    Wrong Portal
                </h1>
                <p className="text-gray-500 text-sm max-w-xs mb-8">
                    You are currently logged in as a <strong className="text-gray-800 capitalize">{primaryRole}</strong>.
                    This is the Customer App. Your account does not have access here.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    {portal && (
                        <Link
                            to={portal.path}
                            className="px-6 py-3 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-700 transition-all"
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

    // Customer or not logged in — pass through normally
    return <Outlet />;
}
