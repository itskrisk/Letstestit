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

    // Transport Mode
    const [transportMode, setTransportMode] = useState<TransportMode>('Motorbike (Boda)');

    // Vehicle & Contact Details
    const [courierDetails, setCourierDetails] = useState({
        make: '',
        model: '',
        plate: '',
        emergencyName: '',
        emergencyRelation: '',
        emergencyPhone: ''
    });

    // Safety Gear Checklists
    const [gearCheck, setGearCheck] = useState({
        hasHelmet: true,
        hasThermalBag: true,
        hasVest: true
    });

    // Documents
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

            const { error: upsertError } = await supabase
                .from('riders')
                .upsert({
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
                    status: 'PENDING',
                    is_online: false,
                    rating: 5.0,
                    total_orders: 0
                }, { onConflict: 'id' });

            if (upsertError) throw upsertError;

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
            <div className="bg-white border-b border-gray-100 py-6 px-8 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-3">
                    <span className="font-heading font-black text-2xl tracking-tighter text-black">
                        Muncheez<span className="text-[#39B54A]">.</span>
                    </span>
                    <span className="px-3 py-1 bg-[#39B54A]/10 border border-[#39B54A]/30 text-[#39B54A] text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5">
                        <Bike size={12} />
                        Glovo Courier Setup
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

            {/* Main Section */}
            <main className="flex-1 max-w-3xl mx-auto w-full p-6 md:p-10 flex flex-col justify-center">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold flex items-center gap-3">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {/* STEP 1: TRANSPORT MODE SELECTION */}
                    {currentStep === 'MODE' && (
                        <motion.div
                            key="mode"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="space-y-8"
                        >
                            <div>
                                <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-900 tracking-tight">
                                    Choose Your Transport Mode
                                </h1>
                                <p className="text-gray-500 mt-2">
                                    Select how you will deliver. Document requirements dynamically adapt to your choice.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-start gap-4 ${isSelected
                                                    ? 'border-[#39B54A] bg-[#39B54A]/5 shadow-md'
                                                    : 'border-gray-100 bg-white hover:border-gray-200'
                                                }`}
                                        >
                                            <div className={`p-3 rounded-2xl ${isSelected ? 'bg-[#39B54A] text-white' : 'bg-gray-100 text-gray-600'}`}>
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

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setCurrentStep('DETAILS')}
                                    className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#39B54A] transition-all flex items-center gap-2 shadow-lg"
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
                            className="space-y-8"
                        >
                            <div>
                                <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-900 tracking-tight">
                                    Transport & Safety Details
                                </h1>
                                <p className="text-gray-500 mt-2">
                                    {isMotorized ? 'Enter your vehicle specs and emergency contact info.' : 'Enter your emergency contact & verify safety equipment.'}
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
                                {/* Vehicle Specs (If Motorized / Bike) */}
                                {isMotorized && (
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                            Vehicle Information ({transportMode})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                                    Vehicle Make
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Honda / Boxer"
                                                    value={courierDetails.make}
                                                    onChange={e => updateDetails('make', e.target.value)}
                                                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#39B54A] focus:bg-white outline-none font-medium transition-all"
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
                                                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#39B54A] focus:bg-white outline-none font-medium transition-all"
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
                                                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#39B54A] focus:bg-white outline-none font-mono font-bold uppercase transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Emergency Contact */}
                                <div className="space-y-4 pt-2 border-t border-gray-100">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <PhoneCall size={14} className="text-[#39B54A]" />
                                        Emergency Contact (Mandatory for Courier Safety)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1.5">
                                                Contact Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. John Omwamba"
                                                value={courierDetails.emergencyName}
                                                onChange={e => updateDetails('emergencyName', e.target.value)}
                                                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#39B54A] focus:bg-white outline-none font-medium transition-all"
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
                                                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#39B54A] focus:bg-white outline-none font-medium transition-all"
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
                                                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#39B54A] focus:bg-white outline-none font-medium transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Safety Gear Checklist */}
                                <div className="space-y-3 pt-2 border-t border-gray-100">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
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
                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${isChecked
                                                        ? 'border-[#39B54A] bg-[#39B54A]/5'
                                                        : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                                                    }`}
                                            >
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-sm">{item.label}</h4>
                                                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                                </div>
                                                <div className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all ${isChecked ? 'bg-[#39B54A] text-white' : 'bg-gray-200 text-transparent'
                                                    }`}>
                                                    <Check size={14} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => setCurrentStep('MODE')}
                                    className="text-gray-400 hover:text-black font-bold uppercase tracking-widest text-xs flex items-center gap-2"
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
                                    className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#39B54A] transition-all flex items-center gap-2 shadow-lg"
                                >
                                    Continue to Documents <ChevronRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: DOCUMENT UPLOADS (DYNAMIC BY TRANSPORT MODE) */}
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
                                    Identity & Transport Verification
                                </h1>
                                <p className="text-gray-500 mt-2">
                                    Upload clear documents for verification. Requirements adapt to your transport mode ({transportMode}).
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
                                {/* Profile Photo / Selfie */}
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-2">
                                        Profile Photo / Clear Selfie (Required for Customer Trust)
                                    </label>
                                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-[#39B54A] rounded-2xl cursor-pointer bg-gray-50/50 transition-all">
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

                                {/* National ID Card */}
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-2">
                                        National Identity Card / Passport (Front/Back)
                                    </label>
                                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-[#39B54A] rounded-2xl cursor-pointer bg-gray-50/50 transition-all">
                                        <Upload className="text-[#39B54A] mb-1.5" size={24} />
                                        <span className="text-xs font-bold text-gray-700">
                                            {documents.idDocFile ? documents.idDocFile.name : 'Click to select National ID'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            onChange={e => setDocuments(prev => ({ ...prev, idDocFile: e.target.files?.[0] || null }))}
                                        />
                                    </label>
                                </div>

                                {/* Motorized Vehicle Documents (Only for Motorbike / Car / Scooter) */}
                                {isMotorized && (
                                    <>
                                        {/* Driving License */}
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-2">
                                                Valid Driving License
                                            </label>
                                            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-[#39B54A] rounded-2xl cursor-pointer bg-gray-50/50 transition-all">
                                                <FileText className="text-[#39B54A] mb-1.5" size={24} />
                                                <span className="text-xs font-bold text-gray-700">
                                                    {documents.licenseFile ? documents.licenseFile.name : 'Click to select Driving License'}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    className="hidden"
                                                    onChange={e => setDocuments(prev => ({ ...prev, licenseFile: e.target.files?.[0] || null }))}
                                                />
                                            </label>
                                        </div>

                                        {/* Logbook / Sales Agreement */}
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-2">
                                                Vehicle Logbook / Proof of Ownership
                                            </label>
                                            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-[#39B54A] rounded-2xl cursor-pointer bg-gray-50/50 transition-all">
                                                <FileText className="text-[#39B54A] mb-1.5" size={24} />
                                                <span className="text-xs font-bold text-gray-700">
                                                    {documents.logbookFile ? documents.logbookFile.name : 'Click to select Vehicle Logbook'}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    className="hidden"
                                                    onChange={e => setDocuments(prev => ({ ...prev, logbookFile: e.target.files?.[0] || null }))}
                                                />
                                            </label>
                                        </div>

                                        {/* Insurance Certificate */}
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-2">
                                                Motor Vehicle Insurance Certificate
                                            </label>
                                            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-[#39B54A] rounded-2xl cursor-pointer bg-gray-50/50 transition-all">
                                                <Shield className="text-[#39B54A] mb-1.5" size={24} />
                                                <span className="text-xs font-bold text-gray-700">
                                                    {documents.insuranceFile ? documents.insuranceFile.name : 'Click to select Insurance Certificate'}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    className="hidden"
                                                    onChange={e => setDocuments(prev => ({ ...prev, insuranceFile: e.target.files?.[0] || null }))}
                                                />
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => setCurrentStep('DETAILS')}
                                    className="text-gray-400 hover:text-black font-bold uppercase tracking-widest text-xs flex items-center gap-2"
                                >
                                    <ChevronLeft size={16} /> Back
                                </button>
                                <button
                                    onClick={handleSubmitKYC}
                                    disabled={loading}
                                    className="px-8 py-4 bg-[#39B54A] text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-[#2fa03f] transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Submit Application For Review <CheckCircle2 size={18} />
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
                            className="bg-white p-10 md:p-12 rounded-3xl shadow-xl text-center max-w-lg mx-auto border-t-4 border-[#39B54A]"
                        >
                            <div className="w-20 h-20 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 mb-6">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-3xl font-heading font-black text-gray-900 mb-3">
                                Application Submitted!
                            </h2>
                            <p className="text-gray-500 text-sm leading-relaxed mb-8">
                                Your courier verification details and documents have been submitted to Muncheez Fleet Admin for review.
                            </p>

                            <button
                                onClick={() => navigate('/courier/dashboard')}
                                className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#39B54A] hover:text-white transition-all shadow-lg"
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
