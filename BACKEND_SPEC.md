# Muncheez V2 — Backend Specification & Implementation Plan

> **Guiding Principle:** Don't throw away the frontend. Build a backend contract around what you've already designed. Every button, form, card, table, and modal in the frontend maps to a specific API endpoint, database table, and permission requirement.

---

## 1. Architectural Recommendation

### What We're Building

```
React/Vite Frontend → Node.js/Express API → PostgreSQL
                                            → authentication layer
```

### Why This Stack

| Component | Choice | Reason |
|-----------|--------|--------|
| **API Framework** | Node.js + Express | You already know JavaScript/TypeScript. Same language as frontend. Fast iteration. |
| **Database** | PostgreSQL | Supabase already uses it. Keep the schema, just own the queries. |
| **ORM** | Prisma | Type-safe, auto-generates types from schema, excellent migrations. |
| **Auth** | Custom JWT + bcrypt | Full control over roles, sessions, and multi-role context switching. |
| **File Storage** | Supabase Storage OR local S3-compatible | Keep Supabase only where useful (storage), not for auth. |
| **Real-time** | Socket.IO | For rider tracking, order status updates, notifications. |
| **Payments** | M-Pesa Daraja API | Direct integration, no middleman. |

### What We Keep from Supabase

- **PostgreSQL database** — The schema is already solid. We just query it directly instead of through Supabase client.
- **Supabase Storage** — For product images, rider documents, etc. It's cheap and works.
- **Email templates** — The `emailtemp/` folder is already designed.

### What We Replace

- **Supabase Auth** → Custom JWT auth with role-based tokens
- **Supabase Realtime** → Socket.IO for real-time features
- **Supabase RLS** → Our own middleware permission checks

---

## 2. The Core Identity Model

### The Multi-Role User

```text
USER
│
├── Identity
│   ├── id (UUID)
│   ├── email (unique)
│   ├── password_hash
│   ├── full_name
│   ├── phone
│   ├── email_verified (boolean)
│   ├── loyalty_tier (Standard, Silver, Gold, Platinum)
│   └── created_at
│
└── Roles (array, not single)
    ├── CUSTOMER
    ├── MERCHANT
    ├── COURIER
    └── ADMIN
```

**Key insight:** A user CAN have multiple roles. What shouldn't happen is one *session* behaving as two active application contexts simultaneously.

### Session Context

When a user logs in, they choose (or are assigned) a **primary context**:

```typescript
interface Session {
    userId: string;
    primaryRole: 'customer' | 'merchant' | 'courier' | 'admin';
    // JWT contains: userId, primaryRole, allRoles[]
}
```

The frontend stores the current context and can switch between roles via the PortalSwitcher.

---

## 3. Frontend → Backend Contract

### Every Frontend Action Maps To:

```text
Frontend Component
        ↓
API Endpoint (method + path)
        ↓
Authentication Check
        ↓
Permission/Role Check
        ↓
Database Operation
        ↓
Response
```

### Complete API Specification

#### A. Authentication

| Frontend Action | API Endpoint | Auth Required | Permission |
|-----------------|--------------|---------------|------------|
| Customer signup | `POST /api/auth/signup` | No | — |
| Merchant signup | `POST /api/auth/signup/merchant` | No | — |
| Courier signup | `POST /api/auth/signup/courier` | No | — |
| Login | `POST /api/auth/login` | No | — |
| Logout | `POST /api/auth/logout` | Yes | Any |
| Refresh token | `POST /api/auth/refresh` | No | — |
| Forgot password | `POST /api/auth/forgot-password` | No | — |
| Reset password | `POST /api/auth/reset-password` | No | — |
| Verify email | `GET /api/auth/verify-email/:token` | No | — |
| Add role to account | `POST /api/auth/roles/add` | Yes | Any authenticated |

#### B. Customer Flows

