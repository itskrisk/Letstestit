import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import theKitchenImg from '../../assets/images/THEKITCHEN.jpg';
import theMarketImg from '../../assets/images/themarket.jpg';
import bakesAndBloomsImg from '../../assets/images/bakesandblooms.jpg';
import apothecaryImg from '../../assets/images/apothecary.jpg';

const offerings = [
    {
        id: "01",
        category: "Fine Dining to Street Eats",
        title: "The Kitchens",
        description: "From Westlands' boutique dining to the legendary food carts of the city center. Delivered with soul.",
        image: theKitchenImg,
    },
    {
        id: "02",
        category: "Supermarkets & Mama Mboga",
        title: "The Market",
        description: "Full supermarket hauls and fresh produce from local stalls, handled with the respect they deserve.",
        image: theMarketImg,
    },
    {
        id: "03",
        category: "Bakeries & Florists",
        title: "Bakes & Blooms",
        description: "Artisan sourdough, delicate pastries, and the city's most vibrant floral arrangements.",
        image: bakesAndBloomsImg,
    },
    {
        id: "04",
        category: "Health & Hydration",
        title: "The Apothecary",
        description: "Quick, discreet pharmacy essentials and professional-grade water delivery for your home.",
        image: apothecaryImg,
    }
];

export default function Services() {
    const ref = useRef(null);
    const [activeId, setActiveId] = useState("01");

    return (
        <section ref={ref} className="relative py-20 lg:py-32 bg-[#4A90E2] text-white overflow-hidden" id="about">

            {/* Faint Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay grayscale">
                <img
                    src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1600"
                    alt=""
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="container relative z-10 px-6 lg:px-20">
                {/* Header */}
                <div className="mb-12 lg:mb-20 text-center lg:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/60 mb-4 block">Our Offerings</span>
                        <h2 className="text-4xl md:text-5xl lg:text-7xl font-heading font-light text-white leading-[1.1] tracking-tighter">
                            Essentials, <br className="hidden lg:block" />
                            Elevated.
                        </h2>
                    </motion.div>
                </div>

                {/* Desktop: Unboxed Interactive Accordion (No rounded card padding) */}
                <div className="hidden lg:flex h-[600px] gap-2 border-t border-b border-white/20 py-6">
                    {offerings.map((item) => (
                        <motion.div
                            key={item.id}
                            className="relative h-full overflow-hidden cursor-pointer group"
                            layout
                            initial={{ flex: 1 }}
                            animate={{ flex: activeId === item.id ? 3 : 1 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            onHoverStart={() => setActiveId(item.id)}
                            onClick={() => setActiveId(item.id)}
                        >
                            {/* Background Image */}
                            <img
                                src={item.image}
                                alt={item.title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                            <div className={`absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-500 ${activeId === item.id ? 'bg-black/10' : ''}`} />

                            {/* Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />

                            {/* Unboxed Content */}
                            <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end h-full">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 border-b border-white/40 pb-0.5">
                                            {item.category}
                                        </span>
                                    </div>

                                    <h3 className={`font-heading font-light tracking-tight transition-colors duration-300 ${activeId === item.id ? 'text-4xl md:text-5xl text-white' : 'text-2xl text-white/70'}`}>
                                        {item.title}
                                    </h3>

                                    <div className="h-4" />
                                    <AnimatePresence initial={false}>
                                        {activeId === item.id && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <p className="text-base text-white/90 font-light leading-relaxed max-w-md mb-6">
                                                    {item.description}
                                                </p>
                                                <Link
                                                    to={`/c/stores?v=${item.title === 'The Kitchens' ? 'kitchen' : item.title === 'The Market' ? 'market' : item.title === 'Bakes & Blooms' ? 'bakes' : 'apothecary'}`}
                                                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white border-b border-white pb-1 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-colors group/btn"
                                                >
                                                    Explore
                                                    <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                                </Link>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="absolute top-6 right-6">
                                <span className="text-xl font-heading font-bold text-white/40 block">
                                    {item.id}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Mobile: Horizontal Snap Scroll (Unboxed Edge-to-Edge) */}
                <div className="lg:hidden -mx-6">
                    <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory px-6 pb-12 scrollbar-hide">
                        {offerings.map((item) => {
                            const targetPath = item.title === 'The Kitchens'
                                ? '/c/stores?v=kitchen'
                                : item.title === 'The Market'
                                    ? '/c/stores?v=market'
                                    : item.title === 'Bakes & Blooms'
                                        ? '/c/stores?v=bakes'
                                        : '/c/stores?v=apothecary';

                            return (
                                <Link
                                    key={item.id}
                                    to={targetPath}
                                    className="relative shrink-0 w-[85vw] aspect-[4/5] overflow-hidden snap-center group block border-t border-b border-white/20"
                                >
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />

                                    <div className="absolute bottom-0 left-0 w-full p-6">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2 block">
                                            {item.category}
                                        </span>
                                        <h3 className="text-3xl font-heading font-light text-white mb-3">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-white/80 font-light leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

            </div>
        </section>
    );
}
