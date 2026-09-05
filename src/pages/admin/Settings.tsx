import { useState } from 'react';
import {
    Shield,
    Bell,
    Globe,
    Scale,
    Users,
    Save,
    RefreshCcw,
    Power,
    Server,
    Database,
    ChevronRight,
    ArrowRight,
    Smartphone
} from 'lucide-react';

export default function Settings() {
    const [isSiteLive, setIsSiteLive] = useState(true);
    const [newSignups, setNewSignups] = useState(true);

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-3">
                        System Control <span className="text-xs bg-black text-white px-2 py-1 rounded-full">v1.0.4</span>
                    </h1>
                    <p className="text-sm text-gray-400 font-medium">Core protocol management & global overrides</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 bg-white border border-gray-100 shadow-sm rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
                        <RefreshCcw size={18} /> Sync Registry
                    </button>
                    <button className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 shadow-lg shadow-black/10 transition-all flex items-center gap-2">
                        <Save size={18} /> Push Changes
                    </button>
                </div>
            </div>

            {/* Quick Overrides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <OverrideCard
                    label="Core Availability"
                    desc="Master switch for the entire Muncheez network"
                    active={isSiteLive}
                    onToggle={() => setIsSiteLive(!isSiteLive)}
                    icon={Power}
                />
                <OverrideCard
                    label="Merchant Intake"
                    desc="Enable/Disable new partner registration"
                    active={newSignups}
                    onToggle={() => setNewSignups(!newSignups)}
                    icon={Users}
                />
                <OverrideCard
                    label="Maintenance Mode"
                    desc="Display maintenance screen to all users"
                    active={false}
                    onToggle={() => { }}
                    icon={Server}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-1 space-y-2">
                    <SettingsTab label="General Environment" active={true} icon={Globe} />
                    <SettingsTab label="Security & Access" icon={Shield} />
                    <SettingsTab label="Financial Rules" icon={Scale} />
                    <SettingsTab label="Push & Webhooks" icon={Bell} />
                    <SettingsTab label="Data Management" icon={Database} />
                    <SettingsTab label="API & Integrations" icon={Smartphone} />
                </div>

                {/* Form Area */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-10 border-b border-gray-50 bg-gray-50/20">
                        <h3 className="text-xl font-black tracking-tight italic uppercase">General Environment</h3>
                        <p className="text-sm text-gray-400 font-medium mt-1">Configure global operational parameters</p>
                    </div>

                    <div className="p-10 space-y-10">
                        <section className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Operational Constants</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Default Delivery Fee (KES)</label>
                                    <input type="number" defaultValue="150" className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] text-sm font-bold focus:bg-white focus:border-black/5 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Platform Commission (%)</label>
                                    <input type="number" defaultValue="15" className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] text-sm font-bold focus:bg-white focus:border-black/5 outline-none transition-all" />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Regional Branding</h4>
                            <div className="space-y-4">
                                <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center justify-between group cursor-pointer hover:bg-black hover:text-white transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center font-black group-hover:bg-white/10 group-hover:text-white transition-colors">
                                            KE
                                        </div>
                                        <div>
                                            <p className="font-black text-lg">Nairobi, Kenya</p>
                                            <p className="text-xs opacity-50 font-medium">Primary Operational Zone</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-300 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </section>

                        <div className="p-10 bg-[#D4AF37] rounded-[3rem] text-black space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-black/5 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="relative z-10">
                                <h4 className="text-xl font-black italic uppercase">Superuser Access</h4>
                                <p className="text-sm font-bold opacity-60 mt-1">You are Currently Authenticated as Root Admin</p>
                                <button className="mt-8 px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg flex items-center gap-3">
                                    Manage Admin Team <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function OverrideCard({ label, desc, active, onToggle, icon: Icon }: any) {
    return (
        <div className={`p-8 rounded-[2.5rem] border transition-all ${active ? 'bg-white border-black/5 bg-gradient-to-br from-white to-gray-50 shadow-xl' : 'bg-gray-50 border-transparent opacity-60'}`}>
            <div className="flex justify-between items-start mb-8">
                <div className={`p-4 rounded-2xl ${active ? 'bg-black text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`}>
                    <Icon size={24} />
                </div>
                <button
                    onClick={onToggle}
                    className={`w-14 h-8 rounded-full relative transition-colors duration-500 ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-500 ${active ? 'left-7' : 'left-1'}`} />
                </button>
            </div>
            <h3 className="text-xl font-black tracking-tight italic uppercase mb-2">{label}</h3>
            <p className="text-xs font-medium text-gray-400 leading-relaxed">{desc}</p>
        </div>
    );
}

function SettingsTab({ label, active = false, icon: Icon }: any) {
    return (
        <div className={`p-6 rounded-[1.5rem] border transition-all cursor-pointer flex items-center justify-between group ${active ? 'bg-black text-white border-black shadow-xl' : 'bg-white border-gray-50 text-gray-400 hover:border-gray-200'}`}>
            <div className="flex items-center gap-4">
                <Icon size={20} className={active ? 'text-[#D4AF37]' : 'group-hover:text-black transition-colors'} />
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            {active && <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />}
        </div>
    );
}