| Frontend Action | API Endpoint | Auth Required | Permission |
|-----------------|--------------|---------------|------------|
| Browse stores | `GET /api/stores` | No | — |
| View store | `GET /api/stores/:id` | No | — |
| View products | `GET /api/stores/:id/products` | No | — |
| Add to cart | `POST /api/cart/items` | Yes | Customer |
| View cart | `GET /api/cart` | Yes | Customer |
| Update cart | `PUT /api/cart/items/:id` | Yes | Customer |
| Remove from cart | `DELETE /api/cart/items/:id` | Yes | Customer |
| Create order | `POST /api/orders` | Yes | Customer |
| View my orders | `GET /api/orders` | Yes | Customer |
| View order | `GET /api/orders/:id` | Yes | Customer |
| Cancel order | `POST /api/orders/:id/cancel` | Yes | Customer |
| Payment init | `POST /api/payments/initiate` | Yes | Customer |
| Payment callback | `POST /api/payments/callback` | No | M-Pesa |
| View order status | `GET /api/orders/:id/status` | Yes | Customer |
| Add review | `POST /api/orders/:id/review` | Yes | Customer |
| Get loyalty tier | `GET /api/customer/loyalty` | Yes | Customer |
| Update profile | `PUT /api/customer/profile` | Yes | Customer |
| Share order | `POST /api/social/orders/share` | Yes | Customer |

#### C. Merchant Flows

| Frontend Action | API Endpoint | Auth Required | Permission |
|-----------------|--------------|---------------|------------|
| View dashboard | `GET /api/merchant/dashboard` | Yes | Merchant |
| Add product | `POST /api/merchant/products` | Yes | Merchant |
| Update product | `PUT /api/merchant/products/:id` | Yes | Merchant |
| Delete product | `DELETE /api/merchant/products/:id` | Yes | Merchant |
| View products | `GET /api/merchant/products` | Yes | Merchant |
| Bulk import products | `POST /api/merchant/products/import` | Yes | Merchant |
| View orders | `GET /api/merchant/orders` | Yes | Merchant |
| Accept order | `POST /api/merchant/orders/:id/accept` | Yes | Merchant |
| Reject order | `POST /api/merchant/orders/:id/reject` | Yes | Merchant |
| Update order status | `PUT /api/merchant/orders/:id/status` | Yes | Merchant |
| View customers | `GET /api/merchant/customers` | Yes | Merchant |
| View deliveries | `GET /api/merchant/deliveries` | Yes | Merchant |
| View payments | `GET /api/merchant/payments` | Yes | Merchant |
| Update settings | `PUT /api/merchant/settings` | Yes | Merchant |
| Upload logo | `POST /api/merchant/logo` | Yes | Merchant |
| View reports | `GET /api/merchant/reports` | Yes | Merchant |
| Toggle online status | `PUT /api/merchant/status` | Yes | Merchant |
| Get merchant locations | `GET /api/merchant/locations` | Yes | Merchant |
| Add merchant location | `POST /api/merchant/locations` | Yes | Merchant |

#### D. Courier/Rider Flows

| Frontend Action | API Endpoint | Auth Required | Permission |
|-----------------|--------------|---------------|------------|
| Go online | `POST /api/courier/status` | Yes | Courier |
| Go offline | `POST /api/courier/status` | Yes | Courier |
| View available orders | `GET /api/courier/orders/available` | Yes | Courier |
| Accept order | `POST /api/courier/orders/:id/accept` | Yes | Courier |
| Decline order | `POST /api/courier/orders/:id/decline` | Yes | Courier |
| Update location | `POST /api/courier/location` | Yes | Courier |
| Pick up order | `POST /api/courier/orders/:id/pickup` | Yes | Courier |
| Complete delivery | `POST /api/courier/orders/:id/deliver` | Yes | Courier |
| View earnings | `GET /api/courier/earnings` | Yes | Courier |
| View performance | `GET /api/courier/performance` | Yes | Courier |
| Submit documents | `POST /api/courier/documents` | Yes | Courier |
| SOS emergency | `POST /api/courier/sos` | Yes | Courier |
| Cashout | `POST /api/courier/cashout` | Yes | Courier |
| Update vehicle info | `PUT /api/courier/vehicle` | Yes | Courier |

#### E. Admin Flows

