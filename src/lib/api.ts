// ============================================
// MUNCHEEZ API CLIENT
// ============================================

import { supabase } from './supabaseClient';
import { authService, profileService, merchantService, riderService, productService, categoryService, orderService, walletService, complaintService, realtimeService, publicStoreService, reviewService, riderLocationService, dispatchService, notificationService, financialService, cartService } from './supabaseService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function adminFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('adminAccessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Request failed');
  }
  return data;
}

// ============================================
// AUTH API
// ============================================

export const authApi = {
  signup: async (data: { email: string; password: string; name: string; phone?: string; role: string }) => {
    const result = await authService.signUp(data.email, data.password, {
      full_name: data.name,
      phone: data.phone,
      role: data.role
    });
    return {
      user: result.data?.user || null,
      token: result.data?.session?.access_token || null,
      error: result.error?.message || null
    };
  },

  signupMerchant: async (data: { email: string; password: string; name: string; phone?: string; businessName: string; type?: string }) => {
    const result = await authService.signUp(data.email, data.password, {
      full_name: data.name,
      phone: data.phone,
      role: 'merchant',
      merchant_type: data.type || 'Restaurant'
    });
    return {
      user: result.data?.user || null,
      token: result.data?.session?.access_token || null,
      error: result.error?.message || null
    };
  },

  signupCourier: async (data: { email: string; password: string; name: string; phone?: string; vehicleType?: string; make?: string; model?: string; plate?: string }) => {
    const result = await authService.signUp(data.email, data.password, {
      full_name: data.name,
      phone: data.phone,
      role: 'courier',
      vehicle_type: data.vehicleType || 'Motorbike',
      vehicle_make: data.make,
      vehicle_model: data.model,
      vehicle_plate: data.plate
    });
    return {
      user: result.data?.user || null,
      token: result.data?.session?.access_token || null,
      error: result.error?.message || null
    };
  },

  login: async (email: string, password: string) => {
    const result = await authService.signIn(email, password);
    return {
      user: result.data?.user || null,
      token: result.data?.session?.access_token || null,
      error: result.error?.message || null
    };
  },

  logout: async () => {
    const result = await authService.signOut();
    return { error: result.error?.message || null };
  },

  refresh: async () => {
    const result = await authService.getSession();
    return {
      token: result.data?.session?.access_token || null,
      error: result.error?.message || null
    };
  },

  forgotPassword: async (email: string) => {
    const result = await authService.resetPassword(email);
    return { error: result.error?.message || null };
  },

  resetPassword: async (token: string, password: string) => {
    // Supabase handles password reset via email link
    return { error: 'Use the link sent to your email' };
  },

  getMe: async () => {
    const result = await authService.getUser();
    return {
      user: result.data?.user || null,
      error: result.error?.message || null
    };
  },

  addRole: async (role: string) => {
    // Roles are managed via Supabase metadata
    return { user: null, error: null };
  }
};

// ============================================
// CUSTOMER API
// ============================================

export const customerApi = {
  getStores: async () => {
    // Get all active merchants (public storefront)
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'APPROVED');
    return { data: data || [], error: error?.message || null };
  },

  getStore: async (id: string) => {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error: error?.message || null };
  },

  getProducts: async (merchantId?: string) => {
    const result = await productService.getProducts(merchantId);
    return { data: result.data || [], error: result.error?.message || null };
  },

  getOrders: async () => {
    const result = await orderService.getOrders();
    return { data: result.data || [], error: result.error?.message || null };
  },

  getOrder: async (id: string) => {
    const result = await orderService.getOrder(id);
    return { data: result.data, error: result.error?.message || null };
  },

  createOrder: async (data: { merchantId: string; items: any[]; deliveryAddress?: string; paymentMethod?: string }) => {
    // Calculate totals server-side
    const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 150; // TODO: Calculate based on distance
    const serviceFee = subtotal * 0.05; // 5% service fee
    const total = subtotal + deliveryFee + serviceFee;

    const result = await orderService.createOrder({
      customer_id: (await authService.getUser()).data?.user?.id,
      merchant_id: data.merchantId,
      status: 'CREATED',
      total,
      delivery_fee: deliveryFee,
      service_fee: serviceFee,
      delivery_address: data.deliveryAddress,
      payment_method: data.paymentMethod || 'MPESA',
      payment_status: 'PENDING',
      items: data.items
    });

    return { data: result.data, error: result.error?.message || null };
  },

  cancelOrder: async (id: string) => {
    const result = await orderService.updateOrderStatus(id, 'CANCELLED');
    return { data: result.data, error: result.error?.message || null };
  },

  // M-Pesa Payment Integration
  initiatePayment: async (orderId: string, phoneNumber: string) => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('accessToken');

    const response = await fetch(`${API_BASE}/api/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ orderId, phoneNumber })
    });

    const result = await response.json();
    return { data: result.data, error: result.error?.message || null };
  },

  getPaymentStatus: async (paymentId: string) => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('accessToken');

    const response = await fetch(`${API_BASE}/api/payments/${paymentId}/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    return { data: result.data, error: result.error?.message || null };
  },

  getLoyalty: async () => {
    // TODO: Implement loyalty logic
    return { data: { tier: 'Standard', points: 0 }, error: null };
  },

  updateProfile: async (data: { fullName?: string; phone?: string }) => {
    const userId = (await authService.getUser()).data?.user?.id;
    if (!userId) return { data: null, error: 'Not authenticated' };

    const result = await profileService.updateProfile(userId, data);
    return { data: result.data, error: result.error?.message || null };
  }
};

