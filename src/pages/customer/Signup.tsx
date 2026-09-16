import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader2, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import customerLoginImg from '../../assets/images/customerloginpic.jpg';

export default function Signup() {
    const navigate = useNavigate();
    const { user, profile, signOut, loading: authLoading, addRole, signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [portalHint, setPortalHint] = useState<{ message: string; link: string; label: string } | null>(null);
    const [addingRole, setAddingRole] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setPortalHint(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            if (user) {
                // User is already logged in — add customer role to their existing account
                setAddingRole(true);
                const { error: addRoleError } = await addRole('customer');

                if (addRoleError) throw new Error(addRoleError);

                navigate('/stores', { replace: true });
            } else {
                // New user signup
                const { error: signupError } = await signUp(email, password, {
                    name: fullName,
                    role: 'customer',
                });

                if (signupError) throw new Error(signupError);

                navigate('/auth/verify-email', {
                    state: { email: email }
                });
                return;
            }
        } catch (err: any) {
            let message = err.message || 'An error occurred during signup.';
            if (message.toLowerCase().includes('already registered') || message.toLowerCase().includes('already exists') || message.toLowerCase().includes('email in use')) {
                setPortalHint({
                    message: 'An account with this email already exists.',
                    link: '/login',
                    label: 'Sign in to your account'
                });
            } else if (message.toLowerCase().includes('rate limit')) {
                message = "Email rate limit reached. Please wait a while before trying again, or use a different email.";
                setError(message);
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
            setAddingRole(false);
        }
    };

    // Active Session Guard — Clean Editorial Design (No Card Boxes)
    if (!authLoading && user) {
        const roles = profile?.roles || (profile?.role ? [profile.role] : []);
        const hasCustomerRole = roles.includes('customer');

        if (hasCustomerRole) {
            navigate('/stores', { replace: true });
            return null;
        }

        const currentRole = roles[0] || profile?.role || 'user';
        const portalMap: Record<string, { label: string; path: string }> = {
            merchant: { label: 'Merchant Portal', path: '/partner' },
            courier: { label: 'Courier Terminal', path: '/courier' },
            admin: { label: 'Admin Console', path: '/admin' },
        };
        const currentPortal = portalMap[currentRole];

        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-8">
                <div className="max-w-md w-full border-b border-black/10 pb-8">
                    <Link to="/" className="inline-block mb-8">
                        <span className="font-heading font-bold text-3xl tracking-tighter text-gray-900">
                            Muncheez<span className="text-[#4A90E2]">.</span>
                        </span>
                    </Link>
                    <h1 className="text-3xl font-heading font-light text-gray-900 tracking-tight mb-3">Add Customer Access</h1>
                    <p className="text-sm text-gray-500 mb-2">
                        Logged in as <strong className="text-gray-900">{user.email}</strong>
                    </p>
                    <p className="text-xs text-gray-400 mb-8 leading-relaxed">
                        Your account has the <strong className="capitalize text-gray-700">{currentRole}</strong> role. You can add Customer access to your account or switch to your existing portal.
                    </p>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleSignup}
                            disabled={loading || addingRole}
                            className="group w-full flex justify-between items-center py-5 px-8 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-[#4A90E2] disabled:bg-gray-400 uppercase tracking-widest transition-all"
                        >
                            <span>{addingRole ? 'Adding Access...' : 'Add Customer Access'}</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        {currentPortal && (
                            <Link
                                to={currentPortal.path}
                                className="w-full text-center py-4 border-b border-gray-200 text-xs font-bold uppercase tracking-widest text-gray-900 hover:text-[#4A90E2] transition-colors"
                            >
                                Go to {currentPortal.label} →
                            </Link>
                        )}
                        <button
                            onClick={async () => { await signOut(); }}
                            className="w-full text-center py-3 text-xs font-bold uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors flex items-center gap-2 justify-center"
                        >
                            <LogOut size={14} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex overflow-hidden">
            {/* Left Side: Editorial Image (Desktop Only) */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    src={customerLoginImg}
                    alt="Customer Signup"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-20 left-20 z-10 max-w-lg">
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 mb-6 block">The 254 Scoop</span>
                    <h2 className="text-6xl font-heading font-light text-white leading-[1.1] tracking-tight mb-8">
                        Join the <br />
                        <span className="italic opacity-50">Collective</span>.
                    </h2>
                    <p className="text-lg text-white/70 font-light leading-relaxed">
                        Become part of the most intentional delivery network in the city. From local heroes to global favorites.
                    </p>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative overflow-y-auto">
                {/* Logo & Header */}
                <div className="mb-12 relative">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A90E2] mb-8 hover:opacity-70 transition-all group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                    </Link>
                    <div className="flex items-center justify-between mb-8">
                        <Link to="/" className="inline-block">
                            <span className="font-heading font-bold text-3xl tracking-tighter text-gray-900">
                                Muncheez<span className="text-[#4A90E2]">.</span>
                            </span>
                        </Link>
                    </div>
                    <h1 className="text-4xl font-heading font-light text-gray-900 tracking-tight mb-3">Join the Fam.</h1>
                    <p className="text-sm text-gray-500">
                        Create an account to start your journey. Already a member?{' '}
                        <Link to="/login" className="font-medium text-[#4A90E2] hover:underline transition-all">
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

                    <form onSubmit={handleSignup} className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                Full Name
                            </label>
                            <input
                                id="customer-name"
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                placeholder="Enter your name"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                Email Address
                            </label>
                            <input
                                id="customer-signup-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                placeholder="name@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                Password
                            </label>
                            <input
                                id="customer-signup-password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                placeholder="Create a password"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                                Confirm Password
                            </label>
                            <input
                                id="customer-signup-confirm-password"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full px-0 py-3 border-b border-gray-100 bg-transparent text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#4A90E2] sm:text-sm transition-all"
                                placeholder="Confirm your password"
                            />
                        </div>

                        <p className="text-[10px] text-gray-400 leading-relaxed">
                            By signing up, you agree to our <Link to="/legal/terms-of-service" className="underline hover:text-[#4A90E2]">Terms</Link> and <Link to="/legal/privacy-policy" className="underline hover:text-[#4A90E2]">Privacy Policy</Link>.
                        </p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group w-full flex justify-between items-center py-5 px-8 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-[#4A90E2] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-500 uppercase tracking-widest shadow-xl shadow-gray-200"
                        >
                            {loading ? (
                                <>
                                    <span>Creating Account...</span>
                                    <Loader2 size={18} className="animate-spin" />
                                </>
                            ) : (
                                <>
                                    <span>Get Started</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-gray-50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-6">Or join using</span>
                        <button className="w-full flex items-center justify-center gap-4 py-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all text-sm font-bold text-gray-700 group">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span className="tracking-tight group-hover:text-black">Sign up with Google</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
