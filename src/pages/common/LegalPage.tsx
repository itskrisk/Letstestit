import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, LucideIcon, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

// --- Types ---
type PageType = 'legal' | 'narrative' | 'utility';

interface PageData {
    type: PageType;
    title: string;
    subtitle: string;
    content: string;
    lastUpdated?: string;
    sections?: { title: string; body: string | string[] }[];
    team?: { name: string; role: string; bio: string }[];
    contact?: { type: string; value: string; icon: LucideIcon }[];
}

// --- Content Data ---
// (Kept separate for readability, would distinct files in prod)
const pages: Record<string, PageData> = {
    // 1. LEGAL ARCHIVES (Split Screen)
    'terms-of-service': {
        type: 'legal',
        title: 'Terms of Service',
        subtitle: 'The Foundation',
        lastUpdated: '01.01.2026',
        content: "Detailed protocols governing the use of the Muncheez platform. By engaging with our services, you agree to these binding terms.",
        sections: [
            { title: "1. Agreement to Terms", body: "By accessing or using Muncheez (the 'Platform'), you explicitly agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you must cease use immediately. These terms constitute a legally binding agreement between you and Muncheez Kenya Ltd." },
            { title: "2. Eligibility & Account Integrity", body: "You must be at least 18 years of age to use Muncheez. By creating an account, you warrant that all information provided is accurate and current. You are responsible for safeguarding your credentials and for all activities that occur under your account." },
            { title: "3. Service Scope", body: "Muncheez acts as an intermediary platform connecting users with independent restaurant partners ('Merchants') and independent delivery riders. While we facilitate the transaction, the Merchant is solely responsible for the quality, safety, and hygiene of the food products." },
            { title: "4. Payments & Financial Terms", body: "All prices are listed in Kenya Shillings (KES). Payments are processed securely via M-Pesa and authorized card processors. By initiating a transaction, you authorize us to charge the total amount including food costs, delivery fees, and applicable taxes." },
            { title: "5. Order Cancellations & Refunds", body: "Orders may be cancelled for a full refund ONLY prior to Merchant acceptance. Once preparation has begun, cancellations are non-refundable. Refunds for missing items, wrong orders, or quality issues are subject to verification." },
            { title: "6. User Code of Conduct", body: "We enforce a strict zero-tolerance policy against harassment, abuse, or discrimination towards our Riders, Merchants, or Support Staff. Violation of this policy will result in immediate and permanent account suspension." },
            { title: "7. Intellectual Property Rights", body: "The Muncheez name, logo, design, and all underlying software are the exclusive intellectual property of Muncheez. You are granted a limited, non-exclusive license to use the app for personal, non-commercial purposes only." },
            { title: "8. Limitation of Liability", body: "To the maximum extent permitted by Kenyan law, Muncheez shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service." },
            { title: "9. Data Protection & Privacy", body: "Your use of the Platform is subject to our Privacy Policy. We process personal data in strict compliance with the Kenya Data Protection Act, 2019." },
            { title: "10. Governing Law", body: "These Terms are governed by the laws of the Republic of Kenya. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Nairobi." }
        ]
    },
    'privacy-policy': {
        type: 'legal',
        title: 'Privacy Policy',
        subtitle: 'Your Data, Respected',
        lastUpdated: '01.01.2026',
        content: "Muncheez is committed to protecting your privacy in compliance with the Kenya Data Protection Act, 2019. We believe in transparency and the fundamental rights of our users.",
        sections: [
            { title: "1. Data We Collect", body: "We collect only data necessary for our operations: (a) Identity Data: Name, phone number (for M-Pesa), email; (b) Location Data: Delivery coordinates and saved addresses; (c) Transaction Data: Order history and payment references (we do not store full card details); (d) Usage Data: App interactions to improve our UX." },
            { title: "2. Purpose of Processing", body: "We process your data to: (a) Fulfill delivery contracts; (b) Process payments via M-Pesa/Card; (c) Provide customer support; (d) Ensure platform security and fraud prevention; (e) Comply with legal obligations (KRA, ODPC)." },
            { title: "3. Legal Basis for Processing", body: "Our processing is lawful under the Data Protection Act: (a) Performance of Contract (delivering food); (b) Legal Obligation (tax/regulatory); (c) Legitimate Interest (security/improvement); (d) Consent (marketing/location tracking)." },
            { title: "4. Data Sharing & Third Parties", body: "We do not sell your data. We share data only with: (a) Merchants (to prepare your order); (b) Riders (to find your location); (c) Payment Processors (Safaricom/Gateways); (d) Legal Authorities (when required by court order)." },
            { title: "5. International Data Transfers", body: "Muncheez complies with data localization requirements. A primary copy of your data is hosted within compliant jurisdictions. Any cross-border transfer is conducted with appropriate safeguards as required by the ODPC." },
            { title: "6. Data Security", body: "We employ industry-standard encryption (TLS 1.2+), strict access controls, and regular security audits to protect your personal information against unauthorized access, loss, or destruction." },
            { title: "7. Your Rights", body: "Under the Data Protection Act, you have the right to: (a) Access your data; (b) Request rectification of errors; (c) Request erasure ('Right to be Forgotten'); (d) Object to processing; (e) Withdraw consent. Contact privacy@muncheez.com to exercise these rights." },
            { title: "8. Data Retention", body: "We retain transaction data for 7 years as required by Kenyan tax laws. Account information is retained while your account is active. You may request account deletion at any time." },
            { title: "9. Children's Privacy", body: "Muncheez is not intended for use by persons under 18. We do not knowingly collect data from minors." },
            { title: "10. Contact Us", body: "For privacy inquiries or to reach our Data Protection Officer, please email privacy@muncheez.com or visit our offices in Westlands, Nairobi." }
        ]
    },

    // 3. THE UTILITY (Concierge Grid)
    'faq': {
        type: 'utility',
        title: 'Q & A',
        subtitle: 'Concierge Desk',
        content: "Common questions about navigating the Muncheez experience.",
        sections: [
            { title: "How long does delivery take?", body: "Most orders arrive within 30-45 minutes. We prioritize speed and handled-with-care delivery to ensure your food arrives exactly as intended." },
            { title: "What suburbs do you cover?", body: "We currently cover Westlands, Kilimani, Lavington, Kileleshwa, and the CBD, with expansion across the wider Nairobi area coming soon." },
            { title: "Can I pay with M-Pesa?", body: "Absolutely. M-Pesa is integrated deeply into our platform for a seamless, secure, and fast checkout experience. We also support card payments." },
            { title: "How do I become a partner?", body: "Navigate to our 'Partner With Us' section in the footer. Fill in your details, and our Collective team will reach out." }
        ]
    },
    'contact-us': {
        type: 'utility',
        title: 'Contact Us',
        subtitle: 'Direct Line',
        content: "Based in the heart of Nairobi. We're always listening.",
        contact: [
            { type: "Email", value: "hello@muncheez.com", icon: Mail },
            { type: "Phone", value: "+254 700 000 000", icon: Phone },
            { type: "HQ", value: "Westlands, Nairobi, KE", icon: MapPin }
        ]
    },
    'help-center': {
        type: 'utility',
        title: 'Help Center',
        subtitle: 'Support',
        content: "Need assistance? Browse our FAQs or get in touch directly.",
        sections: [
            { title: "Where is my order?", body: "You can track your order in real-time via the 'Orders' tab in the app. If you need further assistance, please contact support." },
            { title: "I have a problem with my food.", body: "We take quality seriously. If your order is incorrect or unsatisfactory, please use the 'Report Issue' button on the order details page or call us immediately." },
            { title: "Payment issues?", body: "If a payment failed but you were charged, the reversal usually happens automatically within 24 hours. If not, contact us with your transaction reference." }
        ]
    }
};


