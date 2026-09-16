import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import merchantLoginImg from '../../assets/images/merchantloginpic.jpg';

export default function PartnerLogin() {
    const navigate = useNavigate();
    const { user, profile, loading: authLoading, signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [portalHint, setPortalHint] = useState<{ message: string; link: string; label: string } | null>(null);

    useEffect(() => {
        if (!authLoading && user && profile?.roles?.includes('merchant')) {
            navigate('/partner', { replace: true });
        }
    }, [authLoading, user, profile, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setPortalHint(null);

        try {
            const { error: signInError } = await signIn(email, password);
            if (signInError) {
                setError(signInError);
                return;
            }

            // After sign-in, check if role matches merchant portal
            // The user state updates async, so we read from the context after a tick
            await new Promise(r => setTimeout(r, 100));
        } catch (err: any) {
            setError(err.message || 'Invalid email or password.');
        } finally {
            setIsLoading(false);
        }
    };

    // Detect role mismatch after sign-in completes
    useEffect(() => {
        if (!authLoading && user && profile) {
            const roles: string[] = profile.roles || [];
            if (roles.includes('merchant')) {
                navigate('/partner', { replace: true });
            } else if (roles.includes('courier')) {
                setPortalHint({
                    message: 'This email is registered as a rider account.',
                    link: '/courier/login',
                    label: 'Go to Rider Terminal'
                });
            } else if (roles.includes('customer')) {
                setPortalHint({
                    message: 'This email is registered as a customer account.',
                    link: '/login',
                    label: 'Go to Customer Sign In'
                });
            }
        }
    }, [authLoading, user, profile, navigate]);

    return (
        <div className="min-h-screen bg-white flex overflow-hidden">
            {/* Left Side: Editorial Image */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    src={merchantLoginImg}
                    alt="Merchant Partner"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/25" />
                <div className="absolute bottom-16 left-16 z-10 max-w-sm">
                    <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-white/50 mb-5 block">Partner Portal</span>
                    <h2 className="text-5xl font-heading font-light text-white leading-[1.1] tracking-tight mb-6">
                        Partner<br />
                        <span className="italic opacity-40">Collective</span>.
                    </h2>
                    <p className="text-base text-white/60 font-light leading-relaxed">
                        Nairobi's premier collective of top restaurants, supermarkets, and specialty stores.
                    </p>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-14 lg:px-20 py-14">
                {/* Back */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-black/40 mb-12 hover:text-black transition-colors group w-fit"
                >
                    <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                    Back to Muncheez
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
                    <h1 className="text-3xl font-heading font-light text-black tracking-tight mb-2">Welcome back.</h1>
                    <p className="text-sm text-black/40">
                        No account?{' '}
                        <Link to="/partner/signup" className="text-black font-medium underline underline-offset-2 hover:text-black/60 transition-colors">
                            Register your store
                        </Link>
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-sm w-full"
                >
                    {/* Portal mismatch inline notice */}
                    {portalHint && (
                        <div className="mb-6 border-b border-amber-400 pb-4">
                            <p className="text-xs text-amber-700 font-medium mb-2">{portalHint.message}</p>
                            <Link to={portalHint.link} className="text-[10px] font-bold uppercase tracking-widest text-black underline underline-offset-2 hover:text-black/50 transition-colors">
                                {portalHint.label} →
                            </Link>
                        </div>
                    )}

                    {/* Error */}
                    {error && !portalHint && (
                        <div className="mb-6 border-b border-red-500 pb-3">
                            <p className="text-xs text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-7">
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-black/40 mb-3">
                                Business Email
                            </label>
                            <input
                                id="partner-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full py-3 px-0 bg-transparent border-b border-black/20 text-black text-sm placeholder-black/20 focus:outline-none focus:border-black transition-colors"
                                placeholder="you@business.co.ke"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-black/40">
                                    Password
                                </label>
                                <Link to="/forgot-password" className="text-[9px] font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors">
                                    Forgot?
                                </Link>
                            </div>
                            <input
                                id="partner-password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full py-3 px-0 bg-transparent border-b border-black/20 text-black text-sm placeholder-black/20 focus:outline-none focus:border-black transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                id="partner-login-btn"
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center justify-between w-full py-3.5 border-b border-black text-sm font-bold text-black uppercase tracking-widest hover:text-black/50 hover:border-black/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all group"
                            >
                                <span>{isLoading ? 'Signing in...' : 'Enter Portal'}</span>
                                {isLoading
                                    ? <Loader2 size={16} className="animate-spin" />
                                    : <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                }
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 pt-8 border-t border-black/8">
                        <span className="block text-[9px] font-bold uppercase tracking-[0.25em] text-black/30 mb-4">Switch Portals</span>
                        <div className="flex items-center gap-5">
                            <Link to="/login" className="text-[10px] font-bold text-black/40 hover:text-black uppercase tracking-widest transition-colors">Customer</Link>
                            <span className="w-1 h-1 rounded-full bg-black/15" />
                            <Link to="/courier/login" className="text-[10px] font-bold text-black/40 hover:text-black uppercase tracking-widest transition-colors">Rider Terminal</Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
