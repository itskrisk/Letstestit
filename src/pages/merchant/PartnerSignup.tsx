import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowRight, ArrowLeft, Mail, Lock, Store, Upload, CheckCircle,
    UtensilsCrossed, ShoppingBag, Phone, Shield
} from 'lucide-react';
import { authApi } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';

type OnboardingStep = 'IDENTITY' | 'DNA' | 'COMPLIANCE' | 'SUCCESS';
type MerchantType = 'Restaurant' | 'Supermarket' | 'Pharmacy';

export default function PartnerSignup() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('IDENTITY');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        businessName: '',
        type: 'Restaurant' as MerchantType,
        address: '',
        phone: '',
        mpesaTill: ''
    });

    const [documents, setDocuments] = useState<{
        kraPin: File | null;
        healthPermit: File | null;
    }>({
        kraPin: null,
        healthPermit: null
    });

    const [uploadProgress, setUploadProgress] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (field: 'kraPin' | 'healthPermit', file: File | null) => {
        setDocuments(prev => ({ ...prev, [field]: file }));
    };

    const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (!uploadError) {
                const { data } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(fileName);

                if (data?.publicUrl) {
                    return data.publicUrl;
                }
            }
        } catch (e) {
            console.warn('Storage upload warning, using fallback:', e);
        }

        // Fallback to Data URL if storage bucket doesn't exist
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string || `https://placeholder.file/${file.name}`);
            };
            reader.onerror = () => {
                resolve(`https://placeholder.file/${file.name}`);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (currentStep === 'IDENTITY') {
            setCurrentStep('DNA');
            return;
        }
        if (currentStep === 'DNA') {
            setCurrentStep('COMPLIANCE');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let kraPinUrl = '';
            let healthPermitUrl = '';

            if (documents.kraPin) {
                setUploadProgress('Uploading KRA PIN...');
                kraPinUrl = await uploadFile(documents.kraPin, 'documents', 'merchants/kra');
            }

            if (documents.healthPermit) {
                setUploadProgress('Uploading Health Permit...');
                healthPermitUrl = await uploadFile(documents.healthPermit, 'documents', 'merchants/health');
            }

            setUploadProgress('Creating your account...');

            const signupResult = await authApi.signupMerchant({
                email: formData.email,
                password: formData.password,
                name: formData.businessName,
                phone: formData.phone,
                businessName: formData.businessName,
                type: formData.type,
            });

            if (signupResult.error) throw new Error(signupResult.error);

            if (signupResult.user && (kraPinUrl || healthPermitUrl)) {
                setUploadProgress('Saving documents...');
                const documentData: any = {};
                if (kraPinUrl) documentData.kraPin = { url: kraPinUrl, filename: documents.kraPin?.name, uploadedAt: new Date().toISOString() };
                if (healthPermitUrl) documentData.healthPermit = { url: healthPermitUrl, filename: documents.healthPermit?.name, uploadedAt: new Date().toISOString() };

                const { error: updateError } = await supabase
                    .from('merchants')
                    .update({ documents: documentData })
                    .eq('id', signupResult.user.id);

                if (updateError) {
                    console.error('Error updating merchant documents:', updateError);
                }
            }

            setUploadProgress(null);
            setCurrentStep('SUCCESS');
        } catch (err: any) {
            let message = err.message || 'Signup failed';
            if (message.toLowerCase().includes('rate limit')) {
                message = "Email rate limit reached. Please wait a while before trying again, or use a different email.";
            } else if (message.toLowerCase().includes('already registered') || message.toLowerCase().includes('already has the')) {
                message = message;
            }
            setError(message);
            setUploadProgress(null);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { key: 'IDENTITY', label: 'Identity' },
        { key: 'DNA', label: 'Business' },
        { key: 'COMPLIANCE', label: 'Compliance' }
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex font-sans">
            {/* LEFT SIDE - Editorial Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2000&auto=format&fit=crop"
                    alt="Restaurant"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="relative z-10 flex flex-col justify-end p-12 text-white">
                    <div className="space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center">
                            <Store size={32} className="text-[#D4AF37]" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter leading-[0.9]">
                            Partner<br />
                            <span className="text-[#D4AF37]">Genesis.</span>
                        </h1>
                        <p className="text-sm text-white/70 max-w-sm leading-relaxed">
                            Join Nairobi's premier collective of restaurants, supermarkets, and pharmacies. Reach thousands of hungry customers.
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full bg-[#D4AF37]/30 border-2 border-black flex items-center justify-center text-xs font-bold">
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs text-white/60 font-medium">500+ Partners Active</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 relative overflow-y-auto">
                {/* Mobile Logo */}
                <div className="lg:hidden flex justify-center mb-8">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="font-heading font-bold text-2xl tracking-tighter text-gray-900">
                            Muncheez<span className="text-[#D4AF37]">.</span>
                        </span>
                    </Link>
                </div>

                <div className="max-w-md mx-auto w-full">
                    {/* Back Link */}
                    <Link
                        to="/partner/login"
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-8 hover:opacity-70 transition-all group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                    </Link>

                    {/* Step Indicators */}
                    <div className="flex items-center gap-2 mb-10">
                        {steps.map((step, i) => (
                            <div key={step.key} className="flex items-center gap-2">
                                <div className={`h-1 w-8 rounded-full transition-all duration-500 ${steps.findIndex(s => s.key === currentStep) >= i
                                    ? 'bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                                    : 'bg-gray-200'
                                    }`} />
                            </div>
                        ))}
                    </div>

                    {/* Header */}
                    <div className="mb-10">
                        <h2 className="text-4xl font-heading font-bold text-gray-900 tracking-tight mb-2">
                            {currentStep === 'IDENTITY' && "Partner Genesis."}
                            {currentStep === 'DNA' && "Business DNA."}
                            {currentStep === 'COMPLIANCE' && "Audit Ready."}
                            {currentStep === 'SUCCESS' && "Verification Sent."}
                        </h2>
                        <p className="text-sm text-gray-500 font-light italic">
                            {currentStep === 'IDENTITY' && "Secure your spot in Nairobi's premier collective."}
                            {currentStep === 'DNA' && "Define your category and physical presence."}
                            {currentStep === 'COMPLIANCE' && "Finalize legal and settlement requirements."}
                            {currentStep === 'SUCCESS' && "Check your inbox to activate your terminal."}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            <p className="text-xs font-bold text-red-600 tracking-tight">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <AnimatePresence mode="wait">
                            {currentStep === 'IDENTITY' && (
                                <motion.div
                                    key="identity"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">Business Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-gray-400">
                                                    <Store size={16} />
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.businessName}
                                                    onChange={(e) => updateField('businessName', e.target.value)}
                                                    className="block w-full pl-8 pr-4 py-3 border-b border-gray-100 bg-transparent text-gray-900 focus:outline-none focus:border-[#D4AF37] text-sm transition-all"
                                                    placeholder="e.g., Mama's Kitchen"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">Business Email</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-gray-400">
                                                    <Mail size={16} />
                                                </div>
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => updateField('email', e.target.value)}
                                                    className="block w-full pl-8 pr-4 py-3 border-b border-gray-100 bg-transparent text-gray-900 focus:outline-none focus:border-[#D4AF37] text-sm transition-all"
                                                    placeholder="business@legacy.com"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">Create Password</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-gray-400">
                                                    <Lock size={16} />
                                                </div>
                                                <input
                                                    type="password"
                                                    required
                                                    value={formData.password}
                                                    onChange={(e) => updateField('password', e.target.value)}
                                                    className="block w-full pl-8 pr-4 py-3 border-b border-gray-100 bg-transparent text-gray-900 focus:outline-none focus:border-[#D4AF37] text-sm transition-all"
                                                    placeholder="Minimum 8 characters"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4">
                                        <Link to="/partner/login" className="text-xs font-bold text-[#D4AF37] hover:underline">
                                            Already a Partner? Sign in
                                        </Link>
                                        <button
                                            type="submit"
                                            disabled={!formData.businessName || !formData.email || !formData.password}
                                            className="group flex items-center gap-3 text-black disabled:opacity-30 transition-all hover:gap-5"
                                        >
                                            <span className="font-serif italic text-lg border-b border-black/20 group-hover:border-black transition-all pb-1 leading-none">
                                                Business DNA
                                            </span>
                                            <ArrowRight size={22} className="text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 'DNA' && (
                                <motion.div
                                    key="dna"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-4">Business Category</label>
                                            <div className="grid grid-cols-1 gap-3">
                                                {['Restaurant', 'Supermarket', 'Pharmacy'].map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, type: type as MerchantType }))}
                                                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${formData.type === type ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-gray-50 hover:border-gray-200'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${formData.type === type ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-400'
                                                                }`}>
                                                                {type === 'Restaurant' && <UtensilsCrossed size={18} />}
                                                                {type === 'Supermarket' && <ShoppingBag size={18} />}
                                                                {type === 'Pharmacy' && <Store size={18} />}
                                                            </div>
                                                            <span className={`text-sm font-bold tracking-tight ${formData.type === type ? 'text-black' : 'text-gray-500'}`}>
                                                                {type}
                                                            </span>
                                                        </div>
                                                        <div className={`w-4 h-4 rounded-full border-2 transition-all ${formData.type === type ? 'border-[#D4AF37] bg-[#D4AF37] shadow-[0_0_0_2px_white_inset]' : 'border-gray-200'
                                                            }`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">Physical Address / Branch</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.address}
                                                onChange={(e) => updateField('address', e.target.value)}
                                                className="block w-full px-4 py-3 border-b border-gray-100 bg-transparent text-gray-900 focus:outline-none focus:border-[#D4AF37] text-sm transition-all"
                                                placeholder="e.g., Sarit Centre, Westlands"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">Business Phone</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-gray-400">
                                                    <Phone size={16} />
                                                </div>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={formData.phone}
                                                    onChange={(e) => updateField('phone', e.target.value)}
                                                    className="block w-full pl-8 pr-4 py-3 border-b border-gray-100 bg-transparent text-gray-900 focus:outline-none focus:border-[#D4AF37] text-sm transition-all font-mono"
                                                    placeholder="+254..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep('IDENTITY')}
                                            className="text-gray-400 hover:text-black transition-all"
                                        >
                                            <ArrowLeft size={20} />
                                        </button>
                                        <button
                                            type="submit"
                                            className="group flex items-center gap-3 text-black transition-all hover:gap-5"
                                        >
                                            <span className="font-serif italic text-lg border-b border-black/20 group-hover:border-black transition-all pb-1 leading-none">
                                                Compliance
                                            </span>
                                            <ArrowRight size={22} className="text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 'COMPLIANCE' && (
                                <motion.div
                                    key="compliance"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        {/* KRA PIN Upload */}
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-2">KRA PIN Certificate</label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => handleFileChange('kraPin', e.target.files?.[0] || null)}
                                                    className="hidden"
                                                    id="kra-pin-upload"
                                                />
                                                <label
                                                    htmlFor="kra-pin-upload"
                                                    className={`flex items-center justify-center gap-3 w-full px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${documents.kraPin ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[#D4AF37]'}`}
                                                >
                                                    {documents.kraPin ? (
                                                        <>
                                                            <CheckCircle size={20} className="text-green-600" />
                                                            <span className="text-sm font-bold text-green-700">{documents.kraPin.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload size={20} className="text-gray-400" />
                                                            <span className="text-sm font-medium text-gray-500">Click to upload KRA PIN document</span>
                                                        </>
                                                    )}
                                                </label>
                                            </div>
                                        </div>

                                        {/* Health Permit Upload */}
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-2">Health Permit / License</label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => handleFileChange('healthPermit', e.target.files?.[0] || null)}
                                                    className="hidden"
                                                    id="health-permit-upload"
                                                />
                                                <label
                                                    htmlFor="health-permit-upload"
                                                    className={`flex items-center justify-center gap-3 w-full px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${documents.healthPermit ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[#D4AF37]'}`}
                                                >
                                                    {documents.healthPermit ? (
                                                        <>
                                                            <CheckCircle size={20} className="text-green-600" />
                                                            <span className="text-sm font-bold text-green-700">{documents.healthPermit.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload size={20} className="text-gray-400" />
                                                            <span className="text-sm font-medium text-gray-500">Click to upload Health Permit document</span>
                                                        </>
                                                    )}
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-3">M-Pesa Till / Paybill</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.mpesaTill}
                                                onChange={(e) => updateField('mpesaTill', e.target.value)}
                                                className="block w-full px-4 py-3 border-b border-gray-100 bg-transparent text-gray-900 focus:outline-none focus:border-[#D4AF37] text-sm transition-all font-mono"
                                                placeholder="Enter Shortcode"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-white/50 p-6 rounded-2xl border border-gray-100 flex gap-4">
                                        <Shield className="text-[#D4AF37] shrink-0" size={24} />
                                        <p className="text-[10px] font-bold text-gray-500 leading-relaxed">
                                            Compliance is required for all legal entities operating on the Muncheez Network. Upload your documents for verification.
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep('DNA')}
                                            className="text-gray-400 hover:text-black transition-all p-2"
                                        >
                                            <ArrowLeft size={20} />
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="group flex-1 flex justify-between items-center py-5 px-8 rounded-2xl text-sm font-bold text-white bg-black hover:bg-[#D4AF37] disabled:bg-gray-400 transition-all duration-500 uppercase tracking-widest shadow-xl"
                                        >
                                            {loading ? (uploadProgress || "Processing...") : "Finalize Onboarding"}
                                            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 'SUCCESS' && (
                                <motion.div
                                    key="success"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center py-10"
                                >
                                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/20">
                                        <Mail size={40} className="text-black" />
                                    </div>
                                    <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Verify Your Email</h2>
                                    <p className="text-sm text-gray-500 mb-8 max-w-[280px] mx-auto">
                                        We've sent a secure link to <strong>{formData.email}</strong>. <br /><br />
                                        <strong>You MUST click that link to verify your email before logging in.</strong> Once verified, return here to log into your terminal.
                                    </p>
                                    <button
                                        onClick={() => navigate('/partner/login')}
                                        className="px-10 py-4 bg-black text-[#D4AF37] rounded-xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
                                    >
                                        Proceed to Login
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>

                    <div className="mt-10 flex flex-col gap-6 text-center border-t border-gray-100 pt-8">
                        <div className="flex flex-col gap-3 pt-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 block">Genesis Audit</span>
                            <div className="flex items-center justify-center gap-4">
                                <Link to="/signup" className="text-[10px] font-bold text-gray-400 hover:text-[#4A90E2] uppercase tracking-[0.2em]">Customer</Link>
                                <span className="w-1 h-1 rounded-full bg-gray-100" />
                                <Link to="/courier/signup" className="text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-[0.2em]">Courier</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
