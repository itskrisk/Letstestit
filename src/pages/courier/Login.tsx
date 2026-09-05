import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2, Bike } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function CourierLogin() {
    const navigate = useNavigate();
    const { user, profile, loading: authLoading, signIn } = useAuth();

    // Auto-redirect if already authenticated as courier
    useEffect(() => {
        if (!authLoading && user && profile?.roles?.includes('courier')) {
            navigate('/courier', { replace: true });
        }
    }, [authLoading, user, profile, navigate]);

    // Auth State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { error: loginError } = await signIn(email, password);
            if (loginError) {
                setError(loginError);
                return;
            }
            navigate('/courier', { replace: true });
        } catch (err: any) {
            setError(err.message || 'Access Denied. Verification failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex overflow-hidden">
            {/* Left Side: Editorial Image (Desktop Only) */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=2000"
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
                        Join Nairobi's premier courier network. Fast payments, real-time dispatch, and the respect you deserve.
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
                        <Link to="/" className="inline-flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-[#f0f2f5] flex items-center justify-center border border-white/40">
                                <Bike size={20} className="text-[#D4AF37]" />
                            </div>
                            <span className="font-heading font-bold text-2xl tracking-tighter text-gray-900">
                                FleetOS<span className="text-[#D4AF37]">.</span>
                            </span>
                        </Link>
                    </div>
                    <h1 className="text-4xl font-heading font-light text-gray-900 tracking-tight mb-3">Welcome Back.</h1>
                    <p className="text-sm text-gray-500">
                        Ready to hit the road?{' '}
                        <Link to="/courier/signup" className="font-medium text-[#4A90E2] hover:underline transition-all">
                            Join the fleet
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
                        <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            <p className="text-xs font-bold text-red-600 tracking-tight">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                Email Address
                            </label>
                            <input
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
                                <Link to="/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-[#4A90E2] hover:underline">
                                    Forgot?
                                </Link>
                            </div>
                            <input
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
                                    <span>Authenticating...</span>
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

                    <div className="mt-12 pt-8 border-t border-gray-50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-6">Or continue with</span>
                        <button className="w-full flex items-center justify-center gap-4 py-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all text-sm font-bold text-gray-700 group">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span className="tracking-tight group-hover:text-black">Log in with Google</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