| Frontend Action | API Endpoint | Auth Required | Permission |
|-----------------|--------------|---------------|------------|
| View dashboard | `GET /api/admin/dashboard` | Yes | Admin |
| Manage merchants | `GET /api/admin/merchants` | Yes | Admin |
| Approve merchant | `POST /api/admin/merchants/:id/approve` | Yes | Admin |
| Suspend merchant | `POST /api/admin/merchants/:id/suspend` | Yes | Admin |
| Manage riders | `GET /api/admin/riders` | Yes | Admin |
| Approve rider | `POST /api/admin/riders/:id/approve` | Yes | Admin |
| View orders | `GET /api/admin/orders` | Yes | Admin |
| Update order status | `PUT /api/admin/orders/:id/status` | Yes | Admin |
| View customers | `GET /api/admin/customers` | Yes | Admin |
| Manage inventory | `GET /api/admin/products` | Yes | Admin |
| View financials | `GET /api/admin/financials` | Yes | Admin |
| Create campaign | `POST /api/admin/campaigns` | Yes | Admin |
| Create promo code | `POST /api/admin/promo-codes` | Yes | Admin |
| View support tickets | `GET /api/admin/complaints` | Yes | Admin |
| Resolve complaint | `POST /api/admin/complaints/:id/resolve` | Yes | Admin |
| Issue warning | `POST /api/admin/warnings` | Yes | Admin |
| Update settings | `PUT /api/admin/settings` | Yes | Admin |
| Toggle audit mode | `PUT /api/admin/audit/:merchantId` | Yes | Admin |

#### F. Social Features

| Frontend Action | API Endpoint | Auth Required | Permission |
|-----------------|--------------|---------------|------------|
| Get friends | `GET /api/social/friends` | Yes | Any |
| Send friend request | `POST /api/social/friends/request` | Yes | Any |
| Accept friend request | `POST /api/social/friends/accept` | Yes | Any |
| Get shared orders | `GET /api/social/orders` | Yes | Any |
| Share order | `POST /api/social/orders/share` | Yes | Customer |
| Add reaction | `POST /api/social/orders/:id/react` | Yes | Any |
| Send gift | `POST /api/social/gifts/send` | Yes | Customer |
| Get notifications | `GET /api/social/notifications` | Yes | Any |
| Mark notifications read | `POST /api/social/notifications/read` | Yes | Any |
| Update privacy | `PUT /api/social/privacy` | Yes | Any |
| Search users | `GET /api/social/users/search` | Yes | Any |

---

## 4. Database Schema (Prisma)

### Core Models

