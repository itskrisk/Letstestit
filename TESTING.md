# Muncheez V2 — Backend Testing Guide

Complete step-by-step instructions for testing every endpoint and feature.

## Prerequisites

1. **Backend server must be running:**
   ```bash
   cd backend
   npm run dev
   ```
   Server should be at `http://localhost:5000`

2. **Database must be seeded:**
   ```bash
   npm run prisma:seed
   ```

3. **Test accounts (already seeded):**
   | Email | Password | Role |
   |-------|----------|------|
   | admin@muncheez.co.ke | admin123 | admin |
   | merchant@muncheez.co.ke | merchant123 | customer,merchant |
   | courier@muncheez.co.ke | courier123 | customer,courier |
   | customer@muncheez.co.ke | customer123 | customer |

---

## How to Test

You can test using:
- **curl** (command line)
- **Postman** (GUI)
- **Thunder Client** (VS Code extension)

All examples below use curl.

---

## 1. Health Check

**Endpoint:** `GET /health`

```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-08-17T11:40:55.186Z"
}
```

---

## 2. Authentication

### 2.1 Signup (Customer)

**Endpoint:** `POST /api/auth/signup`

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"newuser@test.com\",\"password\":\"Test@123\",\"name\":\"Test User\",\"phone\":\"0712345678\",\"role\":\"customer\"}"
```

**Expected Response:**
```json
{
  "user": { "id": "...", "email": "newuser@test.com", "fullName": "Test User", ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roles": ["customer"],
  "primaryRole": "customer"
}
```

### 2.2 Signup (Merchant)

**Endpoint:** `POST /api/auth/signup/merchant`

```bash
curl -X POST http://localhost:5000/api/auth/signup/merchant \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"newmerchant@test.com\",\"password\":\"Test@123\",\"name\":\"Test Merchant\",\"phone\":\"0712345678\",\"businessName\":\"Test Kitchen\",\"type\":\"Restaurant\"}"
```

### 2.3 Signup (Courier)

**Endpoint:** `POST /api/auth/signup/courier`

```bash
curl -X POST http://localhost:5000/api/auth/signup/courier \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"newcourier@test.com\",\"password\":\"Test@123\",\"name\":\"Test Courier\",\"phone\":\"0712345678\",\"vehicleType\":\"Motorbike\"}"
```

### 2.4 Login

**Endpoint:** `POST /api/auth/login`

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"customer@muncheez.co.ke\",\"password\":\"customer123\"}"
```

**Expected Response:**
```json
{
  "user": { "id": "...", "email": "customer@muncheez.co.ke", "profile": { "roles": "customer" } },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roles": "customer",
  "primaryRole": "c"
}
```

**Save the `token` for authenticated requests below.**

### 2.5 Get Current User

**Endpoint:** `GET /api/auth/me`

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2.6 Refresh Token

**Endpoint:** `POST /api/auth/refresh`

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"YOUR_REFRESH_TOKEN_HERE\"}"
```

### 2.7 Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"customer@muncheez.co.ke\"}"
```

### 2.8 Reset Password

**Endpoint:** `POST /api/auth/reset-password`

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"reset-token\",\"password\":\"NewPass@123\"}"
```

### 2.9 Add Role to Account

**Endpoint:** `POST /api/auth/roles/add`

```bash
curl -X POST http://localhost:5000/api/auth/roles/add \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"role\":\"merchant\"}"
```

---

## 3. Customer Endpoints

**Base URL:** `http://localhost:5000/api/customer`
**Required Role:** `customer`

### 3.1 Browse Stores

**Endpoint:** `GET /api/customer/stores`

```bash
curl http://localhost:5000/api/customer/stores \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
```

**Expected Response:**
```json
{
  "stores": [
    {
      "id": "...",
      "businessName": "Kamau's Kitchen",
      "type": "Restaurant",
      "products": [...]
    }
  ]
}
```

### 3.2 View Single Store

**Endpoint:** `GET /api/customer/stores/:id`

```bash
curl http://localhost:5000/api/customer/stores/STORE_ID \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
```

### 3.3 Get My Orders

**Endpoint:** `GET /api/customer/orders`

```bash
curl http://localhost:5000/api/customer/orders \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
```

### 3.4 View Single Order

**Endpoint:** `GET /api/customer/orders/:id`

```bash
curl http://localhost:5000/api/customer/orders/ORDER_ID \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
```

### 3.5 Create Order

**Endpoint:** `POST /api/customer/orders`

```bash
curl -X POST http://localhost:5000/api/customer/orders \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"merchantId\":\"MERCHANT_ID\",\"items\":[{\"productId\":\"PRODUCT_ID\",\"name\":\"Chicken Biryani\",\"quantity\":2,\"price\":\"850\"}],\"deliveryAddress\":\"Westlands, Nairobi\",\"paymentMethod\":\"MPESA\"}"
```

### 3.6 Cancel Order

**Endpoint:** `POST /api/customer/orders/:id/cancel`

```bash
curl -X POST http://localhost:5000/api/customer/orders/ORDER_ID/cancel \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
```

### 3.7 Get Loyalty Tier

**Endpoint:** `GET /api/customer/loyalty`

```bash
curl http://localhost:5000/api/customer/loyalty \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
```

### 3.8 Update Profile

**Endpoint:** `PUT /api/customer/profile`

```bash
curl -X PUT http://localhost:5000/api/customer/profile \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Updated Name\",\"phone\":\"0712345678\"}"
```

---

## 4. Merchant Endpoints

**Base URL:** `http://localhost:5000/api/merchant`
**Required Role:** `merchant`

### 4.1 Dashboard

**Endpoint:** `GET /api/merchant/dashboard`

```bash
curl http://localhost:5000/api/merchant/dashboard \
  -H "Authorization: Bearer MERCHANT_TOKEN"
```

### 4.2 List Products

**Endpoint:** `GET /api/merchant/products`

```bash
curl http://localhost:5000/api/merchant/products \
  -H "Authorization: Bearer MERCHANT_TOKEN"
```

### 4.3 Create Product

**Endpoint:** `POST /api/merchant/products`

```bash
curl -X POST http://localhost:5000/api/merchant/products \
  -H "Authorization: Bearer MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"New Product\",\"description\":\"Description\",\"price\":\"500\",\"category\":\"Mains\",\"isAvailable\":true,\"stockLevel\":50}"
```

### 4.4 Update Product

**Endpoint:** `PUT /api/merchant/products/:id`

```bash
curl -X PUT http://localhost:5000/api/merchant/products/PRODUCT_ID \
  -H "Authorization: Bearer MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Updated Product\",\"price\":\"600\"}"
```

### 4.5 Delete Product

**Endpoint:** `DELETE /api/merchant/products/:id`

```bash
curl -X DELETE http://localhost:5000/api/merchant/products/PRODUCT_ID \
  -H "Authorization: Bearer MERCHANT_TOKEN"
```

### 4.6 Bulk Import Products

**Endpoint:** `POST /api/merchant/products/import`

```bash
curl -X POST http://localhost:5000/api/merchant/products/import \
  -H "Authorization: Bearer MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"products\":[{\"name\":\"Product 1\",\"price\":\"100\"},{\"name\":\"Product 2\",\"price\":\"200\"}]}"
```

### 4.7 List Orders

**Endpoint:** `GET /api/merchant/orders`

```bash
curl http://localhost:5000/api/merchant/orders \
  -H "Authorization: Bearer MERCHANT_TOKEN"
```

### 4.8 Update Order Status

**Endpoint:** `PUT /api/merchant/orders/:id/status`

```bash
curl -X PUT http://localhost:5000/api/merchant/orders/ORDER_ID/status \
  -H "Authorization: Bearer MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"PREPARING\"}"
```

### 4.9 List Customers

**Endpoint:** `GET /api/merchant/customers`

```bash
curl http://localhost:5000/api/merchant/customers \
  -H "Authorization: Bearer MERCHANT_TOKEN"
```

### 4.10 Get Payments

**Endpoint:** `GET /api/merchant/payments`

```bash
curl http://localhost:5000/api/merchant/payments \
  -H "Authorization: Bearer MERCHANT_TOKEN"
```

### 4.11 Get Reports

**Endpoint:** `GET /api/merchant/reports`

```bash
curl http://localhost:5000/api/merchant/reports \
  -H "Authorization: Bearer MERCHANT_TOKEN"
```

### 4.12 Update Settings

**Endpoint:** `PUT /api/merchant/settings`

```bash
curl -X PUT http://localhost:5000/api/merchant/settings \
  -H "Authorization: Bearer MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"deliveryFee\":\"200\",\"operatingHours\":\"08:00-22:00\"}"
```

### 4.13 Toggle Online/Offline

**Endpoint:** `PUT /api/merchant/status`

```bash
curl -X PUT http://localhost:5000/api/merchant/status \
  -H "Authorization: Bearer MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"isActive\":true}"
```

---

## 5. Courier Endpoints

**Base URL:** `http://localhost:5000/api/courier`
**Required Role:** `courier`

### 5.1 Update Online/Offline Status

**Endpoint:** `POST /api/courier/status`

```bash
curl -X POST http://localhost:5000/api/courier/status \
  -H "Authorization: Bearer COURIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"isOnline\":true}"
```

### 5.2 Get Available Orders

**Endpoint:** `GET /api/courier/orders/available`

```bash
curl http://localhost:5000/api/courier/orders/available \
  -H "Authorization: Bearer COURIER_TOKEN"
```

### 5.3 Accept Order

**Endpoint:** `POST /api/courier/orders/:id/accept`

```bash
curl -X POST http://localhost:5000/api/courier/orders/ORDER_ID/accept \
  -H "Authorization: Bearer COURIER_TOKEN"
```

### 5.4 Confirm Pickup

**Endpoint:** `POST /api/courier/orders/:id/pickup`

```bash
curl -X POST http://localhost:5000/api/courier/orders/ORDER_ID/pickup \
  -H "Authorization: Bearer COURIER_TOKEN"
```

### 5.5 Complete Delivery

**Endpoint:** `POST /api/courier/orders/:id/deliver`

```bash
curl -X POST http://localhost:5000/api/courier/orders/ORDER_ID/deliver \
  -H "Authorization: Bearer COURIER_TOKEN"
```

### 5.6 Get Earnings

**Endpoint:** `GET /api/courier/earnings`

```bash
curl http://localhost:5000/api/courier/earnings \
  -H "Authorization: Bearer COURIER_TOKEN"
```

### 5.7 SOS Emergency

**Endpoint:** `POST /api/courier/sos`

```bash
curl -X POST http://localhost:5000/api/courier/sos \
  -H "Authorization: Bearer COURIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Emergency!\"}"
```

### 5.8 Update Vehicle Info

**Endpoint:** `PUT /api/courier/vehicle`

```bash
curl -X PUT http://localhost:5000/api/courier/vehicle \
  -H "Authorization: Bearer COURIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"vehicleType\":\"Motorbike\",\"vehiclePlate\":\"KDH 123X\"}"
```

---

## 6. Admin Endpoints

**Base URL:** `http://localhost:5000/api/admin`
**Required Role:** `admin`

### 6.1 Dashboard Stats

**Endpoint:** `GET /api/admin/dashboard`

```bash
curl http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 6.2 List Merchants

**Endpoint:** `GET /api/admin/merchants`

```bash
curl http://localhost:5000/api/admin/merchants \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 6.3 Approve Merchant

**Endpoint:** `POST /api/admin/merchants/:id/approve`

```bash
curl -X POST http://localhost:5000/api/admin/merchants/MERCHANT_ID/approve \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 6.4 Suspend Merchant

**Endpoint:** `POST /api/admin/merchants/:id/suspend`

```bash
curl -X POST http://localhost:5000/api/admin/merchants/MERCHANT_ID/suspend \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 6.5 List Riders

**Endpoint:** `GET /api/admin/riders`

```bash
curl http://localhost:5000/api/admin/riders \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 6.6 Approve Rider

**Endpoint:** `POST /api/admin/riders/:id/approve`

```bash
curl -X POST http://localhost:5000/api/admin/riders/RIDER_ID/approve \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 6.7 List All Orders

**Endpoint:** `GET /api/admin/orders`

```bash
curl http://localhost:5000/api/admin/orders \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 6.8 Update Order Status

**Endpoint:** `PUT /api/admin/orders/:id/status`

```bash
curl -X PUT http://localhost:5000/api/admin/orders/ORDER_ID/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"CANCELLED\"}"
```

### 6.9 List Customers

**Endpoint:** `GET /api/admin/customers`

```bash
curl http://localhost:5000/api/admin/customers \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 6.10 Get Financials

**Endpoint:** `GET /api/admin/financials`

```bash
curl http://localhost:5000/api/admin/financials \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 6.11 List Complaints

**Endpoint:** `GET /api/admin/complaints`

```bash
curl http://localhost:5000/api/admin/complaints \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 6.12 Resolve Complaint

**Endpoint:** `POST /api/admin/complaints/:id/resolve`

```bash
curl -X POST http://localhost:5000/api/admin/complaints/COMPLAINT_ID/resolve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resolution\":\"Resolved with refund\"}"
```

### 6.13 Issue Warning

**Endpoint:** `POST /api/admin/warnings`

```bash
curl -X POST http://localhost:5000/api/admin/warnings \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"issuedToId\":\"USER_ID\",\"severity\":\"MEDIUM\",\"reason\":\"Late delivery\"}"
```

### 6.14 Create Campaign

**Endpoint:** `POST /api/admin/campaigns`

```bash
curl -X POST http://localhost:5000/api/admin/campaigns \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Summer Sale\",\"type\":\"DISCOUNT\",\"discountType\":\"PERCENTAGE\",\"discountValue\":\"10\"}"
```

### 6.15 Create Promo Code

**Endpoint:** `POST /api/admin/promo-codes`

```bash
curl -X POST http://localhost:5000/api/admin/promo-codes \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"SUMMER10\",\"discountType\":\"PERCENTAGE\",\"discountValue\":\"10\",\"usageLimit\":100}"
```

### 6.16 Toggle Audit Mode

**Endpoint:** `PUT /api/admin/audit/:merchantId`

```bash
curl -X PUT http://localhost:5000/api/admin/audit/MERCHANT_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"auditMode\":true}"
```

---

## 7. Social Endpoints

**Base URL:** `http://localhost:5000/api/social`
**Required Role:** Any authenticated user

### 7.1 Get Friends

**Endpoint:** `GET /api/social/friends`

```bash
curl http://localhost:5000/api/social/friends \
  -H "Authorization: Bearer TOKEN"
```

### 7.2 Send Friend Request

**Endpoint:** `POST /api/social/friends/request`

```bash
curl -X POST http://localhost:5000/api/social/friends/request \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"toId\":\"USER_ID\"}"
```

### 7.3 Accept Friend Request

**Endpoint:** `POST /api/social/friends/accept`

```bash
curl -X POST http://localhost:5000/api/social/friends/accept \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"requestId\":\"REQUEST_ID\"}"
```

### 7.4 Get Shared Orders Feed

**Endpoint:** `GET /api/social/orders`

```bash
curl http://localhost:5000/api/social/orders \
  -H "Authorization: Bearer TOKEN"
```

### 7.5 Share Order

**Endpoint:** `POST /api/social/orders/share`

```bash
curl -X POST http://localhost:5000/api/social/orders/share \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\":\"ORDER_ID\",\"items\":[...],\"total\":\"1000\"}"
```

### 7.6 Add Reaction

**Endpoint:** `POST /api/social/orders/:id/react`

```bash
curl -X POST http://localhost:5000/api/social/orders/SHARED_ORDER_ID/react \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"emoji\":\"🔥\"}"
```

### 7.7 Send Gift

**Endpoint:** `POST /api/social/gifts/send`

```bash
curl -X POST http://localhost:5000/api/social/gifts/send \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"toId\":\"USER_ID\",\"giftType\":\"coffee\"}"
```

### 7.8 Get Notifications

**Endpoint:** `GET /api/social/notifications`

```bash
curl http://localhost:5000/api/social/notifications \
  -H "Authorization: Bearer TOKEN"
```

### 7.9 Mark Notifications as Read

**Endpoint:** `POST /api/social/notifications/read`

```bash
curl -X POST http://localhost:5000/api/social/notifications/read \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"notificationIds\":[\"NOTIF_ID_1\",\"NOTIF_ID_2\"]}"
```

### 7.10 Update Privacy Settings

**Endpoint:** `PUT /api/social/privacy`

```bash
curl -X PUT http://localhost:5000/api/social/privacy \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"shareOrdersWithFriends\":true,\"allowSurpriseGifts\":true}"
```

### 7.11 Search Users

**Endpoint:** `GET /api/social/users/search?q=searchterm`

```bash
curl "http://localhost:5000/api/social/users/search?q=john" \
  -H "Authorization: Bearer TOKEN"
```

---

## 8. Payment Endpoints

**Base URL:** `http://localhost:5000/api/payments`

### 8.1 Initiate M-Pesa Payment

**Endpoint:** `POST /api/payments/initiate`

```bash
curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\":\"ORDER_ID\",\"phone\":\"254700000000\",\"amount\":\"1000\"}"
```

### 8.2 M-Pesa Callback (Simulated)

**Endpoint:** `POST /api/payments/callback`

```bash
curl -X POST http://localhost:5000/api/payments/callback \
  -H "Content-Type: application/json" \
  -d "{\"orderId\":\"ORDER_ID\",\"status\":\"SUCCESS\",\"mpesaCode\":\"ABC123\"}"
```

### 8.3 Check Payment Status

**Endpoint:** `GET /api/payments/status/:orderId`

```bash
curl http://localhost:5000/api/payments/status/ORDER_ID \
  -H "Authorization: Bearer TOKEN"
```

---

## 9. Socket.IO Events

Connect from frontend:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('accessToken'),
  },
});

