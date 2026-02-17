# Sprint 10: Role-Based Consoles (Full UI)

## Issue 48: Implement Super Admin console

**Labels:** `sprint-10`, `frontend`, `ui`, `super-admin`, `priority-high`

**Description:**  
Platform-wide management UI for Super Admin role with complete system oversight.

**Tasks:**
- [ ] Create tenant management interface
- [ ] Add global incident monitoring dashboard
- [ ] Implement global billing overview
- [ ] Create global security audit interface
- [ ] Add platform metrics and analytics

**Acceptance criteria:**
- [ ] Super Admin sees platform-wide data
- [ ] Can manage all tenants from single interface
- [ ] Global incidents visible with drill-down capability
- [ ] Platform health metrics in real-time

**Technical implementation:**
```typescript
// components/SuperAdminConsole.tsx
interface SuperAdminConsoleProps {
  userId: string;
}

const SuperAdminConsole: React.FC<SuperAdminConsoleProps> = ({ userId }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics>();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  
  return (
    <div className="super-admin-console">
      <TenantManagement tenants={tenants} />
      <GlobalIncidents incidents={incidents} />
      <PlatformMetrics metrics={globalMetrics} />
      <GlobalSecurityAudit />
    </div>
  );
};

// components/TenantManagement.tsx
const TenantManagement: React.FC<{ tenants: Tenant[] }> = ({ tenants }) => {
  const handleTenantAction = async (tenantId: string, action: TenantAction) => {
    // Tenant management implementation
  };
  
  return (
    <div className="tenant-management">
      <h2>Tenant Management</h2>
      <TenantTable tenants={tenants} onAction={handleTenantAction} />
      <TenantCreationForm />
    </div>
  );
};
```

**Files to modify:**
- `frontend/components/SuperAdminConsole.tsx` (new)
- `frontend/components/TenantManagement.tsx` (new)
- `frontend/components/GlobalIncidents.tsx` (new)
- `frontend/components/PlatformMetrics.tsx` (new)
- `frontend/app/super-admin/dashboard/page.tsx` (new)
- `frontend/lib/api/superAdmin.ts` (new API client)

---

## Issue 49: Implement Owner console

**Labels:** `sprint-10`, `frontend`, `ui`, `owner`, `priority-high`

**Description:**  
Tenant business control UI for Owner role with complete tenant management.

**Tasks:**
- [ ] Create billing management interface
- [ ] Add user and role management
- [ ] Implement approval workflows
- [ ] Create API key management
- [ ] Add tenant settings and configuration

**Acceptance criteria:**
- [ ] Owner sees full tenant management
- [ ] Can manage billing and subscriptions
- [ ] Can approve/deny user requests
- [ ] Can generate and revoke API keys

**Technical implementation:**
```typescript
// components/OwnerConsole.tsx
interface OwnerConsoleProps {
  tenantId: string;
  userId: string;
}

const OwnerConsole: React.FC<OwnerConsoleProps> = ({ tenantId, userId }) => {
  const [billing, setBilling] = useState<BillingInfo>();
  const [users, setUsers] = useState<User[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  
  return (
    <div className="owner-console">
      <BillingManagement billing={billing} />
      <UserManagement users={users} />
      <ApprovalWorkflows pending={pendingApprovals} />
      <APIKeyManagement />
      <TenantSettings />
    </div>
  );
};

// components/BillingManagement.tsx
const BillingManagement: React.FC<{ billing: BillingInfo }> = ({ billing }) => {
  return (
    <div className="billing-management">
      <h2>Billing Overview</h2>
      <BillingSummary billing={billing} />
      <InvoiceHistory />
      <PaymentMethods />
      <SubscriptionManagement />
    </div>
  );
};
```

**Files to modify:**
- `frontend/components/OwnerConsole.tsx` (new)
- `frontend/components/BillingManagement.tsx` (new)
- `frontend/components/UserManagement.tsx` (new)
- `frontend/components/ApprovalWorkflows.tsx` (new)
- `frontend/components/APIKeyManagement.tsx` (new)
- `frontend/app/owner/dashboard/page.tsx` (new)
- `frontend/lib/api/owner.ts` (new API client)

