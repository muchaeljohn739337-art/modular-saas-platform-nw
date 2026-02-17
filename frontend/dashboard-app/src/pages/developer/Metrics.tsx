import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/fetcher";
import { format } from "date-fns";

interface SystemMetric {
  id: string;
  name: string;
  service: string;
  type: "cpu" | "memory" | "disk" | "network" | "response_time" | "error_rate";
  current_value: number;
  threshold: number;
  unit: string;
  status: "healthy" | "warning" | "critical";
  last_updated: Date;
  history: Array<{
    timestamp: Date;
    value: number;
  }>;
}

export default function Metrics() {
  const [selectedService, setSelectedService] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [timeRange, setTimeRange] = useState("1h");

  const { data: metrics } = useQuery({
    queryKey: ["metrics", selectedService, selectedType, timeRange],
    queryFn: async () => {
      const response = await api.get("/developer/metrics", {
        params: {
          service: selectedService === "ALL" ? undefined : selectedService,
          type: selectedType === "ALL" ? undefined : selectedType,
          time_range: timeRange
        }
      });
      return response.data;
    },
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "bg-green-100 text-green-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "cpu": return "bg-blue-100 text-blue-800";
      case "memory": return "bg-purple-100 text-purple-800";
      case "disk": return "bg-orange-100 text-orange-800";
      case "network": return "bg-green-100 text-green-800";
      case "response_time": return "bg-yellow-100 text-yellow-800";
      case "error_rate": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPercentageColor = (current: number, threshold: number) => {
    const percentage = (current / threshold) * 100;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 80) return "text-yellow-600";
    if (percentage >= 70) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">System Metrics</h1>
        <p className="text-gray-600">
          Real-time system performance metrics
        </p>
      </div>
      
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Metric Filters</h2>
          <div className="flex items-center space-x-2">
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
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="cpu">CPU</option>
              <option value="memory">Memory</option>
              <option value="disk">Disk</option>
              <option value="network">Network</option>
              <option value="response_time">Response Time</option>
              <option value="error_rate">Error Rate</option>
            </select>
            
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics?.map((metric: SystemMetric) => (
            <div key={metric.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getTypeColor(metric.type)}`}>
                    {metric.type.replace("_", " ")}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(metric.status)}`}>
                    {metric.status}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{metric.service}</span>
              </div>
              
              <div className="mb-2">
                <h3 className="text-sm font-medium text-gray-900">{metric.name}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-lg font-bold ${getPercentageColor(metric.current_value, metric.threshold)}`}>
                    {metric.current_value}{metric.unit}
                  </span>
                  <span className="text-xs text-gray-500">
                    / {metric.threshold}{metric.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      metric.status === "critical" ? "bg-red-500" :
                      metric.status === "warning" ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min((metric.current_value / metric.threshold) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                Last updated: {format(new Date(metric.last_updated), "HH:mm:ss")}
              </div>
              
              {metric.history && metric.history.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">History (Last 10 points)</summary>
                  <div className="mt-2 space-y-1">
                    {metric.history.slice(-10).map((point, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-600">
                          {format(new Date(point.timestamp), "HH:mm:ss")}
                        </span>
                        <span className={getPercentageColor(point.value, metric.threshold)}>
                          {point.value}{metric.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">System Health</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Healthy Metrics</span>
              <span className="text-sm font-medium text-green-600">
                {metrics?.filter((metric: SystemMetric) => metric.status === "healthy").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Warning Metrics</span>
              <span className="text-sm font-medium text-yellow-600">
                {metrics?.filter((metric: SystemMetric) => metric.status === "warning").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Critical Metrics</span>
              <span className="text-sm font-medium text-red-600">
                {metrics?.filter((metric: SystemMetric) => metric.status === "critical").length || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Service Status</h3>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Performance</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Response Time</span>
              <span className="text-sm font-medium">245ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="text-sm font-medium text-green-600">0.12%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Throughput</span>
              <span className="text-sm font-medium">1,234 req/s</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button className="btn-secondary w-full text-sm">
              Export Metrics
            </button>
            <button className="btn-secondary w-full text-sm">
              Set Alerts
            </button>
            <button className="btn-secondary w-full text-sm">
              Refresh All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