// Listen for order updates
socket.on('order:update', (data) => {
  console.log('Order updated:', data);
});

// Listen for rider location
socket.on('rider:location', (data) => {
  console.log('Rider location:', data);
});

// Listen for notifications
socket.on('notification:new', (data) => {
  console.log('New notification:', data);
});

// Listen for SOS alerts
socket.on('sos:alert', (data) => {
  console.log('SOS alert:', data);
});
```

---

## 10. Error Responses

All endpoints return consistent error formats:

**401 Unauthorized:**
```json
{ "error": "No token provided" }
```

**403 Forbidden:**
```json
{ "error": "Customer access required" }
```

**404 Not Found:**
```json
{ "error": "Route not found" }
```

**500 Server Error:**
```json
{ "error": "Server error" }
```

---

## 11. Quick Test Sequence

Run these in order to verify everything works:

```bash
# 1. Health check
curl http://localhost:5000/health

# 2. Login as customer
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"customer@muncheez.co.ke\",\"password\":\"customer123\"}"

# 3. Copy the token from response, then test stores
curl http://localhost:5000/api/customer/stores \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Login as merchant
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"merchant@muncheez.co.ke\",\"password\":\"merchant123\"}"

# 5. Test merchant dashboard
curl http://localhost:5000/api/merchant/dashboard \
  -H "Authorization: Bearer MERCHANT_TOKEN"

