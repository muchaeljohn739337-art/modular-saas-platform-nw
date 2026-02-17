import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/fetcher";
import { format } from "date-fns";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  service: string;
  message: string;
  metadata?: Record<string, any>;
}

export default function Logs() {
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [selectedService, setSelectedService] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs } = useQuery({
    queryKey: ["logs", selectedLevel, selectedService, searchTerm],
    queryFn: async () => {
      const response = await api.get("/developer/logs", {
        params: {
          level: selectedLevel === "ALL" ? undefined : selectedLevel,
          service: selectedService === "ALL" ? undefined : selectedService,
          search: searchTerm || undefined
        }
      });
      return response.data;
    },
    refetchInterval: 5000 // Auto-refresh every 5 seconds
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ERROR": return "bg-red-100 text-red-800";
      case "WARN": return "bg-yellow-100 text-yellow-800";
      case "INFO": return "bg-blue-100 text-blue-800";
      case "DEBUG": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">System Logs</h1>
        <p className="text-gray-600">
          Real-time system logs and debugging information
        </p>
      </div>
      
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Log Filters</h2>
          <div className="flex items-center space-x-2">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Levels</option>
              <option value="ERROR">Error</option>
              <option value="WARN">Warning</option>
              <option value="INFO">Info</option>
              <option value="DEBUG">Debug</option>
            </select>
            
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Services</option>
              <option value="api-gateway">API Gateway</option>
              <option value="auth-service">Auth Service</option>
              <option value="billing-service">Billing Service</option>
              <option value="ai-service">AI Service</option>
              <option value="web3-service">Web3 Service</option>
              <option value="monitoring-service">Monitoring Service</option>
            </select>
            
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs?.map((log: LogEntry) => (
            <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getLevelColor(log.level)}`}>
                    {log.level}
                  </span>
                  <span className="text-xs text-gray-500">{log.service}</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(log.timestamp), "HH:mm:ss")}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-900">{log.message}</p>
              {log.metadata && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">Metadata</summary>
                  <pre className="text-xs text-gray-600 mt-1">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Log Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Logs</span>
              <span className="text-sm font-medium">{logs?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Errors</span>
              <span className="text-sm font-medium text-red-600">
                {logs?.filter((log: LogEntry) => log.level === "ERROR").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Warnings</span>
              <span className="text-sm font-medium text-yellow-600">
                {logs?.filter((log: LogEntry) => log.level === "WARN").length || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Service Health</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">API Gateway</span>
              <span className="text-sm font-medium text-green-600">Healthy</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Auth Service</span>
              <span className="text-sm font-medium text-green-600">Healthy</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Billing Service</span>
              <span className="text-sm font-medium text-yellow-600">Warning</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button className="btn-secondary w-full text-sm">
              Export Logs
            </button>
            <button className="btn-secondary w-full text-sm">
              Clear Filters
            </button>
            <button className="btn-secondary w-full text-sm">
              Pause Auto-refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
