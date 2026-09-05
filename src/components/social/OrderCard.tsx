import { SharedOrder } from '../../types/social';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

interface OrderCardProps {
    order: SharedOrder;
    onOrderAgain: (order: SharedOrder) => void;
    onGift?: (friendId: string) => void;
    onReact?: (orderId: string, emoji: string) => void;
    isGiftable?: boolean;
}

const OrderCard = ({ order, onOrderAgain, onGift, onReact, isGiftable }: OrderCardProps) => {
    const [isSaved, setIsSaved] = useState(false);
    const [liked, setLiked] = useState(false);

    const getTimeAgo = (timestamp: string) => {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now.getTime() - then.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleLike = () => {
        setLiked(!liked);
        if (!liked) {
            onReact?.(order.id, '❤️');
        }
    };

    const totalReactions = (order.reactions || []).reduce((sum, r) => sum + r.count, 0);

    return (
        <motion.article
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white mb-6 border-b border-gray-200"
        >
            {/* Header - Instagram Style */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-100">
                        <img src={order.userAvatar} alt={order.userName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-gray-900">{order.userName}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{getTimeAgo(order.timestamp)}</span>
                        </div>
                        <p className="text-xs text-gray-500">{order.items[0]?.store}</p>
                    </div>
                </div>
                <button className="text-gray-900">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {/* Main Image */}
            {order.image && (
                <div className="relative w-full aspect-square bg-gray-100">
                    <img
                        src={order.image}
                        alt={order.items[0]?.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between px-4 pt-3">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLike}
                        className="hover:opacity-60 transition-opacity active:scale-90"
                    >
                        <Heart
                            size={24}
                            className={liked ? 'fill-red-500 stroke-red-500' : 'stroke-gray-900'}
                        />
                    </button>
                    <button className="hover:opacity-60 transition-opacity active:scale-90">
                        <MessageCircle size={24} className="stroke-gray-900" />
                    </button>
                    {isGiftable && onGift && (
                        <button
                            onClick={() => onGift(order.userId)}
                            className="hover:opacity-60 transition-opacity active:scale-90"
                        >
                            <Send size={24} className="stroke-gray-900" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setIsSaved(!isSaved)}
                    className="hover:opacity-60 transition-opacity active:scale-90"
                >
                    <Bookmark
                        size={24}
                        className={isSaved ? 'fill-gray-900 stroke-gray-900' : 'stroke-gray-900'}
                    />
                </button>
            </div>

            {/* Likes Count */}
            {totalReactions > 0 && (
                <div className="px-4 pt-2">
                    <p className="text-sm font-semibold text-gray-900">
                        {totalReactions} {totalReactions === 1 ? 'like' : 'likes'}
                    </p>
                </div>
            )}

            {/* Caption/Items */}
            <div className="px-4 pt-2 pb-3">
                <div className="space-y-1">
                    <p className="text-sm">
                        <span className="font-semibold text-gray-900 mr-2">{order.userName}</span>
                        <span className="text-gray-900">
                            {order.items.map(item => `${item.quantity}× ${item.name}`).join(', ')}
                        </span>
                    </p>
                    <p className="text-xs text-gray-500">
                        Total: <span className="font-semibold text-gray-900">KSh {order.total.toLocaleString()}</span>
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={() => onOrderAgain(order)}
                        className="flex-1 bg-black text-white text-xs font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 active:scale-95 transition-all"
                    >
                        Order This
                    </button>
                    {isGiftable && onGift && (
                        <button
                            onClick={() => onGift(order.userId)}
                            className="flex-1 bg-gray-100 text-gray-900 text-xs font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 active:scale-95 transition-all"
                        >
                            Send Gift 🎁
                        </button>
                    )}
                </div>
            </div>
        </motion.article>
    );
};

export default OrderCard;
