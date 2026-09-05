import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from "../../../context/CartContext";

interface GlassCartProps {
    merchant?: any;
}

const GlassCart: React.FC<GlassCartProps> = ({ merchant }) => {
    const navigate = useNavigate();
    const { items, itemCount, total, updateQuantity, clearCart } = useCart();
    const [isExpanded, setIsExpanded] = useState(false);
    const [wantsCutlery, setWantsCutlery] = useState(false);

    if (itemCount === 0) return null;

    const isRestaurant = merchant?.type === 'Restaurant';
    const showCutleryToggle = isRestaurant && merchant?.customSettings?.cutleryRequired;

    return (
        <div className="fixed bottom-6 lg:bottom-10 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
            <motion.div
                layout
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`
                    pointer-events-auto
                    bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.1)]
                    overflow-hidden transition-all duration-500
                    ${isExpanded ? 'w-[calc(100vw-2rem)] max-w-[420px] rounded-[32px]' : 'w-auto rounded-full'}
                `}
            >
                <AnimatePresence mode="wait">
                    {!isExpanded ? (
                        <motion.button
                            key="collapsed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsExpanded(true)}
                            className="flex items-center gap-4 px-6 py-4 whitespace-nowrap group"
                        >
                            <div className="relative">
                                <ShoppingBag size={20} className="text-white group-hover:scale-110 transition-transform" />
                                <span className="absolute -top-2 -right-2 bg-white/90 backdrop-blur-sm text-[#4A90E2] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                                    {itemCount}
                                </span>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/50 leading-none mb-1">Total Order</span>
                                <span className="text-sm font-black text-white leading-none">KES {total.toLocaleString()}</span>
                            </div>
                        </motion.button>
                    ) : (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-6 md:p-8 flex flex-col max-h-[80vh]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                        <ShoppingBag size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-heading font-black tracking-tight text-white line-height-none">My Bag</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{itemCount} Items Selected</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsExpanded(false)}
                                    className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Items List */}
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 mb-8 pr-1">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 group">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                                            <img
                                                src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400"}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[13px] font-black text-white truncate mb-1">{item.name}</h3>
                                            <p className="text-[11px] font-bold text-white/40 tracking-tight">KES {item.price.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white/5 rounded-xl border border-white/5 p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="text-xs font-black text-white min-w-[12px] text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer / Checkout */}
                            <div className="pt-6 border-t border-white/10">
                                {/* Cutlery Toggle for Restaurants */}
                                {showCutleryToggle && (
                                    <div className="flex items-center justify-between mb-6 bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                <span className="text-lg">🍴</span>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-white">Cutlery Request</div>
                                                <div className="text-[9px] text-white/50">Help us reduce plastic waste</div>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={wantsCutlery} onChange={e => setWantsCutlery(e.target.checked)} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                                        </label>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-6">
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Clear all items from your bag?')) clearCart();
                                        }}
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={12} /> Clear Bag
                                    </button>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Subtotal</p>
                                        <p className="text-xl font-black text-white leading-none">KES {total.toLocaleString()}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/checkout')}
                                    className="w-full bg-white/20 hover:bg-white/30 text-white h-16 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl border border-white/30 backdrop-blur-md"
                                >
                                    Proceed to Checkout
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default GlassCart;
