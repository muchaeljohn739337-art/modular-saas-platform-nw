import { createBrowserRouter } from "react-router-dom";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import OwnerLayout from "../layouts/OwnerLayout";
import AdminLayout from "../layouts/AdminLayout";
import DeveloperLayout from "../layouts/DeveloperLayout";
import AuditorLayout from "../layouts/AuditorLayout";
import SupportLayout from "../layouts/SupportLayout";

import Overview from "../pages/superadmin/Overview";
import Tenants from "../pages/superadmin/Tenants";
import Incidents from "../pages/superadmin/Incidents";
import Billing from "../pages/superadmin/Billing";
import Security from "../pages/superadmin/Security";

import OwnerDashboard from "../pages/owner/Dashboard";
import OwnerUsers from "../pages/owner/Users";
import OwnerBilling from "../pages/owner/Billing";
import ApiKeys from "../pages/owner/ApiKeys";
import OwnerSettings from "../pages/owner/Settings";

import Deployments from "../pages/admin/Deployments";
import Monitoring from "../pages/admin/Monitoring";
import Web3 from "../pages/admin/Web3";
import AiAgents from "../pages/admin/AiAgents";
import FeatureFlags from "../pages/admin/FeatureFlags";
import Secrets from "../pages/admin/Secrets";

import ApiExplorer from "../pages/developer/ApiExplorer";
import Logs from "../pages/developer/Logs";
import Metrics from "../pages/developer/Metrics";
import Web3Explorer from "../pages/developer/Web3Explorer";
import AgentRunner from "../pages/developer/AgentRunner";

import AuditLogs from "../pages/auditor/AuditLogs";
import Compliance from "../pages/auditor/Compliance";

import UserLookup from "../pages/support/UserLookup";
import TenantLookup from "../pages/support/TenantLookup";
import IncidentViewer from "../pages/support/IncidentViewer";

export const router = createBrowserRouter([
  {
    path: "/superadmin",
    element: <SuperAdminLayout />,
    children: [
      { path: "overview", element: <Overview /> },
      { path: "tenants", element: <Tenants /> },
      { path: "incidents", element: <Incidents /> },
      { path: "billing", element: <Billing /> },
      { path: "security", element: <Security /> }
    ]
  },
  {
    path: "/owner",
    element: <OwnerLayout />,
    children: [
      { path: "dashboard", element: <OwnerDashboard /> },
      { path: "users", element: <OwnerUsers /> },
      { path: "billing", element: <OwnerBilling /> },
      { path: "apikeys", element: <ApiKeys /> },
      { path: "settings", element: <OwnerSettings /> }
    ]
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { path: "deployments", element: <Deployments /> },
      { path: "monitoring", element: <Monitoring /> },
      { path: "web3", element: <Web3 /> },
      { path: "ai", element: <AiAgents /> },
      { path: "flags", element: <FeatureFlags /> },
      { path: "secrets", element: <Secrets /> }
    ]
  },
  {
    path: "/developer",
    element: <DeveloperLayout />,
    children: [
      { path: "api", element: <ApiExplorer /> },
      { path: "logs", element: <Logs /> },
      { path: "metrics", element: <Metrics /> },
      { path: "web3", element: <Web3Explorer /> },
      { path: "agents", element: <AgentRunner /> }
    ]
  },
  {
    path: "/auditor",
    element: <AuditorLayout />,
    children: [
      { path: "logs", element: <AuditLogs /> },
      { path: "compliance", element: <Compliance /> }
    ]
  },
  {
    path: "/support",
    element: <SupportLayout />,
    children: [
      { path: "users", element: <UserLookup /> },
      { path: "tenants", element: <TenantLookup /> },
      { path: "incidents", element: <IncidentViewer /> }
    ]
  }
]);
