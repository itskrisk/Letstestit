import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import courierImg from '../../assets/images/courierloginndsignup.jpg';

export default function CourierSignup() {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [portalHint, setPortalHint] = useState<{ message: string; link: string; label: string } | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setPortalHint(null);

        if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
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
            const signupResult = await authApi.signupCourier({
                email: email.trim(),
                password: password,
                name: fullName.trim(),
                phone: phone.trim()
            });

            if (signupResult.error) throw new Error(signupResult.error);

            if (signupResult.user) {
                const { error: upsertError } = await supabase
                    .from('riders')
                    .upsert({
                        id: signupResult.user.id,
                        name: fullName.trim(),
                        phone: phone.trim(),
                        email: email.trim(),
                        status: 'ONBOARDING_REQUIRED',
                        is_online: false,
                        rating: 5.0,
                        total_orders: 0,
                        created_at: new Date().toISOString()
                    }, { onConflict: 'id' });

                if (upsertError) {
                    console.warn('Rider record creation notice:', upsertError);
                }
            }

            navigate('/auth/verify-email', {
                state: { email: email.trim(), message: 'Account created! Please check your inbox to verify your email before logging in.' }
            });
        } catch (err: any) {
            let message = err.message || 'An error occurred during signup.';
            if (message.toLowerCase().includes('already registered') || message.toLowerCase().includes('already exists') || message.toLowerCase().includes('email in use')) {
                setPortalHint({
                    message: 'An account with this email already exists.',
                    link: '/courier/login',
                    label: 'Sign in to Courier Terminal'
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
                    src={courierImg}
                    alt="Courier Fleet"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-20 left-20 z-10 max-w-lg">
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 mb-6 block">Fleet Network</span>
                    <h2 className="text-6xl font-heading font-light text-white leading-[1.1] tracking-tight mb-8">
                        Deliver <br />
                        <span className="italic opacity-50">Freedom</span>.
                    </h2>
                    <p className="text-lg text-white/70 font-light leading-relaxed">
                        Earn on your own terms. Instant payouts, real-time dispatch, and drive with pride.
                    </p>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative overflow-y-auto">
                {/* Logo & Header */}
                <div className="mb-12 relative">
                    <Link
                        to="/courier/login"
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
                        <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">Rider Terminal</span>
                    </div>
                    <h1 className="text-4xl font-heading font-light text-gray-900 tracking-tight mb-3">Join the Fleet.</h1>
                    <p className="text-sm text-gray-500">
                        Already a courier?{' '}
                        <Link to="/courier/login" className="font-medium text-[#4A90E2] hover:underline transition-all">
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
                                Full Name
                            </label>
                            <input
                                id="courier-signup-name"
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                Email Address
                            </label>
                            <input
                                id="courier-signup-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                placeholder="rider@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                Phone Number
                            </label>
                            <input
                                id="courier-signup-phone"
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                placeholder="+254 700 000 000"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                    Password
                                </label>
                                <input
                                    id="courier-signup-pass"
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
                                    id="courier-signup-confirmpass"
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
                            By signing up, you agree to our <Link to="/legal/terms-of-service" className="underline hover:text-[#4A90E2]">Rider Terms</Link> and <Link to="/legal/privacy-policy" className="underline hover:text-[#4A90E2]">Privacy Policy</Link>.
                        </p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group w-full flex justify-between items-center py-5 px-8 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-[#4A90E2] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-500 uppercase tracking-widest shadow-xl shadow-gray-200"
                        >
                            {loading ? (
                                <>
                                    <span>Creating Account...</span>
                                    <Loader2 size={18} className="animate-spin" />
                                </>
                            ) : (
                                <>
                                    <span>Register Rider Account</span>
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