// ============================================
// MERCHANT API
// ============================================

export const merchantApi = {
  getDashboard: async () => {
    const userId = (await authService.getUser()).data?.user?.id;
    if (!userId) return { data: null, error: 'Not authenticated' };

    const merchantResult = await merchantService.getMerchant(userId);
    const productsResult = await productService.getProducts(userId);
    const ordersResult = await orderService.getOrders(undefined, userId);

    return {
      data: {
        merchant: merchantResult.data,
        products: productsResult.data || [],
        orders: ordersResult.data || []
      },
      error: null
    };
  },

  getProducts: async () => {
    const userId = (await authService.getUser()).data?.user?.id;
    const result = await productService.getProducts(userId);
    return { data: result.data || [], error: result.error?.message || null };
  },

  createProduct: async (data: any) => {
    const userId = (await authService.getUser()).data?.user?.id;
    const result = await productService.createProduct({
      ...data,
      merchant_id: userId
    });
    return { data: result.data, error: result.error?.message || null };
  },

  updateProduct: async (id: string, data: any) => {
    const result = await productService.updateProduct(id, data);
    return { data: result.data, error: result.error?.message || null };
  },

  deleteProduct: async (id: string) => {
    const result = await productService.deleteProduct(id);
    return { data: result.data, error: result.error?.message || null };
  },

  getOrders: async () => {
    const userId = (await authService.getUser()).data?.user?.id;
    const result = await orderService.getOrders(undefined, userId);
    return { data: result.data || [], error: result.error?.message || null };
  },

  updateOrderStatus: async (id: string, status: string) => {
    const userId = (await authService.getUser()).data?.user?.id;
    const result = await orderService.updateOrderStatus(id, status, userId);
    return { data: result.data, error: result.error?.message || null };
  },

  getCustomers: async () => {
    // TODO: Implement
    return { data: [], error: null };
  },

  getPayments: async () => {
    // TODO: Implement
    return { data: [], error: null };
  },

  getReports: async () => {
    // TODO: Implement
    return { data: {}, error: null };
  },

  updateSettings: async (id: string, data: any) => {
    const result = await merchantService.updateMerchant(id, data);
    return { data: result.data, error: result.error?.message || null };
  },

  updateStatus: async (isActive: boolean) => {
    const userId = (await authService.getUser()).data?.user?.id;
    if (!userId) return { data: null, error: 'Not authenticated' };
    const result = await merchantService.updateMerchant(userId, { is_active: isActive });
    return { data: result.data, error: result.error?.message || null };
  }
};

// ============================================
// COURIER API
// ============================================

