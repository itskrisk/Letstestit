// Core System Entities for Muncheez
// Following the "Nairobi Soul" Architecture

export type MerchantType = 'Restaurant' | 'Supermarket' | 'Pharmacy' | 'Water' | 'Flowers';

export type MerchantStatus = 'PENDING' | 'VERIFICATION_PENDING' | 'APPROVED' | 'SUSPENDED';

// 1. Merchant Entity (Parent)
export interface Merchant {
    id: string;
    businessName: string;
    type: MerchantType;
    status: MerchantStatus;
    logoUrl?: string;
    coverImageUrl?: string;
    description: string;
    // Contact
    ownerName: string;
    ownerPhone: string; // M-Pesa linked
    email: string;
    // Compliance
    kraPin?: string;
    documents?: Record<string, { url: string; filename?: string; uploadedAt?: string }>;
    createdAt: Date;
    // Operational Toggles (Nairobi Specific)
    isActive: boolean;
    mpesaShortcode: string;
    // Operational Metrics (Production)
    deliveryFee?: number;
    operatingHours?: string;
    address?: string;
    // Financials
    taxRate?: number; // e.g., 16 for VAT
    mpesaTillNumber?: string;

    // Notifications
    notificationEmail?: string;
    notificationPhone?: string;

    // UI Customization
    branding?: {
        primaryColor: string;
        secondaryColor: string;
        bannerUrl?: string;
    };

    // Dynamic Settings (Sector Specifics)
    customSettings?: {
        // Restaurant
        kitchenPrepTimeMin?: number;
        cutleryRequired?: boolean;
        dietaryTags?: string[];

        // Pharmacy
        pharmacistName?: string;
        licenseNumber?: string;
        acceptInsurance?: boolean;

        // Supermarket
        lowStockThreshold?: number;
        bulkPurchaseLimit?: number;

        [key: string]: any;
    };
}

// 2. Merchant Location (Branch)
export interface MerchantLocation {
    id: string;
    merchantId: string;
    branchName: string; // e.g. "Westlands", "CBD"
    address: string;
    geo: {
        lat: number;
        lng: number;
    };
    deliveryRadiusKm: number;
    isActive: boolean; // "Live" toggle
}

// 3. Product / Inventory (Polymorphic)
export interface Product {
    id: string;
    merchantId: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    isAvailable: boolean; // Required - controls cart availability

    // Universal Fields (All Merchant Types)
    categoryId?: string; // "Starters", "Mains", "Dairy", "Medicine"
    isFeatured?: boolean; // Promotes to hero sections/deals
    tags?: string[]; // ["Vegan", "Gluten-Free", "Sale", "New"]

    // Restaurant Specific
    preparationTimeMin?: number; // Customer expectation: "Ready in 15 min"

    // Retail Specific (Supermarket/Pharmacy)
    sku?: string;
    stockLevel?: number;
    barcode?: string;
    vatRate?: number; // 16% standard

    // Pharmacy Specific
    isPrescriptionRequired?: boolean; // Compliance requirement
}

// 4. Order (The "Process")
export type OrderStatus =
    | 'CREATED'
    | 'PAYMENT_PENDING'
    | 'PAYMENT_CONFIRMED'
    | 'AWAITING_MERCHANT_ACTION'
    | 'ACCEPTED'
    | 'PREPARING' // Restaurant
    | 'PACKING'   // Retail
    | 'READY_FOR_PICKUP'
    | 'RIDER_ASSIGNED'
    | 'PICKED_UP'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'DECLINED'
    | 'CANCELLED'
    | 'FAILED';

export interface Order {
    id: string;
    merchantId: string; // Link to Merchant
    customer: {
        id?: string;
        name: string;
        phone: string;
        orders_count?: number; // Added for CRM support
    };
    items: Array<{
        productId?: string;
        name: string;
        quantity: number;
        price: number;
        options?: string[]; // e.g. "Spicy", "No Onion"
    }>;
    total: number; // Simplified to match OrdersView expectation
    payment?: {
        method: string;
        status: string;
        mpesa_code?: string;
        amount_paid?: number;
    };
    status: OrderStatus;
    placedAt?: Date;
    time_placed?: string; // For display: "2 mins ago"
    delivery_address?: string;
    notes?: string;
    riderId?: string; // Link to assigned Rider
}

// Merchant Management Types
export interface MerchantWarning {
    id: string;
    merchantId: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reason: string;
    details: string;
    issuedBy: string;
    issuedAt: Date;
    acknowledged?: boolean;
}

export interface MerchantComplaint {
    id: string;
    merchantId: string;
    category: 'QUALITY' | 'DELIVERY' | 'BEHAVIOR' | 'FRAUD' | 'OTHER';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    subject: string;
    description: string;
    filedBy: string;
    filedAt: Date;
    status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
    resolution?: string;
}

export interface Rider {
    id: string;
    name: string;
    phone: string;
    vehicleType: 'Motorbike' | 'Bicycle' | 'Foot' | 'Car';
    isOnline: boolean;
    status: 'IDLE' | 'BUSY' | 'AWAY' | 'PICKING_UP' | 'DELIVERING';
    currentOrderId?: string;
    earnings: {
        today: number;
        weekly?: number;
        total?: number;
    };
    currentLocation?: {
        lat: number;
        lng: number;
    };
    // v1.1 Fleet Suite Extensions
    wallet: {
        balance: number;
        pending: number;
    };
    performance: {
        rating: number;
        acceptanceRate: number;
        reliabilityScore: number;
        completionRate: number;
        onTimeRate: number;
    };
    vehicle?: {
        make: string;
        model: string;
        plate: string;
    };
    documents?: Record<string, { url: string; filename?: string; uploadedAt?: string }>;
}
