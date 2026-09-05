# Supabase Setup Guide for Muncheez

## Step 1: Apply the Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/cmczqydaacndegsiaxvh/editor
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `supabase/migrations/20240101_init_schema.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)

This will create all tables, enums, triggers, and RLS policies.

## Step 2: Enable Authentication

1. Go to **Authentication** > **Providers**
2. Make sure **Email** provider is enabled
3. (Optional) Enable **Google** OAuth if you want social login

## Step 3: Create Admin User

Run this SQL in the SQL Editor to create an admin user:

```sql
-- First, create the user in Supabase Auth
-- Go to Authentication > Users > Add user
-- Or use the signup flow in your app with role: 'admin'
```

## Step 4: Verify Tables

Go to **Table Editor** and verify these tables exist:
- profiles
- active_sessions
- merchants
- riders
- categories
- products
- orders
- order_status_history
- wallet_ledger
- complaints
- warnings
- campaigns
- promo_codes

## Step 5: Test the Application

1. Start the frontend: `npm run dev`
2. Go to http://localhost:5173
3. Try signing up as a customer
4. Try signing up as a merchant
5. Try signing up as a rider

## Troubleshooting

### "Failed to fetch" errors
- Check that your Supabase URL and anon key are correct in `.env`
- Check that the schema has been applied correctly

### "Row Level Security" errors
- Make sure RLS policies were created correctly
- Check the SQL Editor for any errors

### "Trigger not found" errors
- Make sure the `handle_new_user` trigger was created
- Check that the trigger fires on `auth.users` INSERT
