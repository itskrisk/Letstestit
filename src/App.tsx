import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Layouts
import CustomerLayout from "./layouts/CustomerLayout";
import MerchantLayout from "./layouts/MerchantLayout";
import CourierLayout from "./layouts/CourierLayout";
import AdminLayout from "./layouts/AdminLayout";

// Navigation
import Navbar from "./components/layout/Navbar";

// Protected Route
import ProtectedRoute from "./components/ProtectedRoute";

// Customer Pages
import Home from "./pages/customer/Home";
import StoreListing from "./pages/customer/StoreListing";
import StoreFront from "./pages/customer/StoreFront";
import CheckoutView from "./pages/customer/CheckoutView";
import OrderStatus from "./pages/customer/OrderStatus";
import CustomerLogin from "./pages/customer/Login";
import CustomerSignup from "./pages/customer/Signup";

// Merchant Pages
import MerchantDashboard from "./pages/merchant/Dashboard";
import PartnerLogin from "./pages/merchant/PartnerLogin";
import PartnerSignup from "./pages/merchant/PartnerSignup";
import Onboarding from "./pages/merchant/Onboarding";

// Courier/Rider Pages
import CourierDashboard from "./pages/courier/Dashboard";
import CourierLogin from "./pages/courier/Login";
import CourierSignup from "./pages/courier/Signup";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLogin from "./pages/admin/Login";
import AdminMerchants from "./pages/admin/Merchants";
import AdminRiders from "./pages/admin/Riders";
import AdminOrders from "./pages/admin/Orders";
import AdminCustomers from "./pages/admin/Customers";
import AdminFinancials from "./pages/admin/Financials";
import AdminInventory from "./pages/admin/Inventory";
import AdminMarketing from "./pages/admin/Marketing";
import AdminApprovals from "./pages/admin/Approvals";
import AdminSettings from "./pages/admin/Settings";
import AdminSupport from "./pages/admin/Support";
import AdminWaitlist from "./pages/admin/Waitlist";

// Auth Pages
import AuthCallback from "./pages/auth/AuthCallback";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";

// Common Pages
import ComingSoon from "./pages/common/ComingSoon";
import OurStory from "./pages/common/OurStory";
import LegalPage from "./pages/common/LegalPage";
import OurTeam from "./pages/common/OurTeam";
import CookieBanner from "./components/ui/shared/CookieBanner";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="font-sans antialiased text-white bg-[#4A90E2]">
            <Routes>
              {/* ============================================ */}
              {/* CUSTOMER APP (Main Muncheez Frontend)        */}
              {/* ============================================ */}
              <Route element={<CustomerLayout />}>
                <Route path="/" element={
                  <>
                    <Navbar />
                    <Home />
                  </>
                } />
                <Route path="/stores" element={<StoreListing />} />
                <Route path="/c/stores" element={<StoreListing />} />
                <Route path="/store/:id" element={<StoreFront />} />
                <Route path="/checkout" element={<CheckoutView />} />
                <Route path="/order/:id" element={<OrderStatus />} />
                <Route path="/social" element={
                  <Navigate to="/coming-soon" state={{ name: "The Feed" }} replace />
                } />
                <Route path="/login" element={<CustomerLogin />} />
                <Route path="/signup" element={<CustomerSignup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
              </Route>

              {/* ============================================ */}
              {/* MERCHANT PARTNER PORTAL                      */}
              {/* ============================================ */}
              <Route path="/partner/login" element={<PartnerLogin />} />
              <Route path="/partner/signup" element={<PartnerSignup />} />
              <Route
                path="/partner"
                element={
                  <ProtectedRoute requiredRole="merchant">
                    <MerchantLayout>
                      <MerchantDashboard />
                    </MerchantLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/partner/dashboard"
                element={
                  <ProtectedRoute requiredRole="merchant">
                    <MerchantLayout>
                      <MerchantDashboard />
                    </MerchantLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/partner/onboarding"
                element={
                  <ProtectedRoute requiredRole="merchant">
                    <MerchantLayout>
                      <Onboarding />
                    </MerchantLayout>
                  </ProtectedRoute>
                }
              />

              {/* ============================================ */}
              {/* COURIER/RIDER TERMINAL                       */}
              {/* ============================================ */}
              <Route path="/courier/login" element={<CourierLogin />} />
              <Route path="/courier/signup" element={<CourierSignup />} />
              <Route
                path="/courier"
                element={
                  <ProtectedRoute requiredRole="courier">
                    <CourierLayout>
                      <CourierDashboard />
                    </CourierLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courier/dashboard"
                element={
                  <ProtectedRoute requiredRole="courier">
                    <CourierLayout>
                      <CourierDashboard />
                    </CourierLayout>
                  </ProtectedRoute>
                }
              />

              {/* ============================================ */}
              {/* ADMIN CONSOLE                                 */}
              {/* ============================================ */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<AdminLayout />}>
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/merchants"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminMerchants />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/riders"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminRiders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/customers"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminCustomers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/financials"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminFinancials />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/inventory"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminInventory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/marketing"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminMarketing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/approvals"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminApprovals />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/waitlist"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminWaitlist />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/support"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminSupport />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* ============================================ */}
              {/* COMMON PAGES                                  */}
              {/* ============================================ */}
              <Route path="/coming-soon" element={<ComingSoon />} />
              <Route path="/our-story" element={<OurStory />} />
              <Route path="/our-team" element={<OurTeam />} />
              <Route path="/legal/:type" element={<LegalPage />} />

              {/* ============================================ */}
              {/* 404 - CATCH ALL                               */}
              {/* ============================================ */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <CookieBanner />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