```prisma
model User {
  id                String    @id @default(uuid())
  email             String    @unique
  passwordHash      String
  fullName          String
  phone             String?   @unique
  emailVerified     Boolean   @default(false)
  loyaltyTier       String    @default("Standard") // Standard, Silver, Gold, Platinum
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  profile           Profile?
  merchant          Merchant?
  rider             Rider?
  orders            Order[]
  sentMessages      Message[] @relation("SentMessages")
  receivedMessages  Message[] @relation("ReceivedMessages")
  complaints        Complaint[]
  warnings          Warning[]
  walletEntries     WalletEntry[]
  sessions          Session[]
  friends           Friend[] @relation("UserFriends")
  friendRequests    FriendRequest[] @relation("FriendRequestSender")
  receivedRequests  FriendRequest[] @relation("FriendRequestReceiver")
  sharedOrders      SharedOrder[]
  reactions         Reaction[]
  notifications     Notification[]
  privacySettings   PrivacySettings?
}

model Profile {
  id          String    @id @default(uuid())
  userId      String    @unique
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  roles       String[]  @default(["customer"])
  status      String    @default("ACTIVE")
  avatarUrl   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token        String   @unique
  primaryRole  String
  allRoles     String[]
  ipAddress    String?
  userAgent    String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())
}

model Merchant {
  id              String    @id @default(uuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  businessName    String
  type            String    @default("Restaurant")
  status          String    @default("PENDING")
  logoUrl         String?
  coverUrl        String?
  description     String?
  address         String?
  kraPin          String?
  healthPermit    String?
  mpesaTill       String?
  mpesaShortcode  String?
  operatingHours  Json?     @default({})
  branding        Json?     @default({})
  customSettings  Json?     @default({}) // kitchenPrepTimeMin, cutleryRequired, pharmacistName, licenseNumber, lowStockThreshold, bulkPurchaseLimit, etc.
  isActive        Boolean   @default(false)
  deliveryFee     Decimal   @default(150)
  notificationEmail String?
  notificationPhone String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  products        Product[]
  orders          Order[]
  categories      Category[]
  locations       MerchantLocation[]
}

model MerchantLocation {
  id              String    @id @default(uuid())
  merchantId      String
  merchant        Merchant  @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  branchName      String
  address         String
  geo             Json?     @default({}) // { lat, lng }
  deliveryRadiusKm Int      @default(5)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
}

model Rider {
  id              String    @id @default(uuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  vehicleType     String    @default("Motorbike")
  vehicleMake     String?
  vehicleModel    String?
  vehiclePlate    String?
  status          String    @default("PENDING")
  isOnline        Boolean   @default(false)
  rating          Decimal   @default(5.0)
  totalOrders     Int       @default(0)
  hasIdDoc        Boolean   @default(false)
  hasLicense      Boolean   @default(false)
  hasLogbook      Boolean   @default(false)
  hasHelmet       Boolean   @default(false)
  hasThermalBag   Boolean   @default(false)
  hasVest         Boolean   @default(false)
  performance     Json?     @default({}) // rating, acceptanceRate, reliabilityScore, completionRate, onTimeRate
  vehicle         Json?     @default({}) // make, model, plate, serviceHealth, insurance
  earnings        Json?     @default({}) // today, weekly, total
  documents       Json?     @default([]) // [{ type, status }]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  orders          Order[]
  walletEntries   WalletEntry[]
}

model Category {
  id          String    @id @default(uuid())
  merchantId  String
  merchant    Merchant  @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  name        String
  priority    Int       @default(0)
  createdAt   DateTime  @default(now())

  products    Product[]
}

model Product {
  id              String    @id @default(uuid())
  merchantId      String
  merchant        Merchant  @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  categoryId      String?
  category        Category? @relation(fields: [categoryId], references: [id], onDelete:SetNull)
  name            String
  description     String?
  price           Decimal
  imageUrl        String?
  isAvailable     Boolean   @default(true)
  stockLevel      Int?
  sku             String?
  isFeatured      Boolean   @default(false)
  metadata        Json?     @default({}) // tags, preparationTimeMin, isPrescriptionRequired
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  orderItems      OrderItem[]
}

model Order {
  id                  String    @id @default(uuid())
  customerId          String
  customer            User      @relation(fields: [customerId], references: [id])
  merchantId          String
  merchant            Merchant  @relation(fields: [merchantId], references: [id])
  riderId             String?
  rider               Rider?    @relation(fields: [riderId], references: [id])
  status              String    @default("CREATED")
  total               Decimal
  deliveryFee         Decimal   @default(0)
  serviceFee          Decimal   @default(0)
  deliveryAddress     String?
  deliveryStreet      String?
  deliveryBuilding    String?
  deliveryApartment   String?
  deliveryFloor       String?
  deliveryInstructions String?
  paymentMethod       String    @default("MPESA")
  paymentStatus       String    @default("PENDING")
  mpesaCode           String?
  notes               String?
  items               Json      @default("[]")
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  statusHistory       OrderStatusHistory[]
  items               OrderItem[]
  walletEntries       WalletEntry[]
  complaints          Complaint[]
  reactions           Reaction[]
  sharedOrders        SharedOrder[]
}

model OrderItem {
  id          String  @id @default(uuid())
  orderId     String
  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String?
  product     Product? @relation(fields: [productId], references: [id])
  name        String
  quantity    Int
  price       Decimal
  options     String[] @default([])
}

model OrderStatusHistory {
  id          String   @id @default(uuid())
  orderId     String
  order       Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  status      String
  changedBy   String?
  note        String?
  createdAt   DateTime @default(now())
}

model WalletEntry {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  orderId         String?
  order           Order?    @relation(fields: [orderId], references: [id])
  amount          Decimal
  transactionType String
  category        String   // ORDER_PAYMENT, RIDER_PAYOUT, MERCHANT_PAYOUT, PLATFORM_COMMISSION, VAT, CANCELLATION_PENALTY, RIDER_DROP_PENALTY, REFUND, MPESA_FEE
  metadata        Json?     @default({})
  createdAt       DateTime  @default(now())
}

model Complaint {
  id          String    @id @default(uuid())
  orderId     String?
  order       Order?    @relation(fields: [orderId], references: [id])
  filedById   String
  filedBy     User      @relation(fields: [filedById], references: [id], name: "ComplaintFiler")
  againstId   String
  against     User      @relation(fields: [againstId], references: [id], name: "ComplaintAgainst")
  subject     String
  description String
  category    String    @default("OTHER") // QUALITY, DELIVERY, BEHAVIOR, FRAUD, OTHER
  priority    String    @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  status      String    @default("OPEN") // OPEN, INVESTIGATING, RESOLVED, CLOSED
  resolution  String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Warning {
  id          String    @id @default(uuid())
  issuedToId  String
  issuedTo    User      @relation(fields: [issuedToId], references: [id], onDelete: Cascade)
  issuedById  String?
  severity    String    @default("LOW") // LOW, MEDIUM, HIGH, CRITICAL
  reason      String
  details     String?
  acknowledged Boolean @default(false)
  createdAt   DateTime  @default(now())
}

model Campaign {
  id          String    @id @default(uuid())
  name        String
  type        String
  status      String    @default("DRAFT")
  targetZone  String?
  discountType String?
  discountValue Decimal?
  startAt     DateTime?
  endAt       DateTime?
  createdAt   DateTime  @default(now())
}

model PromoCode {
  id          String    @id @default(uuid())
  campaignId  String?
  campaign    Campaign? @relation(fields: [campaignId], references: [id])
  code        String    @unique
  discountType String
  discountValue Decimal
  usageCount  Int       @default(0)
  usageLimit  Int?
  expiresAt   DateTime?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
}

// ─── Social Models ──────────────────────────────────────────────────

model Friend {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade, name: "UserFriends")
  friendId        String
  friend          User      @relation(fields: [friendId], references: [id], onDelete: Cascade)
  status          String    @default("pending") // pending, accepted, incoming, blocked
  allowGifting    Boolean   @default(true)
  allowOrderVisibility Boolean @default(true)
  maskedAddress   String?
  lastActive      String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([userId, friendId])
}

model FriendRequest {
  id          String    @id @default(uuid())
  fromId      String
  from        User      @relation(fields: [fromId], references: [id], name: "FriendRequestSender")
  toId        String
  to          User      @relation(fields: [toId], references: [id], name: "FriendRequestReceiver")
  status      String    @default("pending") // pending, accepted, declined
  createdAt   DateTime  @default(now())
}

model SharedOrder {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  orderId     String?
  order       Order?    @relation(fields: [orderId], references: [id])
  items       Json      @default("[]")
  total       Decimal
  image       String?
  reactions    Reaction[]
  createdAt   DateTime  @default(now())
}

model Reaction {
  id          String    @id @default(uuid())
  sharedOrderId String
  sharedOrder SharedOrder @relation(fields: [sharedOrderId], references: [id], onDelete: Cascade)
  emoji       String
  userIds     String[]  @default([])
  count       Int       @default(0)
  createdAt   DateTime  @default(now())
}

model Notification {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  type        String    // friend_request, gift_sent, gift_received, reaction, order_shared
  fromId      String?
  from        User?     @relation(fields: [fromId], references: [id])
  message     String
  link        String?
  read        Boolean   @default(false)
  createdAt   DateTime  @default(now())
}

model PrivacySettings {
  id                    String    @id @default(uuid())
  userId                String    @unique
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  shareOrdersWithFriends Boolean @default(true)
  allowSurpriseGifts    Boolean   @default(true)
  showMaskedAddress     Boolean   @default(true)
  visibilityLevel       String    @default("all_friends") // all_friends, selective, private
  allowedGiftingFriends String[]  @default([])
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

model AuditLog {
  id          String    @id @default(uuid())
  adminId     String
  targetType  String    // merchant, rider, order
  targetId    String
  action      String    // approve, suspend, warn, etc.
  details     Json?
  createdAt   DateTime  @default(now())
}
```

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal:** Replace Supabase Auth with custom JWT auth while keeping the frontend working.

