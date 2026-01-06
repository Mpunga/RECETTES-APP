import { Navigate } from "react-router-dom";

export function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />; // redirige vers login si pas connecté
  }
  return children;
}
