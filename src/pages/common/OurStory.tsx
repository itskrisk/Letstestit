import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

/**
 * OUR STORY - Tech Logistics Enterprise & Storyteller Alignment
 * - Background Sequence: Blue (#4A90E2) -> Gold (#D4AF37) -> Green (#00A082) -> Blue (#4A90E2)
 * - Signature SVG Curve transitions
 * - Content: Section 1 (Origin & Proof of Concept) -> Section 2 (Who We Are & What We Do as Tech Logistics) -> Section 3 (Ecosystem & Platform OS) -> Section 4 (Mission & Scale)
 * - Strict Rule: NO PADDING, NO ROUNDED CARDS, NO BOXED CONTAINERS
 */
export default function OurStory() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const titleY = useTransform(scrollYProgress, [0, 0.2], [0, 40]);
    const titleOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

    // Standardized SVG Curves
    const BottomCurve = ({ fill }: { fill: string }) => (
        <div className="absolute bottom-[-1px] left-0 w-full leading-[0] z-20">
            <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-[60px] md:h-[100px] block" preserveAspectRatio="none">
                <path fill={fill} fillOpacity="1" d="M0,0L48,10C96,20,192,40,288,50C384,60,480,60,576,50C672,40,768,20,864,15C960,10,1056,20,1152,30C1248,40,1344,50,1392,55L1440,60L1440,100L1392,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z"></path>
            </svg>
        </div>
    );

    return (
        <div ref={containerRef} className="min-h-screen bg-black font-sans selection:bg-white selection:text-black overflow-x-hidden relative">
            <Navbar />

            {/* SECTION 1: BLUE (#4A90E2) - THE ORIGIN & PROOF OF CONCEPT */}
            <section className="relative bg-[#4A90E2] text-white pt-40 pb-32 lg:pt-48 lg:pb-56 px-6 min-h-[95vh] flex flex-col justify-center">
                <div className="absolute inset-0 z-[5] opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-overlay" />

                <div className="container max-w-7xl mx-auto relative z-10">
                    <motion.div style={{ y: titleY, opacity: titleOpacity }} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                        <div className="lg:col-span-5">
                            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 mb-6 block font-mono">
                                The Origin &bull; Muncheez Technologies
                            </span>
                            <h1 className="text-5xl sm:text-6xl md:text-8xl font-heading font-light tracking-tighter text-white leading-[0.92] mb-8">
                                A City of <br />
                                <span className="font-bold">Hidden Gems.</span>
                            </h1>
                            <p className="text-xs font-mono tracking-widest uppercase text-white/70">
                                Nairobi, Kenya &bull; Hyper-Local Logistics Engine
                            </p>
                        </div>

                        <div className="lg:col-span-7 text-base md:text-xl font-light text-white/95 leading-relaxed space-y-8 border-t border-white/20 pt-8 lg:pt-0 lg:border-t-0">
                            <p className="font-heading font-light text-2xl md:text-3xl text-white leading-snug">
                                It started with a simple realization: <strong>Food is the ultimate stress test for last-mile logistics.</strong>
                            </p>
                            <p className="text-white/80 text-sm md:text-base leading-relaxed">
                                The best <em>kuku choma</em> wasn't in a shiny shopping mall; it was tucked away in a backyard in Westlands. The most authentic sourdough was baking quietly in a micro-kitchen in Karen. Nairobi was bursting with merchant vitality, but legacy delivery platforms treated food like generic cargo—ignoring the soul of the city.
                            </p>
                            <p className="text-white/80 text-sm md:text-base leading-relaxed">
                                Moving temperature-sensitive food through Nairobi's urban density demands sub-second dispatch algorithms, thermal preservation, and absolute respect for the merchant's craft. Mastering culinary delivery proved our logistics architecture—laying the foundation for Muncheez Technologies Ltd. as East Africa's premier hyper-local tech logistics engine.
                            </p>
                            <p className="text-white font-medium text-base md:text-lg border-l-2 border-white/40 pl-6 py-1 italic">
                                "If you can master moving hot meals through Nairobi traffic with sub-minute precision, you can power urban logistics for everything."
                            </p>

                            <div className="grid grid-cols-2 gap-8 border-t border-white/20 pt-8 text-left">
                                <div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/60 block mb-1">Coverage Area</span>
                                    <p className="text-lg font-heading font-light text-white">Primary Urban Hubs</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/60 block mb-1">Architecture</span>
                                    <p className="text-lg font-heading font-light text-white">Real-Time Dispatch AI</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <BottomCurve fill="#D4AF37" />
            </section>

            {/* SECTION 2: GOLD (#D4AF37) - WHO WE ARE */}
            <section className="relative bg-[#D4AF37] text-gray-900 py-32 lg:py-48 px-6">
                <div className="absolute inset-0 z-[5] opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-multiply" />

                <div className="container max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">

                        <div className="lg:col-span-5">
                            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-900/50 mb-6 block font-mono">
                                Muncheez Technologies Ltd. &bull; The Company
                            </span>
                            <h2 className="text-5xl sm:text-6xl md:text-8xl font-heading font-light tracking-tighter text-gray-900 leading-[0.92] mb-8">
                                We Move <br />
                                <span className="font-bold">Cities.</span>
                            </h2>
                            <p className="text-xs font-mono tracking-widest uppercase text-gray-900/50">
                                Nairobi, Kenya &bull; Est. 2026
                            </p>
                        </div>

                        <div className="lg:col-span-7 space-y-8 border-t border-gray-900/20 pt-8 lg:pt-0 lg:border-t-0">
                            <p className="font-heading font-light text-2xl md:text-3xl text-gray-900 leading-snug">
                                Muncheez Technologies Ltd. is a <strong>logistics technology company.</strong> We build and operate the digital infrastructure that powers real-time urban commerce across East Africa.
                            </p>
                            <p className="text-gray-900/80 text-sm md:text-base font-light leading-relaxed">
                                We are not a marketplace. We are the engine underneath it. Our platform connects merchants, consumers, and courier fleets through a single intelligent network — dispatching orders in real time, clearing payments automatically, and managing an entire rider fleet without a single manual call.
                            </p>
                            <p className="text-gray-900/80 text-sm md:text-base font-light leading-relaxed">
                                What started as a culinary delivery platform is now the foundation for something much larger. Our logistics rails stretch across every commercial vertical — food, groceries, pharmacy, retail — and we are just getting started. The future of Muncheez is the future of how East Africa's cities move.
                            </p>
                            <p className="text-gray-900 font-medium text-base md:text-lg border-l-2 border-gray-900/40 pl-6 py-1 italic">
                                "We are building the infrastructure layer that East Africa's urban commerce will run on for the next decade."
                            </p>
                        </div>

                    </div>
                </div>

                <BottomCurve fill="#00A082" />
            </section>


            {/* SECTION 3: GREEN (#00A082) - THE ECOSYSTEM & URBAN OPERATING SYSTEM */}
            <section className="relative bg-[#00A082] text-white py-32 lg:py-48 px-6">
                <div className="absolute inset-0 z-[5] opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-overlay" />

                <div className="container max-w-7xl mx-auto relative z-10">
                    <div className="max-w-3xl mb-20">
                        <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 mb-6 block font-mono">
                            Ecosystem Architecture
                        </span>
                        <h2 className="text-5xl md:text-7xl font-heading font-bold mb-6 tracking-tight leading-[0.95]">
                            The Urban Commerce <br />
                            <span className="font-light italic font-serif text-white/90">Operating System.</span>
                        </h2>
                        <p className="text-lg text-white/80 font-light leading-relaxed">
                            Muncheez operates as a synchronized three-sided network engineered to create sustainable economic value for city consumers, merchant partners, and courier operators.
                        </p>
                    </div>

                    {/* Unboxed 3-Column Ecosystem Grid (NO PADDING CARDS) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-b border-white/20 py-16 text-left">
                        {/* Pillar 1 */}
                        <div className="space-y-4">
                            <span className="text-xs font-mono uppercase tracking-widest text-white/60 block">Pillar 01 &bull; Consumers</span>
                            <h3 className="text-3xl font-heading font-light text-white">Frictionless Experience</h3>
                            <p className="text-sm text-white/80 font-light leading-relaxed">
                                Single-tap M-Pesa checkout, multi-department store discovery, live route telemetry, and guaranteed sub-30 minute delivery SLAs.
                            </p>
                            <div className="border-t border-white/20 pt-4 text-xs font-mono text-white/70 space-y-1">
                                <p>&bull; Instant One-Tap Checkout</p>
                                <p>&bull; Real-Time Route Telemetry</p>
                            </div>
                        </div>

                        {/* Pillar 2 */}
                        <div className="space-y-4">
                            <span className="text-xs font-mono uppercase tracking-widest text-white/60 block">Pillar 02 &bull; Merchants</span>
                            <h3 className="text-3xl font-heading font-light text-white">Merchant Terminals</h3>
                            <p className="text-sm text-white/80 font-light leading-relaxed">
                                Real-time Order Display Terminals, live inventory control, automated financial ledgers, and fair partner commissions.
                            </p>
                            <div className="border-t border-white/20 pt-4 text-xs font-mono text-white/70 space-y-1">
                                <p>&bull; Kitchen & Store Dispatch Systems</p>
                                <p>&bull; Transparent Revenue Analytics</p>
                            </div>
                        </div>

                        {/* Pillar 3 */}
                        <div className="space-y-4">
                            <span className="text-xs font-mono uppercase tracking-widest text-white/60 block">Pillar 03 &bull; Fleet Navigators</span>
                            <h3 className="text-3xl font-heading font-light text-white">Courier Network</h3>
                            <p className="text-sm text-white/80 font-light leading-relaxed">
                                Mobile fleet operating app, automated batch routing, instant digital wallet payouts, rider safety telematics, and career dignity.
                            </p>
                            <div className="border-t border-white/20 pt-4 text-xs font-mono text-white/70 space-y-1">
                                <p>&bull; Instant Wallet Payouts</p>
                                <p>&bull; Telematics & Safety Support</p>
                            </div>
                        </div>
                    </div>
                </div>

                <BottomCurve fill="#4A90E2" />
            </section>

            {/* SECTION 4: BLUE (#4A90E2) - MISSION, SCALE & CORPORATE SIGNATURE */}
            <section className="relative bg-[#4A90E2] text-white py-32 lg:py-48 px-6">
                <div className="absolute inset-0 z-[5] opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-overlay" />

                <div className="container max-w-5xl mx-auto relative z-10 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/70 mb-6 block font-mono">
                        Our Mission & Vision
                    </span>
                    <h2 className="text-5xl md:text-8xl font-heading font-light tracking-tight text-white mb-8 leading-[0.95]">
                        Engineering the Future of <br />
                        <span className="font-bold text-white">East African Logistics.</span>
                    </h2>
                    <p className="text-lg md:text-xl font-light text-white/90 leading-relaxed max-w-3xl mx-auto mb-16">
                        Muncheez Technologies Ltd. is expanding its urban logistics network across major commercial corridors. We build the physical and digital infrastructure that empowers local businesses to scale, riders to thrive, and urban dwellers to access instant friction-free delivery.
                    </p>

                    <div className="flex flex-col items-center justify-center gap-4 border-t border-white/20 pt-16">
                        <p className="font-heading font-bold text-2xl tracking-widest uppercase text-white">
                            Muncheez Technologies Ltd<span className="text-[#D4AF37]">.</span>
                        </p>
                        <span className="text-xs font-mono tracking-widest text-white/70 uppercase">
                            Nairobi, Kenya &bull; Reg No. CPR/2026/MUNCHEEZ &bull; Urban Logistics Infrastructure
                        </span>
                    </div>
                </div>

                <BottomCurve fill="#000000" />
            </section>

            <Footer />
        </div>
    );
}

