/**
 * SIPANDU - Dashboard Monitoring (PKK + Kades)
 * Legacy re-export pointing to dedicated dashboard pages
 */
import React from "react";
import PKKDashboardPage from "@/pages/dashboards/PKKDashboardPage";
import KadesDashboardPage from "@/pages/dashboards/KadesDashboardPage";

export function MonitoringPKK() {
  return <PKKDashboardPage />;
}

export function MonitoringKades() {
  return <KadesDashboardPage />;
}
