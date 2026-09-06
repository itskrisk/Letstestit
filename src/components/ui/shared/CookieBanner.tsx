import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, ShieldCheck } from 'lucide-react';
import CookieModal from './CookieModal';

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('muncheez_cookie_preferences');
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 1200);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        const preferences = {
            essential: true,
            analytics: true,
            marketing: true,
            personalization: true,
            updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('muncheez_cookie_preferences', JSON.stringify(preferences));
        const maxAge = 31536000;
        document.cookie = `muncheez_essential=true; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `muncheez_analytics=true; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `muncheez_marketing=true; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `muncheez_personalization=true; path=/; max-age=${maxAge}; SameSite=Lax`;

        window.dispatchEvent(new CustomEvent('muncheez_cookies_updated', { detail: preferences }));
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                        className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[55] bg-black/95 text-white backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl"
                    >
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-2.5 bg-[#4A90E2]/20 text-[#4A90E2] rounded-2xl shrink-0">
                                <Cookie size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold tracking-tight">We value your privacy</h4>
                                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                                    We use essential cookies to maintain security and personalized delivery preferences across Nairobi.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="text-white/40 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAcceptAll}
                                className="flex-1 py-2.5 px-4 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#4A90E2] hover:text-white transition-all shadow-md"
                            >
                                Accept All
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="py-2.5 px-4 bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all border border-white/10"
                            >
                                Customize
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <CookieModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setIsVisible(false);
                }}
            />
        </>
    );
}
