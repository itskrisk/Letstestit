import { useState, useEffect } from 'react';
import {
    Save,
    Building2,
    Clock,
    Wallet,
    Bell,
    Utensils,
    ShoppingBasket,
    Stethoscope,
    UploadCloud,
    CheckCircle2,
    Store
} from 'lucide-react';
import { Merchant } from '../../types/schema';

interface SettingsViewProps {
    merchant: Merchant;
    onUpdate: (id: string, settings: Partial<Merchant>) => void;
}

type Tab = 'general' | 'operations' | 'finance' | 'notifications' | 'sector';

export default function SettingsView({ merchant, onUpdate }: SettingsViewProps) {
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [formData, setFormData] = useState<Partial<Merchant>>({ ...merchant });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData({ ...merchant });
    }, [merchant]);

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        onUpdate(merchant.id, formData);
        setIsSaving(false);
    };

    const updateCustomSetting = (key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            customSettings: {
                ...prev.customSettings,
                [key]: value
            }
        }));
    };

    const getSectorIcon = () => {
        switch (merchant.type) {
            case 'Restaurant': return Utensils;
            case 'Supermarket': return ShoppingBasket;
            case 'Pharmacy': return Stethoscope;
            default: return Store;
        }
    };
    const SectorIcon = getSectorIcon();

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: 'general', label: 'General', icon: Building2 },
        { id: 'operations', label: 'Operations', icon: Clock },
        { id: 'finance', label: 'Finance', icon: Wallet },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'sector', label: `${merchant.type} Settings`, icon: SectorIcon },
    ];

    return (
        <div className="space-y-6 md:space-y-10 pb-20 md:pb-0">
            {/* Header - Adaptive Layout */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 border-b border-black/10 pb-6 md:pb-8">
                <div>
                    <h2 className="text-3xl md:text-4xl font-heading font-light tracking-tight text-black">
                        Store Settings<span className="text-[#D4AF37]">.</span>
                    </h2>
                    <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-2">
                        Manage your {merchant.type} configuration
                    </p>
                </div>

                {/* Desktop Save Button */}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="hidden md:flex items-center gap-2 px-8 py-3 bg-black text-white hover:bg-[#D4AF37] hover:text-black transition-colors rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                    <Save size={16} />
                </button>
            </div>

            {/* Mobile Tab Navigation (Horizontal Scroll Pills) */}
            <div className="flex md:hidden overflow-x-auto gap-2 pb-2 scrollbar-hide">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all border ${isActive
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-gray-500 border-gray-200'
                                }`}
                        >
                            <Icon size={14} className={isActive ? 'text-[#D4AF37]' : ''} />
                            <span className="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Desktop Tab Navigation (Traditional Tabs) */}
            <div className="hidden md:flex gap-2 border-b border-gray-100">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${isActive
                                ? 'border-black text-black'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Icon size={16} className={isActive ? 'text-[#D4AF37]' : ''} />
                            <span className="text-xs font-bold uppercase tracking-widest">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content Container - No Card styling on Mobile to prevent squashing */}
            <div className="md:bg-white md:p-10 md:rounded-3xl md:border md:border-gray-100 md:shadow-sm min-h-[400px]">

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <div className="space-y-8 max-w-5xl">
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-lg font-heading font-bold flex items-center gap-2">
                                    <Building2 size={20} /> Business Profile
                                </h3>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Business Name</label>
                                    <input
                                        value={formData.businessName}
                                        onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                        className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl font-heading font-bold text-lg outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5 transition-all min-h-[120px]"
                                        placeholder="Tell customers about your business..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-heading font-bold flex items-center gap-2">
                                    <UploadCloud size={20} /> Branding
                                </h3>
                                <div className="p-8 border-2 border-dashed border-gray-200 bg-white md:bg-transparent rounded-2xl flex flex-col items-center justify-center text-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                                        <UploadCloud className="text-gray-400 w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">Upload Logo</div>
                                        <div className="text-xs text-gray-400 mt-1">PNG, JPG (Max 2MB)</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-gray-100 my-8"></div>

                        <section className="space-y-6">
                            <h3 className="text-lg font-heading font-bold">Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Owner Name</label>
                                    <input
                                        value={formData.ownerName}
                                        onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                                        className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Contact Email</label>
                                    <input
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Phone Number</label>
                                    <input
                                        value={formData.ownerPhone}
                                        onChange={e => setFormData({ ...formData, ownerPhone: e.target.value })}
                                        className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl outline-none"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* OPERATIONS TAB */}
                {activeTab === 'operations' && (
                    <div className="space-y-8 max-w-5xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-lg font-heading font-bold flex items-center gap-2">
                                    <Clock size={20} /> Operating Hours
                                </h3>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Daily Schedule</label>
                                    <input
                                        value={formData.operatingHours || '08:00 AM - 09:00 PM'}
                                        onChange={e => setFormData({ ...formData, operatingHours: e.target.value })}
                                        className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl outline-none font-mono text-sm"
                                        placeholder="e.g. 08:00 AM - 10:00 PM"
                                    />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-lg font-heading font-bold flex items-center gap-2">
                                    <Store size={20} /> Location & Delivery
                                </h3>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Store Address</label>
                                    <input
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl outline-none text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Delivery Fee</label>
                                        <input
                                            type="number"
                                            value={formData.deliveryFee}
                                            onChange={e => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
                                            className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl outline-none font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Radius (KM)</label>
                                        <input
                                            type="number"
                                            value={5}
                                            disabled
                                            className="w-full p-4 bg-gray-100 text-gray-400 rounded-xl outline-none font-bold cursor-not-allowed text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* FINANCE TAB */}
                {activeTab === 'finance' && (
                    <div className="space-y-8 max-w-5xl">
                        <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-6 rounded-2xl flex items-start gap-4">
                            <div className="p-3 bg-[#D4AF37]/10 rounded-full text-[#D4AF37] shrink-0">
                                <Wallet size={24} />
                            </div>
                            <div>
                                <h4 className="text-[#D4AF37] font-bold text-lg mb-1">M-Pesa Integration Active</h4>
                                <p className="text-sm text-[#D4AF37]/80 leading-relaxed">
                                    Payments are automatically routed to your provided Till/Paybill number.
                                    Settlements occur daily at midnight.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-lg font-heading font-bold">Payment Details</h3>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">M-Pesa Business Shortcode</label>
                                    <input
                                        value={formData.mpesaTillNumber || formData.mpesaShortcode}
                                        onChange={e => setFormData({ ...formData, mpesaTillNumber: e.target.value })}
                                        className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl outline-none font-mono text-lg tracking-widest font-bold"
                                        placeholder="123456"
                                    />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-lg font-heading font-bold">Compliance</h3>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">KRA PIN</label>
                                    <input
                                        value={formData.kraPin}
                                        onChange={e => setFormData({ ...formData, kraPin: e.target.value })}
                                        className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl outline-none font-mono font-bold uppercase"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        value={formData.taxRate || 16}
                                        onChange={e => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                                        className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl outline-none font-bold"
                                        placeholder="16"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* NOTIFICATIONS TAB */}
                {activeTab === 'notifications' && (
                    <div className="space-y-8 max-w-3xl">
                        <section className="space-y-6">
                            <h3 className="text-lg font-heading font-bold flex items-center gap-2">
                                <Bell size={20} /> Alert Preferences
                            </h3>

                            <div className="p-4 bg-white md:bg-transparent border border-gray-100 md:border-gray-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="font-bold">Email Notifications</div>
                                    <div className="text-xs text-gray-400">Receive weekly reports and critical alerts</div>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter email..."
                                    value={formData.notificationEmail || formData.email}
                                    onChange={e => setFormData({ ...formData, notificationEmail: e.target.value })}
                                    className="border-none bg-gray-50 p-3 rounded-lg text-right outline-none text-sm w-full md:w-auto"
                                />
                            </div>

                            <div className="p-4 bg-white md:bg-transparent border border-gray-100 md:border-gray-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="font-bold">SMS Orders</div>
                                    <div className="text-xs text-gray-400">Receive instant SMS for new orders (KES 2.00/sms)</div>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter phone..."
                                    value={formData.notificationPhone || formData.ownerPhone}
                                    onChange={e => setFormData({ ...formData, notificationPhone: e.target.value })}
                                    className="border-none bg-gray-50 p-3 rounded-lg text-right outline-none text-sm w-full md:w-auto"
                                />
                            </div>
                        </section>
                    </div>
                )}

                {/* SECTOR SPECIFIC TAB */}
                {activeTab === 'sector' && (
                    <div className="space-y-8 max-w-5xl">
                        {/* RESTAURANT SETTINGS */}
                        {merchant.type === 'Restaurant' && (
                            <section className="space-y-6">
                                <h3 className="text-lg font-heading font-bold flex items-center gap-2">
                                    <Utensils size={20} /> Kitchen Configuration
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Avg. Prep Time (Minutes)</label>
                                        <input
                                            type="number"
                                            value={formData.customSettings?.kitchenPrepTimeMin || 20}
                                            onChange={e => updateCustomSetting('kitchenPrepTimeMin', Number(e.target.value))}
                                            className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl outline-none font-bold text-lg"
                                        />
                                        <p className="text-[10px] text-gray-400">Used to calculate estimated delivery time.</p>
                                    </div>
                                    <div className="p-4 bg-white md:bg-transparent border border-gray-100 md:border-gray-200 rounded-xl flex items-center justify-between">
                                        <div>
                                            <div className="font-bold">Cutlery Request</div>
                                            <div className="text-xs text-gray-400">Ask customers if they need cutlery?</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={formData.customSettings?.cutleryRequired || false}
                                            onChange={e => updateCustomSetting('cutleryRequired', e.target.checked)}
                                            className="w-6 h-6 accent-black"
                                        />
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* PHARMACY SETTINGS */}
                        {merchant.type === 'Pharmacy' && (
                            <section className="space-y-6">
                                <h3 className="text-lg font-heading font-bold flex items-center gap-2">
                                    <Stethoscope size={20} /> Compliance & Safety
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pharmacist on Duty</label>
                                        <input
                                            value={formData.customSettings?.pharmacistName || ''}
                                            onChange={e => updateCustomSetting('pharmacistName', e.target.value)}
                                            className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl outline-none font-bold"
                                            placeholder="Dr. Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">License Number</label>
                                        <input
                                            value={formData.customSettings?.licenseNumber || ''}
                                            onChange={e => updateCustomSetting('licenseNumber', e.target.value)}
                                            className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl outline-none font-mono uppercase"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 p-6 border border-blue-100 bg-blue-50 rounded-xl flex items-start md:items-center gap-4">
                                        <CheckCircle2 className="text-blue-500 shrink-0" />
                                        <div>
                                            <div className="font-bold text-blue-900 text-lg">Insurance Integration Active</div>
                                            <div className="text-sm text-blue-700 mt-1">Accepting Jubilee, AAR, and Britam direct billing.</div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* SUPERMARKET SETTINGS */}
                        {merchant.type === 'Supermarket' && (
                            <section className="space-y-6">
                                <h3 className="text-lg font-heading font-bold flex items-center gap-2">
                                    <ShoppingBasket size={20} /> Inventory Control
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Low Stock Alert Threshold</label>
                                        <input
                                            type="number"
                                            value={formData.customSettings?.lowStockThreshold || 10}
                                            onChange={e => updateCustomSetting('lowStockThreshold', Number(e.target.value))}
                                            className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl outline-none font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Max Bulk Purchase Qty</label>
                                        <input
                                            type="number"
                                            value={formData.customSettings?.bulkPurchaseLimit || 50}
                                            onChange={e => updateCustomSetting('bulkPurchaseLimit', Number(e.target.value))}
                                            className="w-full p-4 bg-white md:bg-gray-50 border border-gray-100 md:border-transparent rounded-xl outline-none font-bold"
                                        />
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Save Button (Inline) */}
            <div className="md:hidden pt-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-black text-white hover:bg-[#D4AF37] hover:text-black transition-colors rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 shadow-lg"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                    <Save size={16} />
                </button>
            </div>
        </div>
    );
}
