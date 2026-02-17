export const roleRoutes = {
  superadmin: "/superadmin/overview",
  owner: "/owner/dashboard",
  admin: "/admin/deployments",
  developer: "/developer/api",
  auditor: "/auditor/logs",
  support: "/support/users"
};

export const rolePermissions = {
  superadmin: [
    "read:platform",
    "manage:tenants",
    "manage:incidents",
    "view:billing",
    "manage:security"
  ],
  owner: [
    "read:tenant",
    "manage:users",
    "manage:billing",
    "manage:api_keys",
    "manage:settings"
  ],
  admin: [
    "read:deployments",
    "manage:monitoring",
    "manage:web3",
    "manage:ai",
    "manage:flags",
    "manage:secrets"
  ],
  developer: [
    "read:api",
    "read:logs",
    "read:metrics",
    "read:web3",
    "run:agents"
  ],
  auditor: [
    "read:audit_logs",
    "read:compliance",
    "export:reports"
  ],
  support: [
    "lookup:users",
    "lookup:tenants",
    "view:incidents",
    "escalate:issues"
  ]
};

export const hasPermission = (role: string, permission: string): boolean => {
  return rolePermissions[role as keyof typeof rolePermissions]?.includes(permission) || false;
};

export const canAccessRoute = (role: string, route: string): boolean => {
  const routePermissions: Record<string, string[]> = {
    "/superadmin": ["superadmin"],
    "/owner": ["owner"],
    "/admin": ["admin"],
    "/developer": ["developer"],
    "/auditor": ["auditor"],
    "/support": ["support"]
  };
  
  const requiredRole = Object.keys(routePermissions).find(path => 
    route.startsWith(path) && routePermissions[path].includes(role as string)
  );
  
  return !!requiredRole;
};
