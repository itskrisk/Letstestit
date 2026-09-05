import { useNavigate } from 'react-router-dom';
import { useMockDatabase } from "../../../context/MockDatabaseContext";
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Bike, Package, Clock } from 'lucide-react';

export default function ActiveOrderFloat() {
    const navigate = useNavigate();
    const { orders } = useMockDatabase();

    // In this prototype, the most recent active order is "the" live one
    const activeOrder = orders[0];

    if (!activeOrder || activeOrder.status === 'DELIVERED' || activeOrder.status === 'COMPLETED' || activeOrder.status === 'CANCELLED') {
        return null;
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PREPARING': return <ChefHat size={18} />;
            case 'PACKING': return <Package size={18} />;
            case 'RIDER_ASSIGNED':
            case 'PICKED_UP':
            case 'OUT_FOR_DELIVERY': return <Bike size={18} />;
            default: return <Clock size={18} />;
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-8 right-6 z-[400] md:bottom-12 md:right-12"
            >
                <button
                    onClick={() => navigate(`/order/${activeOrder.id}`)}
                    className="relative w-14 h-14 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] text-white group overflow-hidden"
                >
                    {/* Glass Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

                    {/* Pulsing Background for Live Status */}
                    <div className="absolute inset-0 bg-[#4A90E2]/20 animate-pulse rounded-full" />

                    {/* Status Icon */}
                    <div className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] text-[#4A90E2]">
                        {getStatusIcon(activeOrder.status)}
                    </div>

                    {/* Active Indicator Dot */}
                    <div className="absolute top-3 right-3.5 w-2 h-2 bg-[#4A90E2] rounded-full shadow-[0_0_10px_#4A90E2] animate-ping" />
                    <div className="absolute top-3 right-3.5 w-2 h-2 bg-[#4A90E2] rounded-full shadow-[0_0_10px_#4A90E2]" />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
