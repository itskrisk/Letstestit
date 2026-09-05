import { motion } from 'framer-motion';
import appStoreIcon from "../../assets/app-store-icon.png";
import googlePlayIcon from "../../assets/google-play-icon.png";

export default function AppDownload() {
    return (
        <section className="relative py-24 lg:py-32 bg-[#00A082] text-white overflow-hidden" id="app-download">

            {/* Editorial Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay grayscale">
                <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000"
                    alt=""
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="container relative z-20 px-8 lg:px-20">
                <div className="max-w-4xl flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16 text-center md:text-left">

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        viewport={{ once: true }}
                        className="space-y-6 md:space-y-8"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 block">Get the App</span>
                        <h2 className="text-4xl md:text-6xl font-heading font-light text-white leading-[1.1] tracking-tight">
                            The city in your <br />
                            <span className="text-white/30 italic text-5xl md:text-6xl">pocket.</span>
                        </h2>
                        <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed max-w-md">
                            Tap into the best of Nairobi. From local bakes to fine dining, it's all on Muncheez.
                        </p>
                    </motion.div>

                    {/* App Icons / Buttons */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        viewport={{ once: true }}
                        className="w-full md:w-auto"
                    >
                        {/* Mobile Overhaul: Touch Native Buttons */}
                        <div className="flex flex-col gap-4 md:hidden">
                            <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 bg-white text-black px-8 py-5 rounded-[2rem] active:scale-95 transition-transform group">
                                <img src={appStoreIcon} alt="App Store" className="w-10 h-10 object-contain" />
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Download on</span>
                                    <span className="text-lg font-bold font-heading">App Store</span>
                                </div>
                            </a>
                            <a href="https://play.google.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 bg-black text-white px-8 py-5 rounded-[2rem] border border-white/10 active:scale-95 transition-transform group">
                                <img src={googlePlayIcon} alt="Google Play" className="w-10 h-10 object-contain" />
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Get it on</span>
                                    <span className="text-lg font-bold font-heading">Google Play</span>
                                </div>
                            </a>
                        </div>

                        {/* Desktop Icons */}
                        <div className="hidden md:flex gap-8 items-center">
                            <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="transition-all duration-500 hover:scale-110 hover:-translate-y-1 p-1 hover:bg-[#4A90E2] rounded-[22px]">
                                <img src={appStoreIcon} alt="App Store" className="w-16 h-16 md:w-20 md:h-20 shadow-2xl rounded-2xl invert" />
                            </a>
                            <a href="https://play.google.com" target="_blank" rel="noopener noreferrer" className="transition-all duration-500 hover:scale-110 hover:-translate-y-1 p-1 hover:bg-white/10 rounded-[22px]">
                                <img src={googlePlayIcon} alt="Google Play" className="w-16 h-16 md:w-20 md:h-20 shadow-2xl rounded-2xl" />
                            </a>
                        </div>
                    </motion.div>

                </div>
            </div>

            {/* Bottom Curve (Transition to Footer) */}
            <div className="absolute bottom-[-1px] left-0 w-full leading-[0] z-10">
                <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-[60px] block" preserveAspectRatio="none">
                    <path fill="#000000" fillOpacity="1" d="M0,80L48,71C96,62,192,45,288,47C384,49,480,70,576,73C672,77,768,63,864,58C960,53,1056,57,1152,62C1248,67,1344,75,1392,78L1440,82L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z"></path>
                </svg>
            </div>
        </section>
    );
}
