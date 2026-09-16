import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import courierImg from '../../assets/images/courierloginndsignup.jpg';

export default function CourierLogin() {
    const navigate = useNavigate();
    const { user, profile, loading: authLoading, signIn } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [portalHint, setPortalHint] = useState<{ message: string; link: string; label: string } | null>(null);

    // Auto-redirect or role mismatch check
    useEffect(() => {
        if (!authLoading && user && profile) {
            const roles: string[] = profile.roles || (profile.role ? [profile.role] : []);
            if (roles.includes('courier')) {
                navigate('/courier', { replace: true });
            } else if (roles.includes('merchant')) {
                setPortalHint({
                    message: 'This email is registered as a merchant account.',
                    link: '/partner/login',
                    label: 'Go to Merchant Portal'
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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setPortalHint(null);
        setIsLoading(true);

        try {
            const { error: loginError } = await signIn(email, password);
            if (loginError) {
                setError(loginError);
                return;
            }
        } catch (err: any) {
            setError(err.message || 'Access denied. Verification failed.');
        } finally {
            setIsLoading(false);
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
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 mb-6 block">Fleet Terminal</span>
                    <h2 className="text-6xl font-heading font-light text-white leading-[1.1] tracking-tight mb-8">
                        Elite <br />
                        <span className="italic opacity-50">Operators</span>.
                    </h2>
                    <p className="text-lg text-white/70 font-light leading-relaxed">
                        Nairobi's premier courier network. Fast payments, real-time dispatch, and total flexibility.
                    </p>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative">
                {/* Logo & Header */}
                <div className="mb-12 relative">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A90E2] mb-8 hover:opacity-70 transition-all group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Selection
                    </Link>
                    <div className="flex items-center justify-between mb-8">
                        <Link to="/" className="inline-block">
                            <span className="font-heading font-bold text-3xl tracking-tighter text-gray-900">
                                Muncheez<span className="text-[#4A90E2]">.</span>
                            </span>
                        </Link>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">Rider Terminal</span>
                    </div>
                    <h1 className="text-4xl font-heading font-light text-gray-900 tracking-tight mb-3">Welcome Back.</h1>
                    <p className="text-sm text-gray-500">
                        Ready to ride?{' '}
                        <Link to="/courier/signup" className="font-medium text-[#4A90E2] hover:underline transition-all">
                            Join the fleet
                        </Link>
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-md w-full"
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

                    {error && !portalHint && (
                        <div className="mb-6 border-b border-red-500 pb-3">
                            <p className="text-xs text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                Email Address
                            </label>
                            <input
                                id="courier-login-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                placeholder="rider@email.com"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    Password
                                </label>
                                <Link to="/auth/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-[#4A90E2] hover:underline">
                                    Forgot?
                                </Link>
                            </div>
                            <input
                                id="courier-login-password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group w-full flex justify-between items-center py-5 px-8 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-[#4A90E2] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-500 uppercase tracking-widest shadow-xl shadow-gray-200"
                        >
                            {isLoading ? (
                                <>
                                    <span>Signing in...</span>
                                    <Loader2 size={18} className="animate-spin" />
                                </>
                            ) : (
                                <>
                                    <span>Access Terminal</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-gray-50 flex flex-col gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Switch Portals</span>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-xs font-bold text-gray-900 hover:text-[#4A90E2] hover:underline uppercase tracking-widest">Customer App</Link>
                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                            <Link to="/partner/login" className="text-xs font-bold text-[#D4AF37] hover:underline uppercase tracking-widest">Merchant Portal</Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