1. **Set up Express server**
   - Initialize Node.js project
   - Install dependencies: `express`, `prisma`, `bcrypt`, `jsonwebtoken`, `cors`, `dotenv`
   - Create basic server structure

2. **Set up Prisma**
   - Install Prisma CLI
   - Create `prisma/schema.prisma` with models above
   - Run `prisma migrate dev` to create tables
   - Generate Prisma client

3. **Implement authentication endpoints**
   - `POST /api/auth/signup` — Create user + profile + role-specific record
   - `POST /api/auth/login` — Verify credentials, issue JWT
   - `POST /api/auth/logout` — Invalidate session
   - `POST /api/auth/refresh` — Issue new access token
   - `POST /api/auth/forgot-password` — Send reset email
   - `POST /api/auth/reset-password` — Update password

4. **Create auth middleware**
   - Verify JWT token
   - Extract user + roles from token
   - Attach to `req.user`

5. **Update frontend**
   - Replace `supabase.auth` calls with `fetch('/api/auth/...')`
   - Update `AuthContext` to use custom auth
   - Keep Supabase client for database queries initially (gradual migration)

### Phase 2: Core APIs (Week 3-4)

**Goal:** Replace Supabase database calls with custom API endpoints.

1. **Customer APIs**
   - Store listing, product browsing
   - Cart management
   - Order creation and tracking
   - Payment integration (M-Pesa)