# 6. Login as courier
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"courier@muncheez.co.ke\",\"password\":\"courier123\"}"

# 7. Test courier available orders
curl http://localhost:5000/api/courier/orders/available \
  -H "Authorization: Bearer COURIER_TOKEN"

# 8. Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@muncheez.co.ke\",\"password\":\"admin123\"}"

# 9. Test admin dashboard
curl http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 12. Common Issues

| Issue | Solution |
|-------|----------|
| `EADDRINUSE: port 5000` | Kill process: `taskkill /PID <PID> /F` or change PORT in `.env` |
| `Invalid token` | Token expired, use refresh endpoint or login again |
| `Customer access required` | Using wrong role token for endpoint |
| `Database locked` | Close other connections to SQLite DB |
| `Prisma Client not generated` | Run `npx prisma generate` |

---

## 13. Database Inspection

View SQLite database directly:

```bash
# Install SQLite CLI if needed, then:
sqlite3 backend/prisma/dev.db

# Inside SQLite shell:
.tables
SELECT * FROM User;
SELECT * FROM Profile;
SELECT * FROM Merchant;
SELECT * FROM Product;
SELECT * FROM Order;
.quit
```

---

## 14. Next Steps After Testing

Once all endpoints are verified:
1. Update frontend `AuthContext.tsx` to use backend API
2. Replace Supabase calls with fetch calls to backend
3. Update `MockDatabaseContext.tsx` to use backend API
4. Test full user flows end-to-end
5. Implement Socket.IO real-time features
6. Add M-Pesa Daraja API integration
7. Add email service (nodemailer)
