import { createBrowserRouter } from "react-router-dom";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import OwnerLayout from "../layouts/OwnerLayout";
import AdminLayout from "../layouts/AdminLayout";
import DeveloperLayout from "../layouts/DeveloperLayout";
import AuditorLayout from "../layouts/AuditorLayout";
import SupportLayout from "../layouts/SupportLayout";

// import Overview from "../pages/superadmin/Overview";
// import Tenants from "../pages/superadmin/Tenants";
// import Incidents from "../pages/superadmin/Incidents";
// import Billing from "../pages/superadmin/Billing";
// import Security from "../pages/superadmin/Security";

// import OwnerDashboard from "../pages/owner/Dashboard";
// import OwnerUsers from "../pages/owner/Users";
// import OwnerBilling from "../pages/owner/Billing";
// import ApiKeys from "../pages/owner/ApiKeys";
// import OwnerSettings from "../pages/owner/Settings";

// import Deployments from "../pages/admin/Deployments";
// import Monitoring from "../pages/admin/Monitoring";
// import Web3 from "../pages/admin/Web3";
// import AiAgents from "../pages/admin/AiAgents";
// import FeatureFlags from "../pages/admin/FeatureFlags";
// import Secrets from "../pages/admin/Secrets";

// import ApiExplorer from "../pages/developer/ApiExplorer";
// import Logs from "../pages/developer/Logs";
// import Metrics from "../pages/developer/Metrics";
// import Web3Explorer from "../pages/developer/Web3Explorer";
// import AgentRunner from "../pages/developer/AgentRunner";

// import AuditLogs from "../pages/auditor/AuditLogs";
// import Compliance from "../pages/auditor/Compliance";

// import UserLookup from "../pages/support/UserLookup";
// import TenantLookup from "../pages/support/TenantLookup";
// import IncidentViewer from "../pages/support/IncidentViewer";

export const router = createBrowserRouter([
  {
    path: "/superadmin",
    element: <SuperAdminLayout />,
    children: [
      { path: "overview", element: <div>Overview Page</div> },
      { path: "tenants", element: <div>Tenants Page</div> },
      { path: "incidents", element: <div>Incidents Page</div> },
      { path: "billing", element: <div>Billing Page</div> },
      { path: "security", element: <div>Security Page</div> }
    ]
  },
  {
    path: "/owner",
    element: <OwnerLayout />,
    children: [
      { path: "dashboard", element: <div>Owner Dashboard</div> },
      { path: "users", element: <div>Owner Users</div> },
      { path: "billing", element: <div>Owner Billing</div> },
      { path: "apikeys", element: <div>API Keys</div> },
      { path: "settings", element: <div>Owner Settings</div> }
    ]
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { path: "deployments", element: <div>Deployments</div> },
      { path: "monitoring", element: <div>Monitoring</div> },
      { path: "web3", element: <div>Web3</div> },
      { path: "ai", element: <div>AI Agents</div> },
      { path: "flags", element: <div>Feature Flags</div> },
      { path: "secrets", element: <div>Secrets</div> }
    ]
  },
  {
    path: "/developer",
    element: <DeveloperLayout />,
    children: [
      { path: "api", element: <div>API Explorer</div> },
      { path: "logs", element: <div>Logs</div> },
      { path: "metrics", element: <div>Metrics</div> },
      { path: "web3", element: <div>Web3 Explorer</div> },
      { path: "agents", element: <div>Agent Runner</div> }
    ]
  },
  {
    path: "/auditor",
    element: <AuditorLayout />,
    children: [
      { path: "logs", element: <div>Audit Logs</div> },
      { path: "compliance", element: <div>Compliance</div> }
    ]
  },
  {
    path: "/support",
    element: <SupportLayout />,
    children: [
      { path: "users", element: <div>User Lookup</div> },
      { path: "tenants", element: <div>Tenant Lookup</div> },
      { path: "incidents", element: <div>Incident Viewer</div> }
    ]
  }
]);
