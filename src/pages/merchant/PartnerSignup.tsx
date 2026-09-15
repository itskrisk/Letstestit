import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';

export default function PartnerSignup() {
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
            const signupResult = await authApi.signupMerchant({
                email: email.trim(),
                password: password,
                name: fullName.trim(),
                phone: phone.trim()
            });

            if (signupResult.error) throw new Error(signupResult.error);

            if (signupResult.user) {
                // Initial merchant record set to ONBOARDING_REQUIRED
                const { error: upsertError } = await supabase
                    .from('merchants')
                    .upsert({
                        id: signupResult.user.id,
                        owner_name: fullName.trim(),
                        business_name: `${fullName.trim()}'s Store`,
                        phone: phone.trim(),
                        email: email.trim(),
                        status: 'ONBOARDING_REQUIRED',
                        is_active: false,
                        rating: 0,
                        review_count: 0,
                        delivery_fee: 150,
                        created_at: new Date().toISOString()
                    }, { onConflict: 'id' });

                if (upsertError) {
                    console.warn('Merchant record creation notice:', upsertError);
                }
            }

            navigate('/partner/login', {
                state: { message: 'Account created! Please log in to complete your store profile.' }
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
                    src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2000"
                    alt="Merchant Partner"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute bottom-20 left-20 z-10 max-w-lg">
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 mb-6 block">Partner Portal</span>
                    <h2 className="text-6xl font-heading font-light text-white leading-[1.1] tracking-tight mb-8">
                        Grow Your <br />
                        <span className="italic opacity-50">Business</span>.
                    </h2>
                    <p className="text-lg text-white/70 font-light leading-relaxed">
                        Join Nairobi's premier collective of top restaurants, supermarkets, and specialty stores. Reach thousands of customers daily.
                    </p>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative overflow-y-auto">
                {/* Logo & Header */}
                <div className="mb-10 relative">
                    <Link
                        to="/partner/login"
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-8 hover:opacity-70 transition-all group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                    </Link>
                    <div className="flex items-center justify-between mb-8">
                        <Link to="/" className="inline-block">
                            <span className="font-heading font-bold text-3xl tracking-tighter text-gray-900">
                                Muncheez<span className="text-[#D4AF37]">.</span>
                            </span>
                        </Link>
                        <span className="px-3 py-1 bg-amber-50 text-[#D4AF37] border border-amber-200 text-[10px] font-bold uppercase tracking-widest rounded-full">
                            Merchant Portal
                        </span>
                    </div>
                    <h1 className="text-4xl font-heading font-light text-gray-900 tracking-tight mb-3">Become a Partner.</h1>
                    <p className="text-sm text-gray-500">
                        Create your account to start selling. Already a partner?{' '}
                        <Link to="/partner/login" className="font-medium text-[#D4AF37] hover:underline transition-all">
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
                                Full Name / Representative
                            </label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#D4AF37] sm:text-sm transition-all"
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
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#D4AF37] sm:text-sm transition-all"
                                placeholder="name@company.co.ke"
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
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#D4AF37] sm:text-sm transition-all"
                                placeholder="0712 345 678"
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
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#D4AF37] sm:text-sm transition-all"
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
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#D4AF37] sm:text-sm transition-all"
                                placeholder="Confirm your password"
                            />
                        </div>

                        <p className="text-[10px] text-gray-400 leading-relaxed">
                            By signing up, you agree to the Muncheez Partner Terms & Merchant Guidelines. Business & document setup will be completed after logging in.
                        </p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group w-full flex justify-between items-center py-5 px-8 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-[#D4AF37] hover:text-black disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-500 uppercase tracking-widest shadow-xl shadow-gray-200"
                        >
                            {loading ? (
                                <>
                                    <span>Creating Partner Account...</span>
                                    <Loader2 size={18} className="animate-spin" />
                                </>
                            ) : (
                                <>
                                    <span>Register Store</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                        <span>Need help signing up?</span>
                        <a href="mailto:partners@muncheez.co.ke" className="font-medium text-[#D4AF37] hover:underline">
                            Contact Merchant Support
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
