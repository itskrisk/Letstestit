import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Merchant, Product, Order, Rider, MerchantWarning, MerchantComplaint, MerchantStatus } from '../types/schema';
import { customerApi, merchantApi, courierApi, adminApi, socialApi, paymentApi } from '../lib/api';

// ============================================
// SUPABASE-BACKED DATABASE CONTEXT
// All data comes from Supabase via the API service layer
// ============================================

interface MockDatabaseData {
    merchants: Merchant[];
    products: Product[];
    orders: Order[];
    riders: Rider[];
    warnings: MerchantWarning[];
    complaints: MerchantComplaint[];

    // Actions
    updateMerchantStatus: (id: string, status: MerchantStatus) => Promise<void>;
    registerMerchant: (merchant: Merchant) => Promise<void>;
    updateMerchantSettings: (id: string, settings: Partial<Merchant>) => Promise<void>;
    deleteMerchant: (id: string) => Promise<void>;
    addOrder: (order: Order) => Promise<void>;
    updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;

    // Product Actions
    addProduct: (product: Product) => Promise<void>;
    updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;

    // Rider Actions
    acceptOrder: (riderId: string, orderId: string) => Promise<void>;
    pickupOrder: (riderId: string, orderId: string) => Promise<void>;
    completeDelivery: (riderId: string, orderId: string) => Promise<void>;
    updateRiderStatus: (riderId: string, isOnline: boolean) => Promise<void>;
    registerRider: (rider: Rider) => Promise<void>;

    // Selectors
    getMerchantProducts: (merchantId: string) => Product[];
    getMerchantOrders: (merchantId: string) => Order[];

    // Refresh helpers
    refreshMerchants: () => Promise<void>;
    refreshProducts: () => Promise<void>;
    refreshOrders: () => Promise<void>;
    refreshRiders: () => Promise<void>;
}

const MockDatabaseContext = createContext<MockDatabaseData | undefined>(undefined);

// ── Supabase Row → Frontend Type Mappers ──────────────────────

function mapMerchantRow(row: any): Merchant {
    return {
        id: row.id,
        businessName: row.business_name || '',
        type: row.type || 'Restaurant',
        status: row.status || 'PENDING',
        logoUrl: row.logo_url,
        coverImageUrl: row.cover_url,
        description: row.description || '',
        ownerName: row.business_name || '',
        ownerPhone: '',
        email: '',
        kraPin: row.kra_pin,
        createdAt: new Date(row.created_at),
        isActive: row.is_active ?? false,
        mpesaShortcode: row.mpesa_shortcode || '',
        deliveryFee: 150,
        operatingHours: typeof row.operating_hours === 'string'
            ? row.operating_hours
            : JSON.stringify(row.operating_hours || {}),
        address: row.address,
        mpesaTillNumber: row.mpesa_till,
        branding: row.branding || undefined,
    };
}

function mapProductRow(row: any): Product {
    return {
        id: row.id,
        merchantId: row.merchant_id,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        imageUrl: row.image_url,
        isAvailable: row.is_available ?? true,
        categoryId: row.category_id,
        isFeatured: row.is_featured ?? false,
        tags: [],
        preparationTimeMin: 30,
        sku: row.sku,
        stockLevel: row.stock_level,
        isPrescriptionRequired: false,
    };
}

function mapOrderRow(row: any): Order {
    return {
        id: row.id,
        merchantId: row.merchant_id,
        customer: {
            id: row.customer_id || '',
            name: '',
            phone: '',
        },
        items: row.items || [],
        total: Number(row.total),
        status: row.status,
        placedAt: new Date(row.created_at),
        time_placed: new Date(row.created_at).toLocaleString(),
        delivery_address: row.delivery_address,
        notes: row.notes,
        riderId: row.rider_id,
        payment: {
            method: row.payment_method || 'MPESA',
            status: row.payment_status || 'PENDING',
            mpesa_code: row.mpesa_code,
            amount_paid: Number(row.total),
        },
    };
}

function mapRiderRow(row: any): Rider {
    return {
        id: row.id,
        name: '',
        phone: '',
        vehicleType: row.vehicle_type || 'Motorbike',
        isOnline: row.is_online ?? false,
        status: row.is_online ? 'IDLE' : 'AWAY',
        earnings: { today: 0 },
        wallet: { balance: 0, pending: 0 },
        performance: {
            rating: Number(row.rating) || 5.0,
            acceptanceRate: 0,
            reliabilityScore: 0,
            completionRate: 0,
            onTimeRate: 0,
        },
        vehicle: row.vehicle_make ? {
            make: row.vehicle_make,
            model: row.vehicle_model || '',
            plate: row.vehicle_plate || '',
        } : undefined,
    };
}

// ── Provider ──────────────────────────────────────────────────

