import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function ComingSoon() {
    const EASE = [0.16, 1, 0.3, 1] as const;
    const navigate = useNavigate();
    const location = useLocation();

    // Get dynamic title from navigation state or default
    const featureName = location.state?.name || "This Feature";
    const status = location.state?.status || 'coming soon';

    // Different text based on status
    const isUnavailable = status === 'unavailable';
    const title = isUnavailable ? "Unavailable" : "Coming Soon";
    const message = isUnavailable
        ? <><span className="text-[#4A90E2] font-medium">{featureName}</span> is currently down or temporarily deactivated.</>
        : <><span className="text-[#4A90E2] font-medium">{featureName}</span> is being prepped in the kitchen.</>;

    return (
        <section className="relative h-screen supports-[height:100dvh]:h-[100dvh] flex items-center justify-center bg-black overflow-hidden px-6">
            {/* Noise Texture */}
            <div className="absolute inset-0 z-[5] opacity-[0.015] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

            {/* Content - Centered & Simple */}
            <div className="relative z-20 flex flex-col items-center text-center max-w-4xl">
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: EASE }}
                    className="text-[10px] font-bold text-white/30 uppercase tracking-[0.6em] mb-12 flex items-center gap-2"
                >
                    {isUnavailable && <AlertCircle size={10} className="text-red-500/50" />}
                    {isUnavailable ? 'System Alert' : 'Under Development'}
                </motion.span>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5, ease: EASE }}
                    className="text-5xl md:text-8xl lg:text-9xl font-heading font-extralight text-white tracking-tighter mb-8"
                >
                    {title}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.7, ease: EASE }}
                    className="text-base md:text-xl text-white/60 font-light max-w-xl mb-12 leading-relaxed"
                >
                    {message}
                </motion.p>

                <motion.button
                    onClick={() => navigate(-1)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.9, ease: EASE }}
                    className="group flex flex-col items-center gap-2"
                >
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white hover:text-[#4A90E2] transition-colors">
                        Go Back
                    </span>
                    <div className="h-[1px] w-full bg-white/20 group-hover:bg-[#4A90E2] transition-colors" />
                </motion.button>
            </div>
        </section>
    );
}
