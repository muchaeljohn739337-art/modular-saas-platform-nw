import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/fetcher";
import { format } from "date-fns";

interface Deployment {
  id: string;
  tenant_id: string;
  version: string;
  status: "pending" | "deploying" | "success" | "failed" | "rolling_back";
  deployed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export default function Deployments() {
  const { data: deployments } = useQuery({
    queryKey: ["deployments"],
    queryFn: async () => {
      const response = await api.get("/admin/deployments");
      return response.data;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Deployments</h1>
        <p className="text-gray-600">
          Manage blue/green and canary deployments
        </p>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Deployment Queue</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">API Gateway v2.1.0</p>
              <p className="text-xs text-gray-500">Ready to deploy</p>
            </div>
            <span className="text-xs text-gray-500">5 min ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Billing Service</p>
              <p className="text-xs text-gray-500">v2.0.1</p>
            </div>
            <span className="text-xs text-gray-500">2 min ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">AI Service</p>
              <p className="text-xs text-gray-500">Failed</p>
            </div>
            <span className="text-xs text-gray-500">45 min ago</span>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Deployments</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">API Gateway</p>
              <p className="text-xs text-gray-500">Success</p>
            </div>
            <span className="text-xs text-gray-500">30 min ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Billing Service</p>
              <p className="text-xs text-gray-500">Failed</p>
            </div>
            <span className="text-xs text-gray-500">45 min ago</span>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Deployment Actions</h2>
        <div className="space-y-4">
          <button className="btn-primary">
            Deploy New Deployment
          </button>
          <button className="btn-secondary">
            Rollback Deployment
          </button>
          <button className="btn-secondary">
            View Logs
          </button>
        </div>
      </div>
    </div>
  );
}
