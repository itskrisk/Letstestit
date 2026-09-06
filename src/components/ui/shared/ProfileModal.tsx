import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, HelpCircle, LogOut, FileText, X, Cookie, Shield, ArrowLeft, Clock,
    ShoppingBag, MapPin, CreditCard, Heart, Bell, Lock, Compass, FileCode,
    Trash2, Check, Plus, Download, RefreshCw, ChevronRight, Save, Smartphone,
    AlertTriangle, CheckCircle
} from 'lucide-react';
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMockDatabase } from "../../../context/MockDatabaseContext";
import { useCart } from "../../../context/CartContext";
import { supabase } from '../../../lib/supabaseClient';
import CookieModal from './CookieModal';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ModalView =
    | 'main'
    | 'profile'
    | 'orders'
    | 'addresses'
    | 'payments'
    | 'favorites'
    | 'notifications'
    | 'security'
    | 'privacy'
    | 'location'
    | 'support'
    | 'policies'
    | 'delete-account';

const DEFAULT_ADDRESSES = [
    { id: 'addr-1', label: 'Home', fullAddress: 'Lavington Heights, James Gichuru Rd, Nairobi', doorNumber: '4B', instructions: 'Leave with gate security', isDefault: true },
    { id: 'addr-2', label: 'Work', fullAddress: 'One Africa Place, Waiyaki Way, Westlands, Nairobi', doorNumber: 'Suite 502', instructions: 'Call upon arrival', isDefault: false }
];

