import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only treat it as configured if it's a real HTTP(S) URL — not a placeholder string
const isConfigured = Boolean(supabaseUrl) && !supabaseUrl.startsWith('YOUR_');

if (!isConfigured) {
    console.warn('[Muncheez] Supabase is not configured yet. Add your project URL and Anon Key to .env to enable auth and data features.');
}

// If not configured, fall back to a syntactically-valid dummy URL so createClient()
// doesn't throw at module load time and crash the entire React app.
export const supabase = createClient(
    isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
    isConfigured ? supabaseAnonKey : 'placeholder-anon-key'
);
