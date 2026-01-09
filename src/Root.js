import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Footer from "./components/Footer";
import LoadingSpinner from "./components/LoadingSpinner";

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
const ChatList = lazy(() => import("./components/ChatList"));

function Root() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:uid" element={<PublicProfile />} /> 
          <Route path="/recette/:nom" element={<Recette />} />
          <Route path="/courses" element={<ShoppingList />} />
          <Route path="/messages" element={<ChatList />} />
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
