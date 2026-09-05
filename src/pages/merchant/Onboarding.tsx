import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Clock,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    FileSpreadsheet,
    UtensilsCrossed,
    Smartphone,
    CreditCard,
    Store
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { parseInventoryCSV, CSVParseResult } from "../../utils/csvParser";
// Types mimicking the Architecture
type OnboardingStep = 'BUSINESS' | 'INVENTORY' | 'FINANCE' | 'REVIEW';
type MerchantType = 'Restaurant' | 'Supermarket' | 'Pharmacy' | 'Water';

export default function MerchantOnboarding() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('BUSINESS');
    const [merchantType, setMerchantType] = useState<MerchantType>('Restaurant'); // Should come from Signup

    // Step 1: Business Data
    const [businessData, setBusinessData] = useState({
        description: '',
        location: '',
        hours: '',
        branchName: ''
    });

    // Step 2: Inventory Data (Supermarket)
    const [importResult, setImportResult] = useState<CSVParseResult | null>(null);
    const [isParsing, setIsParsing] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        const result = await parseInventoryCSV(file);
        setImportResult(result);
        setIsParsing(false);
    };

    const updateBusinessData = (key: string, value: string) => {
        setBusinessData(prev => ({ ...prev, [key]: value }));
    };

    const nextStep = (target: OnboardingStep) => {
        setCurrentStep(target);
        window.scrollTo(0, 0);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 py-6 px-8 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-xl tracking-tighter text-black">
                        Muncheez<span className="text-[#D4AF37]">.</span>
                    </span>
                    <span className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                        Partner Setup
                    </span>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-2">
                    {['BUSINESS', 'INVENTORY', 'FINANCE', 'REVIEW'].map((step, i) => (
                        <div key={step} className={`h-1 w-8 rounded-full transition-colors ${['BUSINESS', 'INVENTORY', 'FINANCE', 'REVIEW'].indexOf(currentStep) >= i
                            ? 'bg-[#D4AF37]'
                            : 'bg-gray-200'
                            }`} />
                    ))}
                </div>
            </div>

            <main className="flex-1 max-w-4xl mx-auto w-full p-8">
                <AnimatePresence mode='wait'>

                    {/* STEP 1: BUSINESS SETUP */}
                    {currentStep === 'BUSINESS' && (
                        <motion.div
                            key="business"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div>
                                <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">Tell us about your business</h1>
                                <p className="text-gray-500">Let customers know who you are and where to find you.</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                                {/* Merchant Type Selector (For Demo Context) */}
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Simulating Merchant Type:</label>
                                    <div className="flex gap-4">
                                        {['Restaurant', 'Supermarket', 'Pharmacy', 'Water'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setMerchantType(type as MerchantType)}
                                                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors ${merchantType === type ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-500'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-700">
                                            <MapPin size={14} /> Location / Branch Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Westlands Branch"
                                            value={businessData.branchName}
                                            onChange={(e) => updateBusinessData('branchName', e.target.value)}
                                            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black outline-none font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-700">
                                            <Clock size={14} /> Opening Hours
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 08:00 AM - 10:00 PM"
                                            value={businessData.hours}
                                            onChange={(e) => updateBusinessData('hours', e.target.value)}
                                            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black outline-none font-medium"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-700">
                                            <Store size={14} /> Description
                                        </label>
                                        <textarea
                                            placeholder="Briefly describe your business..."
                                            value={businessData.description}
                                            onChange={(e) => updateBusinessData('description', e.target.value)}
                                            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black outline-none font-medium h-32"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button onClick={() => nextStep('INVENTORY')} className="px-8 py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#D4AF37] hover:text-black transition-colors">
                                    Continue to Inventory <ChevronRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: INVENTORY (POLYMORPHIC) */}
                    {currentStep === 'INVENTORY' && (
                        <motion.div
                            key="inventory"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div>
                                <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">
                                    {merchantType === 'Restaurant' ? 'Build your Menu' : 'Stock your Shelves'}
                                </h1>
                                <p className="text-gray-500">
                                    {merchantType === 'Restaurant'
                                        ? 'Add your best sellers first. You can add the rest later.'
                                        : 'Upload your inventory in bulk or start with a few items.'}
                                </p>
                            </div>

                            {/* POLYMORPHIC CONTENT */}
                            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm min-h-[400px]">

                                {/* 🍔 RESTAURANT FLOW */}
                                {merchantType === 'Restaurant' && (
                                    <div className="text-center py-12 space-y-6">
                                        <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto text-[#D4AF37]">
                                            <UtensilsCrossed size={40} />
                                        </div>
                                        <h3 className="text-2xl font-heading font-bold">Manual Menu Builder</h3>
                                        <p className="max-w-md mx-auto text-gray-500">Create categories (e.g., "Starters", "Mains") and add items with photos and prices.</p>

                                        <button className="px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all w-full max-w-sm mx-auto flex items-center justify-center gap-3 group">
                                            <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:text-black transition-colors">+</span>
                                            <span className="font-bold text-gray-600 group-hover:text-black uppercase tracking-wider text-sm">Add First Item</span>
                                        </button>
                                    </div>
                                )}

                                {/* 🛒 SUPERMARKET / RETAIL FLOW */}
                                {['Supermarket', 'Pharmacy', 'Water'].includes(merchantType) && (
                                    <div className="space-y-8">
                                        {!importResult ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Option A: CSV Import */}
                                                <label className="border border-gray-200 rounded-xl p-6 hover:border-black transition-colors cursor-pointer group relative">
                                                    <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-700 mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                                        <FileSpreadsheet size={24} />
                                                    </div>
                                                    <h3 className="font-bold text-lg mb-2">Bulk Import via CSV</h3>
                                                    <p className="text-sm text-gray-500 mb-6">Best for catalogs with 50+ items. Upload your inventory file.</p>
                                                    {isParsing ? (
                                                        <span className="text-green-600 text-xs font-bold uppercase tracking-widest animate-pulse">Analyzing...</span>
                                                    ) : (
                                                        <span className="text-green-600 text-xs font-bold uppercase tracking-widest group-hover:underline">Select File</span>
                                                    )}
                                                </label>

                                                {/* Option B: Manual */}
                                                <div className="border border-gray-200 rounded-xl p-6 hover:border-black transition-colors cursor-pointer group">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 mb-4 group-hover:bg-black group-hover:text-white transition-colors">
                                                        <Store size={24} />
                                                    </div>
                                                    <h3 className="font-bold text-lg mb-2">Add Manually</h3>
                                                    <p className="text-sm text-gray-500 mb-6">Start small. Add your top 20 items one by one.</p>
                                                    <span className="text-gray-900 text-xs font-bold uppercase tracking-widest group-hover:underline">Start Adding</span>
                                                </div>
                                            </div>
                                        ) : (
                                            // IMPORT PREVIEW
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                                            {importResult.success ? <CheckCircle2 className="text-green-500" /> : <Clock className="text-red-500" />}
                                                            Import Analysis
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            Found {importResult.summary.validRows} valid items out of {importResult.summary.totalRows} rows.
                                                        </p>
                                                    </div>
                                                    <button onClick={() => setImportResult(null)} className="text-xs font-bold uppercase hover:underline">Reset</button>
                                                </div>

                                                {/* Error Report */}
                                                {importResult.errors.length > 0 && (
                                                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-800 text-sm max-h-32 overflow-y-auto">
                                                        <p className="font-bold mb-2">Issues Found:</p>
                                                        <ul className="list-disc pl-4 space-y-1">
                                                            {importResult.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Preview Table */}
                                                <div className="border rounded-lg overflow-hidden">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                                                            <tr>
                                                                <th className="p-3">SKU</th>
                                                                <th className="p-3">Name</th>
                                                                <th className="p-3">Stock</th>
                                                                <th className="p-3 text-right">Price</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {importResult.products.slice(0, 5).map((p: any, i: number) => (
                                                                <tr key={i} className="hover:bg-gray-50">
                                                                    <td className="p-3 font-mono text-xs">{p.sku}</td>
                                                                    <td className="p-3">{p.name}</td>
                                                                    <td className="p-3">{p.stockLevel}</td>
                                                                    <td className="p-3 text-right">KES {p.price?.toLocaleString()}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    {importResult.products.length > 5 && (
                                                        <div className="p-2 text-center text-xs text-gray-400 bg-gray-50 border-t">
                                                            + {importResult.products.length - 5} more items
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex justify-end pt-4">
                                                    <button className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-green-700 transition-colors">
                                                        Confirm & Import {importResult.products.length} Items
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between">
                                <button onClick={() => nextStep('BUSINESS')} className="text-gray-400 hover:text-black font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                    <ChevronLeft size={14} /> Back
                                </button>
                                <button onClick={() => nextStep('FINANCE')} className="px-8 py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#D4AF37] hover:text-black transition-colors">
                                    Setup Payments <ChevronRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: PAYMENTS (M-PESA) */}
                    {currentStep === 'FINANCE' && (
                        <motion.div
                            key="finance"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div>
                                <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">Get Paid</h1>
                                <p className="text-gray-500">Secure M-Pesa settlement for your business.</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-8">

                                <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
                                    <div className="p-2 bg-white rounded-full text-green-600 shadow-sm"><Smartphone size={20} /></div>
                                    <div>
                                        <h4 className="font-bold text-green-900 text-sm uppercase tracking-wide">M-Pesa Verification</h4>
                                        <p className="text-xs text-green-700 mt-1">We will send a test transaction of KES 1.00 to verify ownership.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-700">Settlement Method</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button className="p-4 border-2 border-black bg-black text-white rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs">
                                                <Smartphone size={16} /> M-Pesa Till / Paybill
                                            </button>
                                            <button className="p-4 border border-gray-200 text-gray-400 rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs hover:border-gray-400">
                                                <CreditCard size={16} /> Bank Transfer
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-700">Business Shortcode (Till/Paybill)</label>
                                            <input type="text" placeholder="e.g. 882292" className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black outline-none font-medium font-mono" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-700">Phone Number (Owner)</label>
                                            <input type="text" placeholder="07..." className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black outline-none font-medium font-mono" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button onClick={() => nextStep('INVENTORY')} className="text-gray-400 hover:text-black font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                    <ChevronLeft size={14} /> Back
                                </button>
                                <button onClick={() => nextStep('REVIEW')} className="px-8 py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#D4AF37] hover:text-black transition-colors">
                                    Review Application <ChevronRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: REVIEW / SUCCESS */}
                    {currentStep === 'REVIEW' && (
                        <motion.div
                            key="review"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-12 rounded-2xl shadow-xl text-center max-w-lg mx-auto border-t-4 border-[#D4AF37]"
                        >
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-6">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">Application Received</h2>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                Your shop <strong>"{businessData.branchName || 'Westlands Branch'}"</strong> is now under review. We typically verify M-Pesa details within 24 hours.
                            </p>

                            <div className="space-y-3">
                                <button onClick={() => navigate('/partner/dashboard')} className="w-full py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-colors">
                                    Go to Dashboard
                                </button>
                                <p className="text-xs text-gray-400">You can explore the dashboard while we verify.</p>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
}

