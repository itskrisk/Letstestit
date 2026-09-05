import { Notification } from '../../types/social';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationCenterProps {
    notifications: Notification[];
    onClose: () => void;
    onMarkAsRead: () => void;
}

const NotificationCenter = ({ notifications, onClose, onMarkAsRead }: NotificationCenterProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed top-24 right-6 lg:right-20 z-50 w-[90vw] max-w-sm max-h-[70vh] overflow-hidden bg-white rounded-3xl shadow-2xl border border-black/5 flex flex-col"
        >
            <div className="p-6 border-b border-black/5 flex items-center justify-between bg-gray-50/50">
                <div>
                    <h3 className="font-heading font-semibold text-gray-900 tracking-tight">Activity</h3>
                    <p className="text-[9px] text-gray-400 uppercase tracking-[0.25em] font-semibold mt-0.5">Your social updates</p>
                </div>
                <button
                    onClick={onMarkAsRead}
                    className="text-[9px] font-bold text-[#4A90E2] uppercase tracking-wider hover:text-[#D4AF37] transition-colors"
                >
                    Clear All
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                <AnimatePresence initial={false}>
                    {notifications.length > 0 ? (
                        notifications.map((n) => (
                            <motion.div
                                key={n.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`p-4 rounded-2xl mb-2 transition-colors ${n.read ? 'bg-transparent' : 'bg-[#4A90E2]/5'}`}
                            >
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center font-semibold text-gray-600 text-xs overflow-hidden border border-black/5">
                                        {n.from.avatar ? <img src={n.from.avatar} className="w-full h-full object-cover" alt={n.from.name} /> : n.from.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-800 leading-snug font-light">
                                            <span className="font-semibold">{n.from.name}</span> {n.message}
                                        </p>
                                        <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider mt-1.5">
                                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-20 text-center">
                            <span className="text-4xl block mb-3 opacity-30">🔔</span>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.3em]">All caught up!</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <button
                onClick={onClose}
                className="p-5 text-center border-t border-black/5 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 hover:text-gray-900 hover:bg-gray-50/50 transition-all"
            >
                Close Panel
            </button>
        </motion.div>
    );
};

export default NotificationCenter;
