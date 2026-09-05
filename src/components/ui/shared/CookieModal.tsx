import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, X, Lock, Cookie, ArrowRight } from 'lucide-react';

interface CookieModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface CookiePreferences {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
    updatedAt?: string;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
    essential: true,
    analytics: true,
    marketing: false,
    personalization: true,
};

export default function CookieModal({ isOpen, onClose }: CookieModalProps) {
    const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
    const [savedSuccess, setSavedSuccess] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('muncheez_cookie_preferences');
        if (stored) {
            try {
                setPreferences(JSON.parse(stored));
            } catch (err) {
                console.error('Failed to parse cookie preferences:', err);
            }
        }
    }, [isOpen]);

    const handleSave = (customPrefs?: CookiePreferences) => {
        const toSave = customPrefs || {
            ...preferences,
            updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('muncheez_cookie_preferences', JSON.stringify(toSave));
        setPreferences(toSave);
        setSavedSuccess(true);
        setTimeout(() => {
            setSavedSuccess(false);
            onClose();
        }, 800);
    };

    const handleAcceptAll = () => {
        handleSave({
            essential: true,
            analytics: true,
            marketing: true,
            personalization: true,
            updatedAt: new Date().toISOString(),
        });
    };

    const toggle = (key: keyof CookiePreferences) => {
        if (key === 'essential') return; // Cannot disable essential cookies
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 text-black">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
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
                                    <div className="w-10 h-10 rounded-2xl bg-[#4A90E2]/10 text-[#4A90E2] flex items-center justify-center">
                                        <Cookie size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-heading font-black text-xl tracking-tight">Cookie Preferences</h3>
                                        <p className="text-xs text-gray-400 font-medium">Control how Muncheez respects your privacy</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                >
                                    <X size={16} className="text-gray-500" />
                                </button>
                            </div>

                            {savedSuccess ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="py-12 text-center space-y-3"
                                >
                                    <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-100">
                                        <Check size={28} />
                                    </div>
                                    <h4 className="font-bold text-lg text-gray-900">Preferences Saved</h4>
                                    <p className="text-xs text-gray-500 max-w-xs mx-auto">Your cookie choices have been persisted across reloads.</p>
                                </motion.div>
                            ) : (
                                <>
                                    <div className="space-y-4 mb-8">
                                        {/* Essential */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="flex items-start gap-3">
                                                <Lock size={18} className="text-gray-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-gray-900">Essential Cookies</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Required</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Necessary for authentication, checkout, and security protocols.</p>
                                                </div>
                                            </div>
                                            <div className="w-12 h-6 bg-[#4A90E2] rounded-full p-1 flex items-center justify-end shrink-0 cursor-not-allowed opacity-80">
                                                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                            </div>
                                        </div>

                                        {/* Analytics */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div>
                                                <span className="text-xs font-bold text-gray-900">Performance & Analytics</span>
                                                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Helps us optimize delivery routes and application speed.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => toggle('analytics')}
                                                className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors shrink-0 ${preferences.analytics ? 'bg-[#4A90E2] justify-end' : 'bg-gray-200 justify-start'}`}
                                            >
                                                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                            </button>
                                        </div>

                                        {/* Personalization */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div>
                                                <span className="text-xs font-bold text-gray-900">Personalization</span>
                                                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Remembers your favorite stores and dietary preferences.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => toggle('personalization')}
                                                className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors shrink-0 ${preferences.personalization ? 'bg-[#4A90E2] justify-end' : 'bg-gray-200 justify-start'}`}
                                            >
                                                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                            </button>
                                        </div>

                                        {/* Marketing */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div>
                                                <span className="text-xs font-bold text-gray-900">Marketing & Promotions</span>
                                                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Allows curated promotional offers and merchant discounts.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => toggle('marketing')}
                                                className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors shrink-0 ${preferences.marketing ? 'bg-[#4A90E2] justify-end' : 'bg-gray-200 justify-start'}`}
                                            >
                                                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleAcceptAll}
                                            className="flex-1 py-3.5 px-4 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
                                        >
                                            Accept All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSave()}
                                            className="flex-1 py-3.5 px-4 bg-gray-100 text-gray-900 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all border border-gray-200"
                                        >
                                            Save Custom
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
