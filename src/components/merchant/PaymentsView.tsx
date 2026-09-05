import {
    Wallet, ArrowUpRight, ArrowDownLeft, Download,
    AlertCircle, Clock, DollarSign, RefreshCcw, TrendingUp,
    CheckCircle, XCircle, Bike
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Order } from '../../types/schema';
import {
    buildWalletLedger, calculateOrderFinancials, formatKES,
    evaluateCancellationPenalty, MUNCHEEZ_COMMISSION_RATE, VAT_RATE, isPeakHour
} from '../../lib/moneyEngine';

interface PaymentsViewProps {
    orders?: Order[];
    merchantId?: string;
}

export default function PaymentsView({ orders = [], merchantId = 'merchant_1' }: PaymentsViewProps) {
    const [activeTab, setActiveTab] = useState<'transactions' | 'breakdown' | 'cancellation'>('transactions');
    const [cancelOrderAmount, setCancelOrderAmount] = useState(500);
    const [cancelStatus, setCancelStatus] = useState('PREPARING');

    const wallet = useMemo(() => buildWalletLedger(orders, merchantId, 'merchant'), [orders, merchantId]);
    const peak = isPeakHour();

    const { todayEarnings, pendingAmount, pendingCount } = useMemo(() => {
        let today = 0;
        let pending = 0;
        let pCount = 0;
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        orders.forEach(order => {
            const t = new Date(order.placedAt || 0).getTime();
            if (t >= startOfDay && ['COMPLETED', 'DELIVERED'].includes(order.status)) {
                const f = calculateOrderFinancials(order.total);
                today += f.merchantPayout;
            }
            if (['PREPARING', 'RIDER_ASSIGNED', 'PICKED_UP'].includes(order.status)) {
                pending += order.total * (1 - MUNCHEEZ_COMMISSION_RATE - VAT_RATE);
                pCount++;
            }
        });
        return { todayEarnings: today, pendingAmount: pending, pendingCount: pCount };
    }, [orders]);

    const cancelResult = useMemo(() =>
        evaluateCancellationPenalty(cancelStatus, 'CUSTOMER', cancelOrderAmount),
        [cancelStatus, cancelOrderAmount]
    );

    const exportCSV = () => {
        const headers = ['Date', 'Description', 'Type', 'Amount', 'Balance After'];
        const rows = wallet.entries.map(e => [
            e.createdAt.toLocaleDateString(), `"${e.description}"`, e.type,
            e.amount.toFixed(2), (e.balanceAfter || 0).toFixed(2)
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `merchant_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/10 pb-6">
                <div>
                    <h2 className="text-4xl font-heading font-light tracking-tight text-black">
                        Finance<span className="text-[#D4AF37]">.</span>
                    </h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
                        {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} Statement
                        {peak && <span className="ml-2 text-orange-500">· 🔥 Peak Hours Active (+15% bonuses)</span>}
                    </p>
                </div>
                <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white hover:bg-[#D4AF37] hover:text-black transition-colors rounded text-xs font-bold uppercase tracking-widest"
                >
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black text-white p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={100} /></div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-1">Today's Net Earnings</p>
                    <h3 className="text-4xl font-mono font-medium">{formatKES(todayEarnings)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                        <span className="text-green-400 flex items-center gap-1"><ArrowUpRight size={12} /> After 15% commission + 16% VAT</span>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-2xl">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">In Transit (Pending)</p>
                        <div className="p-2 bg-yellow-50 text-yellow-600 rounded-full"><Clock size={16} /></div>
                    </div>
                    <h3 className="text-3xl font-mono font-medium text-gray-900">{formatKES(pendingAmount)}</h3>
                    <p className="text-xs text-gray-400 mt-2">{pendingCount} orders being delivered</p>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-2xl">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Wallet Balance</p>
                        <div className="p-2 bg-green-50 text-green-600 rounded-full"><Wallet size={16} /></div>
                    </div>
                    <h3 className="text-3xl font-mono font-medium text-gray-900">{formatKES(wallet.balance)}</h3>
                    <p className="text-xs text-gray-400 mt-2">From double-entry ledger</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                {(['transactions', 'breakdown', 'cancellation'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest capitalize transition-all ${activeTab === t ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold">Transaction Ledger</h3>
                        <span className="text-xs text-gray-400">{wallet.entries.length} entries</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {wallet.entries.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-xs uppercase font-bold tracking-widest">No transactions yet.</div>
                        ) : wallet.entries.map((tx, i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {tx.type === 'CREDIT' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 text-sm">{tx.description}</div>
                                        <div className="text-xs text-gray-400 font-mono mt-0.5">
                                            {tx.createdAt.toLocaleDateString('en-KE')} · #{tx.orderId?.slice(-6).toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-mono font-bold text-sm ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
                                        {tx.type === 'CREDIT' ? '+' : '-'} {formatKES(tx.amount)}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1">
                                        Bal: {formatKES(tx.balanceAfter || 0)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Breakdown Tab */}
            {activeTab === 'breakdown' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
                        <h3 className="font-bold">Earnings Breakdown</h3>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Gross Sales</p>
                            <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                                <span className="font-mono text-2xl font-black">{formatKES(wallet.totalCredits / 0.69)}</span>
                                <span className="text-xs text-gray-400">Before deductions</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Platform Commission (15%)', value: wallet.totalCredits / 0.69 * MUNCHEEZ_COMMISSION_RATE, color: 'text-red-500' },
                                { label: 'VAT — KRA (16%)', value: wallet.totalCredits / 0.69 * VAT_RATE, color: 'text-red-500' },
                                { label: 'M-Pesa Fees', value: wallet.entries.length * 15, color: 'text-red-500' },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between text-sm">
                                    <span className="text-gray-500">{item.label}</span>
                                    <span className={`font-mono ${item.color}`}>- {formatKES(item.value)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-black/10">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900 uppercase tracking-widest text-xs">Net Earnings</span>
                                <span className="font-mono text-xl font-bold text-[#D4AF37]">{formatKES(wallet.balance)}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 text-right mt-1">Cumulative payout amount</p>
                        </div>
                    </div>
                    <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-6 rounded-xl flex flex-col justify-between">
                        <div>
                            <AlertCircle size={20} className="text-[#D4AF37] mb-3" />
                            <h4 className="font-bold text-gray-900">Tax Compliance Notice</h4>
                            <p className="text-sm text-gray-600 mt-2">
                                16% VAT is withheld from every transaction in compliance with KRA requirements.
                                Your monthly VAT invoice is available for download.
                            </p>
                        </div>
                        <button className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors w-fit">
                            <Download size={14} /> Download KRA Invoice
                        </button>
                    </div>
                </div>
            )}

            {/* Cancellation Guide Tab */}
            {activeTab === 'cancellation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                        <h3 className="font-bold">Cancellation Simulator</h3>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Order Value (KES)</label>
                            <input
                                type="number"
                                value={cancelOrderAmount}
                                onChange={e => setCancelOrderAmount(Number(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-black focus:outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Order Status at Cancellation</label>
                            <select
                                value={cancelStatus}
                                onChange={e => setCancelStatus(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none"
                            >
                                {['CREATED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP'].map(s => (
                                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div className={`p-5 rounded-2xl border ${cancelResult.shouldCharge ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                {cancelResult.shouldCharge
                                    ? <XCircle size={18} className="text-red-500" />
                                    : <CheckCircle size={18} className="text-green-600" />
                                }
                                <p className={`text-sm font-bold ${cancelResult.shouldCharge ? 'text-red-700' : 'text-green-700'}`}>
                                    {cancelResult.penaltyDescription}
                                </p>
                            </div>
                            <p className="text-xs text-gray-500">{cancelResult.reason}</p>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
                        <h3 className="font-bold mb-4">Cancellation Policy</h3>
                        {[
                            { stage: 'Created / Pending', penalty: 'Free cancellation', ok: true },
                            { stage: 'Preparing', penalty: 'KES 75 (50% base fee)', ok: false },
                            { stage: 'Rider Assigned / Picked Up', penalty: '30% of order total', ok: false },
                            { stage: 'Delivered', penalty: 'Non-cancellable', ok: false },
                        ].map(r => (
                            <div key={r.stage} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                                <span className="text-sm text-gray-600">{r.stage}</span>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${r.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                    {r.penalty}
                                </span>
                            </div>
                        ))}
                        <div className="p-4 mt-2 bg-gray-900 text-white rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                                <Bike size={16} />
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Rider Drop Penalty</p>
                            </div>
                            <p className="text-xl font-black">KES 200</p>
                            <p className="text-xs text-gray-400 mt-1">Applied to rider wallet if dropped after pickup</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
