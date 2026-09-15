import { Search, ShoppingCart, Package, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef } from 'react';

export default function HowItWorks() {
    const ref = useRef(null);

    const steps = [
        {
            icon: Search,
            title: "Pick Your Crave",
            description: "Browse the city’s best. From local favorites to big brands, we've got the 254 flavor.",
            id: "Phase 01"
        },
        {
            icon: ShoppingCart,
            title: "Easy Tap",
            description: "No stress, no drama. Just one tap and the kitchen is on it.",
            id: "Phase 02"
        },
        {
            icon: Package,
            title: "Doorstep Magic",
            description: "Sit back and relax. We navigate the Nairobi traffic so you don’t have to.",
            id: "Phase 03"
        }
    ];

    return (
        <section ref={ref} className="relative py-24 lg:py-32 bg-[#D4AF37] overflow-hidden text-gray-900" id="how-it-works">

            {/* Editorial Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay grayscale">
                <img
                    src="https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=2000"
                    alt=""
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="container relative z-10 px-8 lg:px-20">
                {/* Header */}
                <div className="max-w-4xl mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-900/60 mb-8 block">
                            The Narrative
                        </span>
                        <h2 className="text-5xl md:text-7xl font-heading font-light text-gray-900 leading-[1.1] tracking-tighter mb-8">
                            How we move <br />
                            <span className="text-gray-900/40 italic">the city</span>.
                        </h2>
                    </motion.div>
                </div>

                {/* Vertical Unboxed Flow */}
                <div className="max-w-4xl relative">
                    <div className="space-y-16 lg:space-y-24 border-t border-gray-900/20 pt-12">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0.2, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                viewport={{ amount: 0.5 }}
                                className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start border-b border-gray-900/20 pb-12"
                            >
                                <div className="md:col-span-3">
                                    <span className="text-xs font-mono font-bold uppercase tracking-[0.4em] text-gray-900/50 block mb-1">
                                        {step.id}
                                    </span>
                                    <step.icon size={28} className="text-gray-900 mt-2" />
                                </div>

                                <div className="md:col-span-9 space-y-4">
                                    <h3 className="text-3xl md:text-5xl font-heading font-light text-gray-900 tracking-tight">
                                        {step.title}
                                    </h3>
                                    <p className="text-lg md:text-xl text-gray-800 font-light leading-relaxed max-w-xl">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Final CTA — Unboxed Editorial Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="mt-24 pt-12 border-t border-gray-900/20"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <p className="text-xl md:text-2xl font-heading font-light text-gray-900/80 leading-relaxed italic max-w-lg">
                            "Built by people who love food as much as you do. Pure city energy."
                        </p>
                        <a
                            href="#categories"
                            className="inline-flex items-center gap-3 border-b-2 border-gray-900 pb-2 text-xs font-bold uppercase tracking-[0.3em] text-gray-900 hover:text-white hover:border-white transition-colors group"
                        >
                            <span>Begin Experience</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
