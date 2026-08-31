import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { MockDatabaseProvider } from "./context/MockDatabaseContext";
import ProtectedRoute from "./components/ProtectedRoute";
import WelcomeScreen from "./components/layout/WelcomeScreen";

// Layout Silos (only for dashboards — NOT for login/signup pages)
import CustomerLayout from "./layouts/CustomerLayout";
import MerchantLayout from "./layouts/MerchantLayout";
import CourierLayout from "./layouts/CourierLayout";
import AdminLayout from "./layouts/AdminLayout";

// Shared
import Navbar from "./components/layout/Navbar";
import ActiveOrderFloat from "./components/ui/shared/ActiveOrderFloat";
import PortalSwitcher from "./components/ui/shared/PortalSwitcher";

// Common
import LegalPage from "./pages/common/LegalPage";
import ComingSoon from "./pages/common/ComingSoon";
import OurStory from "./pages/common/OurStory";
import Rsvp from "./pages/common/Rsvp";

// Auth (shared utility — no silo guard needed)
import VerifyEmail from "./pages/auth/VerifyEmail";
import AuthCallback from "./pages/auth/AuthCallback";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Customer App
import Home from "./pages/customer/Home";
import Login from "./pages/customer/Login";
import Signup from "./pages/customer/Signup";
import StoreListing from "./pages/customer/StoreListing";
import StoreFront from "./pages/customer/StoreFront";
import CheckoutView from "./pages/customer/CheckoutView";
import OrderStatus from "./pages/customer/OrderStatus";

// Merchant (Partner) App
import PartnerLogin from "./pages/merchant/PartnerLogin";
import PartnerSignup from "./pages/merchant/PartnerSignup";
import MerchantDashboard from "./pages/merchant/Dashboard";
import MerchantOnboarding from "./pages/merchant/Onboarding";

// Courier App
import CourierLogin from "./pages/courier/Login";
import CourierSignup from "./pages/courier/Signup";
import RiderDashboard from "./pages/courier/Dashboard";

// Admin App
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import Orders from "./pages/admin/Orders";
import Merchants from "./pages/admin/Merchants";
import Riders from "./pages/admin/Riders";
import Customers from "./pages/admin/Customers";
import Inventory from "./pages/admin/Inventory";
import Financials from "./pages/admin/Financials";
import Marketing from "./pages/admin/Marketing";
import Support from "./pages/admin/Support";
import Settings from "./pages/admin/Settings";
import Approvals from "./pages/admin/Approvals";

function AppContent() {
  const location = useLocation();
  const showNavbar = location.pathname === "/" || location.pathname === "/our-story";
  const showCartFloat =
    location.pathname.startsWith("/c/store/") || location.pathname === "/c/stores";

  return (
    <>
      {showNavbar && <Navbar />}
      {showCartFloat && <ActiveOrderFloat />}

      <Routes>
        {/* ── SHARED UTILITY (no silo — fully public) ─────────────────── */}
        <Route path="/rsvp" element={<Rsvp />} />
        <Route path="/legal/:slug" element={<LegalPage />} />
        <Route path="/social" element={<ComingSoon />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/our-story" element={<OurStory />} />
        <Route path="/auth/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />

        {/* ── CUSTOMER APP ─────────────────────────────────────────────── */}
        {/* Public customer pages — inside CustomerLayout so Navbar stays customer-aware */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/c/stores" element={<StoreListing />} />
          <Route path="/c/store/:id" element={<StoreFront />} />
          <Route path="/checkout" element={<CheckoutView />} />
          <Route path="/order/:orderId" element={<OrderStatus />} />
        </Route>

        {/* ── MERCHANT PORTAL ──────────────────────────────────────────── */}
        {/* Login + Signup: PUBLIC — no silo guard, anyone can visit */}
        <Route path="/partner/login" element={<PartnerLogin />} />
        <Route path="/partner/signup" element={<PartnerSignup />} />
        <Route path="/partner/onboarding" element={<MerchantOnboarding />} />
        {/* Dashboard: PROTECTED — silo enforces merchant-only access */}
        <Route
          path="/partner/dashboard"
          element={
            <MerchantLayout>
              <ProtectedRoute requiredRole="merchant">
                <MerchantDashboard />
              </ProtectedRoute>
            </MerchantLayout>
          }
        />

        {/* ── COURIER / FLEETOS TERMINAL ───────────────────────────────── */}
        {/* Login + Signup: PUBLIC — no silo guard */}
        <Route path="/courier/login" element={<CourierLogin />} />
        <Route path="/courier/signup" element={<CourierSignup />} />
        {/* Dashboard: PROTECTED — silo enforces courier-only access */}
        <Route
          path="/courier/dashboard"
          element={
            <CourierLayout>
              <ProtectedRoute requiredRole="courier">
                <RiderDashboard />
              </ProtectedRoute>
            </CourierLayout>
          }
        />

        {/* ── ADMIN CONSOLE ────────────────────────────────────────────── */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="orders" element={<Orders />} />
          <Route path="merchants" element={<Merchants />} />
          <Route path="riders" element={<Riders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="products" element={<Inventory />} />
          <Route path="financials" element={<Financials />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="support" element={<Support />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  const [showWelcome, setShowWelcome] = useState(() => {
    return !sessionStorage.getItem("welcomeShown");
  });

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    sessionStorage.setItem("welcomeShown", "true");
  };

  return (
    <Router>
      <div className="font-sans antialiased text-gray-900 bg-white">
        {showWelcome && <WelcomeScreen onComplete={handleWelcomeComplete} />}
        <AppContent />
        <PortalSwitcher />
      </div>
    </Router>
  );
}

export default App;