export const MockDatabaseProvider = ({ children }: { children: ReactNode }) => {
    const { user, token } = useAuth();
    const { updateToken } = useAuth();

    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [warnings] = useState<MerchantWarning[]>([]);
    const [complaints] = useState<MerchantComplaint[]>([]);

    // ── FETCH HELPERS ─────────────────────────────────────────

    const refreshMerchants = useCallback(async () => {
        try {
            const data = await customerApi.getStores();
            setMerchants((data.data || []).map(mapMerchantRow));
        } catch (err) {
            console.error('Failed to fetch merchants:', err);
        }
    }, []);

    const refreshProducts = useCallback(async () => {
        try {
            const data = await customerApi.getProducts();
            setProducts((data.data || []).map(mapProductRow));
        } catch (err) {
            console.error('Failed to fetch products:', err);
        }
    }, []);

    const refreshOrders = useCallback(async () => {
        try {
            const data = await customerApi.getOrders();
            setOrders((data.data || []).map(mapOrderRow));
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        }
    }, []);

    const refreshRiders = useCallback(async () => {
        try {
            // Fetch riders directly from Supabase
            const { supabase } = await import('../lib/supabaseClient');
            const { data: riderData, error } = await supabase
                .from('riders')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (!error && riderData) {
                setRiders(riderData.map(mapRiderRow));
            }
        } catch (err) {
            console.error('Failed to fetch riders:', err);
        }
    }, []);

    // Initial data load when user is authenticated
    useEffect(() => {
        if (user) {
            refreshMerchants();
            refreshProducts();
            refreshOrders();
            refreshRiders();
        }
    }, [user, refreshMerchants, refreshProducts, refreshOrders, refreshRiders]);

    // ── WRITE ACTIONS ─────────────────────────────────────────

    const updateMerchantStatus = async (id: string, status: MerchantStatus) => {
        await adminApi.approveMerchant(id);
        await refreshMerchants();
    };

    const registerMerchant = async (merchant: Merchant) => {
        // Merchant registration is handled during signup
        console.warn('registerMerchant should be called during signup, not here');
    };

    const updateMerchantSettings = async (id: string, settings: Partial<Merchant>) => {
        await merchantApi.updateSettings(id, settings);
        await refreshMerchants();
    };

    const deleteMerchant = async (id: string) => {
        // TODO: Implement delete
        await refreshMerchants();
    };

    const addOrder = async (order: Order) => {
        await customerApi.createOrder({
            merchantId: order.merchantId,
            items: order.items,
            deliveryAddress: order.delivery_address,
            paymentMethod: order.payment?.method || 'MPESA',
        });
        await refreshOrders();
    };

    const updateOrderStatus = async (orderId: string, status: Order['status']) => {
        // Use order service directly for status updates
        const { orderService } = await import('../lib/supabaseService');
        await orderService.updateOrderStatus(orderId, status);
        await refreshOrders();
    };

    // Product Actions
    const addProduct = async (product: Product) => {
        await merchantApi.createProduct({
            name: product.name,
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl,
            isAvailable: product.isAvailable,
            stockLevel: product.stockLevel,
            sku: product.sku,
            isFeatured: product.isFeatured,
            tags: product.tags,
            preparationTimeMin: product.preparationTimeMin,
            isPrescriptionRequired: product.isPrescriptionRequired,
        });
        await refreshProducts();
    };

    const updateProduct = async (id: string, product: Partial<Product>) => {
        await merchantApi.updateProduct(id, product);
        await refreshProducts();
    };

    const deleteProduct = async (id: string) => {
        await merchantApi.deleteProduct(id);
        await refreshProducts();
    };

    // Rider Actions
    const acceptOrder = async (riderId: string, orderId: string) => {
        await courierApi.acceptDelivery(orderId);
        await refreshOrders();
        await refreshRiders();
    };

    const pickupOrder = async (_riderId: string, orderId: string) => {
        await courierApi.updateDeliveryStatus(orderId, 'PICKED_UP');
        await refreshOrders();
    };

    const completeDelivery = async (_riderId: string, orderId: string) => {
        await courierApi.updateDeliveryStatus(orderId, 'DELIVERED');
        await refreshOrders();
        await refreshRiders();
    };

    const updateRiderStatus = async (riderId: string, isOnline: boolean) => {
        await courierApi.updateStatus(isOnline);
        await refreshRiders();
    };

    const registerRider = async (rider: Rider) => {
        // Rider registration is handled during signup
        console.warn('registerRider should be called during signup, not here');
    };

    // ── SELECTORS ─────────────────────────────────────────────

    const getMerchantProducts = (merchantId: string) => {
        return products.filter(p => p.merchantId === merchantId);
    };

    const getMerchantOrders = (merchantId: string) => {
        return orders.filter(o => o.merchantId === merchantId);
    };

    return (
        <MockDatabaseContext.Provider value={{
            merchants,
            products,
            orders,
            riders,
            warnings,
            complaints,
            updateMerchantStatus,
            registerMerchant,
            updateMerchantSettings,
            deleteMerchant,
            addOrder,
            updateOrderStatus,
            addProduct,
            updateProduct,
            deleteProduct,
            acceptOrder,
            pickupOrder,
            completeDelivery,
            updateRiderStatus,
            registerRider,
            getMerchantProducts,
            getMerchantOrders,
            refreshMerchants,
            refreshProducts,
            refreshOrders,
            refreshRiders,
        }}>
            {children}
        </MockDatabaseContext.Provider>
    );
};

export const useMockDatabase = () => {
    const context = useContext(MockDatabaseContext);
    if (context === undefined) {
        throw new Error('useMockDatabase must be used within a MockDatabaseProvider');
    }
    return context;
};
