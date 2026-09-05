# Muncheez V2 — Backend

Node.js + Express + PostgreSQL + Prisma + JWT + Socket.IO

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running Migrations](#running-migrations)
6. [Seeding the Database](#seeding-the-database)
7. [Starting the Server](#starting-the-server)
8. [Testing the API](#testing-the-api)
9. [Frontend Integration](#frontend-integration)
10. [Socket.IO Features](#socketio-features)
11. [M-Pesa Integration](#mpesa-integration)
12. [Email Service](#email-service)
13. [Deployment](#deployment)
14. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) — [Download here](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) — [Download here](https://www.postgresql.org/download/)
- **npm** or **yarn** — Comes with Node.js
- **Git** — [Download here](https://git-scm.com/downloads)

### Verify Installation

```bash
node --version    # Should be v18+
npm --version     # Should be v9+
psql --version    # Should be v14+
```

---

## Installation

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install all dependencies:

```bash
npm install
```

This will install:
- `express` — Web server framework
- `prisma` — Database ORM
- `@prisma/client` — Prisma client for queries
- `bcrypt` — Password hashing
- `jsonwebtoken` — JWT token generation/verification
- `socket.io` — Real-time WebSocket communication
- `cors` — Cross-origin resource sharing
- `dotenv` — Environment variable management
- `express-validator` — Input validation
- `multer` — File upload handling
- `nodemailer` — Email sending
- `axios` — HTTP client for M-Pesa API calls

---

## Environment Configuration

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Open `.env` in your text editor and fill in the values:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/muncheez_db?schema=public"

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here
REFRESH_TOKEN_EXPIRES_IN=30d

# CORS (Frontend URL)
CORS_ORIGIN=http://localhost:5173

# M-Pesa Daraja API
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=174379
MPESA_ENV=sandbox

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=no-reply@muncheez.co.ke

# Supabase (for storage only, not auth)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Socket.IO
SOCKET_CORS_ORIGIN=http://localhost:5173
```

### Important Notes

- **DATABASE_URL**: Replace `YOUR_PASSWORD` with your PostgreSQL password. The database `muncheez_db` will be created automatically by Prisma.
- **JWT_SECRET**: Use a strong, random string. You can generate one with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- **MPESA_ENV**: Use `sandbox` for testing, `production` for live.
- **EMAIL_PASS**: For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password.

---

## Database Setup

### Option A: Using Prisma Migrate (Recommended)

Prisma will create the database and all tables automatically.

### Option B: Manual Database Creation

If you prefer to create the database manually:

```bash
# Log into PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE muncheez_db;

# Create user (optional)
CREATE USER muncheez_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE muncheez_db TO muncheez_user;
```

---

## Running Migrations

1. Generate Prisma client:

```bash
npx prisma generate
```

2. Run migrations to create all tables:

```bash
npx prisma migrate dev --name init
```

This will:
- Create the `muncheez_db` database (if it doesn't exist)
- Create all 20+ tables defined in `schema.prisma`
- Apply indexes and constraints
- Generate the Prisma client

3. Verify the migration:

```bash
npx prisma migrate status
```

You should see all migrations as "Applied".

---

## Seeding the Database

Populate the database with sample data for testing:

```bash
npm run prisma:seed
```

This will create:

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| admin@muncheez.co.ke | Admin@123 | admin | Admin portal access |
| merchant@muncheez.co.ke | Merchant@123 | merchant | Merchant portal access |
| courier@muncheez.co.ke | Courier@123 | courier | Courier portal access |
| customer@muncheez.co.ke | Customer@123 | customer | Customer portal access |

**Important**: Change these passwords in production!

---

## Starting the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

The server will start at `http://localhost:5000`.

### Production Mode

```bash
npm run build
npm start
```

### Verify Server is Running

Open your browser or use curl:

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Testing the API

### Using curl

**1. Sign up a new customer:**

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "name": "Test User",
    "phone": "+254700000000",
    "role": "customer"
  }'
```

**2. Login:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

Save the `accessToken` from the response.

**3. Get current user (authenticated):**

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**4. Browse stores:**

```bash
curl http://localhost:5000/api/customer/stores \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Import the collection from `backend/postman_collection.json` (if available)
2. Or create a new request manually
3. Set the `Authorization` header: `Bearer YOUR_ACCESS_TOKEN`

---

## Frontend Integration

### Step 1: Update API Base URL

In your frontend, update the API base URL to point to the backend:

```typescript
// src/lib/api.ts
export const API_BASE = 'http://localhost:5000/api';
```

### Step 2: Replace Supabase Auth Calls

**Before (Supabase):**
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
});
```

**After (Custom Backend):**
```typescript
const response = await fetch(`${API_BASE}/auth/signup`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, name, phone, role }),
});
const data = await response.json();
```

### Step 3: Store JWT Token

```typescript
// Store token in localStorage
localStorage.setItem('accessToken', data.accessToken);

// Add to request headers
const token = localStorage.getItem('accessToken');
headers: {
  'Authorization': `Bearer ${token}`,
}
```

### Step 4: Update AuthContext

Replace Supabase auth methods with custom API calls:

```typescript
// src/context/AuthContext.tsx
const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (data.accessToken) {
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
  }
};
```

### Step 5: Update MockDatabaseContext

Replace all Supabase queries with fetch calls to the backend API.

---

## Socket.IO Features

The backend uses Socket.IO for real-time features.

### Connecting from Frontend

```typescript
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
```

### Available Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `order:update` | Server → Client | Order status changed |
| `order:new` | Server → Client | New order created |
| `rider:location` | Server → Client | Rider location update |
| `notification:new` | Server → Client | New notification |
| `sos:alert` | Server → Client | SOS emergency alert |

---

## M-Pesa Integration

### Step 1: Get Daraja API Credentials

1. Go to [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create an account
3. Create a new app
4. Get your `Consumer Key`, `Consumer Secret`, and `Passkey`

### Step 2: Configure Environment

```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=174379
MPESA_ENV=sandbox
```

### Step 3: Test Payment Flow

1. Create an order
2. Call `POST /api/payments/initiate` with order ID and phone number
3. Customer receives STK Push on their phone
4. Customer enters PIN
5. Safaricom calls `POST /api/payments/callback`
6. Order status is updated to "paid"

### Step 4: Callback URL

Set your callback URL in the Safaricom portal:
```
https://your-domain.com/api/payments/callback
```

For local testing, use ngrok:
```bash
ngrok http 5000
```

---

## Email Service

### Step 1: Configure Email

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=no-reply@muncheez.co.ke
```

### Step 2: For Gmail

1. Enable 2-Factor Authentication
2. Generate an [App Password](https://support.google.com/accounts/answer/185833)
3. Use the App Password in `EMAIL_PASS`

### Step 3: Email Templates

Email templates are in `emailtemp/`:
- `welcome.html` — Welcome email
- `verification_success.html` — Email verified
- `reset_password.html` — Password reset
- `magic_link.html` — Magic link login
- `invite_user.html` — Invite to platform
- `change_email.html` — Email change confirmation
- `birthday_sharleen.html` — Birthday promotion

### Step 4: Sending Emails

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

await transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to: user.email,
  subject: 'Welcome to Muncheez!',
  html: welcomeTemplate,
});
```

---

## Deployment

### Option 1: Vercel (Recommended for Quick Deploy)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard.

### Option 2: Railway

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login and deploy:
```bash
railway login
railway init
railway up
```

### Option 3: DigitalOcean / AWS / GCP

1. Set up a VPS or cloud instance
2. Install Node.js and PostgreSQL
3. Clone the repository
4. Run `npm install`
5. Set up environment variables
6. Run migrations and seed
7. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start src/server.js --name muncheez-backend
pm2 save
pm2 startup
```

### Option 4: Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t muncheez-backend .
docker run -p 5000:5000 --env-file .env muncheez-backend
```

---

## Troubleshooting

### Database Connection Error

```
Error: P1001: Can't reach database server at `localhost:5432`
```

**Solution:**
- Ensure PostgreSQL is running: `pg_ctl status` (Linux/Mac) or check Services (Windows)
- Check `DATABASE_URL` in `.env`
- Verify PostgreSQL is listening on port 5432

### Migration Fails

```
Error: P3005: The database schema is not empty
```

**Solution:**
```bash
# Drop the database and recreate
npx prisma migrate reset
```

### JWT Token Expired

```
Error: jwt expired
```

**Solution:**
- Use the refresh token endpoint: `POST /api/auth/refresh`
- Or ask the user to login again

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 PID  # Mac/Linux
taskkill /PID PID /F  # Windows
```

### Prisma Client Not Generated

```
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
npx prisma generate
```

### Socket.IO Connection Failed

```
Error: xhr poll error
```

**Solution:**
- Check `SOCKET_CORS_ORIGIN` in `.env`
- Ensure frontend is connecting to correct port
- Check firewall settings

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema (20+ models)
│   └── seed.js            # Database seeder
├── src/
│   ├── server.js          # Express server + Socket.IO
│   ├── middleware/
│   │   ├── auth.js        # JWT authentication + role checks
│   │   └── error.js       # Error handling
│   └── routes/
│       ├── auth.js        # Authentication (10 endpoints)
│       ├── customer.js    # Customer (8 endpoints)
│       ├── merchant.js    # Merchant (13 endpoints)
│       ├── courier.js     # Courier (8 endpoints)
│       ├── admin.js       # Admin (16 endpoints)
│       ├── social.js      # Social (11 endpoints)
│       └── payment.js     # M-Pesa (3 endpoints)
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Support

For issues or questions, refer to:
- [`BACKEND_SPEC.md`](../BACKEND_SPEC.md) — Complete backend specification
- [`history.md`](../history.md) — Project history and changes
