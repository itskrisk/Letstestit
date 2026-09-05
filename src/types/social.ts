export interface User {
    id: string;
    name: string;
    avatar?: string;
    username: string;
}

export interface Friend extends User {
    status: 'accepted' | 'pending' | 'incoming' | 'blocked';
    maskedAddress?: string; // e.g., "zipporah#1"
    allowGifting: boolean;
    allowOrderVisibility: boolean;
    lastActive?: string;
}

export interface FriendRequest {
    id: string;
    from: User;
    toId: string;
    status: 'pending' | 'accepted' | 'declined';
    timestamp: string;
}

export interface Reaction {
    emoji: string;
    count: number;
    userIds: string[];
}

export interface SharedOrder {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    items: {
        name: string;
        quantity: number;
        price: number;
        store: string;
        image?: string;
    }[];
    timestamp: string;
    total: number;
    reactions: Reaction[];
    image?: string; // Main order image
}

export interface Notification {
    id: string;
    type: 'friend_request' | 'gift_sent' | 'gift_received' | 'reaction' | 'order_shared';
    from: User;
    message: string;
    timestamp: string;
    read: boolean;
    link?: string;
}

export interface PrivacySettings {
    shareOrdersWithFriends: boolean;
    allowSurpriseGifts: boolean;
    showMaskedAddress: boolean;
    visibilityLevel: 'all_friends' | 'selective' | 'private';
    allowedGiftingFriends: string[]; // IDs of friends allowed to gift
}
