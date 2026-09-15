import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader2, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import merchantLoginImg from '../../assets/images/merchantloginpic.jpg';

export default function PartnerLogin() {
    const navigate = useNavigate();
    const { user, profile, loading: authLoading, signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && user && profile?.roles?.includes('merchant')) {
            navigate('/partner', { replace: true });
        }
    }, [authLoading, user, profile, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { error: signInError } = await signIn(email, password);
            if (signInError) {
                setError(signInError);
                return;
            }
            navigate('/partner', { replace: true });
        } catch (err: any) {
            setError(err.message || 'Invalid business email or password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex overflow-hidden">
            {/* Left Side: Editorial Image (Desktop Only) */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    src={merchantLoginImg}
                    alt="Merchant Partner"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-20 left-20 z-10 max-w-lg">
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 mb-6 block">Partner Portal</span>
                    <h2 className="text-6xl font-heading font-light text-white leading-[1.1] tracking-tight mb-8">
                        Partner <br />
                        <span className="italic opacity-50">Collective</span>.
                    </h2>
                    <p className="text-lg text-white/70 font-light leading-relaxed">
                        Join Nairobi's premier collective of top restaurants, supermarkets, and specialty stores. Reach thousands of customers daily.
                    </p>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative">
                {/* Logo & Header */}
                <div className="mb-12 relative">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-8 hover:opacity-70 transition-all group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Selection
                    </Link>
                    <div className="flex items-center justify-between mb-8">
                        <Link to="/" className="inline-flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-[#f0f2f5] flex items-center justify-center border border-white/40">
                                <Store size={20} className="text-[#D4AF37]" />
                            </div>
                            <span className="font-heading font-bold text-2xl tracking-tighter text-gray-900">
                                PartnerOS<span className="text-[#D4AF37]">.</span>
                            </span>
                        </Link>
                    </div>
                    <h1 className="text-4xl font-heading font-light text-gray-900 tracking-tight mb-3">Welcome Back.</h1>
                    <p className="text-sm text-gray-500">
                        Need a partner account?{' '}
                        <Link to="/partner/signup" className="font-medium text-[#D4AF37] hover:underline transition-all">
                            Request to join
                        </Link>
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-md"
                >
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                <p className="text-xs font-bold text-red-600 tracking-tight">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                Business Email
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#D4AF37] sm:text-sm transition-all"
                                placeholder="business@legacy.com"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    Password
                                </label>
                                <Link to="/auth/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:underline">
                                    Forgot?
                                </Link>
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#D4AF37] sm:text-sm transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group w-full flex justify-between items-center py-5 px-8 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-[#D4AF37] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-500 uppercase tracking-widest shadow-xl shadow-gray-200"
                        >
                            {isLoading ? (
                                <>
                                    <span>Signing in...</span>
                                    <Loader2 size={18} className="animate-spin" />
                                </>
                            ) : (
                                <>
                                    <span>Enter Portal</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-gray-50 flex flex-col gap-6">
                        <div className="flex flex-col gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Switch Portals</span>
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="text-xs font-bold text-[#4A90E2] hover:underline uppercase tracking-widest">Customer Sign In</Link>
                                <span className="w-1 h-1 rounded-full bg-gray-200" />
                                <Link to="/courier/login" className="text-xs font-bold text-black hover:underline uppercase tracking-widest">Fleet Terminal</Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