const DEFAULT_FAVORITES = [
    { id: 'fav-1', name: "Mama's Kitchen", category: 'African Cuisine', rating: '4.9', path: '/store/kitchen-mama' },
    { id: 'fav-2', name: 'Fresh Mart Supermarket', category: 'Groceries', rating: '4.8', path: '/store/supermarket-fresh' },
    { id: 'fav-3', name: 'Nairobi Apothecary', category: 'Pharmacy & Wellness', rating: '5.0', path: '/store/apothecary-nairobi' }
];

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, profile, signOut, resetPassword, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { orders } = useMockDatabase();
    const { addItem } = useCart();

    const [view, setView] = useState<ModalView>('main');
    const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);

    // Profile Form State
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Saved Addresses State
    const [addresses, setAddresses] = useState(() => {
        const saved = localStorage.getItem('muncheez_user_addresses');
        return saved ? JSON.parse(saved) : DEFAULT_ADDRESSES;
    });
    const [newAddrLabel, setNewAddrLabel] = useState('Home');
    const [newAddrText, setNewAddrText] = useState('');
    const [newAddrDoor, setNewAddrDoor] = useState('');
    const [newAddrNotes, setNewAddrNotes] = useState('');
    const [isAddingAddr, setIsAddingAddr] = useState(false);

    // Payment Methods State
    const [mpesaNumber, setMpesaNumber] = useState(profile?.phone || '+254 700 000 000');
    const [defaultPayment, setDefaultPayment] = useState('MPESA');

    // Favorites State
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('muncheez_favorites');
        return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
    });

    // Notification Preferences State
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('muncheez_notification_settings');
        return saved ? JSON.parse(saved) : {
            orderStatus: true,
            riderAlerts: true,
            promotions: true,
            marketing: false
        };
    });

    // Location Preferences State
    const [neighborhood, setNeighborhood] = useState(localStorage.getItem('muncheez_neighborhood') || 'Lavington');
    const [deliveryNotes, setDeliveryNotes] = useState(localStorage.getItem('muncheez_delivery_notes') || '');

    // Support Form State
    const [supportCategory, setSupportCategory] = useState('Order Issue');
    const [supportDetails, setSupportDetails] = useState('');

    // Policies Active Tab
    const [policyTab, setPolicyTab] = useState<'terms' | 'privacy' | 'refund' | 'delivery'>('terms');

    // Delete Account Confirmation State
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setPhone(profile.phone || '');
            if (profile.phone) setMpesaNumber(profile.phone);
        }
    }, [profile]);

    // Save Addresses to localStorage
    useEffect(() => {
        localStorage.setItem('muncheez_user_addresses', JSON.stringify(addresses));
    }, [addresses]);

    // Save Favorites to localStorage
    useEffect(() => {
        localStorage.setItem('muncheez_favorites', JSON.stringify(favorites));
    }, [favorites]);

    // Save Notifications to localStorage
    useEffect(() => {
        localStorage.setItem('muncheez_notification_settings', JSON.stringify(notifications));
    }, [notifications]);

    // Filter user orders
    const myOrders = orders.filter(o =>
        o.customer.phone === profile?.phone ||
        o.customer.name === profile?.full_name ||
        o.customer.email === user?.email
    ).sort((a, b) => {
        const dateA = a.placedAt ? new Date(a.placedAt).getTime() : 0;
        const dateB = b.placedAt ? new Date(b.placedAt).getTime() : 0;
        return dateB - dateA;
    });

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        setFeedback(null);

        try {
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
            setFeedback({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setFeedback({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user?.email) return;
        const { error } = await resetPassword(user.email);
        if (error) {
            setFeedback({ type: 'error', text: error });
        } else {
            setFeedback({ type: 'success', text: `Password reset email sent to ${user.email}` });
        }
    };

    const handleAddAddress = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAddrText.trim()) return;
        const newAddr = {
            id: `addr-${Date.now()}`,
            label: newAddrLabel,
            fullAddress: newAddrText.trim(),
            doorNumber: newAddrDoor.trim() || 'N/A',
            instructions: newAddrNotes.trim() || 'None',
            isDefault: addresses.length === 0
        };
        setAddresses([newAddr, ...addresses]);
        setNewAddrText('');
        setNewAddrDoor('');
        setNewAddrNotes('');
        setIsAddingAddr(false);
        setFeedback({ type: 'success', text: 'Address saved successfully' });
    };

    const handleSetDefaultAddress = (id: string) => {
        setAddresses(addresses.map((a: any) => ({ ...a, isDefault: a.id === id })));
        setFeedback({ type: 'success', text: 'Default delivery address updated' });
    };

    const handleDeleteAddress = (id: string) => {
        setAddresses(addresses.filter((a: any) => a.id !== id));
    };

    const handleReorder = (orderItems: any[]) => {
        orderItems.forEach((item: any) => {
            addItem({
                id: item.id || `item-${Date.now()}`,
                merchantId: item.merchantId || 'm1',
                name: item.name,
                price: item.price,
                description: item.description || '',
                isAvailable: true,
                categoryId: item.category || 'general'
            }, item.quantity || 1);
        });
        setFeedback({ type: 'success', text: 'Items added to your cart!' });
    };

    const handleDownloadUserData = () => {
        const userData = {
            profile: {
                id: user?.id,
                email: user?.email,
                fullName: profile?.full_name,
                phone: profile?.phone
            },
            addresses,
            favorites,
            ordersCount: myOrders.length,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `muncheez_account_data_${user?.id?.slice(0, 8)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setFeedback({ type: 'success', text: 'Data archive downloaded' });
    };

    const handleSaveLocation = () => {
        localStorage.setItem('muncheez_neighborhood', neighborhood);
        localStorage.setItem('muncheez_delivery_notes', deliveryNotes);
        setFeedback({ type: 'success', text: 'Location preferences saved!' });
    };

    const handleSupportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback({ type: 'success', text: 'Ticket #TK-' + Math.floor(1000 + Math.random() * 9000) + ' submitted. Our team will contact you shortly.' });
        setSupportDetails('');
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;
        setIsSaving(true);
        try {
            await signOut();
            localStorage.clear();
            onClose();
            window.location.href = '/';
        } catch (e) {
            console.error('Delete account error:', e);
        } finally {
            setIsSaving(false);
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
                    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-6 text-black font-sans">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        />

                        {/* Modal Dialog */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ type: "spring", stiffness: 320, damping: 28 }}
                            className="relative w-full max-w-md bg-[#FDFBF7] rounded-3xl overflow-hidden shadow-2xl border border-black/10 flex flex-col max-h-[85vh] h-[620px]"
                        >
                            {/* Header Bar */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 bg-white shrink-0 z-10">
                                {view !== 'main' ? (
                                    <button
                                        onClick={() => { setView('main'); setFeedback(null); }}
                                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/60 hover:text-black transition-colors"
                                    >
                                        <ArrowLeft size={16} />
                                        Back
                                    </button>
                                ) : (
                                    <div className="text-xs font-black uppercase tracking-widest text-[#4A90E2]">
                                        Customer Account
                                    </div>
                                )}

                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
                                >
                                    <X size={16} className="text-black/60" />
                                </button>
                            </div>

                            {/* Toast Notification Banner */}
                            {feedback && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`px-6 py-3 text-xs font-bold flex items-center gap-2 border-b shrink-0 ${
                                        feedback.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                                    }`}
                                >
                                    {feedback.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                    <span className="flex-1">{feedback.text}</span>
                                    <button onClick={() => setFeedback(null)} className="text-black/40 hover:text-black">
                                        <X size={12} />
                                    </button>
                                </motion.div>
                            )}

                            {/* Scrollable View Container */}
                            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                                <AnimatePresence mode="wait">

                                    {/* VIEW 1: OVERVIEW / MAIN HUB */}
                                    {view === 'main' && (
                                        <motion.div
                                            key="main"
                                            initial={{ opacity: 0, x: -15 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -15 }}
                                            className="space-y-6"
                                        >
                                            {/* User Profile Header */}
                                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
                                                <div className="w-14 h-14 rounded-full bg-[#4A90E2] text-white flex items-center justify-center shadow-md shrink-0">
                                                    <span className="text-xl font-black">{initial}</span>
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <h3 className="font-heading font-black text-base text-gray-900 truncate">
                                                        {profile?.full_name || 'Customer Account'}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                    <span className="inline-block mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</span>
                                                </div>
                                            </div>

                                            {/* Quick Actions Grid */}
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-2 px-1">
                                                    Quick Access
                                                </span>
                                                <div className="grid grid-cols-2 gap-2.5">
                                                    <button
                                                        onClick={() => setView('orders')}
                                                        className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-black/5 hover:border-[#4A90E2]/40 hover:shadow-md transition-all group text-left"
                                                    >
                                                        <div className="p-2.5 rounded-xl bg-[#4A90E2]/10 text-[#4A90E2] group-hover:bg-[#4A90E2] group-hover:text-white transition-colors">
                                                            <ShoppingBag size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-900">My Orders</div>
                                                            <div className="text-[10px] text-gray-400 font-medium">{myOrders.length} orders</div>
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => setView('addresses')}
                                                        className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-black/5 hover:border-[#4A90E2]/40 hover:shadow-md transition-all group text-left"
                                                    >
                                                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                            <MapPin size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-900">Addresses</div>
                                                            <div className="text-[10px] text-gray-400 font-medium">{addresses.length} saved</div>
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => setView('payments')}
                                                        className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-black/5 hover:border-[#4A90E2]/40 hover:shadow-md transition-all group text-left"
                                                    >
                                                        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                                            <CreditCard size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-900">Payments</div>
                                                            <div className="text-[10px] text-gray-400 font-medium">M-Pesa</div>
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => setView('favorites')}
                                                        className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-black/5 hover:border-[#4A90E2]/40 hover:shadow-md transition-all group text-left"
                                                    >
                                                        <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                                            <Heart size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-gray-900">Favorites</div>
                                                            <div className="text-[10px] text-gray-400 font-medium">{favorites.length} saved</div>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Categorized Menu Options */}
                                            <div className="space-y-4">
                                                {/* SECTION: ACCOUNT */}
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-2 px-1">
                                                        Account
                                                    </span>
                                                    <div className="bg-white rounded-2xl border border-black/5 divide-y divide-gray-100 overflow-hidden">
                                                        <button onClick={() => setView('profile')} className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors text-left group">
                                                            <div className="flex items-center gap-3">
                                                                <User size={16} className="text-gray-400 group-hover:text-[#4A90E2]" />
                                                                <span className="text-xs font-bold text-gray-800">My Profile</span>
                                                            </div>
                                                            <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-0.5 transition-transform" />
                                                        </button>

                                                        <button onClick={() => setView('notifications')} className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors text-left group">
                                                            <div className="flex items-center gap-3">
                                                                <Bell size={16} className="text-gray-400 group-hover:text-[#4A90E2]" />
                                                                <span className="text-xs font-bold text-gray-800">Notifications</span>
                                                            </div>
                                                            <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-0.5 transition-transform" />
                                                        </button>

                                                        <button onClick={() => setView('security')} className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors text-left group">
                                                            <div className="flex items-center gap-3">
                                                                <Lock size={16} className="text-gray-400 group-hover:text-[#4A90E2]" />
                                                                <span className="text-xs font-bold text-gray-800">Security</span>
                                                            </div>
                                                            <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-0.5 transition-transform" />
                                                        </button>

                                                        <button onClick={() => setView('privacy')} className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors text-left group">
                                                            <div className="flex items-center gap-3">
                                                                <Shield size={16} className="text-gray-400 group-hover:text-[#4A90E2]" />
                                                                <span className="text-xs font-bold text-gray-800">Privacy & Data</span>
                                                            </div>
                                                            <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-0.5 transition-transform" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* SECTION: PREFERENCES */}
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-2 px-1">
                                                        Preferences
                                                    </span>
                                                    <div className="bg-white rounded-2xl border border-black/5 divide-y divide-gray-100 overflow-hidden">
                                                        <button onClick={() => setView('location')} className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors text-left group">
                                                            <div className="flex items-center gap-3">
                                                                <Compass size={16} className="text-gray-400 group-hover:text-[#4A90E2]" />
                                                                <span className="text-xs font-bold text-gray-800">Location Preferences</span>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-[#4A90E2]">{neighborhood}</span>
                                                        </button>

                                                        <button onClick={() => setIsCookieModalOpen(true)} className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors text-left group">
                                                            <div className="flex items-center gap-3">
                                                                <Cookie size={16} className="text-gray-400 group-hover:text-[#4A90E2]" />
                                                                <span className="text-xs font-bold text-gray-800">Cookie Settings</span>
                                                            </div>
                                                            <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-0.5 transition-transform" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* SECTION: SUPPORT */}
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-2 px-1">
                                                        Support
                                                    </span>
                                                    <div className="bg-white rounded-2xl border border-black/5 divide-y divide-gray-100 overflow-hidden">
                                                        <button onClick={() => setView('support')} className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors text-left group">
                                                            <div className="flex items-center gap-3">
                                                                <HelpCircle size={16} className="text-gray-400 group-hover:text-[#4A90E2]" />
                                                                <span className="text-xs font-bold text-gray-800">Help & Support</span>
                                                            </div>
                                                            <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-0.5 transition-transform" />
                                                        </button>

                                                        <button onClick={() => setView('policies')} className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors text-left group">
                                                            <div className="flex items-center gap-3">
                                                                <FileCode size={16} className="text-gray-400 group-hover:text-[#4A90E2]" />
                                                                <span className="text-xs font-bold text-gray-800">Terms & Policies</span>
                                                            </div>
                                                            <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-0.5 transition-transform" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* SECTION: ACTIONS */}
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-2 px-1">
                                                        Account Actions
                                                    </span>
                                                    <div className="bg-white rounded-2xl border border-black/5 divide-y divide-gray-100 overflow-hidden">
                                                        <button onClick={handleLogout} className="w-full flex items-center justify-between p-3.5 hover:bg-red-50 transition-colors text-left group">
                                                            <div className="flex items-center gap-3">
                                                                <LogOut size={16} className="text-red-500" />
                                                                <span className="text-xs font-bold text-red-600">Log Out</span>
                                                            </div>
                                                        </button>

                                                        <button onClick={() => setView('delete-account')} className="w-full flex items-center justify-between p-3.5 hover:bg-red-50 transition-colors text-left group">
                                                            <div className="flex items-center gap-3">
                                                                <Trash2 size={16} className="text-red-400 group-hover:text-red-600" />
                                                                <span className="text-xs font-bold text-red-500 group-hover:text-red-700">Delete Account</span>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* VIEW 2: MY PROFILE */}
                                    {view === 'profile' && (
                                        <motion.div key="profile" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-4">
                                            <h3 className="font-heading font-black text-lg text-gray-900">My Profile</h3>

                                            <form onSubmit={handleSaveProfile} className="space-y-3">
                                                <div className="bg-white p-4 rounded-2xl border border-black/5 space-y-3">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Full Name</label>
                                                        <input
                                                            type="text"
                                                            value={fullName}
                                                            onChange={(e) => setFullName(e.target.value)}
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-black"
                                                            placeholder="Your Name"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Email Address (Read Only)</label>
                                                        <input
                                                            type="text"
                                                            disabled
                                                            value={user.email || ''}
                                                            className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-500 cursor-not-allowed"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Phone Number</label>
                                                        <input
                                                            type="text"
                                                            value={phone}
                                                            onChange={(e) => setPhone(e.target.value)}
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-black"
                                                            placeholder="+254 700 000 000"
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={isSaving}
                                                    className="w-full py-3.5 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-md"
                                                >
                                                    <Save size={14} />
                                                    {isSaving ? 'Saving...' : 'Save Profile Changes'}
                                                </button>
                                            </form>
                                        </motion.div>
                                    )}

                                    {/* VIEW 3: MY ORDERS */}
                                    {view === 'orders' && (
                                        <motion.div key="orders" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-4">
                                            <h3 className="font-heading font-black text-lg text-gray-900">My Orders</h3>
                                            {myOrders.length === 0 ? (
                                                <div className="text-center py-12 bg-white rounded-2xl border border-black/5 p-6">
                                                    <ShoppingBag size={40} className="mx-auto mb-3 text-gray-300" />
                                                    <p className="font-bold text-sm text-gray-500">No active or past orders</p>
                                                    <p className="text-xs text-gray-400 mt-1">Explore restaurants and shops to place your first order!</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {myOrders.map((order) => (
                                                        <div key={order.id} className="bg-white p-4 rounded-2xl border border-black/5 space-y-3 shadow-sm">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase tracking-wider">
                                                                        #{order.id.split('-')[1] || order.id.slice(0, 6)}
                                                                    </span>
                                                                    <h4 className="font-bold text-sm text-gray-900 mt-1">
                                                                        {order.items[0]?.name} {order.items.length > 1 && `+${order.items.length - 1} more`}
                                                                    </h4>
                                                                </div>
                                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                    {order.status}
                                                                </span>
                                                            </div>

                                                            <div className="flex justify-between items-center text-xs border-t border-gray-100 pt-3">
                                                                <span className="text-gray-400 font-medium">{order.placedAt ? new Date(order.placedAt).toLocaleDateString() : 'Recent'}</span>
                                                                <span className="font-black text-[#4A90E2]">KES {order.total?.toLocaleString()}</span>
                                                            </div>

                                                            <div className="flex gap-2 pt-1">
                                                                <button
                                                                    onClick={() => handleReorder(order.items)}
                                                                    className="flex-1 py-2 bg-black/5 hover:bg-black/10 text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5"
                                                                >
                                                                    <RefreshCw size={12} />
                                                                    Reorder
                                                                </button>
                                                                <button
                                                                    onClick={() => { onClose(); navigate(`/order/${order.id}`); }}
                                                                    className="flex-1 py-2 bg-[#4A90E2] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#357ABD] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                                                >
                                                                    Track Status
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* VIEW 4: SAVED ADDRESSES */}
                                    {view === 'addresses' && (
                                        <motion.div key="addresses" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-heading font-black text-lg text-gray-900">Saved Addresses</h3>
                                                <button
                                                    onClick={() => setIsAddingAddr(!isAddingAddr)}
                                                    className="px-3 py-1.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-1"
                                                >
                                                    <Plus size={14} />
                                                    Add
                                                </button>
                                            </div>

                                            {/* Add Address Form */}
                                            {isAddingAddr && (
                                                <form onSubmit={handleAddAddress} className="bg-white p-4 rounded-2xl border border-[#4A90E2]/30 space-y-3 shadow-md">
                                                    <div className="flex gap-2">
                                                        {['Home', 'Work', 'Other'].map(lbl => (
                                                            <button
                                                                key={lbl}
                                                                type="button"
                                                                onClick={() => setNewAddrLabel(lbl)}
                                                                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${newAddrLabel === lbl ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
                                                            >
                                                                {lbl}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Full Address / Building Name"
                                                        value={newAddrText}
                                                        onChange={e => setNewAddrText(e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-black"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Apt / Door Number (e.g. 4B)"
                                                        value={newAddrDoor}
                                                        onChange={e => setNewAddrDoor(e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-black"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Delivery Notes (e.g. Leave with gate guard)"
                                                        value={newAddrNotes}
                                                        onChange={e => setNewAddrNotes(e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-black"
                                                    />
                                                    <div className="flex gap-2 pt-1">
                                                        <button type="submit" className="flex-1 py-2 bg-[#4A90E2] text-white text-xs font-bold uppercase tracking-wider rounded-xl">Save Address</button>
                                                        <button type="button" onClick={() => setIsAddingAddr(false)} className="px-3 py-2 border text-xs font-bold rounded-xl">Cancel</button>
                                                    </div>
                                                </form>
                                            )}

                                            {/* Addresses List */}
                                            <div className="space-y-3">
                                                {addresses.map((addr: any) => (
                                                    <div key={addr.id} className={`bg-white p-4 rounded-2xl border space-y-2 ${addr.isDefault ? 'border-[#4A90E2] ring-1 ring-[#4A90E2]/30' : 'border-black/5'}`}>
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-black uppercase tracking-wider text-gray-900">{addr.label}</span>
                                                                {addr.isDefault && <span className="px-2 py-0.5 bg-[#4A90E2]/10 text-[#4A90E2] text-[9px] font-black uppercase tracking-wider rounded-full">Default</span>}
                                                            </div>
                                                            <button onClick={() => handleDeleteAddress(addr.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-gray-600 font-medium leading-relaxed">{addr.fullAddress}</p>
                                                        {addr.instructions && <p className="text-[10px] text-gray-400 font-medium italic">Note: {addr.instructions}</p>}
                                                        {!addr.isDefault && (
                                                            <button
                                                                onClick={() => handleSetDefaultAddress(addr.id)}
                                                                className="text-[10px] font-bold text-[#4A90E2] uppercase tracking-wider hover:underline pt-1"
                                                            >
                                                                Set as Default
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* VIEW 5: PAYMENT METHODS */}
                                    {view === 'payments' && (
                                        <motion.div key="payments" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-4">
                                            <h3 className="font-heading font-black text-lg text-gray-900">Payment Methods</h3>

                                            <div className="bg-white p-4 rounded-2xl border border-black/5 space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Default Payment Option</label>
                                                <div className="space-y-2">
                                                    {[
                                                        { id: 'MPESA', name: 'M-Pesa STK Push', desc: 'Instant mobile payment' },
                                                        { id: 'CASH', name: 'Cash on Delivery', desc: 'Pay rider directly upon receipt' },
                                                        { id: 'CARD', name: 'Debit / Credit Card', desc: 'Visa & Mastercard supported' }
                                                    ].map(pm => (
                                                        <button
                                                            key={pm.id}
                                                            type="button"
                                                            onClick={() => setDefaultPayment(pm.id)}
                                                            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all text-left ${defaultPayment === pm.id ? 'border-[#4A90E2] bg-[#4A90E2]/5' : 'border-gray-100 hover:border-gray-300'}`}
                                                        >
                                                            <div>
                                                                <div className="text-xs font-bold text-gray-900">{pm.name}</div>
                                                                <div className="text-[10px] text-gray-400">{pm.desc}</div>
                                                            </div>
                                                            {defaultPayment === pm.id && <Check size={16} className="text-[#4A90E2]" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 rounded-2xl border border-black/5 space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">M-Pesa Phone Number</label>
                                                <div className="relative">
                                                    <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={mpesaNumber}
                                                        onChange={e => setMpesaNumber(e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-black"
                                                        placeholder="+254 700 000 000"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setFeedback({ type: 'success', text: 'M-Pesa phone number updated' })}
                                                    className="w-full py-2.5 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                                                >
                                                    Save M-Pesa Number
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* VIEW 6: FAVORITES */}
                                    {view === 'favorites' && (
                                        <motion.div key="favorites" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-4">
                                            <h3 className="font-heading font-black text-lg text-gray-900">Favorites</h3>
                                            <div className="space-y-3">
                                                {favorites.map((fav: any) => (
                                                    <div key={fav.id} className="bg-white p-4 rounded-2xl border border-black/5 flex justify-between items-center shadow-sm">
                                                        <div>
                                                            <h4 className="font-bold text-xs text-gray-900">{fav.name}</h4>
                                                            <p className="text-[10px] text-gray-400 font-medium">{fav.category} • Rating: {fav.rating}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => { onClose(); navigate(fav.path); }}
                                                                className="px-3 py-1.5 bg-[#4A90E2] text-white text-xs font-bold rounded-xl uppercase tracking-wider"
                                                            >
                                                                Visit
                                                            </button>
                                                            <button
                                                                onClick={() => setFavorites(favorites.filter((f: any) => f.id !== fav.id))}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* VIEW 7: NOTIFICATIONS */}
                                    {view === 'notifications' && (
                                        <motion.div key="notifications" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-4">
                                            <h3 className="font-heading font-black text-lg text-gray-900">Notifications</h3>
                                            <div className="bg-white rounded-2xl border border-black/5 divide-y divide-gray-100">
                                                {[
                                                    { key: 'orderStatus', title: 'Order Status Updates', desc: 'Real-time alerts when kitchen accepts order' },
                                                    { key: 'riderAlerts', title: 'Rider Location Alerts', desc: 'SMS updates when courier is nearby' },
                                                    { key: 'promotions', title: 'Promotions & Offers', desc: 'Exclusive weekly discounts & vouchers' },
                                                    { key: 'marketing', title: 'Marketing Newsletter', desc: 'New restaurant launches in Nairobi' }
                                                ].map(item => (
                                                    <div key={item.key} className="p-4 flex items-center justify-between">
                                                        <div className="pr-4">
                                                            <div className="text-xs font-bold text-gray-900">{item.title}</div>
                                                            <div className="text-[10px] text-gray-400">{item.desc}</div>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={(notifications as any)[item.key]}
                                                            onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                                                            className="w-4 h-4 accent-black cursor-pointer"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* VIEW 8: SECURITY */}
                                    {view === 'security' && (
                                        <motion.div key="security" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-4">
                                            <h3 className="font-heading font-black text-lg text-gray-900">Security</h3>
                                            <div className="bg-white p-4 rounded-2xl border border-black/5 space-y-3">
                                                <div className="text-xs font-bold text-gray-900">Password Management</div>
                                                <p className="text-[10px] text-gray-500 leading-relaxed">
                                                    Trigger a secure password reset link sent directly to <strong>{user.email}</strong>.
                                                </p>
                                                <button
                                                    onClick={handleResetPassword}
                                                    className="w-full py-2.5 border border-black text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
                                                >
                                                    Send Password Reset Email
                                                </button>
                                            </div>

                                            <div className="bg-white p-4 rounded-2xl border border-black/5 space-y-3">
                                                <div className="text-xs font-bold text-gray-900">Active Login Sessions</div>
                                                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                                                    <div>
                                                        <div className="font-bold text-gray-800">Current Web Session</div>
                                                        <div className="text-[10px] text-gray-400">Windows Chrome • Active Now</div>
                                                    </div>
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                </div>
                                                <button
                                                    onClick={() => setFeedback({ type: 'success', text: 'Logged out of all other active browser sessions' })}
                                                    className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-colors"
                                                >
                                                    Sign Out Other Devices
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* VIEW 9: PRIVACY */}
                                    {view === 'privacy' && (
                                        <motion.div key="privacy" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-4">
                                            <h3 className="font-heading font-black text-lg text-gray-900">Privacy & Data</h3>
                                            <div className="bg-white p-4 rounded-2xl border border-black/5 space-y-3">
                                                <div className="text-xs font-bold text-gray-900">Data Archive Request</div>
                                                <p className="text-[10px] text-gray-500 leading-relaxed">
                                                    Download a full copy of your personal data, order history, and saved addresses in JSON format.
                                                </p>
                                                <button
                                                    onClick={handleDownloadUserData}
                                                    className="w-full py-2.5 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                                                >
                                                    <Download size={14} />
                                                    Download My Personal Data
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* VIEW 10: LOCATION PREFERENCES */}
                                    {view === 'location' && (
                                        <motion.div key="location" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-4">
                                            <h3 className="font-heading font-black text-lg text-gray-900">Location Preferences</h3>
                                            <div className="bg-white p-4 rounded-2xl border border-black/5 space-y-3">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Default Neighborhood</label>
                                                    <select
                                                        value={neighborhood}
                                                        onChange={e => setNeighborhood(e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-black"
                                                    >
                                                        {['Lavington', 'Kilimani', 'Westlands', 'Kileleshwa', 'Karen', 'Nairobi CBD', 'Runda', 'Gigiri'].map(loc => (
                                                            <option key={loc} value={loc}>{loc}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Global Delivery Instructions</label>
                                                    <textarea
                                                        rows={3}
                                                        value={deliveryNotes}
                                                        onChange={e => setDeliveryNotes(e.target.value)}
                                                        placeholder="e.g. Leave with gate security / Ring doorbell"
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-black"
                                                    />
                                                </div>

                                                <button
                                                    onClick={handleSaveLocation}
                                                    className="w-full py-2.5 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                                                >
                                                    Save Location Preferences
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* VIEW 11: HELP & SUPPORT */}
                                    {view === 'support' && (
                                        <motion.div key="support" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-4">
                                            <h3 className="font-heading font-black text-lg text-gray-900">Help & Support</h3>
                                            <form onSubmit={handleSupportSubmit} className="bg-white p-4 rounded-2xl border border-black/5 space-y-3">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Issue Category</label>
                                                    <select
                                                        value={supportCategory}
                                                        onChange={e => setSupportCategory(e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900"
                                                    >
                                                        <option value="Order Issue">Order Issue / Missing Item</option>
                                                        <option value="Payment Problem">Payment Problem / M-Pesa</option>
                                                        <option value="Delivery Delay">Delivery Delay</option>
                                                        <option value="Account Query">Account Query</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Details</label>
                                                    <textarea
                                                        required
                                                        rows={3}
                                                        value={supportDetails}
                                                        onChange={e => setSupportDetails(e.target.value)}
                                                        placeholder="Describe your inquiry or order problem..."
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900"
                                                    />
                                                </div>

                                                <button type="submit" className="w-full py-2.5 bg-[#4A90E2] text-white rounded-xl text-xs font-bold uppercase tracking-wider">
                                                    Submit Ticket
                                                </button>
                                            </form>
                                        </motion.div>
                                    )}

                                    {/* VIEW 12: TERMS & POLICIES */}
                                    {view === 'policies' && (
                                        <motion.div key="policies" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-4">
                                            <h3 className="font-heading font-black text-lg text-gray-900">Terms & Policies</h3>
                                            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                                                {(['terms', 'privacy', 'refund', 'delivery'] as const).map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setPolicyTab(t)}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider capitalize whitespace-nowrap ${policyTab === t ? 'bg-black text-white' : 'bg-white text-gray-600 border'}`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-black/5 text-xs text-gray-600 space-y-2 leading-relaxed max-h-60 overflow-y-auto">
                                                {policyTab === 'terms' && <p>By using Muncheez, you agree to comply with our delivery network rules and fair use customer policies across Nairobi.</p>}
                                                {policyTab === 'privacy' && <p>We safeguard your location and personal contact data in compliance with Kenya Data Protection Act regulations.</p>}
                                                {policyTab === 'refund' && <p>Orders cancelled prior to kitchen preparation are refunded instantly to your original payment method within 2 hours.</p>}
                                                {policyTab === 'delivery' && <p>Deliveries are fulfilled within 25–45 minutes depending on traffic and driver availability in your zone.</p>}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* VIEW 13: DELETE ACCOUNT */}
                                    {view === 'delete-account' && (
                                        <motion.div key="delete-account" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-4">
                                            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-red-700 space-y-2">
                                                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-red-800">
                                                    <AlertTriangle size={16} />
                                                    Danger Zone — Delete Account
                                                </div>
                                                <p className="text-[10px] leading-relaxed">
                                                    Permanently delete your profile, saved addresses, order history, and favorites. This action cannot be undone.
                                                </p>
                                            </div>

                                            <div className="bg-white p-4 rounded-2xl border border-black/5 space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                                                    Type "DELETE" to confirm
                                                </label>
                                                <input
                                                    type="text"
                                                    value={deleteConfirmText}
                                                    onChange={e => setDeleteConfirmText(e.target.value)}
                                                    placeholder="DELETE"
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-red-500"
                                                />
                                                <button
                                                    onClick={handleDeleteAccount}
                                                    disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isSaving}
                                                    className="w-full py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-40 transition-opacity"
                                                >
                                                    Permanently Delete Account
                                                </button>
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