export const courierApi = {
  getProfile: async () => {
    const userId = (await authService.getUser()).data?.user?.id;
    if (!userId) return { data: null, error: 'Not authenticated' };
    const result = await riderService.getRider(userId);
    return { data: result.data, error: result.error?.message || null };
  },

  getDeliveries: async () => {
    const userId = (await authService.getUser()).data?.user?.id;
    const result = await orderService.getOrders(undefined, undefined, userId);
    return { data: result.data || [], error: result.error?.message || null };
  },

  updateStatus: async (isOnline: boolean) => {
    const userId = (await authService.getUser()).data?.user?.id;
    if (!userId) return { data: null, error: 'Not authenticated' };
    const result = await riderService.updateRider(userId, { is_online: isOnline });
    return { data: result.data, error: result.error?.message || null };
  },

  acceptDelivery: async (orderId: string) => {
    const userId = (await authService.getUser()).data?.user?.id;
    const result = await orderService.updateOrderStatus(orderId, 'RIDER_ASSIGNED', userId);
    return { data: result.data, error: result.error?.message || null };
  },

  updateDeliveryStatus: async (orderId: string, status: string) => {
    const userId = (await authService.getUser()).data?.user?.id;
    const result = await orderService.updateOrderStatus(orderId, status, userId);
    return { data: result.data, error: result.error?.message || null };
  },

  getEarnings: async () => {
    const userId = (await authService.getUser()).data?.user?.id;
    if (!userId) return { data: [], error: 'Not authenticated' };
    const result = await walletService.getEntries(userId);
    return { data: result.data || [], error: result.error?.message || null };
  },

  updateLocation: async (lat: number, lng: number, orderId?: string) => {
    const userId = (await authService.getUser()).data?.user?.id;
    if (!userId) return { data: null, error: 'Not authenticated' };
    const result = await riderLocationService.updateLocation({
      rider_id: userId,
      order_id: orderId,
      lat,
      lng
    });
    return { data: result.data, error: result.error };
  },

  getCurrentLocation: async () => {
    const userId = (await authService.getUser()).data?.user?.id;
    if (!userId) return { data: null, error: 'Not authenticated' };
    const result = await riderLocationService.getLocation(userId);
    return { data: result.data, error: result.error };
  },

  getPendingOffers: async () => {
    const userId = (await authService.getUser()).data?.user?.id;
    if (!userId) return { data: [], error: 'Not authenticated' };
    const result = await dispatchService.getPendingOffers(userId);
    return { data: result.data, error: result.error };
  },

  acceptOffer: async (offerId: string) => {
    const userId = (await authService.getUser()).data?.user?.id;
    if (!userId) return { data: null, error: 'Not authenticated' };
    const result = await dispatchService.respondToOffer(offerId, 'ACCEPTED');
    return { data: result.data, error: result.error };
  },

  rejectOffer: async (offerId: string) => {
    const userId = (await authService.getUser()).data?.user?.id;
    if (!userId) return { data: null, error: 'Not authenticated' };
    const result = await dispatchService.respondToOffer(offerId, 'REJECTED');
    return { data: result.data, error: result.error };
  }
};

// ============================================
// ADMIN API
// ============================================

