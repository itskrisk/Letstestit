import { Clock, CheckCircle, XCircle, Mail, Phone, Shield, LogOut, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'REJECTED' | 'SUSPENDED';

interface VerificationOverlayProps {
    status: VerificationStatus;
    name?: string;
    email?: string;
    phone?: string;
    onContactSupport?: () => void;
}

const statusConfig: Record<VerificationStatus, {
    icon: React.ReactNode;
    heading: string;
    subtext: string;
    gradientFrom: string;
    gradientTo: string;
    iconBg: string;
    accentColor: string;
}> = {
    PENDING: {
        icon: <Clock size={40} className="text-amber-400" />,
        heading: 'Application Under Review',
        subtext: 'Your application has been received. Our team will review your documents and get back to you within 2–3 business days.',
        gradientFrom: 'from-amber-50',
        gradientTo: 'to-orange-50',
        iconBg: 'bg-amber-100',
        accentColor: 'text-amber-600',
    },
    UNDER_REVIEW: {
        icon: <Shield size={40} className="text-blue-500" />,
        heading: 'Verification in Progress',
        subtext: 'Our compliance team is currently verifying your documents. You may be contacted for additional information.',
        gradientFrom: 'from-blue-50',
        gradientTo: 'to-indigo-50',
        iconBg: 'bg-blue-100',
        accentColor: 'text-blue-600',
    },
    REJECTED: {
        icon: <XCircle size={40} className="text-red-500" />,
        heading: 'Application Not Approved',
        subtext: 'Unfortunately, your application did not meet our requirements at this time. Please contact support for details and to discuss next steps.',
        gradientFrom: 'from-red-50',
        gradientTo: 'to-pink-50',
        iconBg: 'bg-red-100',
        accentColor: 'text-red-600',
    },
    SUSPENDED: {
        icon: <XCircle size={40} className="text-orange-500" />,
        heading: 'Account Suspended',
        subtext: 'Your account has been temporarily suspended. Please contact our support team to resolve this and restore your access.',
        gradientFrom: 'from-orange-50',
        gradientTo: 'to-red-50',
        iconBg: 'bg-orange-100',
        accentColor: 'text-orange-600',
    },
};

export default function VerificationOverlay({
    status,
    name,
    onContactSupport,
}: VerificationOverlayProps) {
    const { signOut } = useAuth();
    const config = statusConfig[status];

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (e) {
            console.error('Sign out error:', e);
        } finally {
            // Only remove app-specific items, preserve cookie preferences
            localStorage.removeItem('accessToken');
            localStorage.removeItem('muncheez_admin_master');
            localStorage.removeItem('activeMerchantId');
            window.location.href = '/login';
        }
    };

    return (
        <div className={`fixed inset-0 z-50 bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} flex items-center justify-center p-6`}>
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/40 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/40 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
                {/* Top color strip */}
                <div className={`h-2 w-full ${status === 'PENDING' ? 'bg-amber-400' : status === 'UNDER_REVIEW' ? 'bg-blue-500' : status === 'SUSPENDED' ? 'bg-orange-500' : 'bg-red-500'}`} />

                <div className="p-10 text-center">
                    {/* Icon */}
                    <div className={`w-20 h-20 ${config.iconBg} rounded-3xl flex items-center justify-center mx-auto mb-6`}>
                        {config.icon}
                    </div>

                    {/* Greeting */}
                    {name && (
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Hello, {name}</p>
                    )}

                    {/* Heading */}
                    <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">{config.heading}</h1>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8">{config.subtext}</p>

                    {/* Steps (only for PENDING / UNDER_REVIEW) */}
                    {(status === 'PENDING' || status === 'UNDER_REVIEW') && (
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {[
                                { step: '1', label: 'Submitted', done: true },
                                { step: '2', label: 'Under Review', done: status === 'UNDER_REVIEW' },
                                { step: '3', label: 'Decision', done: false },
                            ].map((item) => (
                                <div key={item.step} className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 ${item.done ? 'bg-black text-white border-black' : 'bg-white text-gray-300 border-gray-200'}`}>
                                        {item.done ? <CheckCircle size={16} /> : item.step}
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Contact Info */}
                    <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left space-y-2">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Need Help?</p>
                        <a href="mailto:partners@muncheez.co.ke" className="flex items-center gap-3 text-sm font-medium text-gray-600 hover:text-black transition-colors">
                            <Mail size={15} className="text-gray-400" />
                            partners@muncheez.co.ke
                        </a>
                        <a href="tel:+254700000000" className="flex items-center gap-3 text-sm font-medium text-gray-600 hover:text-black transition-colors">
                            <Phone size={15} className="text-gray-400" />
                            +254 700 000 000
                        </a>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 py-3.5 border border-gray-200 text-gray-700 rounded-2xl text-xs font-bold uppercase tracking-widest hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={14} />
                                Refresh Status
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="flex-1 py-3.5 border border-red-200 text-red-600 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut size={14} />
                                Sign Out
                            </button>
                        </div>
                        <button
                            onClick={onContactSupport}
                            className="w-full py-3.5 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                        >
                            Contact Support
                        </button>
                    </div>

                    <p className="text-xs text-gray-300 mt-4">
                        Muncheez Partner Portal · All rights reserved © {new Date().getFullYear()}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
