import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { getRoleDashboardPath } from "@/lib/role-routes";

/**
 * Smart Redirector:
 * When accessed via `/dashboard` or general base routes,
 * immediately forwards user to their dedicated role-specific endpoint.
 */
export default function Dashboard() {
  const { currentRole } = useAuth();
  return <Navigate to={getRoleDashboardPath(currentRole)} replace />;
}