export const adminApi = {
  login: async (email: string, password: string) => {
    const result = await adminFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return {
      user: result.data?.user || null,
      token: result.data?.token || null,
      roles: result.data?.roles || [],
      error: result.error?.message || null,
    };
  },

  getDashboard: async () => {
    const result = await adminFetch('/api/admin/dashboard');
    return { data: result.data, error: null };
  },

  getMerchantApplications: async (status = 'PENDING', page = 1, limit = 20) => {
    const result = await adminFetch(`/api/admin/merchant-applications?status=${status}&page=${page}&limit=${limit}`);
    return { data: result.data, error: null };
  },

  approveMerchant: async (id: string, note?: string) => {
    const result = await adminFetch(`/api/admin/merchants/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
    return { data: result, error: null };
  },

  rejectMerchant: async (id: string, note?: string) => {
    const result = await adminFetch(`/api/admin/merchants/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
    return { data: result, error: null };
  },

  suspendMerchant: async (id: string, reason?: string) => {
    const result = await adminFetch(`/api/admin/merchants/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return { data: result, error: null };
  },

  getRiderApplications: async (status = 'PENDING', page = 1, limit = 20) => {
    const result = await adminFetch(`/api/admin/rider-applications?status=${status}&page=${page}&limit=${limit}`);
    return { data: result.data, error: null };
  },

  approveRider: async (id: string, note?: string) => {
    const result = await adminFetch(`/api/admin/riders/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
    return { data: result, error: null };
  },

  rejectRider: async (id: string, note?: string) => {
    const result = await adminFetch(`/api/admin/riders/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
    return { data: result, error: null };
  },

  getOrders: async (status?: string, page = 1, limit = 20) => {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) query.set('status', status);
    const result = await adminFetch(`/api/admin/orders?${query.toString()}`);
    return { data: result.data, error: null };
  },

  getAuditLogs: async (action?: string, entityType?: string, page = 1, limit = 20) => {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (action) query.set('action', action);
    if (entityType) query.set('entityType', entityType);
    const result = await adminFetch(`/api/admin/audit-logs?${query.toString()}`);
    return { data: result.data, error: null };
  },
};

// ============================================
// PUBLIC STOREFRONT API (No auth required)
// ============================================

export const publicApi = {
  getStores: async (options?: { lat?: number; lng?: number; radius?: number; category?: string; search?: string; featured?: boolean }) => {
    const result = await publicStoreService.getStores(options);
    return { data: result.data, error: result.error };
  },

  getStore: async (id: string) => {
    const result = await publicStoreService.getStore(id);
    return { data: result.data, error: result.error };
  },

  getStoreProducts: async (merchantId: string, options?: { category?: string; search?: string; featured?: boolean }) => {
    const result = await publicStoreService.getStoreProducts(merchantId, options);
    return { data: result.data, error: result.error };
  },

  getCategories: async (merchantId?: string) => {
    const result = await publicStoreService.getCategories(merchantId);
    return { data: result.data, error: result.error };
  },

  search: async (query: string, options?: { lat?: number; lng?: number; radius?: number }) => {
    const result = await publicStoreService.search(query, options);
    return { data: result.data, error: result.error };
  },

  getReviews: async (merchantId: string) => {
    const result = await reviewService.getReviews(merchantId);
    return { data: result.data, error: result.error };
  }
};

// ============================================
// SOCIAL API
// ============================================

export const socialApi = {
  getNotifications: async () => {
    const userId = (await authService.getUser()).data?.user?.id;
    if (!userId) return { data: [], error: 'Not authenticated' };
    const result = await notificationService.getNotifications(userId);
    return { data: result.data, error: result.error };
  },

  getUnreadCount: async () => {
    const userId = (await authService.getUser()).data?.user?.id;
    if (!userId) return { data: 0, error: 'Not authenticated' };
    const result = await notificationService.getUnreadCount(userId);
    return { data: result.count, error: result.error };
  },

  markNotificationRead: async (id: string) => {
    const result = await notificationService.markAsRead(id);
    return { data: result.data, error: result.error };
  },

  markAllNotificationsRead: async () => {
    const userId = (await authService.getUser()).data?.user?.id;
    if (!userId) return { data: null, error: 'Not authenticated' };
    const result = await notificationService.markAllAsRead(userId);
    return { data: result.data, error: result.error };
  }
};

// ============================================
// PAYMENT API
// ============================================

export const paymentApi = {
  initiate: async (orderId: string) => {
    // TODO: Integrate with M-Pesa
    return { data: { checkoutRequestId: `mock-${Date.now()}` }, error: null };
  },

  getStatus: async (paymentId: string) => {
    // TODO: Implement
    return { data: { status: 'PENDING' }, error: null };
  }
};

// ============================================
// FINANCIAL API
// ============================================

export const financialApi = {
  getLedger: async (options?: { type?: string; status?: string; limit?: number }) => {
    const userId = (await authService.getUser()).data?.user?.id;
    if (!userId) return { data: [], error: 'Not authenticated' };
    const result = await financialService.getEntries(userId, options);
    return { data: result.data, error: result.error };
  },

  getOrderLedger: async (orderId: string) => {
    const result = await financialService.getOrderEntries(orderId);
    return { data: result.data, error: result.error };
  }
};

// ============================================
// REALTIME
// ============================================

export const realtimeApi = {
  subscribeToOrder: (orderId: string, callback: (payload: any) => void) => {
    return realtimeService.subscribeToOrder(orderId, callback);
  },

  subscribeToOrders: (callback: (payload: any) => void) => {
    return realtimeService.subscribeToOrders(callback);
  }
};

// ============================================
// CART API
// ============================================

export const cartApi = {
  async getCart() {
    return cartService.getCart();
  },

  async updateCart(cart: { items: any[]; merchantId: string | null }) {
    return cartService.updateCart(cart);
  },

  async clearCart() {
    return cartService.clearCart();
  }
};
