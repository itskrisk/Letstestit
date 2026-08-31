import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { supabase } from '../../lib/supabaseClient';

export default function Rsvp() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'attending' | 'declined'>('attending');
    const [plusOnes, setPlusOnes] = useState<number>(0);
    const [dietaryNotes, setDietaryNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const REF = "MCH-2026-VIP-RSVP";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('rsvps').insert([{
                full_name: fullName.trim(),
                email: email.trim().toLowerCase(),
                status,
                plus_ones: status === 'attending' ? plusOnes : 0,
                dietary_notes: dietaryNotes.trim() || null,
                event_title: "Online Launch & Product Demonstration",
                event_date: "To Be Confirmed"
            }]);
            if (error) console.warn('[RSVP]:', error.message);
            try {
                await supabase.functions.invoke('send-rsvp-email', {
                    body: { record: { full_name: fullName, email, status, plus_ones: plusOnes, dietary_notes: dietaryNotes } }
                });
            } catch (_) {}
            setIsSubmitted(true);
        } catch (_) {
            setIsSubmitted(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#4A90E2] text-white font-sans overflow-x-hidden flex flex-col">
            <Navbar />

            <section className="relative flex-1 flex items-center justify-center px-6 py-24 pt-36">
                {/* Noise texture */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-overlay" />

                <div className="relative z-10 w-full max-w-lg">

                    <AnimatePresence mode="wait">
                        {!isSubmitted ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.6 }}
                            >
                                {/* Page Header */}
                                <div className="mb-10">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60 block mb-1">
                                        {REF}
                                    </span>
                                    <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-white leading-none">
                                        RSVP<span className="text-[#0A192F]">.</span>
                                    </h1>
                                    <div className="flex h-[2px] mt-4">
                                        <div className="flex-[3] bg-[#0A192F]" />
                                        <div className="flex-1 bg-white" />
                                    </div>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-7">

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Your full name"
                                            className="w-full bg-transparent border-b-2 border-white/30 focus:border-white text-white text-lg py-2.5 outline-none placeholder-white/30 transition-colors font-light"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            className="w-full bg-transparent border-b-2 border-white/30 focus:border-white text-white text-lg py-2.5 outline-none placeholder-white/30 transition-colors font-light"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-3">Will You Attend?</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { val: 'attending' as const, label: 'Confirm Attendance' },
                                                { val: 'declined' as const, label: 'Regretfully Decline' },
                                            ].map(({ val, label }) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setStatus(val)}
                                                    className={`py-3 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                                        status === val
                                                            ? 'bg-white text-[#0A192F] border-white'
                                                            : 'bg-transparent text-white/70 border-white/30 hover:border-white hover:text-white'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {status === 'attending' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="overflow-hidden"
                                        >
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-3">Additional Guests</label>
                                            <div className="flex gap-3">
                                                {[0, 1, 2].map((n) => (
                                                    <button
                                                        key={n}
                                                        type="button"
                                                        onClick={() => setPlusOnes(n)}
                                                        className={`flex-1 py-2.5 text-[10px] font-mono uppercase tracking-wider border transition-all ${
                                                            plusOnes === n
                                                                ? 'bg-white text-[#0A192F] border-white font-bold'
                                                                : 'bg-transparent text-white/70 border-white/30 hover:border-white'
                                                        }`}
                                                    >
                                                        {n === 0 ? 'Just Me' : `+${n}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Notes (Optional)</label>
                                        <input
                                            type="text"
                                            value={dietaryNotes}
                                            onChange={(e) => setDietaryNotes(e.target.value)}
                                            placeholder="Dietary preferences, questions..."
                                            className="w-full bg-transparent border-b border-white/20 focus:border-white text-white text-sm py-2.5 outline-none placeholder-white/30 transition-colors font-light"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 mt-2 bg-[#0A192F] hover:bg-[#071223] text-white font-bold text-xs uppercase tracking-[0.25em] transition-all disabled:opacity-50 border border-transparent hover:border-white/20"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="space-y-6"
                            >
                                <div className="mb-8">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60 block mb-1">
                                        {REF}
                                    </span>
                                    <h1 className="text-4xl font-heading font-bold tracking-tight text-white leading-none">
                                        Confirmed<span className="text-[#0A192F]">.</span>
                                    </h1>
                                    <div className="flex h-[2px] mt-4">
                                        <div className="flex-[3] bg-[#0A192F]" />
                                        <div className="flex-1 bg-white" />
                                    </div>
                                </div>

                                <p className="text-base font-light text-white/85 leading-relaxed">
                                    {status === 'attending'
                                        ? <>Thank you, <strong>{fullName}</strong>. A confirmation email with your access details has been sent to <strong>{email}</strong>.</>
                                        : <>Thank you, <strong>{fullName}</strong>. Your response has been recorded.</>
                                    }
                                </p>

                                <button
                                    onClick={() => setIsSubmitted(false)}
                                    className="text-[10px] font-mono uppercase tracking-widest text-white/50 hover:text-white border-b border-white/20 hover:border-white transition-colors pb-0.5"
                                >
                                    Edit Response
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </section>

            <Footer />
        </div>
    );
}
