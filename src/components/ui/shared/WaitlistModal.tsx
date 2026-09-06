import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, CheckCircle, Mail, Phone, User, MapPin, ArrowRight } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

interface WaitlistModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<'CUSTOMER' | 'MERCHANT' | 'RIDER'>('CUSTOMER');
    const [neighborhood, setNeighborhood] = useState('Kilimani');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim() || !email.trim()) {
            alert('Please enter your full name and email address.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Attempt insert into Supabase waitlist table
            const { error } = await supabase.from('waitlist').insert([{
                full_name: fullName,
                email: email,
                phone: phone || null,
                role: role,
                neighborhood: neighborhood,
                created_at: new Date().toISOString()
            }]);

            if (error) {
                console.warn('Supabase waitlist insert error (saving locally as fallback):', error);
                // Save locally if table doesn't exist yet
                const localWaitlist = JSON.parse(localStorage.getItem('muncheez_waitlist') || '[]');
                localWaitlist.push({ fullName, email, phone, role, neighborhood, createdAt: new Date().toISOString() });
                localStorage.setItem('muncheez_waitlist', JSON.stringify(localWaitlist));
            }

            setIsSuccess(true);
        } catch (err: any) {
            console.error('Waitlist submission failed:', err);
            // Fallback save
            const localWaitlist = JSON.parse(localStorage.getItem('muncheez_waitlist') || '[]');
            localWaitlist.push({ fullName, email, phone, role, neighborhood, createdAt: new Date().toISOString() });
            localStorage.setItem('muncheez_waitlist', JSON.stringify(localWaitlist));
            setIsSuccess(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFullName('');
        setEmail('');
        setPhone('');
        setIsSuccess(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 text-black">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100"
                    >
                        <div className="h-2 w-full bg-gradient-to-r from-[#4A90E2] via-[#D4AF37] to-[#00A082]" />

                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
                                        <Sparkles size={20} className="text-[#4A90E2]" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#4A90E2]">Early Access</span>
                                        <h3 className="font-heading font-black text-xl tracking-tight">Join the VIP Waitlist</h3>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                >
                                    <X size={16} className="text-gray-500" />
                                </button>
                            </div>

                            {isSuccess ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="py-10 text-center space-y-4"
                                >
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-100">
                                        <CheckCircle size={32} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl text-gray-900">You're on the list!</h4>
                                        <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
                                            We've saved your priority access pass. We'll send your exclusive launch invitation to <span className="font-semibold text-black">{email}</span>.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleReset}
                                        className="mt-4 px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
                                    >
                                        Done
                                    </button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <p className="text-xs text-gray-500 font-medium">
                                        Be first to experience Nairobi's intentional dining & delivery network before public release.
                                    </p>

                                    {/* Role Selection */}
                                    <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-2xl">
                                        {(['CUSTOMER', 'MERCHANT', 'RIDER'] as const).map(r => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setRole(r)}
                                                className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${role === r ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
                                            >
                                                {r === 'CUSTOMER' ? 'Foodie' : r === 'MERCHANT' ? 'Merchant' : 'Courier'}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Full Name *</label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                placeholder="e.g. Amina Hassan"
                                                required
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-black transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Email Address *</label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder="e.g. amina@example.com"
                                                required
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-black transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Phone & Neighborhood */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Phone (Optional)</label>
                                            <div className="relative">
                                                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={e => setPhone(e.target.value)}
                                                    placeholder="+254 7..."
                                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-black transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Neighborhood</label>
                                            <div className="relative">
                                                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <select
                                                    value={neighborhood}
                                                    onChange={e => setNeighborhood(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-black transition-all"
                                                >
                                                    <option value="Kilimani">Kilimani</option>
                                                    <option value="Westlands">Westlands</option>
                                                    <option value="Lavington">Lavington</option>
                                                    <option value="Kileleshwa">Kileleshwa</option>
                                                    <option value="Karen">Karen</option>
                                                    <option value="CBD">CBD</option>
                                                    <option value="Gigiri">Gigiri / Runda</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-3.5 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 disabled:opacity-50 mt-2"
                                    >
                                        {isSubmitting ? 'Securing Spot...' : 'Claim VIP Priority Pass'} <ArrowRight size={16} />
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
