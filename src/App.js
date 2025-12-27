import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import { AuthProvider } from "./auth/AuthContext";
import RoleRoute, { GuestOnlyRoute } from "./auth/RoleRoute";
import LoadingModal from "./components/LoadingModal";
import ErrorBoundary from "./components/ErrorBoundary";
import TermsConsentModal, { useTermsConsent } from "./components/TermsConsentModal";
import "./index.css";

// Lazy load all pages for code splitting - reduces initial bundle size by ~70%
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const BarkadaVote = lazy(() => import("./pages/Barkadavote"));
const Explorer = lazy(() => import("./pages/Explorer"));
const Login = lazy(() => import("./pages/Login"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ChatBot = lazy(() => import("./pages/ChatBot"));
const RestaurantLocator = lazy(() => import("./pages/RestaurantLocator"));
const UploadRecipe = lazy(() => import("./pages/UploadRecipe"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const CommunityRecipes = lazy(() => import("./pages/Recipe"));
const Calendar = lazy(() => import("./pages/Calendar"));
const VerifyOtp = lazy(() => import("./pages/VerifyOtp"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

// Inner component to handle consent modal (needs to be inside BrowserRouter)
function AppContent() {
  const location = useLocation();
  const { hasConsent, grantConsent } = useTermsConsent();
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Check if we're on a legal page (don't show consent modal on terms/privacy pages)
  const isLegalPage = location.pathname === "/terms" || location.pathname === "/privacy";

  useEffect(() => {
    // Show consent modal if user hasn't accepted and not on legal pages
    if (!hasConsent && !isLegalPage) {
      setShowConsentModal(true);
    } else {
      setShowConsentModal(false);
    }
  }, [hasConsent, isLegalPage]);

  const handleAcceptConsent = () => {
    grantConsent();
    setShowConsentModal(false);
  };

  return (
    <>
      {/* Terms Consent Modal - Shows on first visit */}
      <TermsConsentModal
        isOpen={showConsentModal}
        onAccept={handleAcceptConsent}
        showCloseButton={false}
      />

      <Suspense fallback={<LoadingModal message="Loading..." />}>
        <Routes>
          {/* ✅ All routes WITH Sidebar via MainLayout */}
          <Route element={<MainLayout />}>
            {/* 🌐 PUBLIC ROUTES - No login required */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/chatbot" element={<ChatBot />} />
            <Route path="/recipes" element={<CommunityRecipes />} />
            <Route path="/barkada-vote" element={<BarkadaVote />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/restaurants" element={<RestaurantLocator />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />

            {/* 🔒 PROTECTED ROUTES - Login required */}
            <Route
              path="/profile"
              element={
                <RoleRoute allow={["user", "admin"]}>
                  <Profile />
                </RoleRoute>
              }
            />

            <Route
              path="/calendar"
              element={
                <RoleRoute allow={["user", "admin"]}>
                  <Calendar />
                </RoleRoute>
              }
            />

            <Route
              path="/recipes/upload"
              element={
                <RoleRoute allow={["user", "admin"]}>
                  <UploadRecipe />
                </RoleRoute>
              }
            />

            {/* 🔐 ADMIN ONLY */}
            <Route
              path="/admin"
              element={
                <RoleRoute allow={["admin"]}>
                  <AdminPage />
                </RoleRoute>
              }
            />

            {/* 🚪 LOGIN & PASSWORD RESET */}
            <Route
              path="/login"
              element={
                <GuestOnlyRoute>
                  <Login />
                </GuestOnlyRoute>
              }
            />

            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Legal Pages - Outside MainLayout (no sidebar) */}
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Catch-all route */}
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
