# Muncheez - Auth & Routing Definitive Implementation Plan

## Executive Summary
This document details the complete technical architecture and step-by-step remediation plan to resolve all authentication, routing, and database synchronization issues across the Muncheez web application.

---

## 1. Architectural Workflows & System Requirements

### A. Customer Flow
1. **Public Browsing (No Login Required)**: Unauthenticated customers can view verified merchants (`status = 'APPROVED'` and `is_active = true`) on `/stores` and inspect menus/items on `/store/:id`.
2. **Auth & Checkout**: When placing an order, the customer logs in or signs up (`/login` or `/signup`). Upon checkout (`/checkout`), the order is saved to Supabase with status `CREATED`.
3. **Order Tracking**: Customer tracks order state (`/order/:id`) as it transitions: `CREATED` → `ACCEPTED` → `PREPARING` → `READY_FOR_PICKUP` → `RIDER_ASSIGNED` → `PICKED_UP` → `OUT_FOR_DELIVERY` → `DELIVERED`.

### B. Merchant Partner Flow
1. **Registration**: Merchant registers at `/partner/signup`, providing business details and compliance documents (KRA PIN, Health Permit).
2. **Pending Approval Screen**: After signup or upon login at `/partner/login`, if merchant status is `PENDING` or `VERIFICATION_PENDING`, a dedicated **"Waiting for Approval"** screen (`VerificationOverlay`) is displayed, blocking access to product uploads and order processing.
3. **Dashboard Activation**: Once an Admin approves the merchant in the Admin Console, status updates to `APPROVED`. The waiting screen disappears, unlocking full access to dashboard, inventory/menu upload, and order management.

### C. Rider / Courier Flow
1. **Registration & Terminal Access**: Rider signs up at `/courier/signup` or logs in at `/courier/login`.
2. **Verification State**: If rider status is `PENDING`, an "Application Under Review" screen blocks terminal access. Upon Admin approval, rider gets full access to accept ready orders and manage deliveries.

### D. Admin Console ("God View")
1. **Authentication**: Secure login at `/admin/login` redirecting to `/admin`.
2. **Control & Governance**: Full visibility and CRUD access over all profiles, merchants, riders, orders, wallet transactions, and complaints across the system. Admins can approve or reject pending merchants and riders with a single click.

---

## 2. Identified Root Causes & Technical Issues

1. **Routing Path Mismatches**:
   - `CustomerLogin.tsx` & `CustomerSignup.tsx` navigate to `/c/stores`, which was missing from `App.tsx`.
   - `PartnerLogin.tsx` navigates to `/partner/dashboard`, whereas `App.tsx` defined the route as `/partner`.
   - `CourierLogin.tsx` navigates to `/courier/dashboard`, whereas `App.tsx` defined `/courier`.
   - `AdminLogin.tsx` navigates to `/admin/dashboard`, whereas `App.tsx` defined `/admin`.
   - Result: Successful logins hit the wildcard `*` route in `App.tsx` and booted users back to `/`.

2. **Auth Context & Session Race Conditions**:
   - Direct manual queries against `active_sessions` with RLS constraints caused session invalidation and unexpected logouts on page reload.
   - Standardizing `AuthContext.tsx` on Supabase's native `onAuthStateChange` listener ensures atomic state hydration without white screen crashes.

3. **Merchant Approval Screen Logic**:
   - `MerchantDashboard.tsx` previously showed a non-blocking banner for `PENDING` status instead of enforcing the required **Waiting for Approval** screen.

---

## 3. Implementation Steps

### Phase 1: Route Standardization & Alias Mapping (`App.tsx`)
- Define dual routes in `App.tsx` for backwards/forwards compatibility:
  - Customer Stores: `/stores` AND `/c/stores`
  - Merchant Dashboard: `/partner` AND `/partner/dashboard`
  - Courier Terminal: `/courier` AND `/courier/dashboard`
  - Admin Console: `/admin` AND `/admin/dashboard`
- Fix all internal `navigate()` calls across auth pages, navbar, hero, and store components.

### Phase 2: Core Auth & Session Stability (`AuthContext.tsx`)
- Refactor `AuthContext.tsx` to use `supabase.auth.onAuthStateChange`.
- Guarantee clean user normalization: single role assignment (`customer`, `merchant`, `courier`, or `admin`).
- Ensure session persistence across page refreshes.

### Phase 3: Enforce Merchant & Rider Approval Screens
- In `MerchantDashboard.tsx`, display `VerificationOverlay` whenever `status === 'PENDING'` or `'VERIFICATION_PENDING'`, blocking inventory editing until Admin approval.
- In `CourierDashboard.tsx`, enforce approval screen when `status === 'PENDING'`.
- In `AdminApprovals.tsx` & `AdminMerchants.tsx`, ensure admin approval buttons execute Supabase updates to `merchants` (`status: 'APPROVED'`, `is_active: true`) and `riders` (`status: 'APPROVED'`).

### Phase 4: Supabase Database & Trigger Verification
- Verify `supabase/schema.sql` and `fix_trigger.sql`:
  - `handle_new_user()` trigger correctly provisions `profiles`, `merchants` (status `PENDING`), and `riders` (status `PENDING`).
  - Row Level Security (RLS) policies permit public read access for approved merchants and available products.
  - RLS policies allow authenticated customers to insert orders and order parties/admins to manage updates.

---

## 4. Verification & Testing Plan

1. **Customer Flow**:
   - Access `/stores` without logging in -> verify approved merchants load.
   - Log in as customer -> verify successful redirect to `/stores`.
   - Place an order -> verify order creation in Supabase.

2. **Merchant Flow**:
   - Register new merchant -> verify redirect to `/partner` showing "Waiting for Approval" screen.
   - Log in as Admin -> approve merchant -> log back in as merchant -> verify full dashboard access and product upload capability.

3. **Rider Flow**:
   - Register new rider -> verify review screen.
   - Admin approves rider -> rider accesses terminal to accept ready orders.

4. **Admin Flow**:
   - Log in at `/admin/login` -> verify dashboard loads at `/admin` with God View.
