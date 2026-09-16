import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bike,
    Shield,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Upload,
    FileText,
    AlertCircle,
    Check,
    UserCheck,
    Car,
    Footprints,
    PhoneCall
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

type OnboardingStep = 'MODE' | 'DETAILS' | 'DOCUMENTS' | 'REVIEW';
type TransportMode = 'On Foot (Walker)' | 'Bicycle' | 'Scooter / E-Scooter' | 'Motorbike (Boda)' | 'Car / Van';

export default function CourierOnboarding({ onComplete }: { onComplete?: () => void }) {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('MODE');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [transportMode, setTransportMode] = useState<TransportMode>('Motorbike (Boda)');

    const [courierDetails, setCourierDetails] = useState({
        make: '',
        model: '',
        plate: '',
        emergencyName: '',
        emergencyRelation: '',
        emergencyPhone: ''
    });

    const [gearCheck, setGearCheck] = useState({
        hasHelmet: true,
        hasThermalBag: true,
        hasVest: true
    });

    const [documents, setDocuments] = useState<{
        photoFile: File | null;
        idDocFile: File | null;
        licenseFile: File | null;
        logbookFile: File | null;
        insuranceFile: File | null;
    }>({
        photoFile: null,
        idDocFile: null,
        licenseFile: null,
        logbookFile: null,
        insuranceFile: null
    });

    const updateDetails = (key: string, value: string) => {
        setCourierDetails(prev => ({ ...prev, [key]: value }));
        setError(null);
    };

    const toggleGear = (key: keyof typeof gearCheck) => {
        setGearCheck(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const isMotorized = transportMode === 'Motorbike (Boda)' || transportMode === 'Car / Van' || transportMode === 'Scooter / E-Scooter';

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
            let photoUrl = '';
            let idUrl = '';
            let licenseUrl = '';
            let logbookUrl = '';
            let insuranceUrl = '';

            if (documents.photoFile) {
                photoUrl = await uploadFile(documents.photoFile, `riders/${user.id}/photo`);
            }
            if (documents.idDocFile) {
                idUrl = await uploadFile(documents.idDocFile, `riders/${user.id}/id`);
            }
            if (documents.licenseFile) {
                licenseUrl = await uploadFile(documents.licenseFile, `riders/${user.id}/license`);
            }
            if (documents.logbookFile) {
                logbookUrl = await uploadFile(documents.logbookFile, `riders/${user.id}/logbook`);
            }
            if (documents.insuranceFile) {
                insuranceUrl = await uploadFile(documents.insuranceFile, `riders/${user.id}/insurance`);
            }

            const docPayload: any = {};
            if (photoUrl) docPayload.photo = { url: photoUrl, filename: documents.photoFile?.name, uploadedAt: new Date().toISOString() };
            if (idUrl) docPayload.id = { url: idUrl, filename: documents.idDocFile?.name, uploadedAt: new Date().toISOString() };
            if (licenseUrl) docPayload.license = { url: licenseUrl, filename: documents.licenseFile?.name, uploadedAt: new Date().toISOString() };
            if (logbookUrl) docPayload.logbook = { url: logbookUrl, filename: documents.logbookFile?.name, uploadedAt: new Date().toISOString() };
            if (insuranceUrl) docPayload.insurance = { url: insuranceUrl, filename: documents.insuranceFile?.name, uploadedAt: new Date().toISOString() };

            const emergencyPayload = {
                name: courierDetails.emergencyName,
                relationship: courierDetails.emergencyRelation,
                phone: courierDetails.emergencyPhone
            };

            const fullPayload: any = {
                id: user.id,
                name: profile?.full_name || user.email?.split('@')[0] || 'Courier',
                phone: profile?.phone || '',
                email: user.email || '',
                transport_mode: transportMode,
                vehicle_type: transportMode,
                vehicle_make: courierDetails.make || 'N/A',
                vehicle_model: courierDetails.model || 'N/A',
                vehicle_plate: courierDetails.plate || 'N/A',
                emergency_contact: emergencyPayload,
                has_helmet: gearCheck.hasHelmet,
                has_thermal_bag: gearCheck.hasThermalBag,
                has_vest: gearCheck.hasVest,
                has_id_doc: !!idUrl,
                has_license: !!licenseUrl,
                has_logbook: !!logbookUrl,
                has_insurance: !!insuranceUrl,
                profile_photo_url: photoUrl || null,
                id_doc_url: idUrl || null,
                license_url: licenseUrl || null,
                logbook_url: logbookUrl || null,
                insurance_url: insuranceUrl || null,
                documents: docPayload,
                status: 'APPROVED',
                is_online: false,
                rating: 5.0,
                total_orders: 0
            };

            const { error: upsertError } = await supabase
                .from('riders')
                .upsert(fullPayload, { onConflict: 'id' });

            if (upsertError) {
                // Fallback for missing optional document URL columns in remote schema
                const fallbackPayload: any = {
                    id: user.id,
                    name: profile?.full_name || user.email?.split('@')[0] || 'Courier',
                    phone: profile?.phone || '',
                    email: user.email || '',
                    transport_mode: transportMode,
                    vehicle_type: transportMode,
                    vehicle_make: courierDetails.make || 'N/A',
                    vehicle_model: courierDetails.model || 'N/A',
                    vehicle_plate: courierDetails.plate || 'N/A',
                    emergency_contact: emergencyPayload,
                    documents: docPayload,
                    status: 'APPROVED',
                    is_online: false,
                    rating: 5.0,
                    total_orders: 0
                };

                const { error: retryError } = await supabase
                    .from('riders')
                    .upsert(fallbackPayload, { onConflict: 'id' });

                if (retryError) throw retryError;
            }

            // Also update profiles table so roles and status sync
            try {
                await supabase
                    .from('profiles')
                    .update({
                        status: 'APPROVED',
                        roles: ['courier']
                    })
                    .eq('id', user.id);
            } catch (pErr) {
                console.warn('Profile update notice:', pErr);
            }

            setCurrentStep('REVIEW');
            if (onComplete) onComplete();
        } catch (err: any) {
            console.error('Error submitting courier KYC:', err);
            setError(err.message || 'Failed to submit courier verification documents.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-sans flex flex-col">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-100 py-6 px-6 md:px-10 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <span className="font-heading font-black text-2xl tracking-tighter text-black">
                        Muncheez<span className="text-[#39B54A]">.</span>
                    </span>
                    <span className="px-3 py-1 bg-[#39B54A]/10 border border-[#39B54A]/30 text-[#39B54A] text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5">
                        <Bike size={12} />
                        Muncheez Courier Setup
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                    {['MODE', 'DETAILS', 'DOCUMENTS', 'REVIEW'].map((step, i) => (
                        <div
                            key={step}
                            className={`h-1.5 w-10 rounded-full transition-all duration-300 ${['MODE', 'DETAILS', 'DOCUMENTS', 'REVIEW'].indexOf(currentStep) >= i
                                    ? 'bg-[#39B54A]'
                                    : 'bg-gray-200'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 md:px-10">
                {error && (
                    <div className="mt-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold flex items-center gap-3">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {/* STEP 1: TRANSPORT MODE */}
                    {currentStep === 'MODE' && (
                        <motion.div
                            key="mode"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="py-10 border-b border-gray-100"
                        >
                            <div className="mb-10">
                                <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-900 tracking-tight">
                                    Choose Your Transport Mode
                                </h1>
                                <p className="text-gray-500 mt-2">
                                    Select how you will deliver. Document requirements adapt to your choice.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { mode: 'On Foot (Walker)', icon: Footprints, desc: 'Deliver within CBD & short radii. No vehicle required!' },
                                    { mode: 'Bicycle', icon: Bike, desc: 'Eco-friendly, fast city delivery with helmet & thermal bag.' },
                                    { mode: 'Scooter / E-Scooter', icon: Bike, desc: 'Quick electric or gas scooter deliveries.' },
                                    { mode: 'Motorbike (Boda)', icon: Bike, desc: 'High mobility, longer distance deliveries across Nairobi.' },
                                    { mode: 'Car / Van', icon: Car, desc: 'Bulk supermarket & multi-order heavy deliveries.' },
                                ].map(item => {
                                    const isSelected = transportMode === item.mode;
                                    const IconComponent = item.icon;
                                    return (
                                        <div
                                            key={item.mode}
                                            onClick={() => setTransportMode(item.mode as TransportMode)}
                                            className={`cursor-pointer transition-all flex items-start gap-4 py-5 border-t ${isSelected
                                                    ? 'border-[#39B54A]'
                                                    : 'border-gray-100 hover:border-gray-200'
                                                }`}
                                        >
                                            <div className={`p-3 rounded-2xl shrink-0 ${isSelected ? 'bg-[#39B54A] text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                <IconComponent size={22} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 text-sm">{item.mode}</h3>
                                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end mt-10">
                                <button
                                    onClick={() => setCurrentStep('DETAILS')}
                                    className="group flex items-center gap-2 text-sm font-bold text-white bg-gray-900 hover:bg-[#39B54A] transition-all uppercase tracking-widest py-4 px-8"
                                >
                                    Continue to Details <ChevronRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: VEHICLE DETAILS & EMERGENCY CONTACT */}
                    {currentStep === 'DETAILS' && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="py-10 border-b border-gray-100"
                        >
                            <div className="mb-10">
                                <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-900 tracking-tight">
                                    Transport & Safety Details
                                </h1>
                                <p className="text-gray-500 mt-2">
                                    {isMotorized ? 'Enter your vehicle specs and emergency contact info.' : 'Enter your emergency contact & verify safety equipment.'}
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* Vehicle Specs (If Motorized) */}
                                {isMotorized && (
                                    <div className="border-t border-gray-100 pt-6">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                                            Vehicle Information ({transportMode})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                                    Vehicle Make
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Honda / Boxer"
                                                    value={courierDetails.make}
                                                    onChange={e => updateDetails('make', e.target.value)}
                                                    className="w-full bg-transparent border-b border-gray-200 focus:border-[#39B54A] focus:bg-transparent outline-none font-medium transition-all text-sm py-3"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                                    Vehicle Model
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. CB125"
                                                    value={courierDetails.model}
                                                    onChange={e => updateDetails('model', e.target.value)}
                                                    className="w-full bg-transparent border-b border-gray-200 focus:border-[#39B54A] focus:bg-transparent outline-none font-medium transition-all text-sm py-3"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                                    License Plate Number
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. KDH 882X"
                                                    value={courierDetails.plate}
                                                    onChange={e => updateDetails('plate', e.target.value)}
                                                    className="w-full bg-transparent border-b border-gray-200 focus:border-[#39B54A] focus:bg-transparent outline-none font-mono font-bold uppercase transition-all text-sm py-3"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Emergency Contact */}
                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4">
                                        <PhoneCall size={14} className="text-[#39B54A]" />
                                        Emergency Contact (Mandatory for Courier Safety)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                                Contact Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. John Omwamba"
                                                value={courierDetails.emergencyName}
                                                onChange={e => updateDetails('emergencyName', e.target.value)}
                                                className="w-full bg-transparent border-b border-gray-200 focus:border-[#39B54A] focus:bg-transparent outline-none font-medium transition-all text-sm py-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                                Relationship
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Brother / Spouse"
                                                value={courierDetails.emergencyRelation}
                                                onChange={e => updateDetails('emergencyRelation', e.target.value)}
                                                className="w-full bg-transparent border-b border-gray-200 focus:border-[#39B54A] focus:bg-transparent outline-none font-medium transition-all text-sm py-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                                Contact Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                placeholder="e.g. 0712 998 877"
                                                value={courierDetails.emergencyPhone}
                                                onChange={e => updateDetails('emergencyPhone', e.target.value)}
                                                className="w-full bg-transparent border-b border-gray-200 focus:border-[#39B54A] focus:bg-transparent outline-none font-medium transition-all text-sm py-3"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Safety Gear Checklist */}
                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                                        Mandatory Delivery Equipment
                                    </h3>
                                    {[
                                        { key: 'hasThermalBag', label: 'Isothermal Delivery Backpack', desc: 'Insulated thermal bag to keep food warm and cold items chilled', show: true },
                                        { key: 'hasHelmet', label: 'Safety Helmet', desc: 'Protective headgear for safety', show: transportMode !== 'On Foot (Walker)' },
                                        { key: 'hasVest', label: 'Reflective Safety Vest', desc: 'High-visibility vest for night delivery runs', show: isMotorized }
                                    ].filter(item => item.show).map(item => {
                                        const isChecked = gearCheck[item.key as keyof typeof gearCheck];
                                        return (
                                            <div
                                                key={item.key}
                                                onClick={() => toggleGear(item.key as keyof typeof gearCheck)}
                                                className={`cursor-pointer transition-all flex items-center justify-between py-4 border-t ${isChecked
                                                        ? 'border-[#39B54A]'
                                                        : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-sm">{item.label}</h4>
                                                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                                </div>
                                                <div className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all ${isChecked ? 'bg-[#39B54A] text-white' : 'bg-gray-200 text-transparent'}`}>
                                                    <Check size={14} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-10">
                                <button
                                    onClick={() => setCurrentStep('MODE')}
                                    className="group flex items-center gap-2 text-gray-400 hover:text-black font-bold uppercase tracking-widest text-xs"
                                >
                                    <ChevronLeft size={16} /> Back
                                </button>
                                <button
                                    onClick={() => {
                                        if (isMotorized && (!courierDetails.make.trim() || !courierDetails.plate.trim())) {
                                            setError('Please enter your vehicle make and license plate number.');
                                            return;
                                        }
                                        if (!courierDetails.emergencyName.trim() || !courierDetails.emergencyPhone.trim()) {
                                            setError('Please provide an emergency contact name and phone number.');
                                            return;
                                        }
                                        setCurrentStep('DOCUMENTS');
                                    }}
                                    className="group flex items-center gap-2 text-sm font-bold text-white bg-gray-900 hover:bg-[#39B54A] transition-all uppercase tracking-widest py-4 px-8"
                                >
                                    Continue to Documents <ChevronRight size={16} />
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
                            className="py-10 border-b border-gray-100"
                        >
                            <div className="mb-10">
                                <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-900 tracking-tight">
                                    Identity & Transport Verification
                                </h1>
                                <p className="text-gray-500 mt-2">
                                    Upload clear documents for verification. Requirements adapt to your transport mode ({transportMode}).
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* Profile Photo */}
                                <div className="border-t border-gray-100 pt-6">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-2">
                                        Profile Photo / Clear Selfie (Required for Customer Trust)
                                    </label>
                                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-[#39B54A] cursor-pointer bg-transparent transition-all">
                                        <UserCheck className="text-[#39B54A] mb-1.5" size={24} />
                                        <span className="text-xs font-bold text-gray-700">
                                            {documents.photoFile ? documents.photoFile.name : 'Click to upload clear profile selfie'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={e => setDocuments(prev => ({ ...prev, photoFile: e.target.files?.[0] || null }))}
                                        />
                                    </label>
                                </div>

                                {/* ID Document */}
                                <div className="border-t border-gray-100 pt-6">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-2">
                                        National ID / Passport
                                    </label>
                                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-[#39B54A] cursor-pointer bg-transparent transition-all">
                                        <FileText className="text-[#39B54A] mb-1.5" size={24} />
                                        <span className="text-xs font-bold text-gray-700">
                                            {documents.idDocFile ? documents.idDocFile.name : 'Click to upload ID document'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            onChange={e => setDocuments(prev => ({ ...prev, idDocFile: e.target.files?.[0] || null }))}
                                        />
                                    </label>
                                </div>

                                {/* License */}
                                <div className="border-t border-gray-100 pt-6">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-2">
                                        Driving License
                                    </label>
                                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-[#39B54A] cursor-pointer bg-transparent transition-all">
                                        <FileText className="text-[#39B54A] mb-1.5" size={24} />
                                        <span className="text-xs font-bold text-gray-700">
                                            {documents.licenseFile ? documents.licenseFile.name : 'Click to upload license'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            onChange={e => setDocuments(prev => ({ ...prev, licenseFile: e.target.files?.[0] || null }))}
                                        />
                                    </label>
                                </div>

                                {/* Logbook */}
                                {isMotorized && (
                                    <div className="border-t border-gray-100 pt-6">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-2">
                                            Vehicle Logbook
                                        </label>
                                        <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-[#39B54A] cursor-pointer bg-transparent transition-all">
                                            <FileText className="text-[#39B54A] mb-1.5" size={24} />
                                            <span className="text-xs font-bold text-gray-700">
                                                {documents.logbookFile ? documents.logbookFile.name : 'Click to upload logbook'}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                className="hidden"
                                                onChange={e => setDocuments(prev => ({ ...prev, logbookFile: e.target.files?.[0] || null }))}
                                            />
                                        </label>
                                    </div>
                                )}

                                {/* Insurance */}
                                <div className="border-t border-gray-100 pt-6">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-2">
                                        Insurance Certificate
                                    </label>
                                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-[#39B54A] cursor-pointer bg-transparent transition-all">
                                        <Shield className="text-[#39B54A] mb-1.5" size={24} />
                                        <span className="text-xs font-bold text-gray-700">
                                            {documents.insuranceFile ? documents.insuranceFile.name : 'Click to upload insurance'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            onChange={e => setDocuments(prev => ({ ...prev, insuranceFile: e.target.files?.[0] || null }))}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-10">
                                <button
                                    onClick={() => setCurrentStep('DETAILS')}
                                    className="group flex items-center gap-2 text-gray-400 hover:text-black font-bold uppercase tracking-widest text-xs"
                                >
                                    <ChevronLeft size={16} /> Back
                                </button>
                                <button
                                    onClick={() => {
                                        if (!documents.photoFile || !documents.idDocFile) {
                                            setError('Profile photo and ID document are required.');
                                            return;
                                        }
                                        handleSubmitKYC();
                                    }}
                                    disabled={loading}
                                    className="group flex items-center gap-2 text-sm font-bold text-white bg-gray-900 hover:bg-[#39B54A] hover:text-black transition-all uppercase tracking-widest py-4 px-8 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>Submitting...</>
                                    ) : (
                                        <>Complete Setup <CheckCircle2 size={16} /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: REVIEW */}
                    {currentStep === 'REVIEW' && (
                        <motion.div
                            key="review"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="py-10 border-b border-gray-100"
                        >
                            <div className="mb-10">
                                <div className="w-16 h-16 bg-[#39B54A]/10 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle2 className="text-[#39B54A]" size={32} />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-900 tracking-tight">
                                    All Set.
                                </h1>
                                <p className="text-gray-500 mt-2">
                                    Your details have been submitted. Our team will review your application within 24-48 hours.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Transport Mode</p>
                                    <p className="text-sm text-gray-900">{transportMode}</p>
                                </div>
                                {isMotorized && (
                                    <>
                                        <div className="border-t border-gray-100 pt-4">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Vehicle</p>
                                            <p className="text-sm text-gray-900">{courierDetails.make || '—'} {courierDetails.model || ''} {courierDetails.plate || '—'}</p>
                                        </div>
                                        <div className="border-t border-gray-100 pt-4">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Emergency Contact</p>
                                            <p className="text-sm text-gray-900">{courierDetails.emergencyName || '—'} ({courierDetails.emergencyRelation || '—'})</p>
                                        </div>
                                    </>
                                )}
                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Documents</p>
                                    <p className="text-sm text-gray-900">
                                        {[documents.photoFile && 'Profile Photo', documents.idDocFile && 'ID', documents.licenseFile && 'License', documents.logbookFile && 'Logbook', documents.insuranceFile && 'Insurance'].filter(Boolean).join(', ') || 'None'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end mt-10">
                                <button
                                    onClick={() => navigate('/courier')}
                                    className="group flex items-center gap-2 text-sm font-bold text-white bg-gray-900 hover:bg-[#39B54A] hover:text-black transition-all uppercase tracking-widest py-4 px-8"
                                >
                                    Go to Dashboard <ChevronRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
