import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/fetcher";
import { format } from "date-fns";

interface Incident {
  id: string;
  tenant_id: string;
  type: "security" | "performance" | "billing" | "api" | "system";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  status: "open" | "investigating" | "resolved" | "closed";
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
  assigned_to?: string;
  tags: string[];
  metadata: Record<string, any>;
}

export default function IncidentViewer() {
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: incidents } = useQuery({
    queryKey: ["incidents", selectedType, selectedSeverity, selectedStatus, searchTerm],
    queryFn: async () => {
      const response = await api.get("/support/incidents", {
        params: {
          type: selectedType === "ALL" ? undefined : selectedType,
          severity: selectedSeverity === "ALL" ? undefined : selectedSeverity,
          status: selectedStatus === "ALL" ? undefined : selectedStatus,
          search: searchTerm || undefined
        }
      });
      return response.data;
    }
  });

  const { data: incidentActions } = useQuery({
    queryKey: ["incident-actions"],
    queryFn: async () => {
      const response = await api.get("/support/incidents/actions");
      return response.data;
    }
  });

  const handleIncidentAction = async (incidentId: string, action: string) => {
    try {
      await api.post(`/support/incidents/${incidentId}/actions`, { action });
      // Refresh the incidents list
      window.location.reload();
    } catch (error) {
      console.error("Error performing incident action:", error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "security": return "bg-red-100 text-red-800";
      case "performance": return "bg-orange-100 text-orange-800";
      case "billing": return "bg-yellow-100 text-yellow-800";
      case "api": return "bg-blue-100 text-blue-800";
      case "system": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800";
      case "investigating": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Incident Viewer</h1>
        <p className="text-gray-600">
          View and manage support incidents
        </p>
      </div>
      
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Incident Filters</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search incidents..."
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="security">Security</option>
              <option value="performance">Performance</option>
              <option value="billing">Billing</option>
              <option value="api">API</option>
              <option value="system">System</option>
            </select>
            
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          {incidents?.map((incident: Incident) => (
            <div key={incident.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getTypeColor(incident.type)}`}>
                    {incident.type}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getSeverityColor(incident.severity)}`}>
                    {incident.severity}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(incident.status)}`}>
                    {incident.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    onChange={(e) => handleIncidentAction(incident.id, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs"
                    defaultValue=""
                  >
                    <option value="" disabled>Actions</option>
                    {incidentActions?.map((action: string) => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mb-2">
                <h3 className="text-sm font-medium text-gray-900">{incident.title}</h3>
                <p className="text-sm text-gray-600">{incident.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Incident ID:</span>
                  <span className="text-gray-600 ml-1">{incident.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tenant ID:</span>
                  <span className="text-gray-600 ml-1">{incident.tenant_id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="text-gray-600 ml-1">
                    {format(new Date(incident.created_at), "yyyy-MM-dd HH:mm:ss")}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Updated:</span>
                  <span className="text-gray-600 ml-1">
                    {format(new Date(incident.updated_at), "yyyy-MM-dd HH:mm:ss")}
                  </span>
                </div>
                {incident.resolved_at && (
                  <div>
                    <span className="font-medium text-gray-700">Resolved:</span>
                    <span className="text-gray-600 ml-1">
                      {format(new Date(incident.resolved_at), "yyyy-MM-dd HH:mm:ss")}
                    </span>
                  </div>
                )}
                {incident.assigned_to && (
                  <div>
                    <span className="font-medium text-gray-700">Assigned To:</span>
                    <span className="text-gray-600 ml-1">{incident.assigned_to}</span>
                  </div>
                )}
              </div>
              
              {incident.tags.length > 0 && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {incident.tags.map((tag: string) => (
                      <span key={tag} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {Object.keys(incident.metadata).length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">Metadata</summary>
                  <pre className="text-xs text-gray-600 mt-1">
                    {JSON.stringify(incident.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Incident Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Incidents</span>
              <span className="text-sm font-medium">{incidents?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Open Incidents</span>
              <span className="text-sm font-medium text-red-600">
                {incidents?.filter((incident: Incident) => incident.status === "open").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Critical Incidents</span>
              <span className="text-sm font-medium text-red-600">
                {incidents?.filter((incident: Incident) => incident.severity === "critical").length || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Type Distribution</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Security</span>
              <span className="text-sm font-medium text-red-600">
                {incidents?.filter((incident: Incident) => incident.type === "security").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Performance</span>
              <span className="text-sm font-medium text-orange-600">
                {incidents?.filter((incident: Incident) => incident.type === "performance").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Billing</span>
              <span className="text-sm font-medium text-yellow-600">
                {incidents?.filter((incident: Incident) => incident.type === "billing").length || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Activity</h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Last 24 Hours</span>
                <span className="font-medium">
                  {incidents?.filter((incident: Incident) => 
                    new Date(incident.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length || 0}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Last 7 Days</span>
                <span className="font-medium">
                  {incidents?.filter((incident: Incident) => 
                    new Date(incident.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length || 0}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Resolved Today</span>
                <span className="font-medium">
                  {incidents?.filter((incident: Incident) => 
                    incident.status === "resolved" && 
                    incident.resolved_at && 
                    new Date(incident.resolved_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button className="btn-secondary w-full text-sm">
              Create Incident
            </button>
            <button className="btn-secondary w-full text-sm">
              Export Report
            </button>
            <button className="btn-secondary w-full text-sm">
              Escalate Critical
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
