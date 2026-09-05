import { useState, useMemo, useEffect } from 'react';
import {
    TrendingUp, CreditCard, ArrowUpRight, ArrowDownLeft,
    Wallet, Download, Search, Store, Activity, Bike,
    AlertCircle, CheckCircle, Clock, PieChart, RefreshCw,
    Users, BarChart3, ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import {
    calculateOrderFinancials, buildWalletLedger, formatKES,
    MUNCHEEZ_COMMISSION_RATE, VAT_RATE, MPESA_FEE_PER_TXN, RIDER_BASE_FEE,
    isPeakHour
} from '../../lib/moneyEngine';

function exportFinancialsCSV(rows: any[], filename: string) {
    const headers = ['Order ID', 'Merchant', 'Gross', 'Commission', 'VAT', 'Rider Payout', 'Merchant Net', 'Platform Net', 'Status', 'Date'];
    const csv = [headers.join(','), ...rows.map(r => [
        r.orderId, `"${r.merchant}"`, r.gross, r.commission.toFixed(2), r.vat.toFixed(2),
        r.riderPayout.toFixed(2), r.merchantNet.toFixed(2), r.platformNet.toFixed(2), r.status, r.date
    ].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}

export default function Financials() {
    const [orders, setOrders] = useState<any[]>([]);
    const [merchants, setMerchants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'payouts' | 'splits'>('overview');
    const peak = isPeakHour();

    useEffect(() => {
        const fetchFinancialData = async () => {
            try {
                // Focus on delivered orders for core financials, but grab pending so we can calculate pendingValue.
                const [{ data: orderData, error: orderError }, { data: merchantData, error: merchantError }] = await Promise.all([
                    supabase.from('orders').select('*').order('created_at', { ascending: false }),
                    supabase.from('profiles').select('*').eq('role', 'merchant')
                ]);

                if (orderError) throw orderError;
                if (merchantError) throw merchantError;

                if (orderData) setOrders(orderData);
                if (merchantData) {
                    setMerchants(merchantData.map(m => ({
                        id: m.id,
                        businessName: m.business_name || m.full_name || 'Unnamed',
                        type: m.business_type || 'Retail'
                    })));
                }
            } catch (err) {
                console.error("Error fetching financials:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFinancialData();

        const channel = supabase.channel('admin_financials_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
                fetchFinancialData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // ─── Platform Financials ─────────────────────────────────
    const platformLedger = useMemo(() => buildWalletLedger(orders, 'platform', 'platform'), [orders]);

    const finances = useMemo(() => {
        const delivered = orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status));
        const gross = delivered.reduce((s, o) => s + o.total, 0);
        const commission = gross * MUNCHEEZ_COMMISSION_RATE;
        const vat = gross * VAT_RATE;
        const mpesa = delivered.length * MPESA_FEE_PER_TXN;
        const riderPayouts = delivered.reduce((s, _) => s + RIDER_BASE_FEE * 1.2, 0); // avg payout
        const netRevenue = commission - riderPayouts;

        const pending = orders.filter(o => ['PREPARING', 'RIDER_ASSIGNED', 'PICKED_UP'].includes(o.status));
        const pendingValue = pending.reduce((s, o) => s + o.total, 0);

        return { gross, commission, vat, mpesa, riderPayouts, netRevenue, pendingValue, deliveredCount: delivered.length, pendingCount: pending.length };
    }, [orders]);

    // ─── Order breakdown rows ─────────────────────────────────
    const orderRows = useMemo(() => {
        return orders
            .filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status))
            .filter(o => search === '' || o.id.includes(search) || o.merchantId?.includes(search))
            .map(o => {
                const f = calculateOrderFinancials(o.total, o.delivery_distance_km || 3, o.payment_method || 'MPESA');
                const merchant = merchants.find(m => m.id === o.merchant_id);
                return {
                    orderId: o.id.slice(-8).toUpperCase(),
                    merchant: merchant?.businessName || o.merchant_id || 'Unknown',
                    gross: o.total,
                    commission: f.platformCommission,
                    vat: f.vatAmount,
                    riderPayout: f.riderPayout,
                    merchantNet: f.merchantPayout,
                    platformNet: f.netPlatformRevenue,
                    status: o.status,
                    date: new Date(o.created_at || Date.now()).toLocaleDateString('en-KE'),
                };
            });
    }, [orders, merchants, search]);

    // ─── Merchant Settlements ─────────────────────────────────
    const merchantSettlements = useMemo(() => {
        return merchants.map(m => {
            const mOrders = orders.filter(o => o.merchant_id === m.id && ['DELIVERED', 'COMPLETED'].includes(o.status));
            const gross = mOrders.reduce((s, o) => s + o.total, 0);
            const net = gross * (1 - MUNCHEEZ_COMMISSION_RATE - VAT_RATE);
            return { merchant: m, gross, net, orderCount: mOrders.length };
        }).sort((a, b) => b.gross - a.gross);
    }, [orders, merchants]);

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        Financial Core
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${peak ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {peak ? '🔥 Peak Hours' : '● Live'}
                        </span>
                    </h1>
                    <p className="text-sm text-gray-400 font-medium">Revenue orchestration, partner settlements & ledger audit.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                        {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === t ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => exportFinancialsCSV(orderRows, `muncheez_financials_${new Date().toISOString().slice(0, 10)}.csv`)}
                        className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                    >
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Gross Revenue" value={formatKES(finances.gross)} icon={TrendingUp} color="black" change="+12%" />
                <KpiCard label="Platform Commission" value={formatKES(finances.commission)} icon={PieChart} color="blue" change={`${(MUNCHEEZ_COMMISSION_RATE * 100).toFixed(0)}% cut`} />
                <KpiCard label="Rider Payouts" value={formatKES(finances.riderPayouts)} icon={Bike} color="orange" change={`${finances.deliveredCount} deliveries`} />
                <KpiCard label="Net Platform Revenue" value={formatKES(finances.netRevenue)} icon={Wallet} color="green" change="After payouts" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {(['overview', 'ledger', 'payouts', 'splits'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all capitalize ${activeTab === t ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Breakdown Card */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-lg mb-6">Revenue Waterfall</h3>
                        <WaterfallChart finances={finances} />
                    </div>

                    {/* Platform Rules */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400 mb-4">Platform Rules Engine</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Commission Rate', value: `${(MUNCHEEZ_COMMISSION_RATE * 100).toFixed(0)}%`, color: 'bg-blue-50 text-blue-600' },
                                    { label: 'VAT (KRA)', value: `${(VAT_RATE * 100).toFixed(0)}%`, color: 'bg-purple-50 text-purple-600' },
                                    { label: 'Rider Base Fee', value: `KES ${RIDER_BASE_FEE}`, color: 'bg-amber-50 text-amber-600' },
                                    { label: 'M-Pesa Fee/Txn', value: `KES ${MPESA_FEE_PER_TXN}`, color: 'bg-gray-50 text-gray-600' },
                                    { label: 'Peak Hours Active', value: peak ? 'Yes (+15%)' : 'No', color: peak ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400' },
                                ].map(rule => (
                                    <div key={rule.label} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">{rule.label}</span>
                                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${rule.color}`}>{rule.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                            <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-2">Pending Settlement</p>
                            <p className="text-2xl font-black">{formatKES(finances.pendingValue)}</p>
                            <p className="text-xs text-amber-700 mt-1">{finances.pendingCount} orders in transit</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'ledger' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by order ID..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none"
                            />
                        </div>
                        <span className="text-xs text-gray-400">{orderRows.length} transactions</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    {['Order', 'Merchant', 'Gross', 'Commission', 'VAT', 'Rider', 'Merchant Net', 'Platform Net', 'Date'].map(h => (
                                        <th key={h} className="p-4 text-left text-[10px] font-black uppercase tracking-wider text-gray-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orderRows.length === 0 ? (
                                    <tr><td colSpan={9} className="p-12 text-center text-gray-400 text-sm">No completed orders yet.</td></tr>
                                ) : orderRows.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="p-4 text-xs font-mono font-bold text-gray-600">#{row.orderId}</td>
                                        <td className="p-4 text-sm font-medium text-gray-700">{row.merchant}</td>
                                        <td className="p-4 text-sm font-semibold">{formatKES(row.gross)}</td>
                                        <td className="p-4 text-sm text-blue-600 font-medium">-{formatKES(row.commission)}</td>
                                        <td className="p-4 text-sm text-purple-600 font-medium">-{formatKES(row.vat)}</td>
                                        <td className="p-4 text-sm text-orange-600 font-medium">-{formatKES(row.riderPayout)}</td>
                                        <td className="p-4 text-sm text-green-700 font-bold">{formatKES(row.merchantNet)}</td>
                                        <td className="p-4 text-sm font-bold text-gray-900">{formatKES(row.platformNet)}</td>
                                        <td className="p-4 text-xs text-gray-400">{row.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'payouts' && (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="font-bold">Merchant Settlements</h3>
                            <p className="text-sm text-gray-400 mt-1">Net payouts due to each merchant after commission and VAT deductions.</p>
                        </div>
                        {merchantSettlements.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">No settlements yet.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {merchantSettlements.map((s, i) => (
                                    <div key={s.merchant.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-black text-gray-500">{i + 1}</div>
                                            <div>
                                                <p className="font-semibold text-sm">{s.merchant.businessName}</p>
                                                <p className="text-xs text-gray-400">{s.orderCount} orders · {s.merchant.type}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-sm">{formatKES(s.net)}</p>
                                            <p className="text-xs text-gray-400">Gross: {formatKES(s.gross)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'splits' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold mb-4">Order Split Simulator</h3>
                        <SplitSimulator />
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h3 className="font-bold mb-4">Cancellation Penalty Guide</h3>
                        <div className="space-y-3">
                            {[
                                { stage: 'CREATED / PENDING', penalty: 'Free', color: 'text-green-600 bg-green-50' },
                                { stage: 'PREPARING', penalty: 'KES 75 (50% base fee)', color: 'text-amber-600 bg-amber-50' },
                                { stage: 'RIDER ASSIGNED / PICKED UP', penalty: '30% of order total', color: 'text-orange-600 bg-orange-50' },
                                { stage: 'DELIVERED', penalty: 'Non-cancellable', color: 'text-red-600 bg-red-50' },
                            ].map(r => (
                                <div key={r.stage} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                                    <span className="text-sm font-medium text-gray-600">{r.stage}</span>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${r.color}`}>{r.penalty}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-gray-900 text-white rounded-xl">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Rider Drop (after pickup)</p>
                            <p className="text-lg font-black">KES 200 Penalty</p>
                            <p className="text-xs text-gray-400 mt-1">Applied automatically to rider wallet</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


// ─── Revenue Waterfall Chart ───────────────────────────────────────────────
function WaterfallChart({ finances }: any) {
    const total = finances.gross;
    if (total === 0) return (
        <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No completed orders yet to analyze.</div>
    );

    const bars = [
        { label: 'Gross Revenue', value: finances.gross, color: 'bg-gray-900', type: 'input' },
        { label: 'VAT (16%)', value: -(finances.vat), color: 'bg-purple-400', type: 'deduction' },
        { label: 'Commission (15%)', value: -(finances.commission), color: 'bg-blue-400', type: 'deduction' },
        { label: 'Rider Payouts', value: -(finances.riderPayouts), color: 'bg-orange-400', type: 'deduction' },
        { label: 'Net Revenue', value: finances.netRevenue, color: 'bg-emerald-500', type: 'result' },
    ];

    return (
        <div className="space-y-3">
            {bars.map(bar => (
                <div key={bar.label} className="flex items-center gap-4">
                    <div className="w-28 text-right">
                        <p className="text-xs font-medium text-gray-500">{bar.label}</p>
                    </div>
                    <div className="flex-1 relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                            className={`h-full rounded-lg transition-all ${bar.color}`}
                            style={{ width: `${Math.max(Math.abs(bar.value) / total * 100, 2)}%` }}
                        />
                    </div>
                    <div className="w-24 text-left">
                        <p className={`text-xs font-black ${bar.type === 'deduction' ? 'text-red-500' : bar.type === 'result' ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {bar.type === 'deduction' ? '-' : ''}{formatKES(Math.abs(bar.value))}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}


// ─── Split Simulator ───────────────────────────────────────────────────────
function SplitSimulator() {
    const [amount, setAmount] = useState(500);
    const [distance, setDistance] = useState(3);
    const result = calculateOrderFinancials(amount, distance, 'MPESA');

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Order Total (KES)</label>
                <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-black focus:outline-none focus:ring-2 focus:ring-black/5"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Distance (KM)</label>
                <input
                    type="range" min={1} max={20} step={0.5}
                    value={distance}
                    onChange={e => setDistance(Number(e.target.value))}
                    className="w-full accent-black"
                />
                <p className="text-sm font-bold text-center">{distance} km</p>
            </div>
            <div className="space-y-2 pt-4 border-t border-gray-100">
                {[
                    { label: 'Merchant Receives', value: result.merchantPayout, color: 'text-green-700' },
                    { label: 'Rider Earns', value: result.riderPayout, color: 'text-orange-600' },
                    { label: 'VAT to KRA', value: result.vatAmount, color: 'text-purple-600' },
                    { label: 'Platform Net', value: result.netPlatformRevenue, color: 'text-blue-600' },
                ].map(item => (
                    <div key={item.label} className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">{item.label}</span>
                        <span className={`text-sm font-black ${item.color}`}>{formatKES(item.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}


// ─── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, change }: any) {
    const colors: any = {
        black: 'bg-gray-900 text-white',
        blue: 'bg-blue-50 text-blue-600',
        orange: 'bg-orange-50 text-orange-600',
        green: 'bg-emerald-50 text-emerald-600',
    };
    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
                <Icon size={20} />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black mt-1 tracking-tight">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{change}</p>
        </div>
    );
}
