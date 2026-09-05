import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../../lib/api';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await authApi.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex overflow-hidden">
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    src="https://images.unsplash.com/photo-1549466600-019313cf2010?q=80&w=2000"
                    alt="Nairobi Lifestyle"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-20 left-20 z-10 max-w-lg">
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 mb-6 block">Security First</span>
                    <h2 className="text-6xl font-heading font-light text-white leading-[1.1] tracking-tight mb-8">
                        Recovery <br />
                        <span className="italic opacity-50">Protocol</span>.
                    </h2>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative">
                <div className="mb-12 relative">
                    <button
                        onClick={() => navigate('/login')}
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A90E2] mb-8 hover:opacity-70 transition-all group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                    </button>
                    <div className="flex items-center justify-between mb-8">
                        <Link to="/" className="inline-block">
                            <span className="font-heading font-bold text-3xl tracking-tighter text-gray-900">
                                Muncheez<span className="text-[#4A90E2]">.</span>
                            </span>
                        </Link>
                    </div>
                    {success ? (
                        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-8">
                            <KeyRound className="text-green-600" size={32} />
                        </div>
                    ) : (
                        <h1 className="text-4xl font-heading font-light text-gray-900 tracking-tight mb-3">Recover Access.</h1>
                    )}

                    {!success ? (
                        <p className="text-sm text-gray-500 mb-8 max-w-sm">
                            Enter your email below and we'll send you a secure link to reset your password.
                        </p>
                    ) : (
                        <div className="mb-8">
                            <h1 className="text-4xl font-heading font-light text-gray-900 tracking-tight mb-3">Email Sent.</h1>
                            <p className="text-sm text-gray-500 max-w-sm">
                                Check your inbox for a password reset link. It expires in 15 minutes.
                            </p>
                        </div>
                    )}
                </div>

                {!success && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md"
                    >
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                <p className="text-xs font-bold text-red-600 tracking-tight">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleReset} className="space-y-8">
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
                                    placeholder="name@email.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group w-full flex justify-between items-center py-5 px-8 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-[#4A90E2] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-500 uppercase tracking-widest shadow-xl shadow-gray-200"
                            >
                                {loading ? (
                                    <>
                                        <span>Sending Link...</span>
                                        <Loader2 size={18} className="animate-spin" />
                                    </>
                                ) : (
                                    <>
                                        <span>Send Reset Link</span>
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
