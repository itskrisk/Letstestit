import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, HelpCircle, LogOut, FileText, X, Cookie, Shield, ArrowLeft, Clock, ShoppingBag, Settings, Save, Lock, MapPin } from 'lucide-react';
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMockDatabase } from "../../../context/MockDatabaseContext";
import { supabase } from '../../../lib/supabaseClient';
import CookieModal from './CookieModal';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, profile, signOut, resetPassword, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { orders } = useMockDatabase();
    const [view, setView] = useState<'profile' | 'orders' | 'settings'>('profile');
    const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);

    // Profile Settings Form State
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [address, setAddress] = useState(localStorage.getItem('user_delivery_address') || 'Lavington, Nairobi');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setPhone(profile.phone || '');
        }
    }, [profile]);

    // Filter orders for this user
    const myOrders = orders.filter(o =>
        o.customer.phone === profile?.phone ||
        o.customer.name === profile?.full_name ||
        o.customer.email === user?.email
    ).sort((a, b) => {
        const dateA = a.placedAt ? new Date(a.placedAt).getTime() : 0;
        const dateB = b.placedAt ? new Date(b.placedAt).getTime() : 0;
        return dateB - dateA;
    });

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        setSaveMessage(null);

        try {
            // Save address locally
            localStorage.setItem('user_delivery_address', address);

            // Update Supabase profiles
            const { error: updateErr } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName.trim(),
                    phone: phone.trim() || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateErr) throw updateErr;

            await refreshUser();
            setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setSaveMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user?.email) return;
        const { error } = await resetPassword(user.email);
        if (error) {
            setSaveMessage({ type: 'error', text: error });
        } else {
            setSaveMessage({ type: 'success', text: `Password reset email sent to ${user.email}` });
        }
    };

    const handleLogout = async () => {
        await signOut();
        onClose();
        navigate('/');
    };

    if (!user) return null;

    const initial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || '?';

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6 text-black">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="relative w-full max-w-sm bg-[#F9F9F9] rounded-3xl overflow-hidden shadow-2xl border border-white/50"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors z-10"
                            >
                                <X size={16} className="text-black/50" />
                            </button>

                            <div className="p-6 flex flex-col items-center pt-8 h-[540px] overflow-hidden">
                                <AnimatePresence mode="wait">
                                    {view === 'profile' && (
                                        <motion.div
                                            key="profile"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="w-full flex flex-col items-center"
                                        >
                                            {/* Avatar Section */}
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#4A90E2] to-[#BEE3F8] p-0.5 mb-3 shadow-lg shrink-0">
                                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                                    <span className="text-2xl font-black text-[#4A90E2]">{initial}</span>
                                                </div>
                                            </div>

                                            <h2 className="text-xl font-bold text-[#1a1a1a] mb-1 truncate max-w-full">
                                                {profile?.full_name || 'Customer'}
                                            </h2>
                                            <div className="px-3 py-1 bg-[#4A90E2]/10 rounded-full border border-[#4A90E2]/20 mb-5">
                                                <span className="text-[10px] font-bold text-[#4A90E2] tracking-widest uppercase">
                                                    {profile?.loyalty_tier || 'Standard'} Tier
                                                </span>
                                            </div>

                                            {/* Main Actions Grid */}
                                            <div className="grid grid-cols-2 gap-3 w-full mb-4 relative z-10">
                                                <button
                                                    onClick={() => setView('orders')}
                                                    className="flex flex-col items-center justify-center gap-2 bg-white p-4 rounded-2xl shadow-sm border border-black/5 hover:border-[#4A90E2]/30 hover:shadow-md transition-all group"
                                                >
                                                    <div className="p-2 rounded-full bg-black/5 group-hover:bg-[#4A90E2]/10 transition-colors">
                                                        <FileText size={20} className="text-black/60 group-hover:text-[#4A90E2]" />
                                                    </div>
                                                    <span className="text-xs font-bold text-black/70">My Orders</span>
                                                </button>
                                                <button
                                                    onClick={() => setView('settings')}
                                                    className="flex flex-col items-center justify-center gap-2 bg-white p-4 rounded-2xl shadow-sm border border-black/5 hover:border-[#4A90E2]/30 hover:shadow-md transition-all group"
                                                >
                                                    <div className="p-2 rounded-full bg-black/5 group-hover:bg-[#4A90E2]/10 transition-colors">
                                                        <Settings size={20} className="text-black/60 group-hover:text-[#4A90E2]" />
                                                    </div>
                                                    <span className="text-xs font-bold text-black/70">Settings</span>
                                                </button>
                                            </div>

                                            {/* Secondary Actions */}
                                            <div className="w-full flex flex-col gap-1 relative z-10">
                                                <button
                                                    onClick={() => setIsCookieModalOpen(true)}
                                                    className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-white transition-colors group text-left"
                                                >
                                                    <Cookie size={18} className="text-black/40 group-hover:text-[#4A90E2]" />
                                                    <span className="text-sm font-medium text-black/60 group-hover:text-black">Cookie Preferences</span>
                                                </button>
                                                <button
                                                    onClick={() => { onClose(); navigate('/legal/privacy-policy'); }}
                                                    className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-white transition-colors group text-left"
                                                >
                                                    <Shield size={18} className="text-black/40 group-hover:text-black" />
                                                    <span className="text-sm font-medium text-black/60 group-hover:text-black">Privacy Policy</span>
                                                </button>
                                                <button
                                                    onClick={() => { onClose(); navigate('/legal/contact-us'); }}
                                                    className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-white transition-colors group text-left"
                                                >
                                                    <HelpCircle size={18} className="text-black/40 group-hover:text-black" />
                                                    <span className="text-sm font-medium text-black/60 group-hover:text-black">Help & Support</span>
                                                </button>
                                                <div className="h-px w-full bg-black/5 my-1" />
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-red-50 transition-colors group text-left"
                                                >
                                                    <LogOut size={18} className="text-black/40 group-hover:text-red-500" />
                                                    <span className="text-sm font-medium text-black/60 group-hover:text-red-600">Log Out</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {view === 'settings' && (
                                        <motion.div
                                            key="settings"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="w-full h-full flex flex-col"
                                        >
                                            <div className="flex items-center gap-3 mb-4 shrink-0">
                                                <button
                                                    onClick={() => setView('profile')}
                                                    className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                                                >
                                                    <ArrowLeft size={16} className="text-black/60" />
                                                </button>
                                                <h3 className="font-heading font-black text-lg">Account Settings</h3>
                                            </div>

                                            {saveMessage && (
                                                <div className={`p-3 rounded-xl mb-3 text-xs font-bold ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                                    {saveMessage.text}
                                                </div>
                                            )}

                                            <form onSubmit={handleSaveSettings} className="space-y-3 flex-1 overflow-y-auto pr-1 no-scrollbar pb-6">
                                                <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm space-y-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Full Name</label>
                                                        <input
                                                            type="text"
                                                            value={fullName}
                                                            onChange={(e) => setFullName(e.target.value)}
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-black"
                                                            placeholder="John Doe"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Email Address (Read Only)</label>
                                                        <input
                                                            type="text"
                                                            disabled
                                                            value={user.email || ''}
                                                            className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-500 cursor-not-allowed"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Phone Number</label>
                                                        <input
                                                            type="text"
                                                            value={phone}
                                                            onChange={(e) => setPhone(e.target.value)}
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-black"
                                                            placeholder="+254 700 000 000"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Default Delivery Address</label>
                                                        <div className="relative">
                                                            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                value={address}
                                                                onChange={(e) => setAddress(e.target.value)}
                                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-black"
                                                                placeholder="Lavington, Nairobi"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={isSaving}
                                                    className="w-full py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-md"
                                                >
                                                    <Save size={14} />
                                                    {isSaving ? 'Saving Changes...' : 'Save Settings'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleResetPassword}
                                                    className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Lock size={14} />
                                                    Reset Password
                                                </button>
                                            </form>
                                        </motion.div>
                                    )}

                                    {view === 'orders' && (
                                        <motion.div
                                            key="orders"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="w-full h-full flex flex-col"
                                        >
                                            <div className="flex items-center gap-3 mb-6 shrink-0">
                                                <button
                                                    onClick={() => setView('profile')}
                                                    className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                                                >
                                                    <ArrowLeft size={16} className="text-black/60" />
                                                </button>
                                                <h3 className="font-heading font-black text-lg">My Orders</h3>
                                            </div>

                                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar pb-10">
                                                {myOrders.length === 0 ? (
                                                    <div className="text-center py-10 opacity-50">
                                                        <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
                                                        <p className="font-bold text-gray-400">No orders yet</p>
                                                    </div>
                                                ) : (
                                                    myOrders.map(order => (
                                                        <button
                                                            key={order.id}
                                                            onClick={() => {
                                                                onClose();
                                                                navigate(`/order/${order.id}`);
                                                            }}
                                                            className="w-full bg-white p-4 rounded-2xl border border-black/5 shadow-sm hover:shadow-md hover:border-[#4A90E2]/30 transition-all text-left group"
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                                        #{order.id.split('-')[1]}
                                                                    </span>
                                                                    <h4 className="font-bold text-sm mt-1">{order.items[0]?.name} {order.items.length > 1 && `+${order.items.length - 1} more`}</h4>
                                                                </div>
                                                                <div className={`
                                                                    px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                                                    ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-[#D4AF37]/10 text-[#D4AF37]'}
                                                                `}>
                                                                    {order.status}
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between items-end">
                                                                <div className="text-xs text-gray-400 font-medium">
                                                                    <Clock size={12} className="inline mr-1" />
                                                                    {order.placedAt ? new Date(order.placedAt).toLocaleDateString() : 'Just now'}
                                                                </div>
                                                                <span className="font-black text-sm text-[#4A90E2]">KES {order.total.toLocaleString()}</span>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <CookieModal
                isOpen={isCookieModalOpen}
                onClose={() => setIsCookieModalOpen(false)}
            />
        </>
    );
};

export default ProfileModal;