---

## Issue 50: Implement Admin console

**Labels:** `sprint-10`, `frontend`, `ui`, `admin`, `priority-high`

**Description:**  
Operational control UI for Admin role with deployment and monitoring tools.

**Tasks:**
- [ ] Create deployment management interface
- [ ] Add monitoring and alerting dashboard
- [ ] Implement Web3 management tools
- [ ] Create AI agent management interface
- [ ] Add feature flags management
- [ ] Create secrets management interface

**Acceptance criteria:**
- [ ] Admin sees operational tools
- [ ] Can trigger and monitor deployments
- [ ] Can manage Web3 configurations
- [ ] Can oversee AI agent activity

**Technical implementation:**
```typescript
// components/AdminConsole.tsx
interface AdminConsoleProps {
  tenantId: string;
  userId: string;
}

const AdminConsole: React.FC<AdminConsoleProps> = ({ tenantId, userId }) => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [web3Status, setWeb3Status] = useState<Web3Status>();
  
  return (
    <div className="admin-console">
      <DeploymentManagement deployments={deployments} />
      <MonitoringDashboard alerts={alerts} />
      <Web3Management status={web3Status} />
      <AIAgentManagement />
      <FeatureFlags />
      <SecretsManagement />
    </div>
  );
};

// components/DeploymentManagement.tsx
const DeploymentManagement: React.FC<{ deployments: Deployment[] }> = ({ deployments }) => {
  const handleDeploy = async (environment: string) => {
    // Deployment trigger implementation
  };
  
  const handleRollback = async (deploymentId: string) => {
    // Rollback implementation
  };
  
  return (
    <div className="deployment-management">
      <h2>Deployment Management</h2>
      <DeploymentHistory deployments={deployments} />
      <DeploymentControls onDeploy={handleDeploy} onRollback={handleRollback} />
    </div>
  );
};
```

**Files to modify:**
- `frontend/components/AdminConsole.tsx` (new)
- `frontend/components/DeploymentManagement.tsx` (new)
- `frontend/components/MonitoringDashboard.tsx` (new)
- `frontend/components/Web3Management.tsx` (new)
- `frontend/components/AIAgentManagement.tsx` (new)
- `frontend/components/FeatureFlags.tsx` (new)
- `frontend/components/SecretsManagement.tsx` (new)
- `frontend/app/admin/dashboard/page.tsx` (new)
- `frontend/lib/api/admin.ts` (new API client)

---

## Issue 51: Implement Developer console

**Labels:** `sprint-10`, `frontend`, `ui`, `developer`, `priority-medium`

**Description:**  
Technical tools UI for Developer role with debugging and exploration capabilities.

**Tasks:**
- [ ] Create API explorer interface
- [ ] Add real-time logs viewer
- [ ] Implement metrics visualization
- [ ] Create Web3 explorer
- [ ] Add AI agent runner interface
- [ ] Create debugging tools

**Acceptance criteria:**
- [ ] Dev sees technical tools
- [ ] Can explore API endpoints interactively
- [ ] Can view real-time logs and metrics
- [ ] Can test AI agents manually

**Technical implementation:**
```typescript
// components/DeveloperConsole.tsx
interface DeveloperConsoleProps {
  tenantId: string;
  userId: string;
}

const DeveloperConsole: React.FC<DeveloperConsoleProps> = ({ tenantId, userId }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  
  return (
    <div className="developer-console">
      <APIExplorer />
      <LogsViewer logs={logs} />
      <MetricsVisualization metrics={metrics} />
      <Web3Explorer />
      <AIAgentRunner />
      <DebuggingTools />
    </div>
  );
};

// components/APIExplorer.tsx
const APIExplorer: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [requestParams, setRequestParams] = useState<Record<string, any>>({});
  const [response, setResponse] = useState<any>(null);
  
  const handleExecuteRequest = async () => {
    // API request execution implementation
  };
  
  return (
    <div className="api-explorer">
      <h2>API Explorer</h2>
      <EndpointSelector onSelect={setSelectedEndpoint} />
      <ParameterEditor params={requestParams} onChange={setRequestParams} />
      <RequestExecutor onExecute={handleExecuteRequest} />
      <ResponseViewer response={response} />
    </div>
  );
};
```

