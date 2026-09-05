import { Search, ShoppingCart, Package, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef } from 'react';

export default function HowItWorks() {
    const ref = useRef(null);
    // Simplified flow for maximum clarity and 'Quiet Luxury' focus

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
        <section ref={ref} className="relative py-24 lg:py-32 bg-[#D4AF37] overflow-hidden" id="how-it-works">

            {/* Editorial Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay grayscale">
                <img
                    src="https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=2000"
                    alt=""
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="container relative z-10 px-8 lg:px-20">
                {/* Header - Apple Style */}
                <div className="max-w-4xl mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-900/60 mb-12 block">
                            The Narrative
                        </span>
                        <h2 className="text-5xl md:text-7xl font-heading font-light text-gray-900 leading-[1.1] tracking-tighter mb-8">
                            How we move <br />
                            <span className="text-gray-900/40 italic">the city</span>.
                        </h2>
                    </motion.div>
                </div>

                {/* Vertical Storyline Flow */}
                <div className="max-w-4xl relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[31px] top-0 bottom-0 w-[0.5px] bg-gray-900/10"></div>

                    <div className="space-y-24 lg:space-y-32">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0.2, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                viewport={{ amount: 0.8 }}
                                className="relative pl-20 md:pl-24 group"
                            >
                                {/* Circle Node */}
                                <div className="absolute left-0 top-0 w-16 h-16 rounded-full bg-[#D4AF37] border border-gray-900/20 flex items-center justify-center z-10 group-hover:bg-gray-900 group-hover:text-white transition-all duration-700">
                                    <step.icon size={24} />
                                </div>

                                <div className="space-y-6">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-900/40">
                                        {step.id}
                                    </span>
                                    <h3 className="text-4xl md:text-5xl font-heading font-light text-gray-900 tracking-tight">
                                        {step.title}
                                    </h3>
                                    <p className="text-xl text-gray-700 font-light leading-relaxed max-w-xl">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Final CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.5 }}
                    className="mt-40 pt-24 border-t border-gray-900/10"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <p className="text-2xl md:text-3xl font-heading font-light text-gray-900/80 leading-relaxed italic max-w-lg">
                            "Built by people who love food as much as you do. Pure city energy."
                        </p>
                        <a
                            href="#categories"
                            className="inline-flex items-center gap-4 bg-gray-900 text-white px-12 py-6 rounded-2xl font-bold text-lg hover:bg-black hover:-translate-y-1 transition-all shadow-2xl"
                        >
                            <span>Begin Experience</span>
                            <ArrowRight size={20} />
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
