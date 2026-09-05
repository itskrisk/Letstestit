import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
    const navigate = useNavigate();
    const { user, profile, loading: authLoading, signIn } = useAuth();
    const [email, setEmail] = useState('admin@muncheez.co.ke');
    const [password, setPassword] = useState('admin123');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Auto-redirect if already authenticated as admin
    useEffect(() => {
        if (!authLoading && user && profile?.roles?.includes('admin')) {
            navigate('/admin', { replace: true });
        }
    }, [authLoading, user, profile, navigate]);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // 1. Try to sign in first
            let result = await signIn(email, password);

            // 2. If login fails (user doesn't exist yet), auto-provision the admin user via Supabase Admin
            if (result.error && (result.error.toLowerCase().includes('invalid') || result.error.toLowerCase().includes('credentials') || result.error.toLowerCase().includes('email not confirmed'))) {
                // Directly create the user via supabase signUp (bypassing the AuthContext signUp which checks existing sessions)
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: 'Admin User',
                            role: 'admin'
                        }
                    }
                });

                if (signUpError) {
                    // If user already exists but password wrong, show clearer message
                    if (signUpError.message.toLowerCase().includes('already registered') || signUpError.message.toLowerCase().includes('user already registered')) {
                        setError('Invalid credentials. If you just created your Supabase project, please check your email to confirm the admin account first, then try logging in again.');
                    } else {
                        setError(signUpError.message);
                    }
                    return;
                }

                if (signUpData?.user && !signUpData?.session) {
                    // Email confirmation required
                    setError('Admin account created! Please check your email to confirm the account, then return here to log in.');
                    return;
                }

                // If session is immediate (email confirmation disabled), try sign-in
                if (signUpData?.session) {
                    result = await signIn(email, password);
                }
            }

            if (result.error) {
                setError(result.error);
                return;
            }

            navigate('/admin', { replace: true });
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-900">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center shadow-xl shadow-black/10">
                        <ShieldCheck size={32} />
                    </div>
                </div>

                <h1 className="text-2xl font-black text-center mb-2 tracking-tighter">
                    Admin Portal<span className="text-[#D4AF37]">.</span>
                </h1>
                <p className="text-center text-gray-400 mb-10 font-medium text-sm">Secure Access Only</p>

                <form onSubmit={handleLogin} className="space-y-4 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold uppercase tracking-widest border border-red-100">
                            {error}
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Username or Email</label>
                        <input
                            name="email"
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                            placeholder="admin or admin@muncheez.co.ke"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                            <input
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-black text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2 group mt-4"
                    >
                        {isLoading ? 'Authenticating...' : 'Access Dashboard'}
                        {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-6">
                    Master Admin: <strong>admin</strong> / <strong>admin123</strong>
                </p>
            </div>
        </div>
    );
}
