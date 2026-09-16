import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader2, Bike } from 'lucide-react';
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

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
            setError('Please fill in all required fields.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const signupResult = await authApi.signupCourier({
                email: email.trim(),
                password: password,
                name: fullName.trim(),
                phone: phone.trim()
            });

            if (signupResult.error) throw new Error(signupResult.error);

            if (signupResult.user) {
                // Initial rider record set to ONBOARDING_REQUIRED
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
            let message = err.message || 'An error occurred during signup';
            if (message.toLowerCase().includes('rate limit')) {
                message = "Email rate limit reached. Please wait a while before trying again, or use a different email.";
            } else if (message.toLowerCase().includes('already registered')) {
                message = "An account with this email already exists. Please log in.";
            }
            setError(message);
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
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute bottom-20 left-20 z-10 max-w-lg">
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 mb-6 block">Fleet Network</span>
                    <h2 className="text-6xl font-heading font-light text-white leading-[1.1] tracking-tight mb-8">
                        Deliver <br />
                        <span className="italic opacity-50">Freedom</span>.
                    </h2>
                    <p className="text-lg text-white/70 font-light leading-relaxed">
                        Earn on your own terms. Connect with top local merchants, enjoy instant payouts, and drive with pride.
                    </p>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative overflow-y-auto">
                {/* Logo & Header */}
                <div className="mb-10 relative">
                    <Link
                        to="/courier/login"
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#39B54A] mb-8 hover:opacity-70 transition-all group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                    </Link>
                    <div className="flex items-center justify-between mb-8">
                        <Link to="/" className="inline-flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                <Bike size={18} className="text-[#39B54A]" />
                            </div>
                            <span className="font-heading font-bold text-3xl tracking-tighter text-gray-900">
                                Muncheez<span className="text-[#4A90E2]">.</span>
                            </span>
                        </Link>
                        <span className="px-3 py-1 bg-emerald-50 text-[#39B54A] border border-emerald-200 text-[10px] font-bold uppercase tracking-widest rounded-full">
                            Courier Fleet
                        </span>
                    </div>
                    <h1 className="text-4xl font-heading font-light text-gray-900 tracking-tight mb-3">Join the Fleet.</h1>
                    <p className="text-sm text-gray-500">
                        Create an account to start delivering. Already a courier?{' '}
                        <Link to="/courier/login" className="font-medium text-[#39B54A] hover:underline transition-all">
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
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                            <p className="text-xs font-bold text-red-600 tracking-tight">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#39B54A] sm:text-sm transition-all"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#39B54A] sm:text-sm transition-all"
                                placeholder="name@courier.co.ke"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#39B54A] sm:text-sm transition-all"
                                placeholder="0798 765 432"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#39B54A] sm:text-sm transition-all"
                                placeholder="Create a password"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#39B54A] sm:text-sm transition-all"
                                placeholder="Confirm your password"
                            />
                        </div>

                        <p className="text-[10px] text-gray-400 leading-relaxed">
                            By signing up, you agree to the Muncheez Fleet Terms & Courier Operational Policy. Vehicle & document setup will be completed after logging in.
                        </p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group w-full flex justify-between items-center py-5 px-8 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-[#39B54A] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-500 uppercase tracking-widest shadow-xl shadow-gray-200"
                        >
                            {loading ? (
                                <>
                                    <span>Registering Courier...</span>
                                    <Loader2 size={18} className="animate-spin" />
                                </>
                            ) : (
                                <>
                                    <span>Join Courier Fleet</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                        <span>Need help signing up?</span>
                        <a href="mailto:couriers@muncheez.co.ke" className="font-medium text-[#39B54A] hover:underline">
                            Contact Fleet Support
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