2. **Merchant APIs**
   - Dashboard data
   - Product CRUD
   - Order management
   - Settings updates
   - Bulk product import

3. **Courier APIs**
   - Status updates (online/offline)
   - Order acceptance/decline
   - Location updates
   - Earnings view
   - SOS emergency
   - Cashout

4. **Admin APIs**
   - Merchant approval
   - Rider approval
   - Order oversight
   - Financial reports
   - Audit mode toggle

### Phase 3: Real-time & Advanced Features (Week 5-6)

**Goal:** Add real-time capabilities and advanced features.

1. **Socket.IO integration**
   - Rider location tracking
   - Order status updates
   - Notifications

2. **File uploads**
   - Product images
   - Rider documents
   - Merchant logos

3. **Email service**
   - Verification emails
   - Password reset
   - Order confirmations
   - Notifications

4. **Payment webhooks**
   - M-Pesa callback handling
   - Payment status updates

5. **Social features**
   - Friend system
   - Shared orders
   - Reactions
   - Gifts
   - Notifications

### Phase 4: Testing & Deployment (Week 7-8)

**Goal:** Production-ready deployment.

1. **Testing**
   - Unit tests for auth
   - Integration tests for APIs
   - E2E tests for critical flows

2. **Security**
   - Rate limiting
   - Input validation
   - SQL injection prevention (Prisma handles this)
   - CORS configuration

3. **Deployment**
   - Dockerize the API
   - Deploy to Vercel/Railway/Render
   - Set up PostgreSQL database
   - Configure environment variables

---

## 6. Critical Implementation Notes

### Multi-Role Context Switching

```typescript
// When user logs in, they get a JWT with all their roles
// The frontend stores the "primary context" they're currently in

interface JWTPayload {
  userId: string;
  primaryRole: string;
  allRoles: string[];
  email: string;
}

// PortalSwitcher changes the primary context
// Frontend sends context in X-Context header or as query param
// Backend uses this to determine which dashboard data to return
```

### Session Concurrency

```typescript
// Track active sessions in database
// When user logs in from new device, invalidate old session
// Frontend checks session validity every 30 seconds
```

### Order State Machine

