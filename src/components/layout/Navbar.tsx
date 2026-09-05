import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
    const { user, profile } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const AuthButton = ({ mobile = false }) => {
        // Only customer sessions are recognized in the Customer Navbar.
        // Riders, Merchants, and Admins who land here see a plain Login button.
        const isCustomer = user && (profile?.roles?.includes('customer') || profile?.role === 'customer' || !profile);
        const firstName = profile?.full_name?.split(' ')[0];
        const buttonText = isCustomer ? (firstName || 'ACCOUNT') : 'Login';
        const targetPath = isCustomer ? '/stores' : '/login';

        const baseClasses = mobile
            ? 'w-full py-3.5 text-center text-xs font-bold uppercase tracking-widest rounded-xl transition-all'
            : 'hidden md:flex items-center justify-center px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-300 ';

        const activeStyles = mobile
            ? (user ? 'bg-[#4A90E2] text-white' : 'bg-white text-black font-extrabold')
            : (scrolled
                ? 'bg-white text-black hover:bg-[#4A90E2] hover:text-white shadow-lg'
                : 'bg-white/5 text-white hover:bg-white hover:text-black border border-white/10 hover:border-transparent');

        return (
            <Link
                to={targetPath}
                onClick={() => mobile && setMobileMenuOpen(false)}
                className={`${baseClasses} ${activeStyles} group`}
            >
                <span className="flex items-center justify-center gap-2">
                    {buttonText}
                    {user && !mobile && (
                        <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    )}
                </span>
            </Link>
        );
    };

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`
                    fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-[0.16, 1, 0.3, 1]
                    ${scrolled
                        ? 'py-4 bg-white/[0.08] backdrop-blur-3xl border-b border-white/5 shadow-2xl'
                        : 'py-8 bg-transparent'}
                `}
            >
                <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
                    {/* Left: Hamburger (Mobile) + Brand */}
                    <div className="flex items-center gap-4">
                        {/* Mobile Toggle */}
                        <button
                            className="md:hidden text-white/70 hover:text-white transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
                        </button>

                        {/* Brand */}
                        <Link to="/" className="hidden md:flex items-center gap-2 group">
                            <span className="font-heading font-bold text-lg md:text-2xl tracking-tighter text-white">
                                Muncheez<span className="text-[#4A90E2]">.</span>
                            </span>
                        </Link>
                    </div>

                    {/* Center: Editorial Navigation (Desktop Only) */}
                    <div className="hidden md:flex items-center gap-12">
                        {[
                            { name: 'SELECTION', href: '/#categories' },
                            { name: 'FEED', href: '/social' },
                            { name: 'OUR STORY', href: '/our-story' },
                        ].map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="relative text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 hover:text-white transition-colors py-2 group"
                            >
                                {item.name}
                                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#4A90E2] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out" />
                            </a>
                        ))}
                    </div>

                    {/* Right: Login (Desktop & Mobile) */}
                    <div className="flex items-center gap-8">
                        <AuthButton />

                        {/* Mobile Login Placeholder/Toggle */}
                        {!user && (
                            <Link
                                to="/login"
                                className="md:hidden text-xs font-bold uppercase tracking-widest text-white hover:text-[#4A90E2] transition-colors"
                            >
                                Login
                            </Link>
                        )}
                        {user && (
                            <Link
                                to="/stores"
                                className="md:hidden flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#4A90E2]"
                            >
                                {profile?.full_name?.split(' ')[0] || 'App'} <ArrowRight size={14} />
                            </Link>
                        )}
                    </div>
                </div>
            </motion.nav>

            {/* High-End Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-3xl pt-28 px-8 flex flex-col justify-between pb-12"
                    >
                        {/* Mobile Menu Logo */}
                        <Link
                            to="/"
                            onClick={() => setMobileMenuOpen(false)}
                            className="absolute top-8 left-8 flex items-center gap-2 group"
                        >
                            <span className="font-heading font-bold text-2xl tracking-tighter text-white">
                                Muncheez<span className="text-[#4A90E2]">.</span>
                            </span>
                        </Link>

                        {/* Close Button */}
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="absolute top-8 right-8 p-3 text-white/50 hover:text-white transition-colors"
                        >
                            <X size={28} strokeWidth={1.5} />
                        </button>
                        <div className="flex flex-col gap-6 mt-6">
                            {[
                                { name: 'Our Offering', href: '/#about' },
                                { name: 'Selection', href: '/#categories' },
                                { name: 'Our Story', href: '/our-story' },
                                { name: 'Feed', href: '/social' },
                                { name: 'Contact', href: '/legal/contact-us' },
                                { name: 'The Team', href: '/legal/our-team' },
                            ].map((item, i) => (
                                <motion.a
                                    key={item.name}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 + (i * 0.04) }}
                                    href={item.href}
                                    className="flex items-center gap-4 group"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="text-[#4A90E2]/60 font-mono text-xs group-hover:text-[#4A90E2] transition-colors pt-0.5">
                                        0{i + 1}
                                    </span>
                                    <span className="text-lg font-heading font-light tracking-wide text-white group-hover:text-[#4A90E2] transition-colors">
                                        {item.name}
                                    </span>
                                </motion.a>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3 mt-8">
                            <AuthButton mobile />
                            {!user && (
                                <Link
                                    to="/signup"
                                    className="w-full py-3.5 text-center text-xs font-bold uppercase tracking-widest border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Create Account
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </>
    );
}
