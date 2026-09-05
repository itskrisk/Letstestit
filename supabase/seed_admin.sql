-- ============================================================
-- CREATE ADMIN USER FOR TESTING
-- Run this AFTER applying schema.sql
-- ============================================================

-- 1. Create the admin user in Supabase Auth (if not exists)
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if admin already exists
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@muncheez.co.ke';
    
    IF admin_user_id IS NULL THEN
        -- Create new admin user
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            is_super_admin
        ) VALUES (
            gen_random_uuid(),
            'admin@muncheez.co.ke',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"full_name": "Admin User", "role": "admin"}'::jsonb,
            true
        ) RETURNING id INTO admin_user_id;
    END IF;
    
    -- 2. Create/update the admin profile
    INSERT INTO public.profiles (
        id,
        full_name,
        phone,
        roles,
        status,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'Admin User',
        '+254700000000',
        ARRAY['admin'],
        'ACTIVE',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        roles = ARRAY['admin'],
        status = 'ACTIVE',
        updated_at = NOW();
    
    -- 3. Drop and recreate active_sessions with correct schema
    DROP TABLE IF EXISTS public.active_sessions CASCADE;
    
    CREATE TABLE public.active_sessions (
        user_id       UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
        session_token TEXT NOT NULL,
        primary_role  TEXT NOT NULL DEFAULT 'customer',
        all_roles     TEXT[] NOT NULL DEFAULT '{customer}' CHECK (array_length(all_roles, 1) <= 1),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- 4. Insert admin session
    INSERT INTO public.active_sessions (
        user_id,
        session_token,
        primary_role,
        all_roles,
        updated_at
    ) VALUES (
        admin_user_id,
        'admin-session-token-placeholder',
        'admin',
        ARRAY['admin'],
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        primary_role = 'admin',
        all_roles = ARRAY['admin'],
        updated_at = NOW();
END $$;

-- ============================================================
-- ADMIN CREDENTIALS:
-- Email: admin@muncheez.co.ke
-- Password: admin123
-- ============================================================
