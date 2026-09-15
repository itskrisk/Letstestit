import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, CheckCircle2, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

// --- Types ---
type PageType = 'legal' | 'contact' | 'faq' | 'help';

interface PageData {
    type: PageType;
    title: string;
    subtitle: string;
    content: string;
    lastUpdated?: string;
    sections?: { title: string; body: string | string[] }[];
    contact?: { type: string; value: string; icon?: any; subtext: string }[];
}

// --- Content Data ---
const pages: Record<string, PageData> = {
    'terms-of-service': {
        type: 'legal',
        title: 'Terms of Service',
        subtitle: 'Legal Governance & Operating Contract',
        lastUpdated: '01.01.2026',
        content: "Detailed protocols governing the use of the Muncheez platform in the Republic of Kenya. By engaging with our app or website, you agree to these legally binding terms.",
        sections: [
            { title: "1. Binding Agreement", body: "By accessing or using Muncheez (operated by Muncheez Technologies Ltd.), you explicitly agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you must cease use immediately." },
            { title: "2. Eligibility & Account Security", body: "You must be at least 18 years of age to establish an active account. You are responsible for safeguarding your credentials and for all transactions conducted under your phone number or account." },
            { title: "3. Platform Intermediary Scope", body: "Muncheez acts as a high-technology intermediary connecting consumers with independent restaurant partners ('Merchants') and independent fleet riders. Merchants retain full responsibility for food preparation, hygiene, and order compliance." },
            { title: "4. Pricing, Currency & Payments", body: "All prices are listed in Kenya Shillings (KES). Transactions are processed via Safaricom M-Pesa and authorized payment gateways. You authorize Muncheez to charge food costs, delivery fees, and applicable taxes upon order submission." },
            { title: "5. Cancellation & Refund Policy", body: "Orders may be cancelled with a full refund ONLY prior to Merchant acceptance. Once kitchen preparation begins, cancellations are non-refundable. Verified complaints regarding incorrect or damaged items will be credited to your Muncheez Wallet." },
            { title: "6. Zero Tolerance Conduct Code", body: "We enforce a strict zero-tolerance policy against physical, verbal, or written abuse towards our riders, partner staff, or support agents. Violators will face immediate permanent account termination." },
            { title: "7. Intellectual Property Rights", body: "All software, logos, trademarks, brand identity, and design assets are the exclusive property of Muncheez Technologies Ltd. Unauthorized reproduction or scraping is strictly prohibited." },
            { title: "8. Limitation of Liability", body: "To the maximum extent permitted under Kenyan law, Muncheez Technologies Ltd. shall not be liable for indirect, incidental, or consequential damages resulting from service interruptions or third-party partner performance." },
            { title: "9. Kenya Data Protection Act Compliance", body: "Your personal data is processed strictly in accordance with the Kenya Data Protection Act, 2019 and our Privacy Policy." },
            { title: "10. Jurisdiction & Dispute Resolution", body: "These Terms are governed by the laws of the Republic of Kenya. Any legal disputes shall be submitted exclusively to courts sitting in Nairobi, Kenya." }
        ]
    },

    'privacy-policy': {
        type: 'legal',
        title: 'Privacy Policy',
        subtitle: 'Data Integrity & Privacy Guarantees',
        lastUpdated: '01.01.2026',
        content: "Muncheez Technologies Ltd. is committed to absolute data protection in full compliance with the Kenya Data Protection Act, 2019 (ODPC). We respect your privacy as a fundamental right.",
        sections: [
            { title: "1. Information We Collect", body: "We collect data essential for order execution: (a) Identity Data: Full name, phone number, email; (b) Location Data: Delivery coordinates and saved addresses; (c) Transaction Data: M-Pesa receipt IDs and order logs; (d) Telemetry: App usage to optimize delivery routes." },
            { title: "2. Purpose of Data Processing", body: "We process your information to: (a) Dispatch orders to merchants and riders; (b) Process automated M-Pesa payments; (c) Deliver real-time order status updates; (d) Prevent fraudulent activity and secure accounts." },
            { title: "3. Legal Basis for Processing", body: "Under the Kenya Data Protection Act, 2019, our processing is lawful based on: (a) Performance of a Contract; (b) Legal Obligations (KRA tax compliance); (c) Legitimate Security Interests; (d) User Consent." },
            { title: "4. Third-Party Data Sharing", body: "We NEVER sell your personal data. Data is shared exclusively with: (a) Selected Merchants (to prepare your meal); (b) Delivery Riders (active delivery coordinates); (c) Payment Gateway Partners (Safaricom M-Pesa); (d) Law enforcement upon valid legal order." },
            { title: "5. Data Storage & Localization", body: "Muncheez complies with statutory data residency regulations. Your data is stored securely using enterprise encryption standards (TLS 1.3, AES-256) with restricted authorization protocols." },
            { title: "6. User Rights (ODPC Rights)", body: "Under the Data Protection Act, you possess the right to: (a) Access your personal record; (b) Request correction of inaccuracies; (c) Request data erasure ('Right to be Forgotten'); (d) Restrict or object to processing. Contact privacy@muncheez.com to submit requests." },
            { title: "7. Data Retention Schedule", body: "Financial transaction records are maintained for 7 years to meet Kenyan statutory tax requirements. Non-essential usage telemetry is purged after 12 months." },
            { title: "8. Protection of Minors", body: "Muncheez services are restricted to individuals aged 18 and above. We do not knowingly harvest data from minors." },
            { title: "9. Updates to Policy", body: "Any modifications to this Privacy Policy will be published on this page with an updated timestamp." },
            { title: "10. Data Protection Officer Contact", body: "Direct all inquiries regarding data protection to dpo@muncheez.com or our headquarters in Westlands, Nairobi." }
        ]
    },

    'cookie-policy': {
        type: 'legal',
        title: 'Cookie Policy',
        subtitle: 'Digital Tracking & Preference Transparency',
        lastUpdated: '01.01.2026',
        content: "This policy details how Muncheez Technologies Ltd. uses cookies, local storage, and web beacons to deliver a high-speed, secure browsing experience.",
        sections: [
            { title: "1. Essential Operational Cookies", body: "Necessary for key site capabilities including user authentication, session state preservation, M-Pesa checkout flows, and cart persistence. These cannot be toggled off." },
            { title: "2. Performance & Analytics Cookies", body: "Used to collect anonymized telemetry on load speeds, popular merchant views, and technical error logs to continuously elevate app performance." },
            { title: "3. Preference Cookies", body: "Store your neighborhood selection, default delivery instructions, and visual interface settings for seamless return visits." },
            { title: "4. Managing Cookie Preferences", body: "You can modify cookie permissions at any time through our interactive Cookie Banner or directly via your web browser settings." }
        ]
    },

    'contact-us': {
        type: 'contact',
        title: 'Contact Us',
        subtitle: 'Direct Line to Nairobi HQ',
        content: "Have a question, feedback, or enterprise partnership inquiry? Our team in Westlands is always standing by.",
        contact: [
            { type: "Customer Support Email", value: "hello@muncheez.com", subtext: "Average response within 2 hours" },
            { type: "Support Hotline", value: "+254 700 000 000", subtext: "Available 24/7 for active orders" },
            { type: "Nairobi Headquarters", value: "Westlands, Nairobi, Kenya", subtext: "Muncheez Technologies Ltd." }
        ]
    },

    'faq': {
        type: 'faq',
        title: 'Frequently Asked Questions',
        subtitle: 'Quick Knowledge Base',
        content: "Clear, instant answers regarding delivery speeds, M-Pesa checkout, merchant quality, and rider safety.",
        sections: [
            { title: "What areas in Nairobi do you deliver to?", body: "We currently serve Westlands, Kilimani, Lavington, Kileleshwa, Parklands, CBD, Upper Hill, and Karen—with rapid expansion across wider Nairobi underway." },
            { title: "How long does delivery take?", body: "Our average fulfillment window is 30 to 45 minutes. Our dispatch engine dynamically routes riders based on live traffic patterns to ensure food arrives hot and fresh." },
            { title: "How does M-Pesa payment work on Muncheez?", body: "At checkout, enter your M-Pesa phone number and tap 'Pay Now'. An automated M-Pesa STK prompt will appear on your phone asking for your PIN. Payment confirms instantly." },
            { title: "What if my food arrives cold or damaged?", body: "We take quality seriously. Open your order details page in the app and tap 'Report Issue' within 15 minutes of delivery. Our support team will verify and process an instant wallet refund." },
            { title: "How do I become a merchant partner?", body: "We welcome exceptional kitchens! Click 'Partner With Us' in the footer or visit /partner/signup to submit your establishment for our curation review." },
            { title: "How do riders join the Muncheez fleet?", body: "Riders can register at /courier/signup. Candidates undergo background verification, vehicle safety checks, and customer service training prior to activation." }
        ]
    },

    'help-center': {
        type: 'help',
        title: 'Help Center & Support Desk',
        subtitle: 'Concierge Desk 24/7',
        content: "Need assistance with an ongoing order, payment receipt, or account question? We are here to help.",
        sections: [
            { title: "Active Order Support", body: "Track your courier in real-time on your active order screen. For instant driver communication or address modifications, call our dispatch hotline." },
            { title: "M-Pesa & Payment Inquiries", body: "If your M-Pesa payment was deducted but your order status failed to update, please allow 3 minutes for automated reconciliation or submit your Safaricom transaction code." },
            { title: "Account & Security", body: "You can update your delivery addresses, contact details, and security credentials directly inside your Account settings." }
        ]
    }
};

