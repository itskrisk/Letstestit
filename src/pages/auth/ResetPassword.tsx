import { motion } from 'framer-motion';
import { ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authApi } from '../../lib/api';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Get token from URL hash or query params
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        
        if (accessToken) {
            setToken(accessToken);
        } else {
            // Check query params
            const queryParams = new URLSearchParams(window.location.search);
            const queryToken = queryParams.get('token');
            if (queryToken) {
                setToken(queryToken);
            }
        }
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (!token) {
            setError("Invalid or expired reset link. Please request a new one.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await authApi.resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    if (!token && !success) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-8">
                    <AlertCircle className="text-red-600" size={32} />
                </div>
                <h1 className="text-2xl font-heading font-light text-gray-900 mb-4">Invalid or Expired Link</h1>
                <p className="text-sm text-gray-500 text-center max-w-sm mb-8">
                    The password reset link is invalid or has expired. Please request a new one.
                </p>
                <Link
                    to="/auth/forgot-password"
                    className="py-4 px-8 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-[#4A90E2] transition-colors"
                >
                    Request New Link
                </Link>
            </div>
        );
    }

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
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 mb-6 block">Secure Access</span>
                    <h2 className="text-6xl font-heading font-light text-white leading-[1.1] tracking-tight mb-8">
                        Update <br />
                        <span className="italic opacity-50">Credentials</span>.
                    </h2>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative">
                <div className="mb-12 relative">
                    <div className="flex items-center justify-between mb-8">
                        <Link to="/" className="inline-block">
                            <span className="font-heading font-bold text-3xl tracking-tighter text-gray-900">
                                Muncheez<span className="text-[#4A90E2]">.</span>
                            </span>
                        </Link>
                    </div>
                    {success ? (
                        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-8">
                            <ShieldCheck className="text-green-600" size={32} />
                        </div>
                    ) : (
                        <h1 className="text-4xl font-heading font-light text-gray-900 tracking-tight mb-3">Set New Password.</h1>
                    )}

                    {!success ? (
                        <p className="text-sm text-gray-500 mb-8 max-w-sm">
                            Create a strong, unique password to secure your account.
                        </p>
                    ) : (
                        <div>
                            <h1 className="text-4xl font-heading font-light text-gray-900 tracking-tight mb-3">Password Updated.</h1>
                            <p className="text-sm text-gray-500 max-w-sm">
                                Your password has been successfully reset. Redirecting you to login...
                            </p>
                        </div>
                    )}
                </div>

                {!success && token && (
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

                        <form onSubmit={handleUpdatePassword} className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                    placeholder="Minimum 6 characters"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                    placeholder="Repeat new password"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group w-full flex justify-between items-center py-5 px-8 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-[#4A90E2] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-500 uppercase tracking-widest shadow-xl shadow-gray-200"
                            >
                                {loading ? (
                                    <>
                                        <span>Updating...</span>
                                        <Loader2 size={18} className="animate-spin" />
                                    </>
                                ) : (
                                    <>
                                        <span>Set New Password</span>
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
