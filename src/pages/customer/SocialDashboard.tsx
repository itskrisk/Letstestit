import { useState, useEffect } from 'react';
import { socialService } from "../../lib/socialService";
import { Friend, SharedOrder, Notification, User } from "../../types/social";
import OrderCard from "../../components/social/OrderCard";
import SocialSettings from "../../components/social/SocialSettings";
import NotificationCenter from "../../components/social/NotificationCenter";
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, TrendingUp, Heart } from 'lucide-react';

const SocialDashboard = () => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [orders, setOrders] = useState<SharedOrder[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [activeTab, setActiveTab] = useState<'feed' | 'trending' | 'friends' | 'settings'>('feed');
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);

    const currentUser: User = { id: 'me', name: 'You', username: 'current_user' };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadData = () => {
        setFriends(socialService.getFriends());
        setOrders(socialService.getSharedOrders());
        setNotifications(socialService.getNotifications());
    };

    useEffect(() => {
        if (searchQuery.length > 1) {
            setSearchResults(socialService.searchUsers(searchQuery));
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const handleOrderAgain = (order: SharedOrder) => {
        alert(`Added ${order.items.map(i => i.name).join(', ')} to your cart!`);
    };

    const handleGift = (friendId: string) => {
        const friend = friends.find(f => f.id === friendId);
        if (friend) {
            const success = socialService.createGiftOrder(friendId, [], currentUser);
            if (success) {
                alert(`Surprise! Sending a gift to ${friend.name} at ${friend.maskedAddress}. Payment processed from your end.`);
            }
        }
    };

    const handleReact = (orderId: string, emoji: string) => {
        socialService.addReaction(orderId, emoji, currentUser.id);
        loadData();
    };

    const handleAddFriend = (toId: string) => {
        socialService.sendFriendRequest(currentUser, toId);
        setSearchQuery('');
        alert('Friend request sent!');
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    // Calculate trending dishes
    const trendingDishes = orders
        .flatMap(o => o.items)
        .reduce((acc: { name: string; count: number; image?: string; store: string }[], item) => {
            const existing = acc.find(d => d.name === item.name);
            if (existing) {
                existing.count++;
            } else {
                acc.push({ name: item.name, count: 1, image: item.image, store: item.store });
            }
            return acc;
        }, [])
        .sort((a, b) => b.count - a.count);

    return (
        <div className="relative min-h-screen bg-gray-50">
            {/* Content Layer */}
            <div className="relative z-10 min-h-screen">
                {/* Top Bar - Instagram Style */}
                <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                    <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                        <a href="/" className="text-gray-900">
                            <ArrowLeft size={24} />
                        </a>
                        <h1 className="text-xl font-bold text-gray-900">Muncheez</h1>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative text-gray-900"
                        >
                            <Heart size={24} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showNotifications && (
                        <NotificationCenter
                            notifications={notifications}
                            onClose={() => setShowNotifications(false)}
                            onMarkAsRead={() => {
                                socialService.markNotificationsAsRead();
                                loadData();
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Tab Bar - Instagram Style */}
                <div className="bg-white border-b border-gray-200 sticky top-[57px] z-30">
                    <div className="max-w-2xl mx-auto flex">
                        {[
                            { key: 'feed', label: 'Feed' },
                            { key: 'trending', label: 'Trending' },
                            { key: 'friends', label: 'Friends' },
                            { key: 'settings', label: 'Settings' }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${activeTab === tab.key ? 'text-gray-900' : 'text-gray-400'
                                    }`}
                            >
                                {tab.label}
                                {activeTab === tab.key && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-900"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-2xl mx-auto">
                    {/* Search Bar - Only on Friends Tab */}
                    {activeTab === 'friends' && (
                        <div className="bg-white p-4 border-b border-gray-200">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search friends..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-gray-100 border-0 rounded-lg py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900"
                                />
                            </div>
                            <AnimatePresence>
                                {searchResults.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-2 space-y-2"
                                    >
                                        {searchResults.map(user => (
                                            <div key={user.id} className="flex items-center justify-between py-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">{user.name.charAt(0)}</div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                                                        <p className="text-xs text-gray-500">@{user.username}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAddFriend(user.id)}
                                                    className="bg-blue-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-600"
                                                >
                                                    Follow
                                                </button>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Feed Tab */}
                    {activeTab === 'feed' && (
                        <div className="pb-20">
                            {orders.length > 0 ? (
                                orders.map(order => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onOrderAgain={handleOrderAgain}
                                        onGift={handleGift}
                                        onReact={handleReact}
                                        isGiftable={friends.find(f => f.id === order.userId)?.allowGifting}
                                    />
                                ))
                            ) : (
                                <div className="py-20 text-center">
                                    <p className="text-gray-400 text-sm">No posts yet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Trending Tab */}
                    {activeTab === 'trending' && (
                        <div className="bg-white">
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={20} className="text-gray-900" />
                                    <h2 className="text-lg font-bold text-gray-900">Popular Among Friends</h2>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">What your friends are ordering this week</p>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {trendingDishes.map((dish, idx) => (
                                    <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            {dish.image && (
                                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                    <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{dish.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{dish.store}</p>
                                                <p className="text-xs text-gray-900 font-semibold mt-1">
                                                    Ordered {dish.count}× this week
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-gray-900">#{idx + 1}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Friends Tab */}
                    {activeTab === 'friends' && (
                        <div className="bg-white divide-y divide-gray-200">
                            {friends.map((friend) => (
                                <div key={friend.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100">
                                                <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{friend.name}</p>
                                                <p className="text-xs text-gray-500">{friend.maskedAddress}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleGift(friend.id)}
                                            className="bg-gray-100 text-gray-900 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-200"
                                        >
                                            Send Gift
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="p-4">
                            <SocialSettings />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SocialDashboard;
