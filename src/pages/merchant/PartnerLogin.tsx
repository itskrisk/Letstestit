import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Lock, Loader2, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
        <div className="min-h-screen bg-[#FDFBF7] flex font-sans">
            {/* LEFT SIDE - Editorial Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2000&auto=format&fit=crop"
                    alt="Restaurant kitchen"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="relative z-10 flex flex-col justify-end p-12 text-white">
                    <div className="space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center">
                            <Store size={32} className="text-[#D4AF37]" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter leading-[0.9]">
                            Partner<br />
                            <span className="text-[#D4AF37]">Portal.</span>
                        </h1>
                        <p className="text-sm text-white/70 max-w-sm leading-relaxed">
                            Join Nairobi's premier collective of restaurants, supermarkets, and pharmacies. Reach thousands of hungry customers.
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full bg-[#D4AF37]/30 border-2 border-black flex items-center justify-center text-xs font-bold">
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs text-white/60 font-medium">500+ Partners Active</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 relative overflow-y-auto">
                {/* Mobile Logo */}
                <div className="lg:hidden flex justify-center mb-8">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="font-heading font-bold text-2xl tracking-tighter text-gray-900">
                            Muncheez<span className="text-[#D4AF37]">.</span>
                        </span>
                    </Link>
                </div>

                <div className="max-w-md mx-auto w-full">
                    {/* Back Link */}
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-8 hover:opacity-70 transition-all group"
                    >
                        <ArrowRight size={14} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                        Back to Selection
                    </Link>

                    {/* Header */}
                    <div className="mb-10">
                        <h2 className="text-4xl font-heading font-bold text-gray-900 tracking-tight mb-2">
                            Welcome Back.
                        </h2>
                        <p className="text-sm text-gray-500 font-light italic">
                            "Empowering Nairobi's Local Legends."
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            <p className="text-xs font-bold text-red-600 tracking-tight">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">
                                Business Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-gray-400">
                                    <Mail size={16} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-8 pr-4 py-3 border-b border-gray-100 bg-transparent text-gray-900 focus:outline-none focus:border-[#D4AF37] text-sm transition-all"
                                    placeholder="business@legacy.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-gray-400">
                                    <Lock size={16} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-8 pr-4 py-3 border-b border-gray-100 bg-transparent text-gray-900 focus:outline-none focus:border-[#D4AF37] text-sm transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group w-full flex justify-between items-center py-5 px-8 rounded-2xl text-sm font-bold text-white bg-black hover:bg-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 uppercase tracking-widest"
                        >
                            {isLoading ? (
                                <>
                                    Authenticating...
                                    <Loader2 size={18} className="animate-spin" />
                                </>
                            ) : (
                                <>
                                    Enter Portal
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 flex flex-col gap-6 text-center border-t border-gray-100 pt-8">
                        <Link to="/partner/signup" className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest hover:underline">
                            Request to Join the Collective
                        </Link>

                        <div className="flex flex-col gap-3 pt-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 block">Wrong Door?</span>
                            <div className="flex items-center justify-center gap-4">
                                <Link to="/login" className="text-[10px] font-bold text-gray-400 hover:text-[#4A90E2] uppercase tracking-[0.2em]">Customer Sign In</Link>
                                <span className="w-1 h-1 rounded-full bg-gray-100" />
                                <Link to="/courier/login" className="text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-[0.2em]">Courier Terminal</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
