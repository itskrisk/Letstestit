import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import merchantSignupImg from '../../assets/images/merchantsignup.jpg';

export default function PartnerSignup() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [businessName, setBusinessName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [businessType, setBusinessType] = useState('Restaurant');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [portalHint, setPortalHint] = useState<{ message: string; link: string; label: string } | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setPortalHint(null);

        if (!businessName.trim() || !ownerName.trim() || !email.trim() || !phone.trim() || !password) {
            setError('Please fill in all required fields.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const signupResult = await authApi.signupMerchant({
                email: email.trim(),
                password: password,
                name: ownerName.trim(),
                business_name: businessName.trim(),
                phone: phone.trim(),
                business_type: businessType
            });

            if (signupResult.error) throw new Error(signupResult.error);

            if (signupResult.user) {
                const { error: upsertError } = await supabase
                    .from('merchants')
                    .upsert({
                        id: signupResult.user.id,
                        business_name: businessName.trim(),
                        owner_name: ownerName.trim(),
                        email: email.trim(),
                        phone: phone.trim(),
                        business_type: businessType,
                        status: 'PENDING_APPROVAL',
                        onboarding_step: 1,
                        rating: 5.0,
                        created_at: new Date().toISOString()
                    }, { onConflict: 'id' });

                if (upsertError) {
                    console.warn('Merchant record upsert notice:', upsertError);
                }
            }

            navigate('/auth/verify-email', {
                state: { email: email.trim(), message: 'Account created! Please check your email to verify your account before logging in.' }
            });
        } catch (err: any) {
            let message = err.message || 'An error occurred during signup.';
            if (message.toLowerCase().includes('already registered') || message.toLowerCase().includes('already exists') || message.toLowerCase().includes('email in use')) {
                setPortalHint({
                    message: 'An account with this email already exists.',
                    link: '/partner/login',
                    label: 'Sign in to Merchant Portal'
                });
            } else if (message.toLowerCase().includes('rate limit')) {
                setError("Email rate limit reached. Please wait a moment before trying again, or use a different email.");
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex overflow-hidden">
            {/* Left Side: Editorial Image (Desktop Only) */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    src={merchantSignupImg}
                    alt="Merchant Onboarding"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-20 left-20 z-10 max-w-lg">
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 mb-6 block">Expand Your Reach</span>
                    <h2 className="text-6xl font-heading font-light text-white leading-[1.1] tracking-tight mb-8">
                        Grow with <br />
                        <span className="italic opacity-50">Muncheez</span>.
                    </h2>
                    <p className="text-lg text-white/70 font-light leading-relaxed">
                        Connect with thousands of loyal customers across Nairobi. Streamlined logistics, zero headache.
                    </p>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative overflow-y-auto">
                {/* Logo & Header */}
                <div className="mb-12 relative">
                    <Link
                        to="/partner/login"
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A90E2] mb-8 hover:opacity-70 transition-all group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                    </Link>
                    <div className="flex items-center justify-between mb-8">
                        <Link to="/" className="inline-block">
                            <span className="font-heading font-bold text-3xl tracking-tighter text-gray-900">
                                Muncheez<span className="text-[#4A90E2]">.</span>
                            </span>
                        </Link>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">Merchant Portal</span>
                    </div>
                    <h1 className="text-4xl font-heading font-light text-gray-900 tracking-tight mb-3">Partner with Us.</h1>
                    <p className="text-sm text-gray-500">
                        Already have a partner account?{' '}
                        <Link to="/partner/login" className="font-medium text-[#4A90E2] hover:underline transition-all">
                            Sign in
                        </Link>
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-md w-full"
                >
                    {/* Inline warnings */}
                    {portalHint && (
                        <div className="mb-6 border-b border-amber-400 pb-4">
                            <p className="text-xs text-amber-700 font-medium mb-2">{portalHint.message}</p>
                            <Link to={portalHint.link} className="text-[10px] font-bold uppercase tracking-widest text-black underline underline-offset-2 hover:text-black/50 transition-colors">
                                {portalHint.label} →
                            </Link>
                        </div>
                    )}

                    {error && !portalHint && (
                        <div className="mb-6 border-b border-red-500 pb-3">
                            <p className="text-xs text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                Business Name
                            </label>
                            <input
                                id="merchant-signup-bizname"
                                type="text"
                                required
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                placeholder="e.g. Swahili Plate, Nairobi"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                Owner Full Name
                            </label>
                            <input
                                id="merchant-signup-ownername"
                                type="text"
                                required
                                value={ownerName}
                                onChange={(e) => setOwnerName(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                placeholder="Jane Doe"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                    Business Email
                                </label>
                                <input
                                    id="merchant-signup-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                    placeholder="partner@business.com"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                    Phone Number
                                </label>
                                <input
                                    id="merchant-signup-phone"
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                    placeholder="+254 700 000 000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                Business Category
                            </label>
                            <select
                                value={businessType}
                                onChange={(e) => setBusinessType(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                            >
                                <option value="Restaurant">Restaurant</option>
                                <option value="Bakery">Bakery & Pastry</option>
                                <option value="Grocery">Grocery & Fresh Produce</option>
                                <option value="Liquor">Drinks & Beverages</option>
                                <option value="Specialty">Specialty Store</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                    Password
                                </label>
                                <input
                                    id="merchant-signup-pass"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                    Confirm Password
                                </label>
                                <input
                                    id="merchant-signup-confirmpass"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <p className="text-[10px] text-gray-400 leading-relaxed">
                            By submitting, you agree to our <Link to="/legal/terms-of-service" className="underline hover:text-[#4A90E2]">Partner Terms</Link> and <Link to="/legal/privacy-policy" className="underline hover:text-[#4A90E2]">Privacy Policy</Link>.
                        </p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group w-full flex justify-between items-center py-5 px-8 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-[#4A90E2] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-500 uppercase tracking-widest shadow-xl shadow-gray-200"
                        >
                            {loading ? (
                                <>
                                    <span>Submitting Application...</span>
                                    <Loader2 size={18} className="animate-spin" />
                                </>
                            ) : (
                                <>
                                    <span>Register Partner Account</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
