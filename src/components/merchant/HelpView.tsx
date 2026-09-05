import {
    MessageCircle,
    Mail,
    Phone,
    Search,
    ChevronRight,
    AlertTriangle
} from 'lucide-react';

export default function HelpView() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/10 pb-6">
                <div>
                    <h2 className="text-4xl font-heading font-light tracking-tight text-black">Support<span className="text-[#D4AF37]">.</span></h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">24/7 Merchant Assistance</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* 1. Instant Support Channels */}
                <div className="space-y-4">
                    <h3 className="font-heading font-bold text-lg mb-4">Contact Us</h3>

                    <button className="w-full text-left p-4 bg-black text-white rounded-xl shadow-lg hover:bg-[#D4AF37] hover:text-black transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-full group-hover:bg-black/10">
                                <MessageCircle size={24} />
                            </div>
                            <div>
                                <div className="font-bold font-heading text-lg">Live Chat</div>
                                <div className="text-xs text-white/60 group-hover:text-black/60">Typical reply: &lt; 2 mins</div>
                            </div>
                        </div>
                    </button>

                    <button className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-black transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-100 rounded-full text-gray-500 group-hover:text-black">
                                <Phone size={24} />
                            </div>
                            <div>
                                <div className="font-bold font-heading text-lg text-gray-900">Priority Hotline</div>
                                <div className="text-xs text-gray-500">0800-MUNCHEZZ</div>
                            </div>
                        </div>
                    </button>

                    <button className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-black transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-100 rounded-full text-gray-500 group-hover:text-black">
                                <Mail size={24} />
                            </div>
                            <div>
                                <div className="font-bold font-heading text-lg text-gray-900">Email Support</div>
                                <div className="text-xs text-gray-500">partners@munchezz.co.ke</div>
                            </div>
                        </div>
                    </button>
                </div>

                {/* 2. Dispute Resolution & FAQs */}
                <div className="md:col-span-2 space-y-8">

                    {/* Active Ticket */}
                    <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-start gap-4">
                        <div className="p-2 bg-white rounded-full text-red-500 shadow-sm shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-red-900">Open Dispute #TKT-8821</h4>
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-red-100 text-red-600 px-2 py-1 rounded">In Progress</span>
                            </div>
                            <p className="text-sm text-red-700 leading-relaxed mb-3">
                                Regarding "Order #QDH22..." - Customer claimed missing items. You provided CCTV footage evidence.
                            </p>
                            <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
                                <button className="text-red-600 hover:text-black hover:underline">View Details</button>
                                <button className="text-red-400 hover:text-black hover:underline">Upload More Evidence</button>
                            </div>
                        </div>
                    </div>

                    {/* FAQ Search */}
                    <div>
                        <div className="relative mb-6">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search help articles (e.g., 'How to refund')"
                                className="w-full pl-12 pr-4 py-4 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-black outline-none font-medium"
                            />
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-heading font-bold text-lg mb-4">Common Questions</h3>

                            {[
                                'How do I change my operating hours?',
                                'Understanding the weekly payout schedule',
                                'How to handle a rude rider?',
                                'Updating my menu prices in bulk'
                            ].map((q, i) => (
                                <button key={i} className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:border-gray-300 transition-colors group">
                                    <span className="font-medium text-gray-700 group-hover:text-black">{q}</span>
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-black" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
