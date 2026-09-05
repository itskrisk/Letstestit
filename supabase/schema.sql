-- ============================================================
-- MUNCHEEZ V2: FRESH DATABASE SCHEMA
-- Clean slate — no legacy baggage
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'merchant', 'courier', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE merchant_type AS ENUM ('Restaurant', 'Supermarket', 'Pharmacy', 'Water', 'Flowers');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE merchant_status AS ENUM ('PENDING', 'VERIFICATION_PENDING', 'APPROVED', 'SUSPENDED', 'DELETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE rider_status AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'DELETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'CREATED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'ACCEPTED',
        'PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP',
        'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE complaint_status AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE complaint_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE warning_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- CORE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
    id           UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name    TEXT,
    phone        TEXT UNIQUE,
    roles        TEXT[] DEFAULT '{customer}' CHECK (array_length(roles, 1) <= 1),
    avatar_url   TEXT,
    status       TEXT DEFAULT 'ACTIVE',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS active_sessions (
    user_id       UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    session_token TEXT NOT NULL,
    primary_role  TEXT NOT NULL DEFAULT 'customer',
    all_roles     TEXT[] NOT NULL DEFAULT '{customer}' CHECK (array_length(all_roles, 1) <= 1),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS merchants (
    id                UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    business_name     TEXT NOT NULL,
    type              merchant_type NOT NULL DEFAULT 'Restaurant',
    status            merchant_status DEFAULT 'PENDING',
    logo_url          TEXT,
    cover_url         TEXT,
    description       TEXT,
    address           TEXT,
    kra_pin           TEXT,
    health_permit     TEXT,
    kra_pin_url       TEXT,
    health_permit_url TEXT,
    mpesa_till        TEXT,
    mpesa_shortcode   TEXT,
    operating_hours   JSONB DEFAULT '{}'::jsonb,
    branding          JSONB DEFAULT '{}'::jsonb,
    is_active         BOOLEAN DEFAULT false,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS riders (
    id              UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    vehicle_type    TEXT DEFAULT 'Motorbike',
    vehicle_make    TEXT,
    vehicle_model   TEXT,
    vehicle_plate   TEXT,
    status          rider_status DEFAULT 'PENDING',
    is_online       BOOLEAN DEFAULT false,
    rating          DECIMAL(3,2) DEFAULT 5.0,
    total_orders    INTEGER DEFAULT 0,
    has_id_doc      BOOLEAN DEFAULT false,
    has_license     BOOLEAN DEFAULT false,
    has_logbook     BOOLEAN DEFAULT false,
    has_helmet      BOOLEAN DEFAULT false,
    has_thermal_bag BOOLEAN DEFAULT false,
    has_vest        BOOLEAN DEFAULT false,
    id_doc_url      TEXT,
    license_url     TEXT,
    logbook_url     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCT CATALOG
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    priority    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id     UUID REFERENCES merchants(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    price           DECIMAL(12,2) NOT NULL,
    image_url       TEXT,
    is_available    BOOLEAN DEFAULT true,
    stock_level     INTEGER,
    sku             TEXT,
    is_featured     BOOLEAN DEFAULT false,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDER ENGINE
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id             UUID REFERENCES profiles(id),
    merchant_id             UUID REFERENCES merchants(id),
    rider_id                UUID REFERENCES riders(id),
    status                  order_status DEFAULT 'CREATED',
    total                   DECIMAL(12,2) NOT NULL DEFAULT 0,
    delivery_fee            DECIMAL(12,2) DEFAULT 0,
    service_fee             DECIMAL(12,2) DEFAULT 0,
    delivery_address        TEXT,
    delivery_street         TEXT,
    delivery_building       TEXT,
    delivery_apartment      TEXT,
    delivery_floor          TEXT,
    delivery_instructions   TEXT,
    payment_method          TEXT DEFAULT 'MPESA',
    payment_status          TEXT DEFAULT 'PENDING',
    mpesa_code              TEXT,
    notes                   TEXT,
    items                   JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    delivered_at            TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
    status      order_status NOT NULL,
    changed_by  UUID REFERENCES profiles(id),
    note        TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FINANCIAL ENGINE
-- ============================================================

CREATE TABLE IF NOT EXISTS wallet_ledger (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID REFERENCES profiles(id) ON DELETE CASCADE,
    order_id            UUID REFERENCES orders(id) ON DELETE SET NULL,
    amount              DECIMAL(12,2) NOT NULL,
    transaction_type    TEXT NOT NULL,
    metadata            JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REVIEWS ENGINE
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
    customer_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
    merchant_id     UUID REFERENCES merchants(id) ON DELETE CASCADE,
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT,
    is_visible      BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FINANCIAL LEDGER
-- ============================================================

CREATE TABLE IF NOT EXISTS financial_ledger (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID REFERENCES orders(id) ON DELETE SET NULL,
    user_id             UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type                TEXT NOT NULL, -- PAYMENT, REFUND, PAYOUT, COMMISSION, EARNING
    amount              DECIMAL(12,2) NOT NULL,
    currency            TEXT DEFAULT 'KES',
    status              TEXT DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    provider            TEXT, -- MPESA, CARD, CASH
    provider_reference  TEXT,
    metadata            JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_order_id ON financial_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_user_id ON financial_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_type ON financial_ledger(type);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT NOT NULL,
    data            JSONB DEFAULT '{}'::jsonb,
    is_read         BOOLEAN DEFAULT false,
    channel         TEXT DEFAULT 'in_app', -- in_app, sms, email, push
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ============================================================
-- DISPATCH SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS dispatch_offers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
    rider_id        UUID REFERENCES riders(id) ON DELETE CASCADE,
    status          TEXT DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED
    offered_at      TIMESTAMPTZ DEFAULT NOW(),
    responded_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 seconds',
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_offers_order_id ON dispatch_offers(order_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_offers_rider_id ON dispatch_offers(rider_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_offers_status ON dispatch_offers(status);

-- ============================================================
-- RIDER LOCATION TRACKING
-- ============================================================

CREATE TABLE IF NOT EXISTS rider_locations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id        UUID REFERENCES riders(id) ON DELETE CASCADE,
    order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
    lat             DECIMAL(10, 8) NOT NULL,
    lng             DECIMAL(11, 8) NOT NULL,
    accuracy        DECIMAL(10, 2),
    heading         DECIMAL(5, 2),
    speed           DECIMAL(10, 2),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUPPORT ENGINE
-- ============================================================

CREATE TABLE IF NOT EXISTS complaints (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
    filed_by        UUID REFERENCES profiles(id),
    against_id      UUID REFERENCES profiles(id),
    subject         TEXT NOT NULL,
    description     TEXT NOT NULL,
    priority        complaint_priority DEFAULT 'MEDIUM',
    status          complaint_status DEFAULT 'OPEN',
    resolution      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warnings (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issued_to    UUID REFERENCES profiles(id) ON DELETE CASCADE,
    issued_by    UUID REFERENCES profiles(id),
    severity     warning_severity DEFAULT 'LOW',
    reason       TEXT NOT NULL,
    details      TEXT,
    acknowledged BOOLEAN DEFAULT false,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MARKETING ENGINE
-- ============================================================

CREATE TABLE IF NOT EXISTS campaigns (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,
    status          TEXT DEFAULT 'DRAFT',
    target_zone     TEXT,
    discount_type   TEXT,
    discount_value  DECIMAL(8,2),
    start_at        TIMESTAMPTZ,
    end_at          TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promo_codes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id     UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    code            TEXT UNIQUE NOT NULL,
    discount_type   TEXT NOT NULL,
    discount_value  DECIMAL(8,2) NOT NULL,
    usage_count     INTEGER DEFAULT 0,
    usage_limit     INTEGER,
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-provision user on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_roles_arr text[];
    primary_role text;
    user_full_name text;
    user_phone text;
    m_type merchant_type;
BEGIN
    -- ONE EMAIL = ONE ROLE: Extract single role or default to 'customer'
    IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
        user_roles_arr := ARRAY[NEW.raw_user_meta_data->>'role'];
    ELSIF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data->'roles' IS NOT NULL THEN
        SELECT ARRAY(
            SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'roles')
        ) INTO user_roles_arr;
        -- Enforce one role only: take the first role
        user_roles_arr := ARRAY[user_roles_arr[1]];
    ELSE
        user_roles_arr := ARRAY['customer'];
    END IF;

    IF array_length(user_roles_arr, 1) IS NULL THEN
        user_roles_arr := ARRAY['customer'];
    END IF;

    primary_role := user_roles_arr[1];
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
    user_phone := NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '');

    -- Upsert Profile — ONE ROLE ONLY (replace, don't append)
    INSERT INTO public.profiles (id, full_name, phone, roles, status)
    VALUES (NEW.id, user_full_name, user_phone, user_roles_arr, 'ACTIVE')
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        phone = CASE WHEN EXCLUDED.phone IS NOT NULL AND EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
        roles = EXCLUDED.roles;

    -- If Merchant: auto-create row
    IF 'merchant' = ANY(user_roles_arr) OR primary_role = 'merchant' THEN
        BEGIN
            m_type := (COALESCE(NEW.raw_user_meta_data->>'merchant_type', 'Restaurant'))::merchant_type;
        EXCEPTION WHEN OTHERS THEN
            m_type := 'Restaurant'::merchant_type;
        END;

        INSERT INTO public.merchants (
            id, business_name, type, status, kra_pin, health_permit, mpesa_till, address
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unnamed Business'),
            m_type,
            'PENDING',
            NEW.raw_user_meta_data->>'kra_pin',
            NEW.raw_user_meta_data->>'health_permit',
            NEW.raw_user_meta_data->>'mpesa_till',
            NEW.raw_user_meta_data->>'address'
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    -- If Courier: auto-create row
    IF 'courier' = ANY(user_roles_arr) OR primary_role = 'courier' THEN
        INSERT INTO public.riders (id, vehicle_type, status)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'vehicle_type', 'Motorbike'),
            'PENDING'
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add role function for multi-role support
CREATE OR REPLACE FUNCTION public.add_user_role(p_user_id UUID, p_role TEXT)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET roles = (
        SELECT array_agg(DISTINCT r)
        FROM (
            SELECT unnest(roles) AS r
            UNION
            SELECT p_role AS r
        ) combined
    )
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Timestamp automation
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

DROP TRIGGER IF EXISTS active_sessions_updated_at ON active_sessions;
CREATE TRIGGER active_sessions_updated_at BEFORE UPDATE ON active_sessions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Payment timeout
CREATE OR REPLACE FUNCTION expire_unpaid_orders()
RETURNS void AS $$
BEGIN
    UPDATE orders
    SET status = 'CANCELLED',
        notes = COALESCE(notes || ' | ', '') || 'System: Payment window timed out (30s).'
    WHERE (status = 'CREATED' OR status = 'PAYMENT_PENDING')
      AND created_at < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- RLS HELPER FUNCTIONS
-- ============================================================

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND 'admin' = ANY(profiles.roles)
    );
$$;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Profiles readable by all" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Profiles readable by all" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Active Sessions
DROP POLICY IF EXISTS "Users manage own session" ON active_sessions;
CREATE POLICY "Users manage own session" ON active_sessions FOR ALL USING (auth.uid() = user_id);

-- Merchants
DROP POLICY IF EXISTS "Merchants readable by all" ON merchants;
DROP POLICY IF EXISTS "Merchants update own record" ON merchants;
DROP POLICY IF EXISTS "Merchants admin manage" ON merchants;
CREATE POLICY "Merchants readable by all" ON merchants FOR SELECT USING (true);
CREATE POLICY "Merchants admin manage" ON merchants FOR ALL USING (public.is_admin());

-- Riders
DROP POLICY IF EXISTS "Riders readable by all" ON riders;
DROP POLICY IF EXISTS "Riders update own record" ON riders;
DROP POLICY IF EXISTS "Riders admin manage" ON riders;
CREATE POLICY "Riders readable by all" ON riders FOR SELECT USING (true);
CREATE POLICY "Riders admin manage" ON riders FOR ALL USING (public.is_admin());

-- Dev bypass: allow all operations when unauthenticated (for local development)
DROP POLICY IF EXISTS "Merchants dev bypass" ON merchants;
DROP POLICY IF EXISTS "Riders dev bypass" ON riders;
CREATE POLICY "Merchants dev bypass" ON merchants FOR ALL USING (auth.uid() IS NULL);
CREATE POLICY "Riders dev bypass" ON riders FOR ALL USING (auth.uid() IS NULL);

-- Products
DROP POLICY IF EXISTS "Products visible to all" ON products;
DROP POLICY IF EXISTS "All products visible to merchant" ON products;
DROP POLICY IF EXISTS "Merchants manage own products" ON products;
CREATE POLICY "Products visible to all" ON products FOR SELECT USING (is_available = true);
CREATE POLICY "All products visible to merchant" ON products FOR SELECT USING (auth.uid() = merchant_id);
CREATE POLICY "Merchants manage own products" ON products FOR ALL USING (auth.uid() = merchant_id);

-- Orders
DROP POLICY IF EXISTS "Order parties can view" ON orders;
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Order parties can update" ON orders;
CREATE POLICY "Order parties can view" ON orders FOR SELECT USING (
    auth.uid() = customer_id OR auth.uid() = merchant_id OR auth.uid() = rider_id
);
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Order parties can update" ON orders FOR UPDATE USING (
    auth.uid() = merchant_id OR auth.uid() = rider_id
);

-- Wallet
DROP POLICY IF EXISTS "Users see own wallet" ON wallet_ledger;
CREATE POLICY "Users see own wallet" ON wallet_ledger FOR SELECT USING (auth.uid() = user_id);

-- Complaints
DROP POLICY IF EXISTS "Users see own complaints" ON complaints;
DROP POLICY IF EXISTS "Users create complaints" ON complaints;
CREATE POLICY "Users see own complaints" ON complaints FOR SELECT USING (auth.uid() = filed_by OR auth.uid() = against_id);
CREATE POLICY "Users create complaints" ON complaints FOR INSERT WITH CHECK (auth.uid() = filed_by);

-- Warnings
DROP POLICY IF EXISTS "Users see own warnings" ON warnings;
CREATE POLICY "Users see own warnings" ON warnings FOR SELECT USING (auth.uid() = issued_to);

-- Reviews
DROP POLICY IF EXISTS "Reviews visible to all" ON reviews;
DROP POLICY IF EXISTS "Customers create reviews" ON reviews;
DROP POLICY IF EXISTS "Customers update own reviews" ON reviews;
CREATE POLICY "Reviews visible to all" ON reviews FOR SELECT USING (is_visible = true);
CREATE POLICY "Customers create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers update own reviews" ON reviews FOR UPDATE USING (auth.uid() = customer_id);

-- Dispatch Offers
DROP POLICY IF EXISTS "Riders view own offers" ON dispatch_offers;
DROP POLICY IF EXISTS "Riders respond to own offers" ON dispatch_offers;
DROP POLICY IF EXISTS "Merchants view offers for their orders" ON dispatch_offers;
CREATE POLICY "Riders view own offers" ON dispatch_offers FOR SELECT USING (auth.uid() = rider_id);
CREATE POLICY "Riders respond to own offers" ON dispatch_offers FOR UPDATE USING (auth.uid() = rider_id);
CREATE POLICY "Merchants view offers for their orders" ON dispatch_offers FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = dispatch_offers.order_id
        AND orders.merchant_id = auth.uid()
    )
);

-- ============================================================
-- ADMIN RLS POLICIES
-- ============================================================

-- Profiles: Admins can do everything
DROP POLICY IF EXISTS "Admins manage all profiles" ON profiles;
CREATE POLICY "Admins manage all profiles" ON profiles FOR ALL USING (public.is_admin());

-- Active Sessions: Admins can view all sessions
DROP POLICY IF EXISTS "Admins view all sessions" ON active_sessions;
CREATE POLICY "Admins view all sessions" ON active_sessions FOR SELECT USING (public.is_admin());

-- Merchants: Admins can do everything
DROP POLICY IF EXISTS "Admins manage all merchants" ON merchants;
CREATE POLICY "Admins manage all merchants" ON merchants FOR ALL USING (public.is_admin());

-- Riders: Admins can do everything
DROP POLICY IF EXISTS "Admins manage all riders" ON riders;
CREATE POLICY "Admins manage all riders" ON riders FOR ALL USING (public.is_admin());

-- Products: Admins can do everything
DROP POLICY IF EXISTS "Admins manage all products" ON products;
CREATE POLICY "Admins manage all products" ON products FOR ALL USING (public.is_admin());

-- Orders: Admins can view and update all orders
DROP POLICY IF EXISTS "Admins manage all orders" ON orders;
CREATE POLICY "Admins manage all orders" ON orders FOR ALL USING (public.is_admin());

-- Wallet: Admins can view all wallet entries
DROP POLICY IF EXISTS "Admins view all wallet" ON wallet_ledger;
CREATE POLICY "Admins view all wallet" ON wallet_ledger FOR SELECT USING (public.is_admin());

-- Complaints: Admins can view and manage all complaints
DROP POLICY IF EXISTS "Admins manage all complaints" ON complaints;
CREATE POLICY "Admins manage all complaints" ON complaints FOR ALL USING (public.is_admin());

-- Warnings: Admins can view and manage all warnings
DROP POLICY IF EXISTS "Admins manage all warnings" ON warnings;
CREATE POLICY "Admins manage all warnings" ON warnings FOR ALL USING (public.is_admin());

-- Reviews: Admins can manage all reviews
DROP POLICY IF EXISTS "Admins manage all reviews" ON reviews;
CREATE POLICY "Admins manage all reviews" ON reviews FOR ALL USING (public.is_admin());

-- Dispatch Offers: Admins can view all offers
DROP POLICY IF EXISTS "Admins view all dispatch offers" ON dispatch_offers;
CREATE POLICY "Admins view all dispatch offers" ON dispatch_offers FOR SELECT USING (public.is_admin());

-- Financial Ledger: Admins can view all ledger entries
DROP POLICY IF EXISTS "Admins view all financial ledger" ON financial_ledger;
CREATE POLICY "Admins view all financial ledger" ON financial_ledger FOR SELECT USING (public.is_admin());

-- Notifications: Admins can view all notifications
DROP POLICY IF EXISTS "Admins view all notifications" ON notifications;
CREATE POLICY "Admins view all notifications" ON notifications FOR SELECT USING (public.is_admin());

-- Rider Locations: Admins can view all locations
DROP POLICY IF EXISTS "Admins view all rider locations" ON rider_locations;
CREATE POLICY "Admins view all rider locations" ON rider_locations FOR SELECT USING (public.is_admin());

-- Financial Ledger
DROP POLICY IF EXISTS "Users view own ledger" ON financial_ledger;
CREATE POLICY "Users view own ledger" ON financial_ledger FOR SELECT USING (auth.uid() = user_id);

-- Notifications
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Rider Locations
DROP POLICY IF EXISTS "Riders update own location" ON rider_locations;
DROP POLICY IF EXISTS "Order parties can view rider location" ON rider_locations;
CREATE POLICY "Riders update own location" ON rider_locations FOR ALL USING (auth.uid() = rider_id);
CREATE POLICY "Order parties can view rider location" ON rider_locations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = rider_locations.order_id
        AND (orders.customer_id = auth.uid() OR orders.merchant_id = auth.uid() OR orders.rider_id = auth.uid())
    )
);
