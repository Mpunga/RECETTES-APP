import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Footer from "./components/Footer";

// Eager load App for instant homepage
import App from "./App";

// Lazy load other components
const Login = lazy(() => import("./components/Login"));
const Signup = lazy(() => import("./components/Signup"));
const Profile = lazy(() => import("./components/Profile"));
const PublicProfile = lazy(() => import("./components/PublicProfile"));
const Recette = lazy(() => import("./components/Recette"));
const ShoppingList = lazy(() => import("./components/ShoppingList"));
const Admin = lazy(() => import("./components/Admin"));
const SetupAdmin = lazy(() => import("./components/SetupAdmin"));
const About = lazy(() => import("./components/About"));

// Better loading fallback
const LoadingFallback = () => (
  <div style={{
    textAlign: 'center',
    padding: '60px 20px',
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '16px'
  }}>
    <div style={{
      width: '50px',
      height: '50px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #ff4b5c',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function Root() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:uid" element={<PublicProfile />} /> 
          <Route path="/recette/:nom" element={<Recette />} />
          <Route path="/courses" element={<ShoppingList />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/setup-admin" element={<SetupAdmin />} />
          <Route path="/about" element={<About />} />
        </Routes>
        <Footer />
      </Suspense>
    </Router>
  );
}

export default Root;
