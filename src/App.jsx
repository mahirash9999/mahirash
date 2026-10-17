import React, { useState, useEffect, lazy, Suspense } from "react";
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Home/Footer";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import AuthProvider from "./components/AuthProvider";
import CustomerAuthProvider from "./components/CustomerAuthProvider";
import { StoreProvider } from "./components/StoreProvider";
import ScrollToTop from "./components/ScrollToTop";
import Preloader from "./pages/Preloader";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import GeminiChatbot from "./components/GeminiChatbot";

// Lazy loaded page components
const Home = lazy(() => import("./components/Homepage/Home"));
const Admin = lazy(() => import("./pages/Admin/Admin"));
const AdminSignup = lazy(() => import("./pages/AdminSignup"));
const Login = lazy(() => import("./components/Login"));
const Signup = lazy(() => import("./components/Signup"));
const ForgotPassword = lazy(() => import("./components/ForgotPassword"));
const Cart = lazy(() => import("./layouts/Cart"));
const Checkout = lazy(() => import("./layouts/Checkout"));
const Wishlist = lazy(() => import("./components/Wishlist"));
const ProductDetail = lazy(() => import("./layouts/ProductDetail"));
const QuickView = lazy(() => import("./components/QuickView"));
const Account = lazy(() => import("./pages/Account"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Shop = lazy(() => import("./pages/Shop"));
const Orders = lazy(() => import("./pages/Orders"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const SitemapViewer = lazy(() => import("./pages/SitemapViewer"));

const RouteLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-[#f5f5f5]">
    <div className="w-8 h-8 border border-zinc-300 border-t-black animate-spin" />
  </div>
);

const AppRoutes = () => {
  const location = useLocation();
  const hideChrome =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/super") ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/signup") ||
    location.pathname.startsWith("/forgot-password");

  return (
    <>
      <ScrollToTop />
      {!hideChrome && <Header />}
      <div className={!hideChrome ? "" : ""}>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin-signup" element={<AdminSignup />} />
            <Route path="/admin/signup" element={<AdminSignup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/account" element={<Account />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/shop" element={<Shop />} />

            <Route path="/orders" element={<Orders />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/terms-and-conditions" element={<TermsConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/return-policy" element={<Navigate to="/terms" replace />} />
            <Route path="/return" element={<Navigate to="/terms" replace />} />
            <Route path="/refund-policy" element={<Navigate to="/terms" replace />} />

            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/product/:id/quickview" element={<QuickView />} />
            <Route path="/sitemap.xml" element={<SitemapViewer />} />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
      {!hideChrome && <Footer />}
      {!hideChrome && <FloatingWhatsApp />}
      {!hideChrome && <GeminiChatbot />}
    </>
  );
};

import PromoPopup from "./components/PromoPopup";
import AddToCartModal from "./components/AddToCartModal";

function App() {
  const [isPreloaderDone, setIsPreloaderDone] = useState(false);

  return (
    <>
      {!isPreloaderDone && <Preloader onComplete={() => setIsPreloaderDone(true)} />}
      <AuthProvider>
        <CustomerAuthProvider>
          <StoreProvider>
            <BrowserRouter>
              <AppRoutes />
              <PromoPopup />
              <AddToCartModal />
            </BrowserRouter>
          </StoreProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </>
  );
}

export default App;
