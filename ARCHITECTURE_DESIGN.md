# Muncheez Backend — Target Architecture Design

## 1. CORE PRINCIPLES

### 1.1 Separation of Concerns

```
Authentication  →  Who is this user?
Authorization   →  What can this user do?
Approval        →  Is this user permitted to operate as merchant/rider?
Visibility      →  What information is publicly available?
```

These four concepts are **never** mixed.

### 1.2 Public-First Storefront

Anonymous users browse without authentication. Authentication is only required for actions that need identity (checkout, order history, dashboard access).

### 1.3 Backend is Source of Truth

The frontend displays state and requests actions. The backend determines whether actions are legal. Never trust client-provided prices, ownership, roles, or status.

---

## 2. AUTHENTICATION & AUTHORIZATION MODEL

### 2.1 User Identity

A `User` is a single identity record:

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  fullName      String
  phone         String?   @unique
  emailVerified Boolean   @default(false)
  status        String    @default("ACTIVE")  // ACTIVE, SUSPENDED, DELETED
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  profile           Profile?
  merchantProfile   MerchantProfile?
  riderProfile      RiderProfile?
  customerProfile   CustomerProfile?
  sessions          Session[]
  orders            Order[]
  walletEntries     WalletEntry[]
  notifications     Notification[]
  auditLogs         AuditLog[]
  complaints        Complaint[]
  warnings          Warning[]
  sentMessages      Message[] @relation("SentMessages")
  receivedMessages  Message[] @relation("ReceivedMessages")
}
```

### 2.2 Roles (Enums, Not JSON)

```prisma
enum Role {
  CUSTOMER
  MERCHANT
  RIDER
  ADMIN
}
```

```prisma
model Profile {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  roles     Role[]   @default([CUSTOMER])
  status    String   @default("ACTIVE")  // ACTIVE, SUSPENDED
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Key change:** `roles` is now a proper `Role[]` array, not a JSON string.

### 2.3 Sessions

```prisma
model Session {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token        String   @unique
  primaryRole  Role
  allRoles     Role[]
  ipAddress    String?
  userAgent    String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())
}
```

JWT payload contains:
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "primaryRole": "customer",
  "allRoles": ["customer", "merchant"],
  "exp": 1234567890
}
```

### 2.4 Authorization Flow

```
Request arrives
    ↓
Extract JWT from Authorization header
    ↓
Verify JWT signature & expiry
    ↓
Look up User + Profile + Session
    ↓
If user not found / session expired → 401
    ↓
Attach req.user, req.roles, req.primaryRole
    ↓
Route handler checks:
  - Is user authenticated? (req.user exists)
  - Does user have required role? (req.roles includes required)
  - Is user approved for this operation? (status checks)
  - Does user own this resource? (ownership check)
    ↓
Proceed or reject
```

### 2.5 Merchant Approval State Machine

```
User registers with merchant role
    ↓
User: ACTIVE
MerchantProfile: PENDING
MerchantAccess: DENIED
    ↓
Admin reviews
    ↓
[APPROVED] → MerchantProfile: APPROVED → MerchantAccess: ALLOWED
[REJECTED] → MerchantProfile: REJECTED → MerchantAccess: DENIED
[SUSPENDED] → MerchantProfile: SUSPENDED → MerchantAccess: DENIED
```

**Critical:** A pending merchant is **authenticated** but **not authorized** for merchant operations.

### 2.6 Rider Approval State Machine

```
User registers with rider role
    ↓
User: ACTIVE
RiderProfile: PENDING
RiderAccess: DENIED
    ↓
Admin reviews
    ↓
