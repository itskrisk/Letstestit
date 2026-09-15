import { useState } from 'react';
import { Instagram, Facebook, Twitter, Linkedin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import appStoreIcon from "../../assets/app-store-icon.png";
import googlePlayIcon from "../../assets/google-play-icon.png";
import CookieModal from '../ui/shared/CookieModal';

export default function Footer() {
    const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);

    return (
        <footer className="bg-black text-white relative z-50 border-t border-white/10" id="contact">
            <div className="container">

                {/* Newsletter - Soulful Update */}
                <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end gap-8 py-10 border-b border-white/5">
                    <div className="max-w-xl text-center lg:text-left">
                        <span className="text-[10px] font-bold text-[#4A90E2] uppercase tracking-[0.4em] mb-3 block">Newsletter</span>
                        <h3 className="text-3xl md:text-5xl font-heading font-light mb-4 tracking-tight">Join the Fam<span className="text-[#4A90E2]">.</span></h3>
                        <p className="text-white/40 font-light leading-relaxed max-w-sm mx-auto lg:mx-0 text-xs md:text-sm">
                            Get the 254 scoop: exclusive deals, city favorites, and the soul of Nairobi delivered to your inbox.
                        </p>
                    </div>
                    <div className="w-full lg:w-auto">
                        <form className="flex w-full md:w-96 relative" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Your email address"
                                className="bg-transparent border-b border-white/20 text-white w-full focus:outline-none focus:border-white/40 transition-all placeholder:text-white/20 text-sm py-2"
                            />
                            <button className="absolute right-0 top-1/2 -translate-y-1/2 text-white hover:text-[#4A90E2] transition-colors">
                                <ArrowRight size={20} />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-10 lg:gap-12 py-10">
                    {/* Identity - Compact Branding */}
                    <div className="col-span-2 lg:col-span-1 border-b lg:border-none border-white/5 pb-8 lg:pb-0">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <span className="font-heading font-bold text-2xl tracking-tighter text-white">
                                Muncheez<span className="text-[#4A90E2]">.</span>
                            </span>
                        </Link>
                        <p className="text-white/20 text-[10px] uppercase tracking-widest leading-relaxed mb-4 max-w-xs">
                            Bringing Nairobi's favorite kitchens straight to your door.
                        </p>
                        <div className="flex gap-4">
                            {[
                                { Icon: Instagram, name: 'Instagram', href: 'https://instagram.com' },
                                { Icon: Facebook, name: 'Facebook', href: 'https://facebook.com' },
                                { Icon: Twitter, name: 'Twitter', href: 'https://twitter.com' },
                                { Icon: Linkedin, name: 'LinkedIn', href: 'https://linkedin.com' }
                            ].map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white/30 hover:text-white transition-colors"
                                >
                                    <social.Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4">Selection</h4>
                        <ul className="space-y-2">
                            {[
                                { name: 'The Kitchens', href: '/stores' },
                                { name: 'The Pantry', href: '/stores' },
                                { name: '254 Gems', href: '/stores' },
                                { name: 'The Oven', href: '/stores' },
                                { name: 'Home Favs', href: '/stores' }
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        className="text-xs text-white/40 hover:text-white transition-colors font-light tracking-wide"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4">Company</h4>
                        <ul className="space-y-2">
                            {[
                                { name: 'About Us', href: '/our-story' },
                                { name: 'Our Team', href: '/our-team' },
                                { name: 'Partner With Us', href: '/partner/login' },
                                { name: 'Join as Rider', href: '/courier/login' }
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link to={item.href} className="text-xs text-white/40 hover:text-white transition-colors font-light tracking-wide">{item.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4">Support</h4>
                        <ul className="space-y-2">
                            {[
                                { name: 'Help', slug: 'help-center' },
                                { name: 'Contact', slug: 'contact-us' },
                                { name: 'FAQs', slug: 'faq' },
                                { name: 'Terms', slug: 'terms-of-service' },
                                { name: 'Privacy', slug: 'privacy-policy' }
                            ].map((item) => (
                                <li key={item.name}>
                                    <Link to={`/legal/${item.slug}`} className="text-xs text-white/40 hover:text-white transition-colors font-light tracking-wide">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Download */}
                    <div className="col-span-1 lg:col-span-1">
                        <h4 className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4">Get App</h4>
                        <div className="flex flex-col gap-2">
                            <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/30 hover:text-white transition-colors group">
                                <img src={appStoreIcon} alt="App Store" className="w-5 h-5 shrink-0 object-contain invert opacity-40 group-hover:opacity-100 transition-opacity" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">App Store</span>
                            </a>
                            <a href="https://play.google.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/30 hover:text-white transition-colors group">
                                <img src={googlePlayIcon} alt="Google Play" className="w-5 h-5 shrink-0 object-contain opacity-40 group-hover:opacity-100 transition-opacity" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Play Store</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/5 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-white/20">
                    <p>© 2026 Muncheez Technologies Ltd. Built for Nairobi.</p>
                    <div className="flex flex-wrap justify-center gap-6">
                        <Link to="/legal/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="/legal/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link to="/admin/login" className="hover:text-white transition-colors">Admin Login</Link>
                        <button onClick={() => setIsCookieModalOpen(true)} className="hover:text-white transition-colors cursor-pointer uppercase">Cookie Settings</button>
                    </div>
                </div>

            </div>

            <CookieModal
                isOpen={isCookieModalOpen}
                onClose={() => setIsCookieModalOpen(false)}
            />
        </footer>
    );
}