// --- LAYOUT 1: LEGAL ARCHIVES (Terms, Privacy, Cookie Policy) ---
function LegalLayout({ page }: { page: PageData }) {
    const [activeSection, setActiveSection] = useState(0);
    const navigate = useNavigate();

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-8 pt-32 pb-32">
            <div className="mb-12">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/70 hover:text-white transition-all group cursor-pointer"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                {/* Left Column: Title & Table of Contents */}
                <div className="lg:col-span-5 lg:sticky lg:top-32 flex flex-col justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] mb-4 block">
                            {page.subtitle}
                        </span>
                        <h1 className="text-5xl sm:text-6xl md:text-7xl font-heading font-light tracking-tighter mb-6 text-white leading-none">
                            {page.title}<span className="text-[#D4AF37]">.</span>
                        </h1>
                        <p className="text-white/70 text-xs font-mono tracking-widest mb-8 uppercase">
                            LAST UPDATED: <span className="text-white font-bold">{page.lastUpdated}</span>
                        </p>
                        <p className="text-white/90 text-base font-light leading-relaxed mb-8 border-l border-white/30 pl-4">
                            {page.content}
                        </p>
                    </div>

                    {/* Desktop Table of Contents */}
                    <div className="hidden lg:block space-y-3 overflow-y-auto max-h-[35vh] pr-4 custom-scrollbar border-t border-white/20 pt-6">
                        <span className="text-[9px] font-bold text-white/50 uppercase tracking-[0.3em] block mb-2">Sections</span>
                        {page.sections?.map((section, i) => (
                            <button
                                key={i}
                                onClick={() => document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: 'smooth' })}
                                className={`text-left text-xs uppercase tracking-widest transition-all block w-full truncate py-1 cursor-pointer ${activeSection === i ? 'text-[#D4AF37] font-bold pl-2 border-l-2 border-[#D4AF37]' : 'text-white/60 hover:text-white'}`}
                            >
                                {section.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column: Clean Editorial Content Body (No Boxed Padding / Cards) */}
                <div className="lg:col-span-7 space-y-12">
                    {page.sections?.map((section, i) => (
                        <motion.div
                            key={i}
                            id={`section-${i}`}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ margin: "-10% 0px -10% 0px" }}
                            onViewportEnter={() => setActiveSection(i)}
                            className="border-t border-white/20 pt-8 text-left"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <span className="text-[#D4AF37] font-mono text-xs font-bold mt-1">0{i + 1}</span>
                                <h2 className="text-2xl font-heading font-light tracking-tight text-white">
                                    {section.title}
                                </h2>
                            </div>
                            <div className="pl-8 text-base text-white/90 leading-relaxed font-light">
                                {Array.isArray(section.body) ? (
                                    <ul className="space-y-3">
                                        {section.body.map((item, j) => <li key={j}>&bull; {item}</li>)}
                                    </ul>
                                ) : (
                                    <p>{section.body}</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    <div className="border-t border-white/20" />
                </div>
            </div>
        </div>
    );
}

// --- LAYOUT 2: CONTACT US PAGE (UNBOXED, NO PADDING CARDS, PURE CLASSY EDITORIAL) ---
function ContactLayout({ page }: { page: PageData }) {
    const navigate = useNavigate();
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', category: 'General Inquiry', message: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="max-w-5xl mx-auto px-6 md:px-8 pt-32 pb-32">
            <div className="mb-12">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/70 hover:text-white transition-all group cursor-pointer"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>
            </div>

            <div className="text-center max-w-3xl mx-auto mb-20">
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] mb-4 block">
                    {page.subtitle}
                </span>
                <h1 className="text-6xl sm:text-7xl md:text-8xl font-heading font-light tracking-tighter text-white mb-6 leading-none">
                    {page.title}<span className="text-[#D4AF37]">.</span>
                </h1>
                <p className="text-base md:text-lg text-white/90 font-light max-w-xl mx-auto">{page.content}</p>
            </div>

            {/* Direct Contact Info — Unboxed Editorial Dividers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 border-t border-b border-white/20 py-12">
                {page.contact?.map((item, i) => (
                    <div key={i} className="text-left">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/60 block mb-2">{item.type}</span>
                        <h3 className="text-2xl font-heading font-light text-white mb-2">{item.value}</h3>
                        <p className="text-xs font-light text-white/70">{item.subtext}</p>
                    </div>
                ))}
            </div>

            {/* Contact Form — Unboxed Editorial Bottom-Line Fields */}
            <div className="max-w-2xl mx-auto text-left">
                <h2 className="text-3xl md:text-4xl font-heading font-light text-white mb-2">Send a Message<span className="text-[#D4AF37]">.</span></h2>
                <p className="text-xs text-white/60 mb-12 uppercase tracking-widest font-mono">Direct transmission to support operations</p>

                {submitted ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 border-t border-white/20">
                        <CheckCircle2 size={48} className="text-white mb-6" />
                        <h3 className="text-3xl font-heading font-light text-white mb-3">Message Received.</h3>
                        <p className="text-base text-white/90 max-w-md mb-8 font-light leading-relaxed">
                            Thank you for reaching out. A Muncheez concierge specialist will respond to <span className="font-mono text-white font-bold">{formData.email}</span> within 2 hours.
                        </p>
                        <button
                            onClick={() => setSubmitted(false)}
                            className="text-xs font-bold uppercase tracking-widest text-white underline hover:text-white/80 transition-all cursor-pointer"
                        >
                            Send Another Message &rarr;
                        </button>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="border-b border-white/30 py-2">
                                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/70 mb-2">Your Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Amani Mwangi"
                                    className="w-full bg-transparent text-lg text-white placeholder:text-white/40 focus:outline-none"
                                />
                            </div>
                            <div className="border-b border-white/30 py-2">
                                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/70 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="amani@example.com"
                                    className="w-full bg-transparent text-lg text-white placeholder:text-white/40 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="border-b border-white/30 py-2">
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-white/70 mb-2">Topic Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-transparent text-lg text-white focus:outline-none cursor-pointer"
                            >
                                <option value="General Inquiry" className="bg-[#4A90E2]">General Inquiry</option>
                                <option value="Active Order Support" className="bg-[#4A90E2]">Active Order Support</option>
                                <option value="Merchant Partnership" className="bg-[#4A90E2]">Merchant Partnership</option>
                                <option value="Rider Fleet Application" className="bg-[#4A90E2]">Rider Fleet Application</option>
                                <option value="Feedback & Suggestions" className="bg-[#4A90E2]">Feedback & Suggestions</option>
                            </select>
                        </div>

                        <div className="border-b border-white/30 py-2">
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-white/70 mb-2">Your Message</label>
                            <textarea
                                required
                                rows={4}
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="How can we assist you today?"
                                className="w-full bg-transparent text-lg text-white placeholder:text-white/40 focus:outline-none resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-5 text-center text-xs font-bold uppercase tracking-[0.3em] text-black bg-white hover:bg-[#D4AF37] hover:text-white transition-all cursor-pointer shadow-xl"
                        >
                            Transmit Message &rarr;
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

// --- LAYOUT 3: FAQ PAGE (UNBOXED EDITORIAL) ---
function FAQLayout({ page }: { page: PageData }) {
    const navigate = useNavigate();
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSections = page.sections?.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof s.body === 'string' && s.body.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="max-w-4xl mx-auto px-6 md:px-8 pt-32 pb-32">
            <div className="mb-12">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/70 hover:text-white transition-all group cursor-pointer"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>
            </div>

            <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] mb-4 block">
                    {page.subtitle}
                </span>
                <h1 className="text-6xl sm:text-7xl font-heading font-light tracking-tighter text-white mb-6 leading-none">
                    {page.title}<span className="text-[#D4AF37]">.</span>
                </h1>
                <p className="text-base text-white/90 font-light mb-8">{page.content}</p>

                {/* Clean Search Input */}
                <div className="border-b border-white/30 py-2 max-w-md mx-auto">
                    <input
                        type="text"
                        placeholder="Search questions (e.g. M-Pesa, delivery)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none text-center"
                    />
                </div>
            </div>

            {/* Accordion List — Clean Border Dividers, No Boxes */}
            <div className="border-t border-white/20">
                {filteredSections && filteredSections.length > 0 ? (
                    filteredSections.map((item, i) => {
                        const isOpen = openIndex === i;
                        return (
                            <div key={i} className="border-b border-white/20">
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : i)}
                                    className="w-full py-8 text-left flex items-center justify-between gap-4 group cursor-pointer"
                                >
                                    <span className="text-xl md:text-2xl font-heading font-light text-white group-hover:text-[#D4AF37] transition-colors">
                                        {item.title}
                                    </span>
                                    <ChevronDown size={20} className={`text-white/70 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-[#D4AF37]' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="pb-8 text-base text-white/90 font-light leading-relaxed pr-8"
                                        >
                                            {item.body}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-16">
                        <HelpCircle size={40} className="text-white/50 mx-auto mb-4" />
                        <p className="text-sm text-white/80">No questions matched your search query.</p>
                    </div>
                )}
            </div>

            {/* Footer Prompt */}
            <div className="mt-20 text-center border-t border-white/20 pt-12">
                <h3 className="text-2xl font-heading font-light text-white mb-2">Still need assistance?</h3>
                <p className="text-xs text-white/70 mb-8 uppercase tracking-widest font-mono">Our Nairobi support team is available 24/7</p>
                <Link
                    to="/legal/contact-us"
                    className="inline-block py-4 px-8 text-xs font-bold uppercase tracking-[0.3em] text-black bg-white hover:bg-[#D4AF37] hover:text-white transition-all shadow-lg"
                >
                    Contact Concierge &rarr;
                </Link>
            </div>
        </div>
    );
}

// --- LAYOUT 4: HELP CENTER (UNBOXED EDITORIAL) ---
function HelpLayout({ page }: { page: PageData }) {
    const navigate = useNavigate();

    return (
        <div className="max-w-5xl mx-auto px-6 md:px-8 pt-32 pb-32">
            <div className="mb-12">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/70 hover:text-white transition-all group cursor-pointer"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>
            </div>

            <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] mb-4 block">
                    {page.subtitle}
                </span>
                <h1 className="text-6xl sm:text-7xl font-heading font-light tracking-tighter text-white mb-6 leading-none">
                    {page.title}<span className="text-[#D4AF37]">.</span>
                </h1>
                <p className="text-base text-white/90 font-light">{page.content}</p>
            </div>

            {/* Quick Action Grid — Unboxed Dividers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 border-t border-b border-white/20 py-12 text-left">
                <Link to="/stores" className="group">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] block mb-2">01 / Telemetry</span>
                    <h3 className="text-2xl font-heading font-light text-white mb-2 group-hover:text-[#D4AF37] transition-colors">Track Active Order &rarr;</h3>
                    <p className="text-xs text-white/70 font-light leading-relaxed">View real-time GPS telemetry and driver status for your current order.</p>
                </Link>

                <Link to="/legal/contact-us" className="group">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] block mb-2">02 / Issues</span>
                    <h3 className="text-2xl font-heading font-light text-white mb-2 group-hover:text-[#D4AF37] transition-colors">Report Order Issue &rarr;</h3>
                    <p className="text-xs text-white/70 font-light leading-relaxed">Food missing or unsatisfactory? Submit a quick report for instant review.</p>
                </Link>

                <Link to="/legal/faq" className="group">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] block mb-2">03 / Answers</span>
                    <h3 className="text-2xl font-heading font-light text-white mb-2 group-hover:text-[#D4AF37] transition-colors">Browse FAQ Library &rarr;</h3>
                    <p className="text-xs text-white/70 font-light leading-relaxed">Instant answers regarding M-Pesa, delivery boundaries, and refund policies.</p>
                </Link>
            </div>

            {/* Structured Help Topics */}
            <div className="space-y-8 text-left">
                <h2 className="text-3xl font-heading font-light text-white mb-6">Core Support Topics<span className="text-[#D4AF37]">.</span></h2>
                {page.sections?.map((sec, i) => (
                    <div key={i} className="border-t border-white/20 pt-6">
                        <h3 className="text-xl font-heading font-light text-white mb-2">{sec.title}</h3>
                        <p className="text-base text-white/90 font-light leading-relaxed">{sec.body}</p>
                    </div>
                ))}
                <div className="border-t border-white/20" />
            </div>
        </div>
    );
}

// --- MAIN LEGAL PAGE CONTAINER ---
export default function LegalPage() {
    const { type, slug } = useParams<{ type?: string; slug?: string }>();
    const pageKey = type || slug || '';
    const page = pageKey ? pages[pageKey] : null;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pageKey]);

    if (!page) {
        return (
            <div className="min-h-screen bg-[#4A90E2] text-white flex flex-col justify-between">
                <Navbar />
                <div className="text-center py-40">
                    <h1 className="text-4xl font-heading text-white mb-4">Page Not Found</h1>
                    <p className="text-sm text-white/80 mb-8">The requested legal or support document does not exist.</p>
                    <Link to="/" className="bg-white text-black font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl">
                        Return Home
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#4A90E2] text-white relative selection:bg-white selection:text-black">
            <Navbar />

            {/* Subtle background noise overlay */}
            <div className="absolute inset-0 z-[1] opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat fixed" />

            <div className="relative z-10 text-white">
                {page.type === 'legal' && <LegalLayout page={page} />}
                {page.type === 'contact' && <ContactLayout page={page} />}
                {page.type === 'faq' && <FAQLayout page={page} />}
                {page.type === 'help' && <HelpLayout page={page} />}
            </div>

            <Footer />
        </div>
    );
}
