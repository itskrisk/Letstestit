import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppRole } from '../../../context/AuthContext';
import { Store, Bike, User, Settings } from 'lucide-react';

const PORTAL_CONFIG: Record<AppRole, { label: string; path: string; icon: React.ReactNode; color: string }> = {
    customer: {
        label: 'Customer App',
        path: '/stores',
        icon: <User size={18} />,
        color: 'bg-[#4A90E2]'
    },
    merchant: {
        label: 'Partner Portal',
        path: '/partner',
        icon: <Store size={18} />,
        color: 'bg-[#D4AF37]'
    },
    courier: {
        label: 'Fleet Terminal',
        path: '/courier',
        icon: <Bike size={18} />,
        color: 'bg-black'
    },
    admin: {
        label: 'Admin Console',
        path: '/admin',
        icon: <Settings size={18} />,
        color: 'bg-red-600'
    }
};

export default function PortalSwitcher() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    if (!user || !profile) return null;

    // ONE EMAIL = ONE ROLE: Show only the single active portal
    const roles = profile.roles || (profile.role ? [profile.role] : []);
    const activeRole = roles[0];

    if (!activeRole || !(activeRole in PORTAL_CONFIG)) return null;

    const portal = PORTAL_CONFIG[activeRole as AppRole];

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            <button
                onClick={() => navigate(portal.path)}
                className={`${portal.color} text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 hover:scale-105 transition-all duration-300 group`}
            >
                <div className="group-hover:rotate-12 transition-transform">
                    {portal.icon}
                </div>
                <span className="text-xs font-black uppercase tracking-widest">
                    {portal.label}
                </span>
            </button>
        </div>
    );
}
