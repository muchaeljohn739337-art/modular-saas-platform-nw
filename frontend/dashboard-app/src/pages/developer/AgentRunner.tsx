import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/fetcher";
import { format } from "date-fns";

interface AgentTask {
  id: string;
  name: string;
  type: "payment_processing" | "fraud_detection" | "compliance_check" | "data_analysis" | "customer_support";
  status: "idle" | "running" | "completed" | "failed" | "paused";
  progress: number;
  started_at?: Date;
  completed_at?: Date;
  error_message?: string;
  result?: any;
  parameters: Record<string, any>;
  logs: Array<{
    timestamp: Date;
    level: "INFO" | "WARN" | "ERROR";
    message: string;
  }>;
}

interface AgentConfig {
  id: string;
  name: string;
  type: string;
  description: string;
  enabled: boolean;
  parameters: Record<string, any>;
  last_run?: Date;
  success_rate: number;
  avg_execution_time: number;
}

export default function AgentRunner() {
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [taskParameters, setTaskParameters] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<"run" | "monitor" | "config">("run");

  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const response = await api.get("/developer/agents");
      return response.data;
    }
  });

  const { data: tasks } = useQuery({
    queryKey: ["agent-tasks"],
    queryFn: async () => {
      const response = await api.get("/developer/agents/tasks");
      return response.data;
    },
    refetchInterval: 5000 // Auto-refresh every 5 seconds
  });

  const handleRunAgent = async (agentId: string, parameters: Record<string, any>) => {
    try {
      await api.post(`/developer/agents/${agentId}/run`, { parameters });
      // Refresh tasks
      window.location.reload();
    } catch (error) {
      console.error("Error running agent:", error);
    }
  };

  const handleStopAgent = async (taskId: string) => {
    try {
      await api.post(`/developer/agents/tasks/${taskId}/stop`);
      // Refresh tasks
      window.location.reload();
    } catch (error) {
      console.error("Error stopping agent:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      case "idle": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "payment_processing": return "bg-green-100 text-green-800";
      case "fraud_detection": return "bg-red-100 text-red-800";
      case "compliance_check": return "bg-blue-100 text-blue-800";
      case "data_analysis": return "bg-purple-100 text-purple-800";
      case "customer_support": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">AI Agent Runner</h1>
        <p className="text-gray-600">
          Run and monitor AI agents for automated tasks
        </p>
      </div>
      
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("run")}
              className={`px-3 py-1 rounded text-sm ${
                activeTab === "run" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              Run Agents
            </button>
            <button
              onClick={() => setActiveTab("monitor")}
              className={`px-3 py-1 rounded text-sm ${
                activeTab === "monitor" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              Monitor Tasks
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`px-3 py-1 rounded text-sm ${
                activeTab === "config" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              Configuration
            </button>
          </div>
        </div>
        
        {activeTab === "run" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select Agent</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents?.map((agent: AgentConfig) => (
                  <div
                    key={agent.id}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      selectedAgent?.id === agent.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{agent.name}</h4>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getTypeColor(agent.type)}`}>
                        {agent.type.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{agent.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded ${
                        agent.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {agent.enabled ? "Enabled" : "Disabled"}
                      </span>
                      <span className="text-gray-500">
                        {agent.success_rate}% success rate
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {selectedAgent && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Configure Parameters</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-3">
                    {Object.entries(selectedAgent.parameters).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {key.replace("_", " ").charAt(0).toUpperCase() + key.replace("_", " ").slice(1)}
                        </label>
                        <input
                          type={typeof value === "number" ? "number" : "text"}
                          defaultValue={value}
                          onChange={(e) => setTaskParameters({...taskParameters, [key]: e.target.value})}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleRunAgent(selectedAgent.id, taskParameters)}
                    className="btn-primary w-full mt-4"
                  >
                    Run Agent
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === "monitor" && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Active Tasks</h3>
            <div className="space-y-2">
              {tasks?.map((task: AgentTask) => (
                <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getTypeColor(task.type)}`}>
                        {task.type.replace("_", " ")}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{task.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.status === "running" && (
                        <button
                          onClick={() => handleStopAgent(task.id)}
                          className="btn-secondary text-xs"
                        >
                          Stop
                        </button>
                      )}
                      <span className="text-xs text-gray-500">
                        {task.started_at && format(new Date(task.started_at), "HH:mm:ss")}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${
                        task.status === "failed" ? "bg-red-500" :
                        task.status === "completed" ? "bg-green-500" :
                        task.status === "running" ? "bg-blue-500" :
                        "bg-gray-500"
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    Progress: {task.progress}%
                  </div>
                  
                  {task.error_message && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs text-red-600">{task.error_message}</p>
                    </div>
                  )}
                  
                  {task.logs && task.logs.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">Logs ({task.logs.length})</summary>
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                        {task.logs.slice(-5).map((log, index) => (
                          <div key={index} className="text-xs">
                            <span className="text-gray-500">
                              {format(new Date(log.timestamp), "HH:mm:ss")}
                            </span>
                            <span className={`ml-2 ${
                              log.level === "ERROR" ? "text-red-600" :
                              log.level === "WARN" ? "text-yellow-600" :
                              "text-gray-600"
                            }`}>
                              [{log.level}]
                            </span>
                            <span className="text-gray-600">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === "config" && (
          <div className="text-center py-8">
            <p className="text-gray-500">Agent configuration management coming soon...</p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Task Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Tasks</span>
              <span className="text-sm font-medium">{tasks?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Running</span>
              <span className="text-sm font-medium text-blue-600">
                {tasks?.filter((task: AgentTask) => task.status === "running").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="text-sm font-medium text-green-600">
                {tasks?.filter((task: AgentTask) => task.status === "completed").length || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Agent Performance</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Success Rate</span>
              <span className="text-sm font-medium text-green-600">
                {agents?.reduce((acc: number, agent: AgentConfig) => acc + agent.success_rate, 0) / (agents?.length || 1) | 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Execution Time</span>
              <span className="text-sm font-medium">
                {agents?.reduce((acc: number, agent: AgentConfig) => acc + agent.avg_execution_time, 0) / (agents?.length || 1) | 0}s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Enabled Agents</span>
              <span className="text-sm font-medium text-green-600">
                {agents?.filter((agent: AgentConfig) => agent.enabled).length || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Activity</h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Last Hour</span>
                <span className="font-medium">
                  {tasks?.filter((task: AgentTask) => 
                    task.started_at && new Date(task.started_at) > new Date(Date.now() - 60 * 60 * 1000)
                  ).length || 0}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Last 24 Hours</span>
                <span className="font-medium">
                  {tasks?.filter((task: AgentTask) => 
                    task.started_at && new Date(task.started_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length || 0}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Failed Today</span>
                <span className="font-medium text-red-600">
                  {tasks?.filter((task: AgentTask) => 
                    task.status === "failed" && 
                    task.started_at && 
                    new Date(task.started_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
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
              Create Agent
            </button>
            <button className="btn-secondary w-full text-sm">
              Export Logs
            </button>
            <button className="btn-secondary w-full text-sm">
              System Health
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