```typescript
// Enforce valid transitions server-side
const ORDER_TRANSITIONS = {
  'CREATED': ['PAYMENT_PENDING', 'CANCELLED'],
  'PAYMENT_PENDING': ['PAYMENT_CONFIRMED', 'CANCELLED'],
  'PAYMENT_CONFIRMED': ['ACCEPTED', 'CANCELLED'],
  'ACCEPTED': ['PREPARING', 'CANCELLED'],
  'PREPARING': ['READY_FOR_PICKUP', 'CANCELLED'],
  'READY_FOR_PICKUP': ['RIDER_ASSIGNED', 'CANCELLED'],
  'RIDER_ASSIGNED': ['PICKED_UP', 'CANCELLED'],
  'PICKED_UP': ['DELIVERED', 'CANCELLED'],
  'DELIVERED': ['COMPLETED'],
  'COMPLETED': [],
  'CANCELLED': [],
  'FAILED': []
};
```

### Financial Calculations

```typescript
// All money calculations happen server-side
// Never trust client-side calculations
// Use integer math (cents) or Decimal type
// Double-entry ledger for all transactions
```

### Social Features Architecture

```typescript
// Social features are opt-in per user
// Privacy settings control visibility
// Shared orders are linked to original Order via orderId
// Reactions are stored as array of userIds per emoji
// Notifications are created async via Socket.IO
```

### Pharmacy Compliance

```typescript
// Prescription-required products must have isPrescriptionRequired flag
// Pharmacist on duty must be set in merchant.customSettings
// License number must be validated on merchant approval
// Insurance integration requires separate webhook handling
```

### Supermarket Inventory

```typescript
// Low stock alerts triggered when stockLevel <= lowStockThreshold
// Bulk purchase limit enforced at cart level
// SKU must be unique per merchant
```

---

## 7. Reference Architectures

### KitchenAsty (Node.js + Express + PostgreSQL + Prisma + JWT)
- Similar multi-role structure
- Good reference for API organization
- [GitHub](https://github.com/mighty840/kitchenasty)

### Velora (Spring Boot + React + PostgreSQL)
- Multi-role dashboards
- Good reference for permission patterns
- [GitHub](https://github.com/PriyamJaiswal/Velora-food-delivery)

### Food Delivery App (React/Node/Express/MongoDB)
- Simpler architecture, good for studying API structure
- [GitHub](https://github.com/chahatkesh/food-delivery-app)

---

## 8. Next Immediate Steps

1. **Create `backend/` folder** in project root
2. **Initialize Node.js project** with `package.json`
3. **Set up Prisma** with the schema above
4. **Create basic Express server** with health check endpoint
5. **Implement first auth endpoint** (`POST /api/auth/login`)
6. **Test with Postman/Thunder Client** before touching frontend
7. **Gradually migrate** frontend from Supabase to custom API

---

## 9. What NOT To Do

- ❌ Don't build a custom backend that mirrors Supabase's limitations
- ❌ Don't create separate accounts for the same email
- ❌ Don't let the backend dictate frontend design
- ❌ Don't skip the specification phase — map EVERY frontend action first
- ❌ Don't deploy without proper session management
- ❌ Don't calculate money on the frontend
- ❌ Don't forget the social features — they're already built in the frontend
- ❌ Don't ignore pharmacy/supermarket-specific requirements

---

## 10. Frontend Coverage Checklist

### ✅ Covered
- [x] All auth flows (login, signup, forgot password, reset password, verify email)
- [x] Multi-role support and PortalSwitcher
- [x] Customer: browse stores, view products, cart, checkout, order tracking
- [x] Merchant: dashboard, products, orders, customers, deliveries, payments, reports, settings
- [x] Courier: online/offline, accept orders, pickup, deliver, wallet, performance, SOS
- [x] Admin: dashboard, merchants, riders, orders, customers, financials, inventory, marketing, support, settings
- [x] Social: friends, shared orders, reactions, gifts, notifications, privacy
- [x] Realtime: order status updates, rider tracking
- [x] Financial: wallet ledger, double-entry, commissions, VAT, penalties
- [x] File storage: product images, logos, rider documents

### ⚠️ Needs Attention
- [ ] Loyalty tier logic (backend calculation, not just display)
- [ ] M-Pesa Daraja API integration details
- [ ] Email service implementation (templates exist in `emailtemp/`)
- [ ] Socket.IO event naming convention
- [ ] Rate limiting configuration
- [ ] File upload size limits and validation

---

*This document is the single source of truth for the backend implementation. Every API endpoint, database table, and permission rule is derived from the existing frontend code.*
