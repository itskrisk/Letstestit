-- ==========================================
-- Migration: Create RSVPs Table & Security RLS
-- Description: Stores guest RSVP submissions for private events
-- ==========================================

-- 1. Create the rsvps table
CREATE TABLE IF NOT EXISTS public.rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('attending', 'declined')),
    plus_ones INTEGER DEFAULT 0,
    dietary_notes TEXT,
    event_title TEXT DEFAULT 'Muncheez Founder Tasting & Celebration',
    event_date TEXT DEFAULT 'Saturday, October 24, 2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Index for faster lookups by email and event
CREATE INDEX IF NOT EXISTS rsvps_email_idx ON public.rsvps (email);
CREATE INDEX IF NOT EXISTS rsvps_status_idx ON public.rsvps (status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Allow anyone (anon + authenticated) to submit an RSVP
CREATE POLICY "Allow public RSVP insertions" 
    ON public.rsvps 
    FOR INSERT 
    WITH CHECK (true);

-- 5. Policy: Only authenticated users (Admins/Staff) can view RSVPs
CREATE POLICY "Allow admin read access to RSVPs" 
    ON public.rsvps 
    FOR SELECT 
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ==========================================
-- Optional: Automated Email Trigger (Supabase Database Webhook or Edge Function)
-- ==========================================
-- You can configure a Supabase Database Webhook on table `public.rsvps` on INSERT event 
-- targeting your Supabase Edge Function URL:
-- POST https://<project-ref>.supabase.co/functions/v1/send-rsvp-email
