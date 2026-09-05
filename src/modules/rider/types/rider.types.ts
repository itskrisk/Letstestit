export type RiderPresence =
    | "OFFLINE"
    | "ONLINE_IDLE"
    | "OFFER_RECEIVED"
    | "ASSIGNED"
    | "ARRIVED_AT_PICKUP"
    | "PICKED_UP"
    | "EN_ROUTE"
    | "ARRIVED_AT_CUSTOMER"
    | "COMPLETED"
    | "ON_BREAK"
    | "SUSPENDED";

export type OrderState =
    | "CREATED"
    | "OFFERED"
    | "ACCEPTED"
    | "ARRIVED_AT_STORE"
    | "READY"
    | "PICKED_UP"
    | "IN_TRANSIT"
    | "ARRIVED"
    | "DELIVERED"
    | "CANCELLED"
    | "FAILED";

export interface Location {
    lat: number;
    lng: number;
    address?: string;
}

export interface RiderPresenceMeta {
    lastActive: Date;
    batteryLevel: number;
    networkStrength: "STRONG" | "WEAK" | "OFFLINE";
    gpsAccuracy: number;
}

export interface OrderOffer {
    id: string;
    pickup: Location;
    dropoff: Location;
    distanceKm: number;
    estimatedMinutes: number;
    payout: {
        base: number;
        surge: number;
        tipEstimate?: number;
    };
    expiresAt: Date;
}

export interface EarningsBreakdown {
    base: number;
    distance: number;
    surge: number;
    tip: number;
    bonus: number;
    penalty: number;
}

export interface RiderScorecard {
    acceptanceRate: number;
    completionRate: number;
    onTimeRate: number;
    rating: number;
    reliabilityScore: number;
}

export interface WalletTransaction {
    id: string;
    amount: number;
    type: "EARNING" | "CASHOUT" | "BONUS" | "PENALTY";
    status: "COMPLETED" | "PENDING" | "FAILED";
    timestamp: Date;
    description: string;
    mpesaReceipt?: string;
}

export interface Wallet {
    balance: number;
    pendingEarnings: number;
    totalWithdrawn: number;
    transactions: WalletTransaction[];
}

export interface VehicleProfile {
    id: string;
    make: string;
    model: string;
    plateNumber: string;
    lastServiceDate: Date;
    mileageKm: number;
    fuelEfficiency: number; // L/100km
}

export interface SafetyIncident {
    id: string;
    type: "ACCIDENT" | "HARASSMENT" | "THEFT" | "HEALTH_EMERGENCY";
    timestamp: Date;
    location: Location;
    status: "REPORTED" | "INVESTIGATING" | "RESOLVED";
    description: string;
}

export interface Document {
    id: string;
    name: string;
    type: "ID" | "LICENSE" | "INSURANCE" | "HEALTH_CERT";
    expiryDate: Date;
    status: "VERIFIED" | "EXPIRED" | "PENDING";
    imageUrl: string;
}

export interface Referral {
    id: string;
    referredName: string;
    status: "SIGNED_UP" | "ACTIVE" | "COMPLETED_FIRST_DELIVERY";
    bonusEarned: number;
}

export interface RiderAnalytics {
    totalDeliveries: number;
    totalDistanceKm: number;
    avgOnlineHoursPerDay: number;
    efficiencyRatio: number; // Earnings per hour
    customerCompliments: string[];
}

export interface HeatmapPoint {
    lat: number;
    lng: number;
    intensity: number; // 0-1
}
