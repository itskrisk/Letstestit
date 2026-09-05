import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
    const navigate = useNavigate();
    const { user, profile, loading: authLoading, signIn } = useAuth();
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
            const email = (e.target as any).email.value;
            const password = (e.target as any).password.value;

            const result = await signIn(email, password);
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
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Email</label>
                        <input
                            type="email"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                            placeholder="admin@muncheez.co.ke"
                            defaultValue="admin@muncheez.co.ke"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                            <input
                                type="password"
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                placeholder="••••••••"
                                defaultValue="admin123"
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
            </div>
        </div>
    );
}