**Files to modify:**
- `frontend/components/DeveloperConsole.tsx` (new)
- `frontend/components/APIExplorer.tsx` (new)
- `frontend/components/LogsViewer.tsx` (new)
- `frontend/components/MetricsVisualization.tsx` (new)
- `frontend/components/Web3Explorer.tsx` (new)
- `frontend/components/AIAgentRunner.tsx` (new)
- `frontend/app/developer/dashboard/page.tsx` (new)
- `frontend/lib/api/developer.ts` (new API client)

---

## Issue 52: Implement Auditor + Support consoles

**Labels:** `sprint-10`, `frontend`, `ui`, `auditor`, `support`, `priority-medium`

**Description:**  
Read-only and support tools for Auditor and Support roles.

**Tasks:**
- [ ] Create audit logs viewer for Auditor
- [ ] Add deployment history viewer
- [ ] Implement user lookup tools for Support
- [ ] Create tenant lookup tools for Support
- [ ] Add compliance reporting interface

**Acceptance criteria:**
- [ ] Auditor sees read-only compliance data
- [ ] Support sees safe troubleshooting tools
- [ ] No modification capabilities (read-only)
- [ ] Comprehensive audit trail access

**Technical implementation:**
```typescript
// components/AuditorConsole.tsx
interface AuditorConsoleProps {
  tenantId: string;
  userId: string;
}

const AuditorConsole: React.FC<AuditorConsoleProps> = ({ tenantId, userId }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  
  return (
    <div className="auditor-console">
      <AuditLogsViewer logs={auditLogs} />
      <ComplianceReports reports={complianceReports} />
      <SecurityAudit />
      <DataAccessLogs />
    </div>
  );
};

// components/SupportConsole.tsx
interface SupportConsoleProps {
  tenantId: string;
  userId: string;
}

const SupportConsole: React.FC<SupportConsoleProps> = ({ tenantId, userId }) => {
  const [userLookup, setUserLookup] = useState<User | null>(null);
  const [tenantLookup, setTenantLookup] = useState<Tenant | null>(null);
  
  return (
    <div className="support-console">
      <UserLookup onUserFound={setUserLookup} />
      <TenantLookup onTenantFound={setTenantLookup} />
      <TroubleshootingTools />
      <SupportTickets />
      <KnowledgeBase />
    </div>
  );
};
```

**Files to modify:**
- `frontend/components/AuditorConsole.tsx` (new)
- `frontend/components/SupportConsole.tsx` (new)
- `frontend/components/AuditLogsViewer.tsx` (new)
- `frontend/components/UserLookup.tsx` (new)
- `frontend/components/TenantLookup.tsx` (new)
- `frontend/app/auditor/dashboard/page.tsx` (new)
- `frontend/app/support/dashboard/page.tsx` (new)
- `frontend/lib/api/auditor.ts` (new API client)
- `frontend/lib/api/support.ts` (new API client)

---

## Sprint 10 Summary

**Focus:** Role-Based Consoles (Full UI)
**Duration:** 2 weeks
**Priority:** High - Complete user interface for all roles

**Key Deliverables:**
- Super Admin platform management console
- Owner tenant management console
- Admin operational console
- Developer technical tools console
- Auditor compliance console
- Support troubleshooting console

**Dependencies:**
- Sprint 9 (AI Orchestrator) must be complete
- All backend services implemented
- Role-based access control functional

**Success Metrics:**
- All roles have functional, role-appropriate consoles
- UI performance < 1s for all dashboards
- Real-time updates working across all consoles
- Complete audit trail visibility for auditors

**UI/UX Goals:**
- Consistent design language across all consoles
- Responsive design for mobile/tablet access
- Intuitive navigation and information architecture
- Accessibility compliance (WCAG 2.1 AA)

**Security Considerations:**
- Role-based UI restrictions enforced
- No data leakage between role consoles
- Audit logging for all console actions
- Secure API communication with proper auth
