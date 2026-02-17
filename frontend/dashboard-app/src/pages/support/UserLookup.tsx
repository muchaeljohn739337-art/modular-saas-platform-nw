import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/fetcher";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenant_id: string;
  status: "active" | "inactive" | "suspended";
  last_login?: Date;
  created_at: Date;
  subscription_status: "active" | "expired" | "trial" | "cancelled";
}

export default function UserLookup() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const { data: users } = useQuery({
    queryKey: ["users", searchTerm, selectedRole, selectedStatus],
    queryFn: async () => {
      const response = await api.get("/support/users", {
        params: {
          search: searchTerm || undefined,
          role: selectedRole === "ALL" ? undefined : selectedRole,
          status: selectedStatus === "ALL" ? undefined : selectedStatus
        }
      });
      return response.data;
    }
  });

  const { data: userActions } = useQuery({
    queryKey: ["user-actions"],
    queryFn: async () => {
      const response = await api.get("/support/users/actions");
      return response.data;
    }
  });

  const handleUserAction = async (userId: string, action: string) => {
    try {
      await api.post(`/support/users/${userId}/actions`, { action });
      // Refresh the users list
      window.location.reload();
    } catch (error) {
      console.error("Error performing user action:", error);
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
        <h1 className="text-2xl font-semibold text-gray-900">User Lookup</h1>
        <p className="text-gray-600">
          Search and manage user accounts
        </p>
      </div>
      
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">User Search</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email, name, or user ID..."
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
            
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Roles</option>
              <option value="superadmin">SuperAdmin</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
              <option value="auditor">Auditor</option>
              <option value="support">Support</option>
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
          {users?.map((user: User) => (
            <div key={user.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                  <span className="text-xs text-gray-500">{user.role}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getSubscriptionColor(user.subscription_status)}`}>
                    {user.subscription_status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    onChange={(e) => handleUserAction(user.id, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs"
                    defaultValue=""
                  >
                    <option value="" disabled>Actions</option>
                    {userActions?.map((action: string) => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="text-gray-600 ml-1">{user.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="text-gray-600 ml-1">{user.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">User ID:</span>
                  <span className="text-gray-600 ml-1">{user.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tenant ID:</span>
                  <span className="text-gray-600 ml-1">{user.tenant_id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="text-gray-600 ml-1">
                    {format(new Date(user.created_at), "yyyy-MM-dd")}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Last Login:</span>
                  <span className="text-gray-600 ml-1">
                    {user.last_login ? format(new Date(user.last_login), "yyyy-MM-dd HH:mm") : "Never"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">User Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Users</span>
              <span className="text-sm font-medium">{users?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="text-sm font-medium text-green-600">
                {users?.filter((user: User) => user.status === "active").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Suspended Users</span>
              <span className="text-sm font-medium text-red-600">
                {users?.filter((user: User) => user.status === "suspended").length || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Subscription Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active</span>
              <span className="text-sm font-medium text-green-600">
                {users?.filter((user: User) => user.subscription_status === "active").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Trial</span>
              <span className="text-sm font-medium text-blue-600">
                {users?.filter((user: User) => user.subscription_status === "trial").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expired</span>
              <span className="text-sm font-medium text-red-600">
                {users?.filter((user: User) => user.subscription_status === "expired").length || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button className="btn-secondary w-full text-sm">
              Export User List
            </button>
            <button className="btn-secondary w-full text-sm">
              Bulk Actions
            </button>
            <button className="btn-secondary w-full text-sm">
              User Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
