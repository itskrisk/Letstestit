// Supabase Compatibility Shim
// This file provides a Supabase-like interface that routes calls to the backend API
// Use this as a temporary bridge while migrating pages from Supabase to backend API

import { authApi, customerApi, merchantApi, courierApi, adminApi, socialApi, paymentApi } from './api';

// ============================================================
// AUTH SHIM
// ============================================================

const authShim = {
  signUp: async (options: any) => {
    const result = await authApi.signup({
      email: options.email,
      password: options.password,
      name: options.data?.full_name || options.data?.name || options.email,
      phone: options.data?.phone,
      role: 'customer',
    });
    return { data: { user: result.user, session: { access_token: result.token } }, error: null };
  },

  signInWithPassword: async (credentials: any) => {
    const result = await authApi.login(credentials.email, credentials.password);
    return { data: { user: result.user, session: { access_token: result.token } }, error: null };
  },

  signOut: async () => {
    await authApi.logout();
    return { error: null };
  },

  getSession: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return { data: { session: null } };
    
    try {
      const result = await authApi.getMe();
      return { data: { session: { user: result.user, access_token: token } } };
    } catch {
      return { data: { session: null } };
    }
  },

  resetPasswordForEmail: async (email: string) => {
    await authApi.forgotPassword(email);
    return { data: {}, error: null };
  },

  updateUser: async (updates: any) => {
    // Password reset is handled separately
    return { data: { user: {} }, error: null };
  },
};

// ============================================================
// DATABASE SHIM
// ============================================================

class TableShim {
  private tableName: string;
  private filters: any[] = [];
  private selectFields: string = '*';
  private singleResult: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields: string) {
    this.selectFields = fields;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ type: 'gt', column, value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ type: 'lt', column, value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ type: 'gte', column, value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ type: 'lte', column, value });
    return this;
  }

  like(column: string, value: string) {
    this.filters.push({ type: 'like', column, value });
    return this;
  }

  ilike(column: string, value: string) {
    this.filters.push({ type: 'ilike', column, value });
    return this;
  }

  is(column: string, value: any) {
    this.filters.push({ type: 'is', column, value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ type: 'in', column, value: values });
    return this;
  }

  or(condition: string) {
    this.filters.push({ type: 'or', value: condition });
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.filters.push({ type: 'order', column, ascending: options.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.filters.push({ type: 'limit', value: count });
    return this;
  }

  range(from: number, to: number) {
    this.filters.push({ type: 'range', from, to });
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  async execute(): Promise<{ data: any; error: any }> {
    // This is a simplified shim - for complex queries, pages should be migrated to use the API directly
    console.warn(`[SupabaseShim] Table query on "${this.tableName}" - consider migrating to backend API`);
    
    // Return empty data for now - pages using this shim should be migrated
    return { data: this.singleResult ? null : [], error: null };
  }

  async insert(data: any): Promise<{ data: any; error: any }> {
    console.warn(`[SupabaseShim] Insert into "${this.tableName}" - consider migrating to backend API`);
    return { data: null, error: null };
  }

  async update(data: any): Promise<{ data: any; error: any }> {
    console.warn(`[SupabaseShim] Update "${this.tableName}" - consider migrating to backend API`);
    return { data: null, error: null };
  }

  async delete(): Promise<{ data: any; error: any }> {
    console.warn(`[SupabaseShim] Delete from "${this.tableName}" - consider migrating to backend API`);
    return { data: null, error: null };
  }

  async upsert(data: any): Promise<{ data: any; error: any }> {
    console.warn(`[SupabaseShim] Upsert into "${this.tableName}" - consider migrating to backend API`);
    return { data: null, error: null };
  }
}

const dbShim = {
  from: (table: string) => new TableShim(table),
  
  // Direct table access for common operations
  async merchants() {
    const result = await customerApi.getStores();
    return { data: result, error: null };
  },

  async products() {
    const result = await customerApi.getProducts();
    return { data: result, error: null };
  },

  async orders() {
    const result = await customerApi.getOrders();
    return { data: result, error: null };
  },

  async riders() {
    // Fetch riders directly from Supabase since adminApi doesn't have getRiders
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      const supabaseClient = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabaseClient.from('riders').select('*');
      return { data: data || [], error };
    } catch (e) {
      return { data: [], error: e };
    }
  },
};

// ============================================================
// REALTIME SHIM
// ============================================================

class RealtimeChannelShim {
  private channelName: string;
  private callbacks: any[] = [];

  constructor(name: string) {
    this.channelName = name;
  }

  on(event: string, options: any, callback: any) {
    this.callbacks.push({ event, options, callback });
    return this;
  }

  subscribe() {
    console.warn(`[SupabaseShim] Realtime subscription on "${this.channelName}" - realtime not available in shim`);
    return this;
  }
}

const realtimeShim = {
  channel: (name: string) => new RealtimeChannelShim(name),
  removeChannel: (channel: any) => {
    console.warn(`[SupabaseShim] Removed channel "${channel.channelName}"`);
  },
};

// ============================================================
// MAIN SUPABASE OBJECT
// ============================================================

export const supabase = {
  auth: authShim,
  from: (table: string) => new TableShim(table),
  channel: (name: string) => new RealtimeChannelShim(name),
  removeChannel: (channel: any) => {
    console.warn(`[SupabaseShim] Removed channel`);
  },
  
  // Direct access to common tables
  async merchants() {
    return dbShim.merchants();
  },

  async products() {
    return dbShim.products();
  },

  async orders() {
    return dbShim.orders();
  },

  async riders() {
    return dbShim.riders();
  },
};

export default supabase;
