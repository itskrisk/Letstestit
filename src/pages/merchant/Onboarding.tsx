import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Clock,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Smartphone,
    Store,
    Upload,
    FileText,
    Shield,
    AlertCircle,
    Building2,
    Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

type OnboardingStep = 'BUSINESS' | 'FINANCE' | 'DOCUMENTS' | 'REVIEW';
type MerchantType = 'Restaurant' | 'Supermarket' | 'Pharmacy' | 'Bakery & Pastry' | 'Groceries & Fresh Produce' | 'Liquor & Beverages';

export default function MerchantOnboarding({ onComplete }: { onComplete?: () => void }) {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('BUSINESS');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Business Data
    const [businessData, setBusinessData] = useState({
        businessName: '',
        type: 'Restaurant' as MerchantType,
        address: '',
        buildingBranch: '',
        hours: '08:00 AM - 10:00 PM',
        description: '',
        phone: profile?.phone || ''
    });

    // Finance Data
    const [financeData, setFinanceData] = useState({
        mpesaTill: '',
        kraPin: ''
    });

    // Documents
    const [documents, setDocuments] = useState<{
        businessPermitFile: File | null;
        kraPinFile: File | null;
        healthPermitFile: File | null;
    }>({
        businessPermitFile: null,
        kraPinFile: null,
        healthPermitFile: null
    });

    const updateBusiness = (key: string, value: string) => {
        setBusinessData(prev => ({ ...prev, [key]: value }));
        setError(null);
    };

    const updateFinance = (key: string, value: string) => {
        setFinanceData(prev => ({ ...prev, [key]: value }));
        setError(null);
    };

    const uploadFile = async (file: File, path: string): Promise<string> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, file, { cacheControl: '3600', upsert: true });

            if (!uploadError) {
                const { data } = supabase.storage.from('documents').getPublicUrl(fileName);
                if (data?.publicUrl) return data.publicUrl;
            }
        } catch (e) {
            console.warn('Storage upload notice, fallback used:', e);
        }

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string || `https://placeholder.file/${file.name}`);
            reader.onerror = () => resolve(`https://placeholder.file/${file.name}`);
            reader.readAsDataURL(file);
        });
    };

    const handleSubmitKYC = async () => {
        if (!user?.id) {
            setError('User session not found. Please log in again.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let permitUrl = '';
            let kraUrl = '';
            let healthUrl = '';

            if (documents.businessPermitFile) {
                permitUrl = await uploadFile(documents.businessPermitFile, `merchants/${user.id}/permit`);
            }
            if (documents.kraPinFile) {
                kraUrl = await uploadFile(documents.kraPinFile, `merchants/${user.id}/kra`);
            }
            if (documents.healthPermitFile) {
                healthUrl = await uploadFile(documents.healthPermitFile, `merchants/${user.id}/health`);
            }

            const docPayload: any = {};
            if (permitUrl) docPayload.businessPermit = { url: permitUrl, filename: documents.businessPermitFile?.name, uploadedAt: new Date().toISOString() };
            if (kraUrl) docPayload.kraPin = { url: kraUrl, filename: documents.kraPinFile?.name, uploadedAt: new Date().toISOString() };
            if (healthUrl) docPayload.healthPermit = { url: healthUrl, filename: documents.healthPermitFile?.name, uploadedAt: new Date().toISOString() };

            const fullAddress = businessData.buildingBranch
                ? `${businessData.buildingBranch}, ${businessData.address}`
                : businessData.address;

            const { error: upsertError } = await supabase
                .from('merchants')
                .upsert({
                    id: user.id,
                    business_name: businessData.businessName || `${profile?.full_name || 'Partner'}'s Store`,
                    owner_name: profile?.full_name || user.email?.split('@')[0] || 'Owner',
                    phone: businessData.phone || profile?.phone || '',
                    email: user.email || '',
                    type: businessData.type,
                    address: fullAddress,
                    description: businessData.description,
                    mpesa_till: financeData.mpesaTill,
                    kra_pin: financeData.kraPin,
                    business_permit_url: permitUrl || null,
                    kra_pin_url: kraUrl || null,
                    health_permit_url: healthUrl || null,
                    documents: docPayload,
                    status: 'PENDING',
                    is_active: false
                }, { onConflict: 'id' });

            if (upsertError) throw upsertError;

            setCurrentStep('REVIEW');
            if (onComplete) onComplete();
        } catch (err: any) {
            console.error('Error submitting KYC:', err);
            setError(err.message || 'Failed to submit onboarding documents.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-sans flex flex-col">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-100 py-6 px-8 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-3">
                    <span className="font-heading font-black text-2xl tracking-tighter text-black">
                        Muncheez<span className="text-[#D4AF37]">.</span>
                    </span>
                    <span className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest rounded-full">
                        Glovo-Style Partner Setup
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                    {['BUSINESS', 'FINANCE', 'DOCUMENTS', 'REVIEW'].map((step, i) => (
                        <div
                            key={step}
                            className={`h-1.5 w-10 rounded-full transition-all duration-300 ${['BUSINESS', 'FINANCE', 'DOCUMENTS', 'REVIEW'].indexOf(currentStep) >= i
                                    ? 'bg-[#D4AF37]'
                                    : 'bg-gray-200'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Main Section */}
            <main className="flex-1 max-w-3xl mx-auto w-full p-6 md:p-10 flex flex-col justify-center">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold flex items-center gap-3">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {/* STEP 1: BUSINESS SETUP */}
                    {currentStep === 'BUSINESS' && (
                        <motion.div
                            key="business"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="space-y-8"
                        >
                            <div>
                                <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-900 tracking-tight">
                                    Store & Category Details
                                </h1>
                                <p className="text-gray-500 mt-2">
                                    Provide your legal business details, store branch address, and operating category.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
                                {/* Type Selector */}
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-3">
                                        Store Operating Category
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {([
                                            'Restaurant', 'Supermarket', 'Pharmacy',
                                            'Bakery & Pastry', 'Groceries & Fresh Produce', 'Liquor & Beverages'
                                        ] as MerchantType[]).map(t => (
                                            <button
                                                type="button"
                                                key={t}
                                                onClick={() => updateBusiness('type', t)}
                                                className={`py-3 px-3 text-xs font-bold uppercase tracking-wider rounded-xl border text-center transition-all ${businessData.type === t
                                                        ? 'bg-black text-white border-black shadow-md'
                                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                            Store / Business Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Swahili Plate Restaurant"
                                            value={businessData.businessName}
                                            onChange={e => updateBusiness('businessName', e.target.value)}
                                            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D4AF37] focus:bg-white outline-none font-medium transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                                City / Sub-County Area
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Westlands, Nairobi"
                                                value={businessData.address}
                                                onChange={e => updateBusiness('address', e.target.value)}
                                                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D4AF37] focus:bg-white outline-none font-medium transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                                Building / Branch Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Westgate Mall, 1st Floor"
                                                value={businessData.buildingBranch}
                                                onChange={e => updateBusiness('buildingBranch', e.target.value)}
                                                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D4AF37] focus:bg-white outline-none font-medium transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                                Operating Hours
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 08:00 AM - 10:00 PM"
                                                value={businessData.hours}
                                                onChange={e => updateBusiness('hours', e.target.value)}
                                                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D4AF37] focus:bg-white outline-none font-medium transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                                Dispatch Contact Phone
                                            </label>
                                            <input
                                                type="tel"
                                                placeholder="e.g. 0712 345 678"
                                                value={businessData.phone}
                                                onChange={e => updateBusiness('phone', e.target.value)}
                                                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D4AF37] focus:bg-white outline-none font-medium transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                            Store Description
                                        </label>
                                        <textarea
                                            placeholder="Authentic coastal cuisine, fresh seafood & natural fruit juices..."
                                            value={businessData.description}
                                            onChange={e => updateBusiness('description', e.target.value)}
                                            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D4AF37] focus:bg-white outline-none font-medium h-24 resize-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => {
                                        if (!businessData.businessName.trim() || !businessData.address.trim()) {
                                            setError('Please enter your store name and physical address.');
                                            return;
                                        }
                                        setCurrentStep('FINANCE');
                                    }}
                                    className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#D4AF37] hover:text-black transition-all flex items-center gap-2 shadow-lg"
                                >
                                    Continue to Financial & Tax Setup <ChevronRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: FINANCE & TAX */}
                    {currentStep === 'FINANCE' && (
                        <motion.div
                            key="finance"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="space-y-8"
                        >
                            <div>
                                <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-900 tracking-tight">
                                    Financial & Tax Settlement
                                </h1>
                                <p className="text-gray-500 mt-2">
                                    Enter your settlement M-Pesa Till number and KRA PIN for tax compliance.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                                    <Smartphone className="text-[#D4AF37] shrink-0" size={24} />
                                    <div className="text-xs text-amber-900">
                                        <p className="font-bold uppercase tracking-wider">Direct M-Pesa Settlement</p>
                                        <p className="text-amber-700 mt-0.5">Earnings are settled directly into your registered M-Pesa Till / Paybill number.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                            M-Pesa Till / Paybill Number
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 882910"
                                            value={financeData.mpesaTill}
                                            onChange={e => updateFinance('mpesaTill', e.target.value)}
                                            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D4AF37] focus:bg-white outline-none font-mono font-bold transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                            KRA PIN Number
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. A019283746Z"
                                            value={financeData.kraPin}
                                            onChange={e => updateFinance('kraPin', e.target.value)}
                                            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D4AF37] focus:bg-white outline-none font-mono font-bold uppercase transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => setCurrentStep('BUSINESS')}
                                    className="text-gray-400 hover:text-black font-bold uppercase tracking-widest text-xs flex items-center gap-2"
                                >
                                    <ChevronLeft size={16} /> Back
                                </button>
                                <button
                                    onClick={() => {
                                        if (!financeData.mpesaTill.trim()) {
                                            setError('Please enter your M-Pesa Till number.');
                                            return;
                                        }
                                        setCurrentStep('DOCUMENTS');
                                    }}
                                    className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#D4AF37] hover:text-black transition-all flex items-center gap-2 shadow-lg"
                                >
                                    Continue to Compliance Documents <ChevronRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: DOCUMENT UPLOADS */}
                    {currentStep === 'DOCUMENTS' && (
                        <motion.div
                            key="documents"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="space-y-8"
                        >
                            <div>
                                <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-900 tracking-tight">
                                    Upload Verification Documents
                                </h1>
                                <p className="text-gray-500 mt-2">
                                    Submit clear photos or PDFs of your Single Business Permit, KRA PIN, and Health Permit.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
                                {/* Single Business Permit */}
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-2">
                                        Single Business Permit (County Government)
                                    </label>
                                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-[#D4AF37] rounded-2xl cursor-pointer bg-gray-50/50 transition-all">
                                        <Building2 className="text-[#D4AF37] mb-1.5" size={26} />
                                        <span className="text-xs font-bold text-gray-700">
                                            {documents.businessPermitFile ? documents.businessPermitFile.name : 'Click to select Single Business Permit'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, or PDF up to 5MB</span>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            onChange={e => setDocuments(prev => ({ ...prev, businessPermitFile: e.target.files?.[0] || null }))}
                                        />
                                    </label>
                                </div>

                                {/* KRA PIN Certificate */}
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-2">
                                        KRA PIN Certificate
                                    </label>
                                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-[#D4AF37] rounded-2xl cursor-pointer bg-gray-50/50 transition-all">
                                        <Upload className="text-[#D4AF37] mb-1.5" size={26} />
                                        <span className="text-xs font-bold text-gray-700">
                                            {documents.kraPinFile ? documents.kraPinFile.name : 'Click to select KRA Certificate'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, or PDF up to 5MB</span>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            onChange={e => setDocuments(prev => ({ ...prev, kraPinFile: e.target.files?.[0] || null }))}
                                        />
                                    </label>
                                </div>

                                {/* Health Permit */}
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-2">
                                        County Food & Health Hygiene Permit
                                    </label>
                                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-[#D4AF37] rounded-2xl cursor-pointer bg-gray-50/50 transition-all">
                                        <FileText className="text-[#D4AF37] mb-1.5" size={26} />
                                        <span className="text-xs font-bold text-gray-700">
                                            {documents.healthPermitFile ? documents.healthPermitFile.name : 'Click to select Health Permit'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, or PDF up to 5MB</span>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            onChange={e => setDocuments(prev => ({ ...prev, healthPermitFile: e.target.files?.[0] || null }))}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => setCurrentStep('FINANCE')}
                                    className="text-gray-400 hover:text-black font-bold uppercase tracking-widest text-xs flex items-center gap-2"
                                >
                                    <ChevronLeft size={16} /> Back
                                </button>
                                <button
                                    onClick={handleSubmitKYC}
                                    disabled={loading}
                                    className="px-8 py-4 bg-[#D4AF37] text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-[#c49f27] transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Submit Store For Review <CheckCircle2 size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: REVIEW CONFIRMATION */}
                    {currentStep === 'REVIEW' && (
                        <motion.div
                            key="review"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-10 md:p-12 rounded-3xl shadow-xl text-center max-w-lg mx-auto border-t-4 border-[#D4AF37]"
                        >
                            <div className="w-20 h-20 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 mb-6">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-3xl font-heading font-black text-gray-900 mb-3">
                                Application Submitted!
                            </h2>
                            <p className="text-gray-500 text-sm leading-relaxed mb-8">
                                Your store details and documents have been submitted to Muncheez Admin for review.
                            </p>

                            <button
                                onClick={() => navigate('/partner/dashboard')}
                                className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg"
                            >
                                View Application Status
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
