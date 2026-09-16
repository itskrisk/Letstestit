import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import merchantSignupImg from '../../assets/images/merchantsignup.jpg';

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
            setError('Passwords do not match.');
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

            navigate('/auth/verify-email', {
                state: { email: email.trim(), message: 'Account created! Please check your inbox to verify your email before logging in.' }
            });
        } catch (err: any) {
            let message = err.message || 'An error occurred during signup';
            if (message.toLowerCase().includes('rate limit')) {
                message = 'Email rate limit reached. Please wait a moment before trying again, or use a different email.';
            } else if (message.toLowerCase().includes('already registered')) {
                message = 'An account with this email already exists. Please sign in instead.';
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex overflow-hidden">
            {/* Left Side: Editorial Image */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    src={merchantSignupImg}
                    alt="Merchant Partner"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute bottom-16 left-16 z-10 max-w-sm">
                    <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-white/50 mb-5 block">Partner Portal</span>
                    <h2 className="text-5xl font-heading font-light text-white leading-[1.1] tracking-tight mb-6">
                        Grow Your<br />
                        <span className="italic opacity-40">Business</span>.
                    </h2>
                    <p className="text-base text-white/60 font-light leading-relaxed">
                        Join Nairobi's premier collective of top restaurants, supermarkets, and specialty stores.
                    </p>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-14 lg:px-20 py-14 overflow-y-auto">
                {/* Back */}
                <Link
                    to="/partner/login"
                    className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-black/40 mb-12 hover:text-black transition-colors group w-fit"
                >
                    <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                    Back to Login
                </Link>

                {/* Logo */}
                <div className="mb-10">
                    <Link to="/" className="inline-block mb-1">
                        <span className="font-heading font-black text-2xl tracking-tighter text-black">
                            Muncheez<span className="text-[#4A90E2]">.</span>
                        </span>
                    </Link>
                    <span className="block text-[9px] font-bold uppercase tracking-[0.3em] text-black/30 mt-1">Merchant Portal</span>
                </div>

                {/* Heading */}
                <div className="mb-10 border-b border-black/10 pb-8">
                    <h1 className="text-3xl font-heading font-light text-black tracking-tight mb-2">Become a partner.</h1>
                    <p className="text-sm text-black/40">
                        Already a partner?{' '}
                        <Link to="/partner/login" className="text-black font-medium underline underline-offset-2 hover:text-black/60 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-sm w-full"
                >
                    {error && (
                        <div className="mb-6 border-b border-red-500 pb-3">
                            <p className="text-xs text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-6">
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-black/40 mb-3">
                                Full Name / Representative
                            </label>
                            <input
                                id="partner-signup-name"
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full py-3 px-0 bg-transparent border-b border-black/20 text-black text-sm placeholder-black/20 focus:outline-none focus:border-black transition-colors"
                                placeholder="Your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-black/40 mb-3">
                                Email Address
                            </label>
                            <input
                                id="partner-signup-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full py-3 px-0 bg-transparent border-b border-black/20 text-black text-sm placeholder-black/20 focus:outline-none focus:border-black transition-colors"
                                placeholder="name@company.co.ke"
                            />
                        </div>

                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-black/40 mb-3">
                                Phone Number
                            </label>
                            <input
                                id="partner-signup-phone"
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full py-3 px-0 bg-transparent border-b border-black/20 text-black text-sm placeholder-black/20 focus:outline-none focus:border-black transition-colors"
                                placeholder="0712 345 678"
                            />
                        </div>

                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-black/40 mb-3">
                                Password
                            </label>
                            <input
                                id="partner-signup-password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full py-3 px-0 bg-transparent border-b border-black/20 text-black text-sm placeholder-black/20 focus:outline-none focus:border-black transition-colors"
                                placeholder="Create a password"
                            />
                        </div>

                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-black/40 mb-3">
                                Confirm Password
                            </label>
                            <input
                                id="partner-signup-confirm"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full py-3 px-0 bg-transparent border-b border-black/20 text-black text-sm placeholder-black/20 focus:outline-none focus:border-black transition-colors"
                                placeholder="Confirm your password"
                            />
                        </div>

                        <p className="text-[10px] text-black/30 leading-relaxed pt-1">
                            By signing up, you agree to the Muncheez Partner Terms. Business & document setup completed after login.
                        </p>

                        <div className="pt-1">
                            <button
                                id="partner-signup-btn"
                                type="submit"
                                disabled={loading}
                                className="flex items-center justify-between w-full py-3.5 border-b border-black text-sm font-bold text-black uppercase tracking-widest hover:text-black/50 hover:border-black/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all group"
                            >
                                <span>{loading ? 'Creating Account...' : 'Register Store'}</span>
                                {loading
                                    ? <Loader2 size={16} className="animate-spin" />
                                    : <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                }
                            </button>
                        </div>
                    </form>

                    <div className="mt-10 pt-6 border-t border-black/8 flex items-center justify-between">
                        <span className="text-[10px] text-black/30">Need help signing up?</span>
                        <a href="mailto:partners@muncheez.co.ke" className="text-[10px] font-bold text-black underline underline-offset-2 hover:text-black/50 transition-colors">
                            Merchant Support
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