// --- LAYOUT 1: LEGAL ARCHIVES (Split Screen Sticky) ---
function LegalLayout({ page }: { page: PageData }) {
    const [activeSection, setActiveSection] = useState(0);
    const navigate = useNavigate();

    return (
        <div className="flex flex-col lg:flex-row min-h-screen">
            {/* Left Column: Sticky Title & Nav */}
            <div className="lg:w-1/3 pt-12 lg:pt-24 px-6 lg:px-12 pb-12 lg:h-screen lg:sticky lg:top-0 flex flex-col justify-start border-r border-white/5">
                {/* Back Button - Original Style */}
                <div className="mb-12">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A90E2] hover:text-white transition-all group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>
                </div>

                <div>
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-bold text-[#4A90E2] uppercase tracking-[0.4em] mb-6 block">
                        {page.subtitle}
                    </motion.span>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl lg:text-7xl font-heading font-extralight tracking-tighter mb-8 text-white leading-[0.9]">
                        {page.title.split(" ").map((word, i) => (
                            <span key={i} className="block">{word}</span>
                        ))}
                    </motion.h1>
                    <p className="text-white/40 text-xs font-mono tracking-widest mb-12">
                        LAST UPDATED: <span className="text-white">{page.lastUpdated}</span>
                    </p>
                </div>

                {/* Table of Contents (Desktop Only) */}
                <div className="hidden lg:block space-y-4 overflow-y-auto max-h-[40vh] pr-4 custom-scrollbar mt-auto">
                    {page.sections?.map((section, i) => (
                        <button
                            key={i}
                            onClick={() => document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: 'smooth' })}
                            className={`text-left text-xs uppercase tracking-widest transition-colors block w-full truncate ${activeSection === i ? 'text-white font-bold' : 'text-white/30 hover:text-white/60'}`}
                        >
                            {section.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Column: Scrollable Content */}
            <div className="lg:w-2/3 pt-12 lg:pt-40 px-6 lg:px-20 pb-40">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-24">
                    <p className="text-xl md:text-2xl text-white/80 font-serif italic font-light leading-relaxed">
                        {page.content}
                    </p>
                </motion.div>

                <div className="space-y-20">
                    {page.sections?.map((section, i) => (
                        <motion.div
                            key={i}
                            id={`section-${i}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ margin: "-20% 0px -20% 0px" }}
                            onViewportEnter={() => setActiveSection(i)}
                            className="group"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <span className="text-[#4A90E2] font-mono text-sm mt-1">0{i + 1}</span>
                                <h2 className="text-2xl font-heading font-light tracking-tight text-white group-hover:text-[#4A90E2] transition-colors">
                                    {section.title}
                                </h2>
                            </div>
                            <div className="pl-8 md:pl-10 text-sm md:text-base text-white/50 leading-loose font-light border-l border-white/5 group-hover:border-white/10 transition-colors">
                                {Array.isArray(section.body) ? (
                                    <ul className="space-y-2">
                                        {section.body.map((item, j) => <li key={j}>{item}</li>)}
                                    </ul>
                                ) : (
                                    <p>{section.body}</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// --- LAYOUT 2: THE NARRATIVE (Magazine Magazine) ---
function NarrativeLayout({ page }: { page: PageData }) {
    const isTeam = page.title === 'The Collective';
    const navigate = useNavigate();

    return (
        <div className="pt-12 lg:pt-24 pb-20 px-6 md:px-12 max-w-[1400px] mx-auto">
            {/* Back Button - Original Style */}
            <div className="mb-16">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A90E2] hover:text-white transition-all group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>
            </div>

            {/* Magazine Header */}
            <div className={`${isTeam ? 'mb-16' : 'mb-32'} text-center`}>
                {!isTeam && (
                    <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-block text-[10px] font-bold text-[#4A90E2] uppercase tracking-[0.4em] mb-8">
                        {page.subtitle}
                    </motion.span>
                )}
                <motion.h1 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="text-7xl md:text-9xl font-heading font-extralight tracking-tighter text-white mb-12">
                    {page.title}
                </motion.h1>
                <div className="h-[1px] w-24 bg-white/20 mx-auto" />
            </div>

            {/* Content Zigzag */}
            {!isTeam && page.sections && (
                <div className="space-y-32">
                    {page.sections.map((section, i) => (
                        <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-24 items-center`}>
                            <motion.div initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1">
                                <h2 className="text-4xl md:text-5xl font-heading font-light tracking-tight text-white mb-8">
                                    {section.title}
                                </h2>
                                <p className="text-lg md:text-xl text-white/60 font-light leading-relaxed font-serif">
                                    {section.body}
                                </p>
                            </motion.div>
                            <div className="flex-1 w-full relative">
                                {/* Placeholder for Image - using abstract colored div for now */}
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    className="aspect-[4/5] bg-white/[0.03] border border-white/5 rounded-none relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[#4A90E2]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    {/* Texture */}
                                    <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">Fig. {i + 1}</p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Team Grid (Dean & Kris Featured Executive Layout) */}
            {isTeam && page.team && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-20 max-w-5xl mx-auto">
                        {page.team.map((member, i) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.15 }}
                                className="group relative bg-white/[0.02] border border-white/10 rounded-3xl p-8 md:p-12 hover:border-[#4A90E2]/50 hover:bg-white/[0.04] transition-all duration-500 flex flex-col justify-between overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#4A90E2]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-700" />
                                
                                <div>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold font-mono text-[#4A90E2] group-hover:bg-[#4A90E2] group-hover:text-white transition-all duration-500">
                                            {member.name.split(' ')[0][0]}{member.name.split(' ')[1]?.[0] || ''}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] px-3.5 py-1.5 rounded-full bg-white/5 text-white/60 border border-white/10">
                                            Executive
                                        </span>
                                    </div>

                                    <h3 className="text-4xl md:text-5xl font-heading font-light text-white tracking-tight mb-3 group-hover:text-[#4A90E2] transition-colors duration-300">
                                        {member.name}
                                    </h3>
                                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-6">
                                        {member.role}
                                    </p>
                                    <p className="text-sm md:text-base text-white/60 font-serif leading-relaxed font-light">
                                        {member.bio}
                                    </p>
                                </div>

                                <div className="pt-8 mt-8 border-t border-white/5 flex items-center justify-between text-[10px] uppercase font-mono tracking-widest text-white/30">
                                    <span>Muncheez Leadership</span>
                                    <span>Nairobi, KE</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-3xl mx-auto border-t border-white/10 pt-16"
                    >
                        <p className="text-lg md:text-2xl font-serif italic font-light text-white/70 leading-relaxed mb-4">
                            "{page.content}"
                        </p>
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A90E2]">
                            Muncheez Leadership
                        </span>
                    </motion.div>
                </>
            )}
        </div>
    );
}

// --- LAYOUT 3: UTILITY (The Concierge) ---
function UtilityLayout({ page }: { page: PageData }) {
    const isFAQ = page.title === 'Q & A';
    const navigate = useNavigate();

    return (
        <div className="min-h-screen pt-12 lg:pt-24 px-6 md:px-12 flex flex-col items-center relative">
            {/* Back Button - Original Style absolute positioned for center layout */}
            <div className="absolute top-12 lg:top-24 left-6 lg:left-12">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A90E2] hover:text-white transition-all group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>
            </div>

            <div className="text-center mb-24 max-w-2xl mt-24">
                <span className="text-[10px] font-bold text-[#4A90E2] uppercase tracking-[0.4em] mb-6 block">
                    {page.subtitle}
                </span>
                <h1 className="text-6xl md:text-8xl font-heading font-extralight tracking-tighter text-white mb-8">
                    {page.title}
                </h1>
                <p className="text-lg text-white/50 font-light">{page.content}</p>
            </div>

            {/* FAQ Accordion */}
            {isFAQ && page.sections && (
                <div className="max-w-3xl w-full space-y-4">
                    {page.sections.map((section, i) => (
                        <FAQItem key={i} title={section.title} body={section.body as string} />
                    ))}
                </div>
            )}

            {/* Contact Grid */}
            {!isFAQ && page.contact && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                    {page.contact.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (i * 0.1) }}
                            className="aspect-square flex flex-col items-center justify-center border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors group cursor-pointer"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-[#4A90E2] mb-8 group-hover:scale-110 transition-transform">
                                <item.icon size={28} strokeWidth={1} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mb-3">{item.type}</span>
                            <span className="text-lg font-heading text-white tracking-wide">{item.value}</span>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

function FAQItem({ title, body }: { title: string, body: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-white/10">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-8 flex items-center justify-between text-left group"
            >
                <span className="text-xl md:text-2xl font-heading font-light text-white group-hover:text-[#4A90E2] transition-colors tracking-tight">
                    {title}
                </span>
                <span className={`text-white/30 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown size={20} />
                </span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pb-8 text-white/50 font-light leading-relaxed pr-8">
                            {body}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- MAIN COMPONENT ---
export default function LegalPage() {
    const { type, slug } = useParams<{ type?: string; slug?: string }>();
    const pageKey = type || slug || '';
    const page = pageKey ? pages[pageKey] : null;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pageKey]);

    if (!page) return <div className="h-screen bg-black flex items-center justify-center text-white">Not Found</div>;

    return (
        <div className="min-h-screen bg-black text-white relative">
            {/* Global Noise */}
            <div className="absolute inset-0 z-[5] opacity-[0.015] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat fixed" />

            {/* NOTE: Fixed back button removed. Back button is now integrated into individual layouts. */}

            <div className="relative z-10 text-white">
                {page.type === 'legal' && <LegalLayout page={page} />}
                {page.type === 'narrative' && <NarrativeLayout page={page} />}
                {page.type === 'utility' && <UtilityLayout page={page} />}
            </div>

            {/* Simple Footer for Legal Pages */}
            <div className="border-t border-white/5 py-12 text-center text-[10px] uppercase tracking-[0.3em] text-white/20 relative z-10">
                <p>© 2026 Muncheez Technologies Ltd. All Rights Reserved.</p>
            </div>
        </div>
    );
}
