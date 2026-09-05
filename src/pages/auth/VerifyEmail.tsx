import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || 'your email';

    return (
        <div className="min-h-screen bg-white flex overflow-hidden">
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2000"
                    alt="Nairobi Lifestyle"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-20 left-20 z-10 max-w-lg">
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 mb-6 block">Almost There</span>
                    <h2 className="text-6xl font-heading font-light text-white leading-[1.1] tracking-tight mb-8">
                        Verify your <br />
                        <span className="italic opacity-50">Identity</span>.
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
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8">
                        <Mail className="text-[#4A90E2]" size={32} />
                    </div>
                    <h1 className="text-4xl font-heading font-light text-gray-900 tracking-tight mb-3">Check your inbox.</h1>
                    <p className="text-sm text-gray-500 max-w-sm mb-8">
                        We've sent a verification link to <span className="font-bold text-gray-900">{email}</span>.
                        Please click the link to confirm your account and start ordering.
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#4A90E2] mt-1.5" />
                            <p className="text-xs font-medium text-blue-900 leading-relaxed">
                                You cannot log in until your email is verified. This ensures the safety of our collective.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <button
                        onClick={() => navigate('/login')}
                        className="group w-full max-w-md flex justify-between items-center py-5 px-8 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-[#4A90E2] transition-all duration-500 uppercase tracking-widest shadow-xl shadow-gray-200"
                    >
                        <span>Go to Login</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
