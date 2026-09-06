import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    CheckCircle2,
    ShoppingBag,
    Store,
    Bike,
    Users,
    Package,
    TrendingUp,
    Megaphone,
    MessageSquare,
    Settings,
    LogOut,
    Search,
    Bell,
    ChevronDown,
    Menu,
    X,
    Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        navigate('/admin/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: "Overview", path: "/admin" },
        { icon: CheckCircle2, label: "Approvals", path: "/admin/approvals" },
        { icon: Sparkles, label: "VIP Waitlist", path: "/admin/waitlist" },
        { icon: ShoppingBag, label: "Orders", path: "/admin/orders" },
        { icon: Store, label: "Merchants", path: "/admin/merchants" },
        { icon: Bike, label: "Riders", path: "/admin/riders" },
        { icon: Users, label: "Customers", path: "/admin/customers" },
        { icon: Package, label: "Inventory", path: "/admin/inventory" },
        { icon: TrendingUp, label: "Financials", path: "/admin/financials" },
        { icon: Megaphone, label: "Marketing", path: "/admin/marketing" },
        { icon: MessageSquare, label: "Support", path: "/admin/support" },
        { icon: Settings, label: "Settings", path: "/admin/settings" },
    ];

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex text-gray-900">
            {/* Sidebar (Desktop) */}
            <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex-col z-20">
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <span className="font-heading font-bold text-xl tracking-tighter">
                        Muncheez<span className="text-[#D4AF37]">.</span> Ops
                    </span>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                                ? 'bg-black text-white shadow-lg shadow-black/10'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                                }`}
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                    <div className="mt-4 px-4 py-3 bg-gray-50 rounded-xl flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                            AD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">Admin User</p>
                            <p className="text-[10px] text-gray-400 truncate">Super Admin</p>
                        </div>
                        <ChevronDown size={14} className="text-gray-400" />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-10 px-4 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>

                        {/* Global Search */}
                        <div className="hidden md:flex items-center relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search orders, users, transactions... (Cmd+K)"
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-black/5"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <aside className="absolute top-0 left-0 w-64 bg-white h-full shadow-2xl flex flex-col">
                        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
                            <span className="font-heading font-bold text-xl tracking-tighter">
                                Muncheez<span className="text-[#D4AF37]">.</span>
                            </span>
                            <button onClick={() => setIsMobileMenuOpen(false)}>
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>
                        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                            {navItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                        navigate(item.path);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                                        ? 'bg-black text-white'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                                        }`}
                                >
                                    <item.icon size={18} />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>
                </div>
            )}
        </div>
    );
}