[APPROVED] → RiderProfile: APPROVED → RiderAccess: ALLOWED
[REJECTED] → RiderProfile: REJECTED → RiderAccess: DENIED
[SUSPENDED] → RiderProfile: SUSPENDED → RiderAccess: DENIED
```

### 2.7 Admin Authorization

Admin is a role, not a separate user type. Admin authorization is checked via:

```javascript
req.roles.includes('ADMIN')
```

No separate approval flow for admin — admin role is assigned by existing admin or seed data.

### 2.8 Suspension/Revocation

- `User.status = SUSPENDED` → all access denied
- `Profile.status = SUSPENDED` → role-specific access denied
- `MerchantProfile.status = SUSPENDED` → merchant access denied
- `RiderProfile.status = SUSPENDED` → rider access denied

---

## 3. PUBLIC STOREFRONT

### 3.1 Public API Layer

Separate from protected APIs. No JWT required.

```
GET  /public/stores
GET  /public/stores/:id
GET  /public/stores/:id/products
GET  /public/stores/:id/categories
GET  /public/categories
GET  /public/search
GET  /public/products/:id
```

### 3.2 Public Data Rules

A store is publicly visible **only** when ALL conditions are met:

```
merchantProfile.status = APPROVED
AND merchantProfile.user.status = ACTIVE
AND store.isActive = true
AND store.isPublic = true
AND store serves requested location (geolocation check)
```

Products are publicly visible **only** when:

```
product.isAvailable = true
AND product.store.isPublic = true
AND product.store.merchantProfile.status = APPROVED
```

### 3.3 What is NEVER Public

- Merchant private information (KRA PIN, M-Pesa details, documents)
- Customer private information (addresses, payment details, order history)
- Rider information (location, personal details)
- Admin information
- Internal financial data
- Authentication secrets
- Private order information

---

## 4. GEOLOCATION DESIGN

### 4.1 Data Model

```prisma
model Store {
  id               String   @id @default(uuid())
  merchantId       String
  merchant         MerchantProfile @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  
  // Identity
  name             String
  description      String?
  logoUrl          String?
  coverUrl         String?
  
  // Location
  address          String
  lat              Float
  lng              Float
  
  // Serviceability
  isActive         Boolean  @default(true)
  isPublic         Boolean  @default(true)
  deliveryRadiusKm Float    @default(5.0)
  
  // Operations
  openingHours     Json     @default({})  // { monday: {open: "08:00", close: "22:00"}, ... }
  preparationTimeMin Int    @default(30)
  deliveryFee      Decimal  @default(150)
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  categories       Category[]
  products         Product[]
  orders           Order[]
  deliveryZones    DeliveryZone[]
}
```

### 4.2 Delivery Zones

```prisma
model DeliveryZone {
  id          String   @id @default(uuid())
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  name        String   // e.g., "Westlands", "CBD", "Kilimani"
  polygon     Json     @default([])  // GeoJSON polygon or simple radius
  fee         Decimal
  minOrder    Decimal?
  etaMin      Int?
  
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

### 4.3 Serviceability Check

When a user provides `lat` + `lng`:

1. Find all stores where `isActive = true` AND `isPublic = true` AND merchant approved
2. For each store, check if point is within:
   - Store's `deliveryRadiusKm` (simple circle), OR
   - Any active `DeliveryZone` polygon
3. Return only serviceable stores, sorted by distance

### 4.4 Distance Calculation

Use Haversine formula for simple radius checks. For polygon checks, use point-in-polygon algorithm.

```javascript
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

---

## 5. MERCHANT DATA MODEL

### 5.1 Merchant Profile (Separate from User)

```prisma
model MerchantProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Business Info
  businessName    String
  type            MerchantType @default(RESTAURANT)
  status          MerchantStatus @default(PENDING)
  description     String?
  address         String?
  
  // Compliance
  kraPin          String?
  healthPermit    String?
  mpesaTill       String?
  mpesaShortcode  String?
  
  // Operations
  isActive        Boolean  @default(false)
  deliveryFee     Decimal  @default(150)
  
  // Notifications
  notificationEmail String?
  notificationPhone String?
  
  // Metadata
  branding        Json?    @default({})
  customSettings  Json?    @default({})
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  stores          Store[]
  categories      Category[]
  products        Product[]
  orders          Order[]
}
```

### 5.2 Store (Merchant's Operating Unit)

A merchant can have multiple stores. Each store has its own location, products, and delivery configuration.

### 5.3 Category & Product

```prisma
model Category {
  id          String   @id @default(uuid())
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  name        String
  priority    Int      @default(0)
  createdAt   DateTime @default(now())

  products    Product[]
}

