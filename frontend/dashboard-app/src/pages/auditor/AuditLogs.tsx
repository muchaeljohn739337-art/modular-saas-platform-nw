import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/fetcher";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export default function AuditLogs() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd")
  });
  const [searchTerm, setSearchTerm] = useState("");

  const { data: auditLogs } = useQuery({
    queryKey: ["audit-logs", selectedSeverity, selectedAction, dateRange, searchTerm],
    queryFn: async () => {
      const response = await api.get("/auditor/audit-logs", {
        params: {
          severity: selectedSeverity === "ALL" ? undefined : selectedSeverity,
          action: selectedAction === "ALL" ? undefined : selectedAction,
          start_date: dateRange.start,
          end_date: dateRange.end,
          search: searchTerm || undefined
        }
      });
      return response.data;
    }
  });

  const { data: exportUrl } = useQuery({
    queryKey: ["audit-logs-export", selectedSeverity, selectedAction, dateRange, searchTerm],
    queryFn: async () => {
      const response = await api.get("/auditor/audit-logs/export", {
        params: {
          severity: selectedSeverity === "ALL" ? undefined : selectedSeverity,
          action: selectedAction === "ALL" ? undefined : selectedAction,
          start_date: dateRange.start,
          end_date: dateRange.end,
          search: searchTerm || undefined
        }
      });
      return response.data.url;
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "bg-red-100 text-red-800";
      case "HIGH": return "bg-orange-100 text-orange-800";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800";
      case "LOW": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleExport = () => {
    if (exportUrl) {
      window.open(exportUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600">
          Complete audit trail for compliance and security
        </p>
      </div>
      
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Audit Filters</h2>
          <div className="flex items-center space-x-2">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="EXPORT">Export</option>
              <option value="ACCESS_DENIED">Access Denied</option>
            </select>
            
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
            
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
            
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit logs..."
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
            
            <button
              onClick={handleExport}
              className="btn-primary text-sm"
            >
              Export
            </button>
          </div>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {auditLogs?.map((log: AuditLog) => (
            <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getSeverityColor(log.severity)}`}>
                    {log.severity}
                  </span>
                  <span className="text-xs text-gray-500">{log.action}</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">User:</span>
                  <span className="text-gray-600 ml-1">{log.user_id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tenant:</span>
                  <span className="text-gray-600 ml-1">{log.tenant_id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Resource:</span>
                  <span className="text-gray-600 ml-1">{log.resource}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">IP Address:</span>
                  <span className="text-gray-600 ml-1">{log.ip_address}</span>
                </div>
              </div>
              
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">User Agent:</span> {log.user_agent}
                  </div>
                  <pre className="text-xs text-gray-600 mt-1">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Audit Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Logs</span>
              <span className="text-sm font-medium">{auditLogs?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Critical Events</span>
              <span className="text-sm font-medium text-red-600">
                {auditLogs?.filter((log: AuditLog) => log.severity === "CRITICAL").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Access Denied</span>
              <span className="text-sm font-medium text-orange-600">
                {auditLogs?.filter((log: AuditLog) => log.action === "ACCESS_DENIED").length || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Compliance Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">HIPAA</span>
              <span className="text-sm font-medium text-green-600">Compliant</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">SOX</span>
              <span className="text-sm font-medium text-green-600">Compliant</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">GDPR</span>
              <span className="text-sm font-medium text-green-600">Compliant</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Activity</h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Login Events</span>
                <span className="font-medium">
                  {auditLogs?.filter((log: AuditLog) => log.action === "LOGIN").length || 0}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Data Exports</span>
                <span className="font-medium">
                  {auditLogs?.filter((log: AuditLog) => log.action === "EXPORT").length || 0}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Delete Actions</span>
                <span className="font-medium">
                  {auditLogs?.filter((log: AuditLog) => log.action === "DELETE").length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button className="btn-secondary w-full text-sm">
              Generate Report
            </button>
            <button className="btn-secondary w-full text-sm">
              Schedule Export
            </button>
            <button className="btn-secondary w-full text-sm">
              Compliance Check
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
