import { Instagram, Facebook, Twitter, Linkedin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import appStoreIcon from "../../assets/app-store-icon.png";
import googlePlayIcon from "../../assets/google-play-icon.png";


export default function Footer() {
    return (
        <footer className="bg-black pt-20 pb-10 text-white relative z-50" id="contact">
            <div className="container">

                {/* Newsletter - Soulful Update */}
                <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end gap-8 mb-16 border-b border-white/5 pb-16">
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
                                className="bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl w-full focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all placeholder:text-white/20 text-sm"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-black font-bold p-2.5 rounded-xl hover:bg-[#4A90E2] hover:text-white transition-colors">
                                <ArrowRight size={20} />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-12 lg:gap-12 mb-16">
                    {/* Identity - Compact Branding */}
                    <div className="col-span-2 lg:col-span-1 border-b lg:border-none border-white/5 pb-10 lg:pb-0">
                        <Link to="/" className="flex items-center gap-2 mb-6">
                            <span className="font-heading font-bold text-2xl tracking-tighter text-white">
                                Muncheez<span className="text-[#4A90E2]">.</span>
                            </span>
                        </Link>
                        <p className="text-white/20 text-[10px] uppercase tracking-widest leading-relaxed mb-6 max-w-xs">
                            Bringing Nairobi’s favorite kitchens straight to your door.
                        </p>
                        <div className="flex gap-3">
                            {[
                                { Icon: Instagram, name: 'Instagram', status: 'unavailable' },
                                { Icon: Facebook, name: 'Facebook', status: 'unavailable' },
                                { Icon: Twitter, name: 'Twitter', status: 'unavailable' },
                                { Icon: Linkedin, name: 'LinkedIn', status: 'unavailable' }
                            ].map((social, i) => (
                                <Link
                                    key={i}
                                    to="/coming-soon"
                                    state={{
                                        name: `Our ${social.name}`,
                                        status: social.status
                                    }}
                                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white hover:text-black transition-all border border-white/10"
                                >
                                    <social.Icon size={14} />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-6">Selection</h4>
                        <ul className="space-y-3">
                            {['The Kitchens', 'The Pantry', '254 Gems', 'The Oven', 'Home Favs'].map((item) => (
                                <li key={item}>
                                    <Link
                                        to="/coming-soon"
                                        state={{ name: item, status: 'coming soon' }}
                                        className="text-xs text-white/40 hover:text-white transition-colors font-light tracking-wide"
                                    >
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-6">Company</h4>
                        <ul className="space-y-3">
                            {[
                                { name: 'About Us', href: '/our-story' },
                                { name: 'Our Team', slug: 'our-team' },
                                { name: 'Join Rider', href: '/courier/login' }
                            ].map((item) => (
                                <li key={item.name}>
                                    {item.slug ? (
                                        <Link to={`/legal/${item.slug}`} className="text-xs text-white/40 hover:text-white transition-colors font-light tracking-wide">{item.name}</Link>
                                    ) : (
                                        <Link to={item.href || '#'} className="text-xs text-white/40 hover:text-white transition-colors font-light tracking-wide">{item.name}</Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-6">Support</h4>
                        <ul className="space-y-3">
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
                        <h4 className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-6">Get App</h4>
                        <div className="flex flex-col gap-3">
                            <Link to="/coming-soon" state={{ name: "The iOS App" }} className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-xl hover:bg-[#4A90E2] hover:border-[#4A90E2] transition-all group overflow-hidden">
                                <img src={appStoreIcon} alt="App Store" className="w-6 h-6 rounded-lg shrink-0 object-contain invert opacity-30 group-hover:opacity-100 transition-opacity" />
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-bold uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">App Store</span>
                                </div>
                            </Link>
                            <Link to="/coming-soon" state={{ name: "The Android App" }} className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-xl hover:bg-[#00A082] hover:border-[#00A082] transition-all group overflow-hidden">
                                <img src={googlePlayIcon} alt="Google Play" className="w-6 h-6 rounded-lg shrink-0 object-contain opacity-30 group-hover:opacity-100 transition-opacity" />
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-bold uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">Play Store</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] uppercase tracking-[0.2em] text-white/20">
                    <p>© 2026 Muncheez. Built for Nairobi.</p>
                    <div className="flex flex-wrap justify-center gap-8">
                        <Link to="/legal/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="/legal/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link to="/admin/login" className="hover:text-white transition-colors">Admin Login</Link>
                        <Link to="/coming-soon" state={{ name: "Cookie Settings" }} className="hover:text-white transition-colors">Cookie Settings</Link>
                    </div>
                </div>

            </div>
        </footer>
    );
}
