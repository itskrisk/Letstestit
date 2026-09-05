import { useState, useEffect } from 'react';
import { socialService } from '../../lib/socialService';
import { PrivacySettings } from '../../types/social';
import { motion } from 'framer-motion';

const SocialSettings = () => {
    const [settings, setSettings] = useState<PrivacySettings | null>(null);

    useEffect(() => {
        setSettings(socialService.getPrivacySettings());
    }, []);

    const handleChange = (key: keyof PrivacySettings, value: any) => {
        if (!settings) return;
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        socialService.updatePrivacySettings(newSettings);
    };

    if (!settings) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-10 border border-black/5 shadow-sm"
        >
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] w-8 bg-black/10" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-black/40">Control Panel</span>
                </div>
                <h2 className="text-3xl font-heading font-light text-gray-900 tracking-tight">Privacy Settings</h2>
                <p className="text-sm text-gray-500 font-light mt-2">Manage your social visibility and interactions.</p>
            </div>

            <div className="space-y-5">
                {/* Order Visibility */}
                <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-black/5">
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">Share Order History</h4>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Friends can see what you buy</p>
                    </div>
                    <button
                        onClick={() => handleChange('shareOrdersWithFriends', !settings.shareOrdersWithFriends)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${settings.shareOrdersWithFriends ? 'bg-[#4A90E2]' : 'bg-gray-200'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.shareOrdersWithFriends ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                {/* Gifting */}
                <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-black/5">
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">Allow Surprise Gifts</h4>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Friends can send you food treats</p>
                    </div>
                    <button
                        onClick={() => handleChange('allowSurpriseGifts', !settings.allowSurpriseGifts)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${settings.allowSurpriseGifts ? 'bg-[#4A90E2]' : 'bg-gray-200'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.allowSurpriseGifts ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                {/* Masked Address */}
                <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-black/5">
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">Anonymize Location</h4>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Show "home#1" instead of address</p>
                    </div>
                    <button
                        onClick={() => handleChange('showMaskedAddress', !settings.showMaskedAddress)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${settings.showMaskedAddress ? 'bg-[#4A90E2]' : 'bg-gray-200'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.showMaskedAddress ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                {/* Visibility Level */}
                <div className="pt-6 border-t border-black/5">
                    <label className="text-[9px] text-gray-400 font-black uppercase tracking-[0.3em] mb-4 block">Visibility Level</label>
                    <div className="grid grid-cols-3 gap-3">
                        {['all_friends', 'selective', 'private'].map((level) => (
                            <button
                                key={level}
                                onClick={() => handleChange('visibilityLevel', level)}
                                className={`py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${settings.visibilityLevel === level
                                        ? 'bg-black text-white border-black shadow-sm'
                                        : 'bg-white text-gray-400 border-black/10 hover:border-black/20'
                                    }`}
                            >
                                {level.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-[#4A90E2]/5 border border-[#4A90E2]/10 rounded-2xl p-5 flex gap-4 items-start mt-8">
                    <div className="text-2xl">🛡️</div>
                    <p className="text-[11px] text-gray-600 leading-relaxed font-light">
                        Muncheez uses end-to-end address masking. Even if you allow gifting, your friends never see your actual street address or floor number.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default SocialSettings;
