import { useState, useMemo } from 'react';
import {
    Search,
    Star,
    MoreHorizontal,
    Phone
} from 'lucide-react';
import { Order } from '../../types/schema';

interface CustomersViewProps {
    orders?: Order[];
}

interface CustomerProfile {
    id: string;
    name: string;
    phone: string;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: Date;
    tier: 'VIP' | 'Regular' | 'New';
    status: 'Active' | 'Inactive' | 'Flagged';
}

export default function CustomersView({ orders = [] }: CustomersViewProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Aggregate customers from orders
    const customers = useMemo(() => {
        const customerMap = new Map<string, CustomerProfile>();

        orders.forEach(order => {
            const phone = order.customer.phone;

            if (!customerMap.has(phone)) {
                customerMap.set(phone, {
                    id: order.customer.id || phone,
                    name: order.customer.name,
                    phone: order.customer.phone,
                    orderCount: 0,
                    totalSpent: 0,
                    lastOrderDate: new Date(0), // Epoch
                    tier: 'New',
                    status: 'Active'
                });
            }

            const profile = customerMap.get(phone)!;
            profile.orderCount += 1;
            profile.totalSpent += order.total;

            const orderDate = new Date(order.placedAt || Date.now());
            if (orderDate > profile.lastOrderDate) {
                profile.lastOrderDate = orderDate;
            }

            // Determine Tier
            if (profile.totalSpent > 50000 || profile.orderCount > 20) {
                profile.tier = 'VIP';
            } else if (profile.orderCount > 5) {
                profile.tier = 'Regular';
            }
        });

        return Array.from(customerMap.values()).sort((a, b) => b.lastOrderDate.getTime() - a.lastOrderDate.getTime());
    }, [orders]);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/10 pb-6">
                <div>
                    <h2 className="text-4xl font-heading font-light tracking-tight text-black">Clientele<span className="text-[#D4AF37]">.</span></h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">CRM & Relationships</p>
                </div>

                {/* Search Toolbar - Industrial Style */}
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH PHONE / NAME..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64 pl-8 pr-4 py-2 bg-transparent border-b border-gray-200 text-sm font-mono focus:outline-none focus:border-black transition-colors placeholder:text-gray-300 uppercase tracking-wider"
                        />
                    </div>
                </div>
            </div>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 gap-4">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden md:grid">
                    <div className="col-span-4">Customer Profile</div>
                    <div className="col-span-2">Status / Tier</div>
                    <div className="col-span-3">Delivery Notes</div>
                    <div className="col-span-2 text-right">Lifetime Value</div>
                    <div className="col-span-1"></div>
                </div>

                {filteredCustomers.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-xs font-bold uppercase tracking-widest">
                        No customers found.
                    </div>
                ) : (
                    filteredCustomers.map((customer) => (
                        <div key={customer.phone} className="bg-white border-l-4 border-gray-200 hover:border-[#D4AF37] shadow-sm p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center group transition-colors">
                            <div className="col-span-1 md:col-span-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-heading text-lg ${customer.tier === 'VIP' ? 'bg-black text-[#D4AF37]' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {customer.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{customer.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-1">
                                            <Phone size={12} /> {customer.phone}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 flex items-center md:block">
                                <span className="md:hidden text-xs font-bold text-gray-400 w-24">TIER:</span>
                                {customer.tier === 'VIP' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest border border-[#D4AF37]/20">
                                        <Star size={10} fill="currentColor" /> Top Tier
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                        {customer.tier}
                                    </span>
                                )}
                                <div className="text-[10px] text-gray-400 mt-1 font-mono ml-auto md:ml-0">{customer.orderCount} Orders</div>
                            </div>

                            <div className="col-span-1 md:col-span-3">
                                {/* Mock Notes based on random logic or real data if available */}
                                <div className="text-xs text-gray-400 italic">No specific notes.</div>
                            </div>

                            <div className="col-span-1 md:col-span-2 flex md:block justify-between md:text-right">
                                <span className="md:hidden text-xs font-bold text-gray-400">LTV:</span>
                                <div>
                                    <div className="font-mono font-bold text-gray-900">KES {customer.totalSpent.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-400">Last: {customer.lastOrderDate.toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="col-span-1 flex justify-end">
                                <button className="p-2 text-gray-300 hover:text-black transition-colors"><MoreHorizontal size={16} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
