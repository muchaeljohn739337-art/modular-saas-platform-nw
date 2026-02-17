import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/fetcher";
import { format } from "date-fns";

interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: "active" | "inactive" | "suspended";
  plan: "starter" | "professional" | "enterprise";
  created_at: Date;
  user_count: number;
  subscription_status: "active" | "expired" | "trial" | "cancelled";
  billing_cycle: "monthly" | "yearly";
  next_billing_date?: Date;
}

export default function TenantLookup() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const { data: tenants } = useQuery({
    queryKey: ["tenants", searchTerm, selectedPlan, selectedStatus],
    queryFn: async () => {
      const response = await api.get("/support/tenants", {
        params: {
          search: searchTerm || undefined,
          plan: selectedPlan === "ALL" ? undefined : selectedPlan,
          status: selectedStatus === "ALL" ? undefined : selectedStatus
        }
      });
      return response.data;
    }
  });

  const { data: tenantActions } = useQuery({
    queryKey: ["tenant-actions"],
    queryFn: async () => {
      const response = await api.get("/support/tenants/actions");
      return response.data;
    }
  });

  const handleTenantAction = async (tenantId: string, action: string) => {
    try {
      await api.post(`/support/tenants/${tenantId}/actions`, { action });
      // Refresh the tenants list
      window.location.reload();
    } catch (error) {
      console.error("Error performing tenant action:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "suspended": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "enterprise": return "bg-purple-100 text-purple-800";
      case "professional": return "bg-blue-100 text-blue-800";
      case "starter": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSubscriptionColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "trial": return "bg-blue-100 text-blue-800";
      case "expired": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Tenant Lookup</h1>
        <p className="text-gray-600">
          Search and manage tenant accounts
        </p>
      </div>
      
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Tenant Search</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, domain, or tenant ID..."
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
            
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Plans</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          {tenants?.map((tenant: Tenant) => (
            <div key={tenant.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(tenant.status)}`}>
                    {tenant.status}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getPlanColor(tenant.plan)}`}>
                    {tenant.plan}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getSubscriptionColor(tenant.subscription_status)}`}>
                    {tenant.subscription_status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    onChange={(e) => handleTenantAction(tenant.id, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs"
                    defaultValue=""
                  >
                    <option value="" disabled>Actions</option>
                    {tenantActions?.map((action: string) => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="text-gray-600 ml-1">{tenant.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Domain:</span>
                  <span className="text-gray-600 ml-1">{tenant.domain}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tenant ID:</span>
                  <span className="text-gray-600 ml-1">{tenant.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">User Count:</span>
                  <span className="text-gray-600 ml-1">{tenant.user_count}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="text-gray-600 ml-1">
                    {format(new Date(tenant.created_at), "yyyy-MM-dd")}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Billing Cycle:</span>
                  <span className="text-gray-600 ml-1">{tenant.billing_cycle}</span>
                </div>
                {tenant.next_billing_date && (
                  <div>
                    <span className="font-medium text-gray-700">Next Billing:</span>
                    <span className="text-gray-600 ml-1">
                      {format(new Date(tenant.next_billing_date), "yyyy-MM-dd")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tenant Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Tenants</span>
              <span className="text-sm font-medium">{tenants?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Tenants</span>
              <span className="text-sm font-medium text-green-600">
                {tenants?.filter((tenant: Tenant) => tenant.status === "active").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Suspended Tenants</span>
              <span className="text-sm font-medium text-red-600">
                {tenants?.filter((tenant: Tenant) => tenant.status === "suspended").length || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Plan Distribution</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Enterprise</span>
              <span className="text-sm font-medium text-purple-600">
                {tenants?.filter((tenant: Tenant) => tenant.plan === "enterprise").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Professional</span>
              <span className="text-sm font-medium text-blue-600">
                {tenants?.filter((tenant: Tenant) => tenant.plan === "professional").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Starter</span>
              <span className="text-sm font-medium text-green-600">
                {tenants?.filter((tenant: Tenant) => tenant.plan === "starter").length || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button className="btn-secondary w-full text-sm">
              Export Tenant List
            </button>
            <button className="btn-secondary w-full text-sm">
              Bulk Actions
            </button>
            <button className="btn-secondary w-full text-sm">
              Tenant Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