model Product {
  id              String   @id @default(uuid())
  storeId         String
  store           Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  categoryId      String?
  category        Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  
  name            String
  description     String?
  price           Decimal  @db.Decimal(12, 2)
  imageUrl        String?
  isAvailable     Boolean  @default(true)
  stockLevel      Int?
  sku             String?
  isFeatured      Boolean  @default(false)
  metadata        Json?    @default({})  // tags, prepTime, etc.
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  orderItems      OrderItem[]
}
```

### 5.4 Ownership Enforcement

Every merchant operation validates:

```javascript
const store = await prisma.store.findFirst({
  where: { id: storeId, merchantId: req.user.merchantProfile.id }
})
if (!store) return 403
```

Never trust URL parameters alone.

---

## 6. RIDER DATA MODEL

### 6.1 Rider Profile

```prisma
model RiderProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  vehicleType     String   @default("Motorbike")
  vehicleMake     String?
  vehicleModel    String?
  vehiclePlate    String?
  
  status          RiderStatus @default(PENDING)
  isOnline        Boolean  @default(false)
  
  rating          Decimal  @default(5.0) @db.Decimal(3, 2)
  totalOrders     Int      @default(0)
  
  // Documents
  hasIdDoc        Boolean  @default(false)
  hasLicense      Boolean  @default(false)
  hasLogbook      Boolean  @default(false)
  hasHelmet       Boolean  @default(false)
  hasThermalBag   Boolean  @default(false)
  hasVest         Boolean  @default(false)
  
  // Performance
  performance     Json?    @default({})
  
  // Earnings
  earnings        Json?    @default({})
  
  // Documents
  documents       Json?    @default([])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  orders          Order[]
  walletEntries   WalletEntry[]
}
```

### 6.2 Rider Assignment

```prisma
model RiderAssignment {
  id          String   @id @default(uuid())
  orderId     String
  order       Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  riderId     String
  rider       RiderProfile @relation(fields: [riderId], references: [id])
  
  status      String   @default("PENDING")  // PENDING, ACCEPTED, REJECTED, EXPIRED
  assignedAt  DateTime @default(now())
  acceptedAt  DateTime?
  rejectedAt  DateTime?
  
  @@unique([orderId, riderId])
}
```

---

## 7. CUSTOMER DATA MODEL

### 7.1 Customer Profile

```prisma
model CustomerProfile {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  loyaltyTier String   @default("Standard")  // Standard, Silver, Gold, Platinum
  totalOrders Int      @default(0)
  totalSpent  Decimal  @default(0) @db.Decimal(12, 2)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  addresses   Address[]
  orders      Order[]
  cart        Cart?
  reviews     Review[]
}
```

### 7.2 Address

```prisma
model Address {
  id          String   @id @default(uuid())
  customerId  String
  customer    CustomerProfile @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  label       String?  // "Home", "Work", etc.
  address     String
  lat         Float?
  lng         Float?
  instructions String?
  isDefault   Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 8. CART (Backend-Owned)

### 8.1 Cart Model

```prisma
model Cart {
  id          String   @id @default(uuid())
  customerId  String
  customer    CustomerProfile @relation(fields: [customerId], references: [id], onDelete: Cascade)
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  items       CartItem[]
  total       Decimal  @default(0) @db.Decimal(12, 2)
  itemCount   Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([customerId, storeId])
}
```

### 8.2 Cart Item

```prisma
model CartItem {
  id          String   @id @default(uuid())
  cartId      String
  cart        Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  
  quantity    Int
  price       Decimal  @db.Decimal(12, 2)  // Snapshot at time of adding
  options     Json?    @default([])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 8.3 Cart Rules

- One cart per customer per store
- Adding product from different store clears existing cart (with confirmation)
- Backend validates: product exists, product is available, product belongs to store, store is serviceable
- Backend calculates and stores `price` at time of adding (price snapshot)
- Backend recalculates `total` on every cart mutation
- At checkout, backend recalculates everything from current prices

---

## 9. ORDER STATE MACHINE

### 9.1 Order Statuses (Enum)

```prisma
enum OrderStatus {
  PENDING_PAYMENT    // Awaiting payment
  PAID               // Payment confirmed
  PLACED             // Order submitted to merchant
  MERCHANT_ACCEPTED  // Merchant accepted
  PREPARING          // Being prepared
  READY_FOR_PICKUP   // Ready for rider
  RIDER_ASSIGNED     // Rider assigned, en route to merchant
  RIDER_ARRIVING     // Rider at merchant
  PICKED_UP          // Rider has order
  IN_TRANSIT         // Rider en route to customer
  DELIVERED          // Delivered to customer
  COMPLETED          // Order fully completed
  
  // Terminal/negative states
  MERCHANT_REJECTED  // Merchant rejected
  CANCELLED          // Cancelled by customer/system
  REFUND_PENDING     // Refund initiated
  REFUNDED           // Refund completed
  FAILED             // Payment failed
}
```

### 9.2 State Transition Table

| From | To | Who | Conditions |
|------|----|-----|------------|
| PENDING_PAYMENT | PAID | System | Payment confirmed |
| PENDING_PAYMENT | FAILED | System | Payment failed |
| PENDING_PAYMENT | CANCELLED | Customer | Before payment |
| PAID | PLACED | System | Payment confirmed |
| PLACED | MERCHANT_ACCEPTED | Merchant | Order valid |
| PLACED | MERCHANT_REJECTED | Merchant | Order invalid |
| PLACED | CANCELLED | Customer | Before acceptance |
| MERCHANT_ACCEPTED | PREPARING | Merchant | Started preparation |
| MERCHANT_ACCEPTED | CANCELLED | Merchant/Customer | Before preparation |
| PREPARING | READY_FOR_PICKUP | Merchant | Preparation complete |
| PREPARING | CANCELLED | Merchant | Cannot prepare |
| READY_FOR_PICKUP | RIDER_ASSIGNED | System | Rider accepts |
| READY_FOR_PICKUP | CANCELLED | Merchant | Too long wait |
| RIDER_ASSIGNED | RIDER_ARRIVING | Rider | At merchant |
| RIDER_ASSIGNED | CANCELLED | System | Rider timeout/reject |
| RIDER_ARRIVING | PICKED_UP | Rider | Picked up |
| RIDER_ARRIVING | CANCELLED | System | Rider timeout |
| PICKED_UP | IN_TRANSIT | Rider | En route |
| IN_TRANSIT | DELIVERED | Rider | Delivered |
| DELIVERED | COMPLETED | System | Auto-complete after timeout |
| Any | CANCELLED | System | Payment timeout |
| Any | REFUND_PENDING | Admin | Dispute |
| REFUND_PENDING | REFUNDED | System | Refund processed |
| MERCHANT_REJECTED | REFUND_PENDING | System | Auto-refund |
| CANCELLED | REFUND_PENDING | Customer | Eligible cancel |

### 9.3 Order Model

```prisma
model Order {
  id                  String   @id @default(uuid())
  
  // Ownership
  customerId          String
  customer            CustomerProfile @relation(fields: [customerId], references: [id])
  merchantId          String
  merchant            MerchantProfile @relation(fields: [merchantId], references: [id])
  storeId             String
  store               Store @relation(fields: [storeId], references: [id])
  riderId             String?
  rider               RiderProfile? @relation(fields: [riderId], references: [id])
  
  // Status
  status              OrderStatus @default(PENDING_PAYMENT)
  paymentStatus       PaymentStatus @default(PENDING)
  
  // Financials (calculated server-side, never from client)
  subtotal            Decimal  @db.Decimal(12, 2)
  deliveryFee         Decimal  @db.Decimal(12, 2)
  serviceFee          Decimal  @db.Decimal(12, 2)
  discount            Decimal  @db.Decimal(12, 2) @default(0)
  total               Decimal  @db.Decimal(12, 2)
  
  // Delivery
  deliveryAddress     String
  deliveryLat         Float?
  deliveryLng         Float?
  deliveryInstructions String?
  
  // Payment
  paymentMethod       String   @default("MPESA")
  mpesaCode           String?
  
  // Metadata
  notes               String?
  items               Json     @default("[]")  // Snapshot at order time
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  statusHistory       OrderStatusHistory[]
  riderAssignments    RiderAssignment[]
  payments            Payment[]
  walletEntries       WalletEntry[]
  complaints          Complaint[]
  reviews             Review[]
}
```

### 9.4 Order Item (Snapshot)

```prisma
model OrderItem {
  id          String   @id @default(uuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String?
  product     Product? @relation(fields: [productId], references: [id])
  
  name        String   // Snapshot
  quantity    Int
  price       Decimal  @db.Decimal(12, 2)  // Snapshot at order time
  options     Json?    @default([])
  
  createdAt   DateTime @default(now())
}
```

### 9.5 Order Status History

```prisma
model OrderStatusHistory {
  id          String   @id @default(uuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  status      OrderStatus
  changedBy   String?  // User ID who triggered
  changedByRole Role?
  note        String?
  metadata    Json?    @default({})
  
  createdAt   DateTime @default(now())
}
```

---

## 10. PAYMENT & FINANCIAL MODEL

### 10.1 Payment Status

```prisma
enum PaymentStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}
```

### 10.2 Payment Model

```prisma
model Payment {
  id              String   @id @default(uuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id])
  
  method          String   @default("MPESA")
  status          PaymentStatus @default(PENDING)
  
  amount          Decimal  @db.Decimal(12, 2)
  currency        String   @default("KES")
  
  // Provider details
  providerRef     String?  // M-Pesa receipt number
  providerPayload Json?    @default({})
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  transactions    PaymentTransaction[]
  refunds         Refund[]
}
```

### 10.3 Payment Transaction

```prisma
model PaymentTransaction {
  id          String   @id @default(uuid())
  paymentId   String
  payment     Payment  @relation(fields: [paymentId], references: [id])
  
  type        String   // INITIATE, CONFIRM, FAIL, REFUND
  status      String
  amount      Decimal  @db.Decimal(12, 2)
  currency    String   @default("KES")
  
  providerRef String?
  response    Json?    @default({})
  
  createdAt   DateTime @default(now())
}
```

### 10.4 Refund

```prisma
model Refund {
  id              String   @id @default(uuid())
  paymentId       String
  payment         Payment  @relation(fields: [paymentId], references: [id])
  
  amount          Decimal  @db.Decimal(12, 2)
  reason          String
  status          String   @default("PENDING")  // PENDING, PROCESSED, FAILED
  
  processedBy     String?  // Admin user ID
  providerRef     String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 10.5 Wallet / Ledger

```prisma
model WalletEntry {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  orderId         String?
  order           Order?   @relation(fields: [orderId], references: [id])
  
  amount          Decimal  @db.Decimal(12, 2)
  transactionType String   // CREDIT, DEBIT
  category        String   // ORDER_PAYMENT, RIDER_PAYOUT, MERCHANT_PAYOUT, PLATFORM_COMMISSION, REFUND, etc.
  metadata        Json?    @default({})
  
  createdAt       DateTime @default(now())
}
```

### 10.6 Financial Rules

- All money calculations use `Decimal` type
- Backend calculates: subtotal, delivery fee, service fee, discount, total
- Never trust client-provided totals
- Platform fee percentage is configurable (not hardcoded)
- All financial events create `WalletEntry` records
- Merchant and rider payouts are separate ledger entries

---

## 11. RIDER DISPATCH

### 11.1 Dispatch Flow

```
Order status = READY_FOR_PICKUP
    ↓
System finds eligible riders:
  - rider.isOnline = true
  - rider.status = APPROVED
  - rider NOT currently assigned to another order
  - rider within delivery radius of store
    ↓
Create RiderAssignment (status = PENDING)
    ↓
Notify rider (push/SMS/socket)
    ↓
Rider accepts → RiderAssignment.status = ACCEPTED
Rider rejects/timeout → RiderAssignment.status = REJECTED/EXPIRED
    ↓
If rejected → try next eligible rider
If all exhausted → order remains READY_FOR_PICKUP (not cancelled)
```

### 11.2 Rider Eligibility

```javascript
async function findEligibleRiders(storeId, orderId) {
  const store = await prisma.store.findUnique({ where: { id: storeId } })
  
  const riders = await prisma.riderProfile.findMany({
    where: {
      status: RIDER_APPROVED,
      isOnline: true,
      riderAssignments: {
        none: { status: { in: ['PENDING', 'ACCEPTED'] } }
      }
    },
    include: { user: true }
  })
  
  return riders
    .map(rider => ({
      ...rider,
      distance: haversine(store.lat, store.lng, rider.currentLat, rider.currentLng)
    }))
    .filter(rider => rider.distance <= store.deliveryRadiusKm)
    .sort((a, b) => a.distance - b.distance)
}
```

---

## 12. NOTIFICATIONS

### 12.1 Notification Model

```prisma
model Notification {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type        String   // MERCHANT_APPLICATION_SUBMITTED, ORDER_CREATED, etc.
  fromId      String?
  from        User?    @relation(fields: [fromId], references: [id])
  
  title       String
  message     String
  link        String?
  read        Boolean  @default(false)
  
  metadata    Json?    @default({})
  createdAt   DateTime @default(now())
}
```

### 12.2 Notification Events

Events are emitted by backend services and consumed by notification service:

```
MERCHANT_APPLICATION_SUBMITTED
MERCHANT_APPROVED
MERCHANT_REJECTED
MERCHANT_SUSPENDED
RIDER_APPLICATION_SUBMITTED
RIDER_APPROVED
RIDER_REJECTED
RIDER_SUSPENDED
ORDER_CREATED
ORDER_ACCEPTED
ORDER_REJECTED
ORDER_PREPARING
ORDER_READY
RIDER_ASSIGNED
RIDER_PICKED_UP
ORDER_IN_TRANSIT
ORDER_DELIVERED
REFUND_CREATED
PAYMENT_FAILED
```

---

## 13. AUDIT LOGGING

### 13.1 Audit Log Model

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  
  actorId     String   // User ID who performed action
  actorRole   Role
  action      String   // APPROVE_MERCHANT, SUSPEND_RIDER, etc.
  
  targetType  String   // merchant, rider, order, store, product
  targetId    String
  
  metadata    Json?    @default({})
  ipAddress   String?
  userAgent   String?
  
  createdAt   DateTime @default(now())
}
```

### 13.2 Audited Actions

- Admin approves/rejects/suspends merchant
- Admin approves/rejects/suspends rider
- Merchant changes product price
- Merchant rejects order
- Rider accepts delivery
- Rider marks order picked up
- Customer cancels order
- Payment refunded
- Admin overrides order status

---

## 14. API ARCHITECTURE

### 14.1 Route Organization

```
/api
  /public
    GET  /stores
    GET  /stores/:id
    GET  /stores/:id/products
    GET  /stores/:id/categories
    GET  /categories
    GET  /search
    GET  /products/:id
  
  /auth
    POST /signup
    POST /signup/merchant
    POST /signup/rider
    POST /login
    POST /logout
    POST /refresh
    POST /forgot-password
    POST /reset-password
    GET  /me
  
  /customer
    GET  /profile
    PUT  /profile
    GET  /addresses
    POST /addresses
    PUT  /addresses/:id
    DELETE /addresses/:id
    GET  /cart
    POST /cart/items
    PUT  /cart/items/:id
    DELETE /cart/items/:id
    POST /orders
    GET  /orders
    GET  /orders/:id
    POST /orders/:id/cancel
    GET  /orders/:id/track
    POST /payments/initiate
    GET  /payments/status/:orderId
    POST /reviews
    GET  /reviews
  
  /merchant
    GET  /dashboard
    GET  /application
    POST /application
    GET  /stores
    POST /stores
    GET  /stores/:id
    PUT  /stores/:id
    POST /stores/:id/categories
    PUT  /categories/:id
    POST /stores/:id/products
    PUT  /products/:id
    DELETE /products/:id
    GET  /orders
    GET  /orders/:id
    POST /orders/:id/accept
    POST /orders/:id/reject
    POST /orders/:id/status
    GET  /payments
    GET  /reports
    PUT  /settings
  
  /rider
    GET  /profile
    POST /status
    GET  /available-orders
    POST /orders/:id/accept
    POST /orders/:id/reject
    POST /orders/:id/arrive
    POST /orders/:id/pickup
    POST /orders/:id/deliver
    GET  /earnings
    GET  /performance
    POST /sos
    PUT  /vehicle
  
  /admin
    GET  /dashboard
    GET  /merchants
    POST /merchants/:id/approve
    POST /merchants/:id/reject
    POST /merchants/:id/suspend
    GET  /riders
    POST /riders/:id/approve
    POST /riders/:id/reject
    POST /riders/:id/suspend
    GET  /orders
    PUT  /orders/:id/status
    GET  /customers
    GET  /financials
    GET  /complaints
    POST /complaints/:id/resolve
    POST /warnings
    POST /campaigns
    POST /promo-codes
    GET  /audit-logs
```

### 14.2 Middleware Stack

```
Request
    ↓
helmet (security headers)
    ↓
cors
    ↓
rateLimit
    ↓
bodyParser
    ↓
authMiddleware (if protected route)
    ↓
roleCheck (if role required)
    ↓
approvalCheck (if merchant/rider operation)
    ↓
ownershipCheck (if accessing specific resource)
    ↓
routeHandler
    ↓
errorMiddleware
```

### 14.3 Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

Status codes:
- 400: Validation error
- 401: Unauthenticated
- 403: Authenticated but unauthorized
- 404: Resource not found
- 409: Conflict (duplicate, invalid state transition)
- 422: Business rule violation
- 429: Rate limited
- 500: Unexpected server error

---

## 15. DATABASE MIGRATION STRATEGY

### 15.1 Current State

- SQLite database at `backend/prisma/dev.db`
- Existing data in tables
- Schema has issues (JSON roles, String prices, etc.)

### 15.2 Migration Plan

1. **Backup existing data** — export critical tables
2. **Create new Prisma schema** — with proper types, enums, relationships
3. **Generate migration** — `prisma migrate dev`
4. **Create data migration script** — transform existing data:
   - Parse JSON roles → Role[]
   - Convert String prices → Decimal
   - Map old statuses to new enums
5. **Seed development data** — admin, sample merchant, sample rider, sample customer
6. **Test migration** — verify data integrity

### 15.3 What Cannot Be Auto-Migrated

- Supabase-specific data (auth.users, etc.)
- Any data stored in Supabase Storage
- Frontend localStorage data (cart, preferences)

These require manual handling or are intentionally not migrated.

---

## 16. IMPLEMENTATION SLICES

### Slice 1: Foundation (Database + Auth)

- New Prisma schema
- Migrations
- Auth service (register, login, logout, refresh)
- Auth middleware
- Role/permission checks
- Session management

### Slice 2: Merchant (Application + Store + Products)

- Merchant application submission
- Admin approval flow
- Store CRUD
- Category CRUD
- Product CRUD
- Public store visibility
- Geolocation serviceability

### Slice 3: Customer (Browsing + Cart)

- Public store listing
- Public product browsing
- Customer registration/login
- Address management
- Backend cart
- Cart validation

### Slice 4: Orders (Checkout + State Machine)

- Order creation from cart
- Order state machine
- Order status history
- Merchant order management
- Customer order tracking

### Slice 5: Rider (Application + Dispatch + Delivery)

- Rider application submission
- Admin approval flow
- Rider availability
- Dispatch system
- Order assignment
- Pickup/delivery actions

### Slice 6: Payments

- Payment abstraction
- M-Pesa integration
- Payment webhooks
- Refund processing
- Wallet/ledger entries

### Slice 7: Operations

- Notifications
- Admin dashboard
- Audit logging
- Support tickets
- Reviews
- Social features (optional, can defer)

---

## 17. FRONTEND CONTRACT

### 17.1 What Changes

| Current | New |
|---------|-----|
| `customerApi.getStores()` requires auth | `publicApi.getStores()` no auth |
| Cart in localStorage | Cart in backend |
| Frontend calculates totals | Backend calculates totals |
| `MockDatabaseContext` band-aid | Direct API calls |
| Supabase client unused | Remove Supabase dependency |

### 17.2 What Stays

| Current | New |
|---------|-----|
| React + Vite + TypeScript | Same |
| Portal routing | Same |
| AuthContext | Updated to use new API |
| UI components | Same |
| Design system | Same |

### 17.3 API Client Structure

```typescript
// src/lib/api.ts
export const publicApi = { ... }
export const authApi = { ... }
export const customerApi = { ... }
export const merchantApi = { ... }
export const riderApi = { ... }
export const adminApi = { ... }
export const paymentApi = { ... }
```

---

## 18. SECURITY CHECKLIST

- [ ] All protected routes require authentication
- [ ] All protected routes check authorization (role + approval)
- [ ] All resource access checks ownership
- [ ] No client-provided prices are trusted
- [ ] No client-provided ownership is trusted
- [ ] No client-provided status is trusted
- [ ] Input validation on all endpoints
- [ ] Rate limiting on auth endpoints
- [ ] Rate limiting on public endpoints
- [ ] CORS properly configured
- [ ] Helmet security headers
- [ ] No secrets in responses
- [ ] No database errors exposed to clients
- [ ] SQL injection prevented (Prisma parameterized queries)
- [ ] XSS prevented (no raw HTML in responses)
- [ ] CSRF protection where applicable

---

## 19. TESTING STRATEGY

### 19.1 Unit Tests

- Auth service (register, login, token validation)
- Permission checks
- Order state machine transitions
- Price calculations
- Geolocation serviceability

### 19.2 Integration Tests

- Public store browsing (no auth)
- Customer checkout flow
- Merchant dashboard access (pending → denied)
- Merchant dashboard access (approved → allowed)
- Rider dispatch flow
- Admin approval flow
- Order state transitions
- Payment flow

### 19.3 E2E Scenarios

1. Anonymous → browse → checkout → auth required
2. Customer → register → browse → cart → checkout → order → track
3. Merchant → register → pending → denied → admin approves → allowed → create store → products visible
4. Rider → register → pending → denied → admin approves → allowed → go online → accept → pickup → deliver
5. Admin → login → approve merchant → approve rider → view orders → resolve complaint

---

## 20. DEFINITION OF DONE

The backend is complete when:

1. Anonymous users can browse stores and products
2. Geolocation determines available stores
3. Customer can register, browse, cart, checkout, order, track
4. Merchant can apply, be pending/denied, be approved/allowed, manage store
5. Rider can apply, be pending/denied, be approved/allowed, accept/deliver
6. Admin can approve/reject/suspend merchants and riders
7. Order state machine enforces valid transitions
8. Backend calculates all money
9. Backend cart validates all rules
10. All sensitive operations are authenticated, authorized, and audited
11. All resources have ownership checks
12. All errors are properly formatted
13. All tests pass
