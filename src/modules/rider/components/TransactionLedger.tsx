import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Zap, Gift, ShoppingBag, Banknote, Clock } from "lucide-react";
import { LedgerEntry } from "../../../lib/moneyEngine";
import { formatKES } from "../../../lib/moneyEngine";

interface TransactionLedgerProps {
    entries: LedgerEntry[];
    pendingAmount: number;
}

export default function TransactionLedger({ entries, pendingAmount }: TransactionLedgerProps) {
    return (
        <div className="space-y-4">
            {pendingAmount > 0 && (
                <motion.div
                    whileHover={{ scale: 0.99 }}
                    className="p-4 bg-yellow-50/50 rounded-3xl shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] flex items-center justify-between border border-yellow-200/50"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-yellow-100/50 text-yellow-600">
                            <Clock size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-700 tracking-tight">Pending Deliveries</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">In Transit</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black italic text-yellow-600">
                            {formatKES(pendingAmount)}
                        </p>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">ESTIMATED</p>
                    </div>
                </motion.div>
            )}

            {entries.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs uppercase font-bold tracking-widest border border-white/30 rounded-3xl bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]">
                    No transactions yet. Complete deliveries to earn.
                </div>
            ) : entries.map((txn, index) => (
                <motion.div
                    key={txn.id + index}
                    whileHover={{ scale: 0.99 }}
                    className="p-4 bg-[#f0f2f5] rounded-3xl shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] flex items-center justify-between border border-white/30"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-[#f0f2f5] shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_#ffffff] text-gray-400">
                            {txn.category === "RIDER_PAYOUT" && <ShoppingBag size={16} />}
                            {txn.category === "CANCELLATION_PENALTY" && <Zap size={16} className="text-red-500" />}
                            {txn.category === "RIDER_DROP_PENALTY" && <Zap size={16} className="text-red-500" />}
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-700 tracking-tight">
                                {txn.description.split('—')[0] || txn.category.replace(/_/g, ' ')}
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                {txn.createdAt.toLocaleDateString('en-KE')}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`text-sm font-black italic ${txn.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {txn.type === 'CREDIT' ? '+' : '-'} {formatKES(txn.amount)}
                        </p>
                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1">
                            Bal: {formatKES(txn.balanceAfter || 0)}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
