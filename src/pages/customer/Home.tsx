import { Link } from "react-router-dom";
import Hero from "../../components/marketing/Hero";
import Services from "../../components/marketing/Services";
import Collections from "../../components/Collections";
import HowItWorks from "../../components/marketing/HowItWorks";
import Stats from "../../components/marketing/Stats";
import Testimonials from "../../components/marketing/Testimonials";
import AppDownload from "../../components/marketing/AppDownload";
import Footer from "../../components/layout/Footer";

export default function Home() {
    return (
        <main>
            <Hero />

            <Services />

            <Collections />

            <HowItWorks />

            <Stats />

            <Testimonials />

            {/* Quiet Luxury Partner/Rider Section - NOW GREEN (ZONE 3) */}
            <section className="relative py-0 bg-[#00A082]">
                {/* Top Curve: Gold to Green */}
                <div className="absolute top-[-1px] left-0 w-full leading-[0] z-10 rotate-180">
                    <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-[60px] block" preserveAspectRatio="none">
                        <path fill="#D4AF37" fillOpacity="1" d="M0,0L48,10C96,20,192,40,288,50C384,60,480,60,576,50C672,40,768,20,864,15C960,10,1056,20,1152,30C1248,40,1344,50,1392,55L1440,60L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z"></path>
                    </svg>
                </div>
                <div className="flex flex-col lg:flex-row border-y border-gray-200/50">

                    {/* Merchant Canvas */}
                    <div className="flex-1 p-20 lg:p-32 border-b lg:border-b-0 lg:border-r border-gray-200/50 group relative overflow-hidden">
                        <div className="relative z-10 transition-transform duration-700 group-hover:-translate-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#D4AF37] mb-12 block">The Collective</span>
                            <h2 className="text-5xl font-heading font-light text-white mb-10 leading-[1.1] tracking-tight">
                                Build Your <br />
                                Legacy.
                            </h2>
                            <p className="text-lg text-white/90 font-light max-w-sm mb-16 leading-relaxed">
                                Join a platform that respects the craft. From local kitchens to city favorites, we're building Nairobi's best together.
                            </p>
                            <div className="flex items-center gap-6">
                                <Link to="/partner/signup" className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-white border-b border-white pb-2 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-colors">
                                    Join the Collective
                                </Link>
                                <Link to="/partner/login" className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">
                                    Login
                                </Link>
                            </div>
                        </div>
                        {/* Faint Texture */}
                        <div className="absolute inset-0 opacity-[0.03] grayscale pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-1000">
                            <img src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1000" alt="" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* Rider Canvas */}
                    <div className="flex-1 p-20 lg:p-32 group relative overflow-hidden">
                        <div className="relative z-10 transition-transform duration-700 group-hover:-translate-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#D4AF37] mb-12 block">The Movement</span>
                            <h2 className="text-5xl font-heading font-light text-white mb-10 leading-[1.1] tracking-tight">
                                Own the <br />
                                Streets.
                            </h2>
                            <p className="text-lg text-white/90 font-light max-w-sm mb-16 leading-relaxed">
                                Move with purpose. Join the city's most intentional courier network and earn on your own terms.
                            </p>
                            <div className="flex items-center gap-6">
                                <Link to="/courier/signup" className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-white border-b border-white pb-2 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-colors">
                                    Join the Fleet
                                </Link>
                                <Link to="/courier/login" className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">
                                    Login
                                </Link>
                            </div>
                        </div>
                        {/* Faint Texture */}
                        <div className="absolute inset-0 opacity-[0.03] grayscale pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-1000">
                            <img src="https://images.unsplash.com/photo-1526367790999-0150786686a2?q=80&w=1000" alt="" className="w-full h-full object-cover" />
                        </div>
                    </div>

                </div>
            </section>

            <AppDownload />

            <Footer />
        </main>
    )
}
