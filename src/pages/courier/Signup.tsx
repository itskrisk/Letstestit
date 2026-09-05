import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowRight, ArrowLeft, Mail, Lock, Phone, Upload, CheckCircle,
    Bike, Car, Shield, User, FileText, Camera
} from 'lucide-react';
import { authApi } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';

type OnboardingStep = 'IDENTITY' | 'FLEET' | 'ASSET' | 'COMPLIANCE' | 'SUCCESS';
type VehicleType = 'Foot' | 'Bicycle' | 'Motorbike' | 'Car';

export default function CourierSignup() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('IDENTITY');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        vehicleType: 'Motorbike' as VehicleType,
        make: '',
        model: '',
        plate: '',
        safetyGear: {
            thermalBag: false,
            helmet: false,
            vest: false
        }
    });

    const [documents, setDocuments] = useState<{
        id: File | null;
        license: File | null;
        logbook: File | null;
    }>({
        id: null,
        license: null,
        logbook: null
    });

    const [uploadProgress, setUploadProgress] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDocChange = (field: 'id' | 'license' | 'logbook', file: File | null) => {
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
            setCurrentStep('FLEET');
            return;
        }
        if (currentStep === 'FLEET') {
            if (formData.vehicleType === 'Foot' || formData.vehicleType === 'Bicycle') {
                setCurrentStep('COMPLIANCE');
            } else {
                setCurrentStep('ASSET');
            }
            return;
        }
        if (currentStep === 'ASSET') {
            setCurrentStep('COMPLIANCE');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let idUrl = '';
            let licenseUrl = '';
            let logbookUrl = '';

            if (documents.id) {
                setUploadProgress('Uploading ID...');
                idUrl = await uploadFile(documents.id, 'documents', 'riders/id');
            }
            if (documents.license) {
                setUploadProgress('Uploading License...');
                licenseUrl = await uploadFile(documents.license, 'documents', 'riders/license');
            }
            if (documents.logbook) {
                setUploadProgress('Uploading Logbook...');
                logbookUrl = await uploadFile(documents.logbook, 'documents', 'riders/logbook');
            }

            setUploadProgress('Creating your account...');

            const signupResult = await authApi.signupCourier({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                phone: formData.phone,
                vehicleType: formData.vehicleType,
                make: formData.make,
                model: formData.model,
                plate: formData.plate
            });

            if (signupResult.error) throw new Error(signupResult.error);

            if (signupResult.user && (idUrl || licenseUrl || logbookUrl)) {
                setUploadProgress('Saving documents...');
                const documentData: any = {};
                if (idUrl) documentData.id = { url: idUrl, filename: documents.id?.name, uploadedAt: new Date().toISOString() };
                if (licenseUrl) documentData.license = { url: licenseUrl, filename: documents.license?.name, uploadedAt: new Date().toISOString() };
                if (logbookUrl) documentData.logbook = { url: logbookUrl, filename: documents.logbook?.name, uploadedAt: new Date().toISOString() };

                const { error: updateError } = await supabase
                    .from('riders')
                    .update({ documents: documentData })
                    .eq('id', signupResult.user.id);

                if (updateError) {
                    console.error('Error updating rider documents:', updateError);
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
        { key: 'FLEET', label: 'Fleet' },
        { key: 'ASSET', label: 'Asset' },
        { key: 'COMPLIANCE', label: 'Compliance' }
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex font-sans">
            {/* LEFT SIDE - Editorial Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=2000&auto=format&fit=crop"
                    alt="Delivery rider"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="relative z-10 flex flex-col justify-end p-12 text-white">
                    <div className="space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center">
                            <Bike size={32} className="text-[#D4AF37]" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter leading-[0.9]">
                            Join the<br />
                            <span className="text-[#D4AF37]">Fleet.</span>
                        </h1>
                        <p className="text-sm text-white/70 max-w-sm leading-relaxed">
                            Become part of Nairobi's most elite delivery network. Flexible hours, instant payouts, and a community that moves the city.
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full bg-[#D4AF37]/30 border-2 border-black flex items-center justify-center text-xs font-bold">
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs text-white/60 font-medium">2,400+ Operators Active</span>
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
                        to="/"
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-8 hover:opacity-70 transition-all group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Selection
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
                            {currentStep === 'IDENTITY' && "Welcome."}
                            {currentStep === 'FLEET' && "Your Fleet."}
                            {currentStep === 'ASSET' && "Your Asset."}
                            {currentStep === 'COMPLIANCE' && "Final Step."}
                            {currentStep === 'SUCCESS' && "Almost There."}
                        </h2>
                        <p className="text-sm text-gray-500 font-light italic">
                            {currentStep === 'IDENTITY' && "Secure your spot in the fleet."}
                            {currentStep === 'FLEET' && "How do you move?"}
                            {currentStep === 'ASSET' && "What are you driving?"}
                            {currentStep === 'COMPLIANCE' && "Upload your documents for verification."}
                            {currentStep === 'SUCCESS' && "Check your inbox to activate your account."}
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
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">Full Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-gray-400">
                                                    <User size={16} />
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => updateField('name', e.target.value)}
                                                    className="block w-full pl-8 pr-4 py-3 border-b border-gray-100 bg-transparent text-gray-900 focus:outline-none focus:border-[#D4AF37] text-sm transition-all"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">Phone Number</label>
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
                                                    placeholder="07XX XXX XXX"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">Email Address</label>
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
                                                    placeholder="rider@example.com"
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
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">Confirm Password</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-gray-400">
                                                    <Lock size={16} />
                                                </div>
                                                <input
                                                    type="password"
                                                    required
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                                                    className="block w-full pl-8 pr-4 py-3 border-b border-gray-100 bg-transparent text-gray-900 focus:outline-none focus:border-[#D4AF37] text-sm transition-all"
                                                    placeholder="Repeat password"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4">
                                        <Link to="/courier/login" className="text-xs font-bold text-[#D4AF37] hover:underline">
                                            Already an Operator? Sign in
                                        </Link>
                                        <button
                                            type="submit"
                                            disabled={!formData.name || !formData.email || !formData.password}
                                            className="group flex items-center gap-3 text-black disabled:opacity-30 transition-all hover:gap-5"
                                        >
                                            <span className="font-serif italic text-lg border-b border-black/20 group-hover:border-black transition-all pb-1 leading-none">
                                                Select Fleet
                                            </span>
                                            <ArrowRight size={22} className="text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 'FLEET' && (
                                <motion.div
                                    key="fleet"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { type: 'Foot', label: 'On Foot', icon: <User size={24} /> },
                                            { type: 'Bicycle', label: 'Bicycle', icon: <Bike size={24} /> },
                                            { type: 'Motorbike', label: 'Motorbike', icon: <Bike size={24} className="rotate-12" /> },
                                            { type: 'Car', label: 'Compact Car', icon: <Car size={24} /> }
                                        ].map((vehicle) => (
                                            <button
                                                key={vehicle.type}
                                                type="button"
                                                onClick={() => updateField('vehicleType', vehicle.type)}
                                                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${formData.vehicleType === vehicle.type
                                                    ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37]'
                                                    : 'border-gray-100 hover:border-gray-200 text-gray-400'
                                                    }`}
                                            >
                                                <div className={`p-3 rounded-xl transition-all ${formData.vehicleType === vehicle.type ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-gray-50'}`}>
                                                    {vehicle.icon}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">{vehicle.label}</span>
                                            </button>
                                        ))}
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
                                                {formData.vehicleType === 'Foot' || formData.vehicleType === 'Bicycle' ? 'Verification Documents' : 'Asset Details'}
                                            </span>
                                            <ArrowRight size={22} className="text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 'ASSET' && (
                                <motion.div
                                    key="asset"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">Vehicle Make</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.make}
                                                onChange={(e) => updateField('make', e.target.value)}
                                                className="block w-full px-4 py-3 border-b border-gray-100 bg-transparent text-gray-900 focus:outline-none focus:border-[#D4AF37] text-sm transition-all"
                                                placeholder="e.g. Honda / Toyota"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">Model Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.model}
                                                onChange={(e) => updateField('model', e.target.value)}
                                                className="block w-full px-4 py-3 border-b border-gray-100 bg-transparent text-gray-900 focus:outline-none focus:border-[#D4AF37] text-sm transition-all"
                                                placeholder="e.g. Ace 125 / Civic"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">License Plate</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.plate}
                                                onChange={(e) => updateField('plate', e.target.value)}
                                                className="block w-full px-4 py-3 border-b border-gray-100 bg-transparent text-gray-900 focus:outline-none focus:border-[#D4AF37] text-sm transition-all font-mono"
                                                placeholder="e.g. KMDQ 123X"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep('FLEET')}
                                            className="text-gray-400 hover:text-black transition-all"
                                        >
                                            <ArrowLeft size={20} />
                                        </button>
                                        <button
                                            type="submit"
                                            className="group flex items-center gap-3 text-black transition-all hover:gap-5"
                                        >
                                            <span className="font-serif italic text-lg border-b border-black/20 group-hover:border-black transition-all pb-1 leading-none">
                                                Verification Documents
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
                                        {/* ID Document Upload */}
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-2">National ID or Passport</label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => handleDocChange('id', e.target.files?.[0] || null)}
                                                    className="hidden"
                                                    id="id-upload"
                                                />
                                                <label
                                                    htmlFor="id-upload"
                                                    className={`flex items-center justify-center gap-3 w-full px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${documents.id ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[#D4AF37]'}`}
                                                >
                                                    {documents.id ? (
                                                        <>
                                                            <CheckCircle size={20} className="text-green-600" />
                                                            <span className="text-sm font-bold text-green-700">{documents.id.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload size={20} className="text-gray-400" />
                                                            <span className="text-sm font-medium text-gray-500">Click to upload ID or Passport</span>
                                                        </>
                                                    )}
                                                </label>
                                            </div>
                                        </div>

                                        {/* License Upload (Only required for motor vehicles) */}
                                        {formData.vehicleType !== 'Foot' && formData.vehicleType !== 'Bicycle' && (
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-2">Driver's License</label>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => handleDocChange('license', e.target.files?.[0] || null)}
                                                        className="hidden"
                                                        id="license-upload"
                                                    />
                                                    <label
                                                        htmlFor="license-upload"
                                                        className={`flex items-center justify-center gap-3 w-full px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${documents.license ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[#D4AF37]'}`}
                                                    >
                                                        {documents.license ? (
                                                            <>
                                                                <CheckCircle size={20} className="text-green-600" />
                                                                <span className="text-sm font-bold text-green-700">{documents.license.name}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload size={20} className="text-gray-400" />
                                                                <span className="text-sm font-medium text-gray-500">Click to upload Driver's License</span>
                                                            </>
                                                        )}
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        {/* Logbook Upload */}
                                        {formData.vehicleType !== 'Foot' && formData.vehicleType !== 'Bicycle' && (
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-2">Vehicle Logbook</label>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => handleDocChange('logbook', e.target.files?.[0] || null)}
                                                        className="hidden"
                                                        id="logbook-upload"
                                                    />
                                                    <label
                                                        htmlFor="logbook-upload"
                                                        className={`flex items-center justify-center gap-3 w-full px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${documents.logbook ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[#D4AF37]'}`}
                                                    >
                                                        {documents.logbook ? (
                                                            <>
                                                                <CheckCircle size={20} className="text-green-600" />
                                                                <span className="text-sm font-bold text-green-700">{documents.logbook.name}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload size={20} className="text-gray-400" />
                                                                <span className="text-sm font-medium text-gray-500">Click to upload Vehicle Logbook</span>
                                                            </>
                                                        )}
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-white/50 p-6 rounded-2xl border border-gray-100 flex gap-4">
                                        <Shield className="text-[#D4AF37] shrink-0" size={24} />
                                        <p className="text-[10px] font-bold text-gray-500 leading-relaxed">
                                            I hereby consent to a background check and agree to adhere to the Muncheez safety protocols for my vehicle type.
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep(formData.vehicleType === 'Foot' || formData.vehicleType === 'Bicycle' ? 'FLEET' : 'ASSET')}
                                            className="text-gray-400 hover:text-black transition-all p-2"
                                        >
                                            <ArrowLeft size={20} />
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="group flex-1 flex justify-between items-center py-5 px-8 rounded-2xl text-sm font-bold text-white bg-black hover:bg-[#D4AF37] disabled:bg-gray-400 transition-all duration-500 uppercase tracking-widest shadow-xl"
                                        >
                                            {loading ? (uploadProgress || "Processing...") : "Initialize Profile"}
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
                                        We've sent a secure link to your email. <strong>You must verify it before you can log in.</strong> After login, your account will await admin approval.
                                    </p>
                                    <button
                                        onClick={() => navigate('/courier/login')}
                                        className="px-10 py-4 bg-black text-[#D4AF37] rounded-xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
                                    >
                                        Proceed to Login
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>

                    <div className="mt-10 flex flex-col gap-6 text-center border-t border-gray-100 pt-8">
                        <Link to="/courier/login" className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest hover:underline">
                            Already an Operator? Sign in
                        </Link>

                        <div className="flex flex-col gap-3 pt-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 block">Wrong Terminal?</span>
                            <div className="flex items-center justify-center gap-4">
                                <Link to="/signup" className="text-[10px] font-bold text-gray-400 hover:text-[#4A90E2] uppercase tracking-[0.2em]">Customer App</Link>
                                <span className="w-1 h-1 rounded-full bg-gray-100" />
                                <Link to="/partner/signup" className="text-[10px] font-bold text-gray-400 hover:text-[#D4AF37] uppercase tracking-[0.2em]">Merchant Collective</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
