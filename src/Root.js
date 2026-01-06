import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const App = lazy(() => import("./App"));
const Login = lazy(() => import("./components/Login"));
const Signup = lazy(() => import("./components/Signup"));
const Profile = lazy(() => import("./components/Profile"));
const PublicProfile = lazy(() => import("./components/PublicProfile"));
const Recette = lazy(() => import("./components/Recette"));

function Root() {
  return (
    <Router>
      <Suspense fallback={<div style={{textAlign:'center',padding:40}}>Chargement…</div>}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:uid" element={<PublicProfile />} /> 
          <Route path="/recette/:nom" element={<Recette />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default Root;
