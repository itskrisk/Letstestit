import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Heart, Flame, Utensils, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import morningDewImg from '../assets/images/morningdew.jpg';
import streetKingsImg from '../assets/images/streetkings.jpg';
import kulaFitiImg from '../assets/images/kulafiti.jpg';
import theVaultImg from '../assets/images/thevault.jpg';

const collections = [
    {
        id: "01",
        name: "Morning Dew",
        tagline: "The Early Rise",
        description: "Artisan coffee, flaky pastries, and the city’s most famous hidden bakeries.",
        image: morningDewImg,
        icon: Heart,
        span: "lg:col-span-8",
        aspect: "aspect-[4/5] lg:aspect-[4/3] lg:h-[420px]"
    },
    {
        id: "02",
        name: "Street Kings",
        tagline: "The Hustle",
        description: "The absolute best of local food carts—unfiltered flavors that define the city.",
        image: streetKingsImg,
        icon: Utensils,
        span: "lg:col-span-4",
        aspect: "aspect-[4/5] lg:h-[420px]"
    },
    {
        id: "03",
        name: "Kula Fiti",
        tagline: "The Balance",
        description: "Clean, organic, and locally-sourced meals for when your body needs a reset.",
        image: kulaFitiImg,
        icon: Flame,
        span: "lg:col-span-4",
        aspect: "aspect-[4/5] lg:h-[420px]"
    },
    {
        id: "04",
        name: "The Vault",
        tagline: "Elite Selection",
        description: "Exclusive menus from the city’s premier kitchens. Reserved for the bold.",
        image: theVaultImg,
        icon: Globe,
        span: "lg:col-span-8",
        aspect: "aspect-[4/5] lg:aspect-[4/3] lg:h-[420px]"
    }
];

export default function Collections() {
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const titleY = useTransform(scrollYProgress, [0, 0.5], [50, 0]);

    return (
        <section ref={sectionRef} className="relative py-20 lg:py-40 bg-[#D4AF37] overflow-hidden text-gray-900" id="categories">

            {/* Top Curve: Blue to Gold */}
            <div className="absolute top-[-1px] left-0 w-full leading-[0] z-10 rotate-180">
                <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-[60px] block" preserveAspectRatio="none">
                    <path fill="#4A90E2" fillOpacity="1" d="M0,0L48,10C96,20,192,40,288,50C384,60,480,60,576,50C672,40,768,20,864,15C960,10,1056,20,1152,30C1248,40,1344,50,1392,55L1440,60L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z"></path>
                </svg>
            </div>

            {/* Editorial Background Texture */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay grayscale">
                <img
                    src="https://images.unsplash.com/photo-1543353071-873f17a7a088?q=60&w=1600"
                    alt=""
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="container relative z-20 px-6 lg:px-20">

                {/* Header - Huge Architectural Typo */}
                <div className="relative mb-12 lg:mb-32 text-center lg:text-left">
                    <motion.div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                            <div className="h-[1px] w-12 bg-black/20" />
                            <span className="text-xs font-bold uppercase tracking-[0.4em] text-black/60">
                                The 254 Selection
                            </span>
                            <div className="h-[1px] w-12 bg-black/20" />
                        </div>
                        <motion.h2
                            style={{ y: titleY }}
                            className="text-6xl md:text-8xl lg:text-[10rem] font-heading font-black text-gray-900 leading-[0.8] tracking-tighter"
                        >
                            NAIROBI <br />
                            <span className="text-white drop-shadow-lg italic font-serif font-light tracking-normal">Gems.</span>
                        </motion.h2>
                    </motion.div>
                </div>

                {/* Unboxed Grid Layout (No Card Container Boxes) */}
                <div className="lg:-mx-0 -mx-6">
                    <div className="flex lg:grid lg:grid-cols-12 overflow-x-auto lg:overflow-visible gap-6 lg:gap-8 snap-x snap-mandatory px-6 lg:px-0 pb-12 lg:pb-0 scrollbar-hide">
                        {collections.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                viewport={{ once: true, amount: 0.2 }}
                                className={`relative group shrink-0 w-[85vw] sm:w-[350px] lg:w-auto snap-center border-t border-b border-black/20 py-4 ${item.span}`}
                            >
                                <Link
                                    to={`/c/stores?v=kitchen&tag=${item.name.toLowerCase().replace(' ', '-')}`}
                                    className="block h-full w-full"
                                >
                                    <div className="relative h-full overflow-hidden isolate">
                                        {/* Image Layer */}
                                        <div className={`w-full ${item.aspect} overflow-hidden`}>
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-[1000ms] ease-out will-change-transform opacity-90 group-hover:opacity-100"
                                            />
                                        </div>

                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                                        {/* Content Layer - Unboxed Editorial */}
                                        <div className="absolute bottom-0 left-0 w-full p-6 lg:p-8 z-20">
                                            <div className="flex items-end justify-between mb-3">
                                                <div>
                                                    <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-2">
                                                        {item.tagline}
                                                    </span>
                                                    <h3 className="text-3xl lg:text-4xl font-heading font-light text-white leading-none tracking-tight">
                                                        {item.name}
                                                    </h3>
                                                </div>
                                                <div className="text-white hover:text-[#D4AF37] transition-colors">
                                                    <ArrowRight size={20} className="-rotate-45" />
                                                </div>
                                            </div>
                                            <p className="text-sm text-white/80 font-light leading-relaxed max-w-sm">
                                                {item.description}
                                            </p>
                                        </div>

                                        {/* Floating ID */}
                                        <div className="absolute top-4 left-4 z-20">
                                            <span className="text-xs font-bold text-white/60 font-mono tracking-widest border-b border-white/30 pb-0.5">
                                                {item.id}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Footer Stat/Action */}
                <div className="hidden lg:block mt-24 text-center">
                    <Link
                        to="/coming-soon"
                        state={{ name: "Full Selection", status: 'coming soon' }}
                        className="inline-flex items-center gap-3 border-b border-gray-900 pb-2 text-xs font-bold uppercase tracking-[0.3em] text-gray-900 hover:text-white hover:border-white transition-colors group"
                    >
                        Explore Full Selection
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
