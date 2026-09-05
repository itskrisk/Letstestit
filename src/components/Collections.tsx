import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Heart, Flame, Utensils, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const collections = [
    {
        id: "01",
        name: "Morning Dew",
        tagline: "The Early Rise",
        description: "Artisan coffee, flaky pastries, and the city’s most famous hidden bakeries.",
        image: "https://images.unsplash.com/photo-1544681280-d25a782adc9b?q=60&w=800&auto=format&fit=crop",
        icon: Heart,
        span: "lg:col-span-8 lg:row-span-2",
        aspect: "aspect-[4/3] lg:aspect-auto lg:h-full"
    },
    {
        id: "02",
        name: "Street Kings",
        tagline: "The Hustle",
        description: "The absolute best of local food carts—unfiltered flavors that define the city.",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=60&w=800&auto=format&fit=crop",
        icon: Utensils,
        span: "lg:col-span-4 lg:row-span-2",
        aspect: "aspect-[4/5] lg:aspect-auto lg:h-full"
    },
    {
        id: "03",
        name: "Kula Fiti",
        tagline: "The Balance",
        description: "Clean, organic, and locally-sourced meals for when your body needs a reset.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=60&w=800&auto=format&fit=crop",
        icon: Flame,
        span: "lg:col-span-4",
        aspect: "aspect-[4/5] lg:h-[400px]"
    },
    {
        id: "04",
        name: "The Vault",
        tagline: "Elite Selection",
        description: "Exclusive menus from the city’s premier kitchens. Reserved for the bold.",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
        icon: Globe,
        span: "lg:col-span-8",
        aspect: "aspect-[4/3] lg:h-[400px]"
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
        <section ref={sectionRef} className="relative py-20 lg:py-40 bg-[#D4AF37] overflow-hidden" id="categories">

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
                <div className="relative mb-12 lg:mb-40 text-center lg:text-left">
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

                {/* Experimental Layout: Grid (Desktop) / Horizontal Scroll (Mobile) */}
                <div className="lg:-mx-0 -mx-6">
                    <div className="flex lg:grid lg:grid-cols-12 overflow-x-auto lg:overflow-visible gap-6 lg:gap-8 snap-x snap-mandatory px-6 lg:px-0 pb-12 lg:pb-0 scrollbar-hide">
                        {collections.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                viewport={{ once: true, amount: 0.2 }}
                                className={`relative group shrink-0 w-[85vw] sm:w-[350px] lg:w-auto snap-center ${item.span}`}
                            >
                                <Link
                                    to={`/c/stores?v=kitchen&tag=${item.name.toLowerCase().replace(' ', '-')}`}
                                    className="block h-full w-full"
                                >
                                    <div className="relative h-full overflow-hidden rounded-[2rem] bg-gray-900 shadow-xl isolate">
                                        {/* Image Layer */}
                                        <div className={`w-full ${item.aspect} overflow-hidden`}>
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-[1200ms] ease-out will-change-transform opacity-80 group-hover:opacity-60"
                                            />
                                        </div>

                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                                        {/* Content Layer - Bottom Aligned */}
                                        <div className="absolute bottom-0 left-0 w-full p-8 lg:p-12 z-20 translate-y-0 lg:translate-y-4 lg:group-hover:translate-y-0 transition-transform duration-500 ease-out">
                                            <div className="flex items-end justify-between mb-4">
                                                <div>
                                                    <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                                        {item.tagline}
                                                    </span>
                                                    <h3 className="text-3xl lg:text-5xl font-heading font-bold text-white mb-2 leading-none tracking-tight">
                                                        {item.name}
                                                    </h3>
                                                </div>
                                                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white lg:group-hover:bg-[#D4AF37] lg:group-hover:border-[#D4AF37] lg:group-hover:text-black transition-all duration-300 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 scale-100 lg:scale-75 lg:group-hover:scale-100 origin-right">
                                                    <ArrowRight size={20} className="-rotate-45" />
                                                </div>
                                            </div>
                                            <p className="text-sm lg:text-base text-white/70 font-light max-w-sm line-clamp-2 lg:group-hover:line-clamp-none transition-all duration-500">
                                                {item.description}
                                            </p>
                                        </div>

                                        {/* Floating ID Number */}
                                        <div className="absolute top-6 left-6 z-20">
                                            <span className="text-xs font-bold text-white/30 border border-white/20 px-3 py-1 rounded-full backdrop-blur-md">
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
                <div className="hidden lg:block mt-32 text-center">
                    <Link
                        to="/coming-soon"
                        state={{ name: "Full Selection", status: 'coming soon' }}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-gray-900 transition-all duration-300 group"
                    >
                        Explore Full Selection
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
