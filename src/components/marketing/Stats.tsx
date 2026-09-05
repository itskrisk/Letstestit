import { motion } from 'framer-motion';
import { Clock, Users, TrendingUp, ThumbsUp } from 'lucide-react';

const stats = [
    {
        value: "20",
        unit: "min",
        label: "Village Market to Kilimani",
        icon: Clock
    },
    {
        value: "1k",
        unit: "+",
        label: "Nairobi's Best",
        icon: Users
    },
    {
        value: "24",
        unit: "/7",
        label: "City Pulse",
        icon: TrendingUp
    },
    {
        value: "100",
        unit: "%",
        label: "Trust the 254",
        icon: ThumbsUp
    }
];

export default function Stats() {
    return (
        <section className="relative py-24 lg:py-32 bg-[#D4AF37] text-gray-900 overflow-hidden">

            {/* Editorial Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay grayscale">
                <img
                    src="https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=2000"
                    alt=""
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="container relative z-10 px-8 lg:px-20">
                {/* Desktop Grid (md+), Mobile Vertical Editorial (default) */}
                <div className="flex flex-col md:grid md:grid-cols-4 gap-x-6 gap-y-20 md:gap-12">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className="flex flex-col md:items-center text-left md:text-center group"
                        >
                            {/* Icon - Discreet on Mobile, Centered on Desktop */}
                            <div className="w-12 h-px bg-black/20 mb-8 md:hidden" />
                            <div className="w-16 h-16 md:mx-auto mb-8 md:mb-12 rounded-2xl bg-black/5 border border-black/5 flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-all duration-700">
                                <stat.icon size={20} className="md:size-6" />
                            </div>

                            {/* Value */}
                            <div className="flex items-baseline md:justify-center mb-4 md:mb-6">
                                <span className="text-7xl md:text-7xl font-heading font-extralight tracking-tighter">{stat.value}</span>
                                <span className="text-2xl font-light text-gray-900/40 ml-1">{stat.unit}</span>
                            </div>

                            {/* Label */}
                            <p className="max-w-[150px] md:max-w-none text-[10px] font-bold uppercase tracking-[0.4em] md:tracking-[0.5em] text-gray-900/60 leading-tight">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
