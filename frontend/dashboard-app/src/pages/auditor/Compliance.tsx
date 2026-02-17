import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/fetcher";
import { format } from "date-fns";

interface ComplianceReport {
  id: string;
  name: string;
  type: "HIPAA" | "SOX" | "GDPR" | "PCI-DSS" | "SOC2";
  status: "compliant" | "non_compliant" | "pending" | "review_required";
  last_updated: Date;
  next_review: Date;
  score: number;
  findings: Array<{
    category: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    recommendation: string;
    status: "open" | "in_progress" | "resolved";
  }>;
  auditor_notes?: string;
}

export default function Compliance() {
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const { data: complianceReports } = useQuery({
    queryKey: ["compliance-reports", selectedType, selectedStatus],
    queryFn: async () => {
      const response = await api.get("/auditor/compliance", {
        params: {
          type: selectedType === "ALL" ? undefined : selectedType,
          status: selectedStatus === "ALL" ? undefined : selectedStatus
        }
      });
      return response.data;
    }
  });

  const { data: complianceActions } = useQuery({
    queryKey: ["compliance-actions"],
    queryFn: async () => {
      const response = await api.get("/auditor/compliance/actions");
      return response.data;
    }
  });

  const handleComplianceAction = async (reportId: string, action: string) => {
    try {
      await api.post(`/auditor/compliance/${reportId}/actions`, { action });
      // Refresh the compliance reports
      window.location.reload();
    } catch (error) {
      console.error("Error performing compliance action:", error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "HIPAA": return "bg-blue-100 text-blue-800";
      case "SOX": return "bg-green-100 text-green-800";
      case "GDPR": return "bg-purple-100 text-purple-800";
      case "PCI-DSS": return "bg-orange-100 text-orange-800";
      case "SOC2": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant": return "bg-green-100 text-green-800";
      case "non_compliant": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "review_required": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-yellow-600";
    if (score >= 70) return "text-orange-600";
    return "text-red-600";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Compliance Dashboard</h1>
        <p className="text-gray-600">
          Monitor and manage regulatory compliance
        </p>
      </div>
      
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Compliance Reports</h2>
          <div className="flex items-center space-x-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="HIPAA">HIPAA</option>
              <option value="SOX">SOX</option>
              <option value="GDPR">GDPR</option>
              <option value="PCI-DSS">PCI-DSS</option>
              <option value="SOC2">SOC2</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="compliant">Compliant</option>
              <option value="non_compliant">Non-Compliant</option>
              <option value="pending">Pending</option>
              <option value="review_required">Review Required</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          {complianceReports?.map((report: ComplianceReport) => (
            <div key={report.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getTypeColor(report.type)}`}>
                    {report.type}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(report.status)}`}>
                    {report.status.replace("_", " ")}
                  </span>
                  <span className={`text-sm font-bold ${getScoreColor(report.score)}`}>
                    {report.score}%
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    onChange={(e) => handleComplianceAction(report.id, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs"
                    defaultValue=""
                  >
                    <option value="" disabled>Actions</option>
                    {complianceActions?.map((action: string) => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mb-2">
                <h3 className="text-sm font-medium text-gray-900">{report.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-2">
                  <div>
                    <span className="font-medium text-gray-700">Last Updated:</span>
                    <span className="text-gray-600 ml-1">
                      {format(new Date(report.last_updated), "yyyy-MM-dd")}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Next Review:</span>
                    <span className="text-gray-600 ml-1">
                      {format(new Date(report.next_review), "yyyy-MM-dd")}
                    </span>
                  </div>
                </div>
              </div>
              
              {report.findings.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Findings ({report.findings.length})</h4>
                  <div className="space-y-1">
                    {report.findings.slice(0, 3).map((finding, index) => (
                      <div key={index} className="p-2 bg-white rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium px-2 py-1 rounded ${getSeverityColor(finding.severity)}`}>
                            {finding.severity}
                          </span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            finding.status === "resolved" ? "bg-green-100 text-green-800" :
                            finding.status === "in_progress" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {finding.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{finding.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">Recommendation:</span> {finding.recommendation}
                        </p>
                      </div>
                    ))}
                    {report.findings.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        ... and {report.findings.length - 3} more findings
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {report.auditor_notes && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">Auditor Notes</summary>
                  <p className="text-xs text-gray-600 mt-1">{report.auditor_notes}</p>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Compliance Overview</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Reports</span>
              <span className="text-sm font-medium">{complianceReports?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Compliant</span>
              <span className="text-sm font-medium text-green-600">
                {complianceReports?.filter((report: ComplianceReport) => report.status === "compliant").length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Non-Compliant</span>
              <span className="text-sm font-medium text-red-600">
                {complianceReports?.filter((report: ComplianceReport) => report.status === "non_compliant").length || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Average Scores</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Overall</span>
              <span className={`text-sm font-bold ${getScoreColor(
                complianceReports?.reduce((acc: number, report: ComplianceReport) => acc + report.score, 0) / (complianceReports?.length || 1)
              )}`}>
                {Math.round(
                  (complianceReports?.reduce((acc: number, report: ComplianceReport) => acc + report.score, 0) / (complianceReports?.length || 1)) || 0
                )}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">HIPAA</span>
              <span className={`text-sm font-bold ${getScoreColor(
                complianceReports?.find((r: ComplianceReport) => r.type === "HIPAA")?.score || 0
              )}`}>
                {complianceReports?.find((r: ComplianceReport) => r.type === "HIPAA")?.score || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">SOX</span>
              <span className={`text-sm font-bold ${getScoreColor(
                complianceReports?.find((r: ComplianceReport) => r.type === "SOX")?.score || 0
              )}`}>
                {complianceReports?.find((r: ComplianceReport) => r.type === "SOX")?.score || 0}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Open Findings</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Critical</span>
              <span className="text-sm font-medium text-red-600">
                {complianceReports?.reduce((acc: number, report: ComplianceReport) => 
                  acc + report.findings.filter((f) => f.severity === "critical" && f.status !== "resolved").length, 0
                ) || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">High</span>
              <span className="text-sm font-medium text-orange-600">
                {complianceReports?.reduce((acc: number, report: ComplianceReport) => 
                  acc + report.findings.filter((f) => f.severity === "high" && f.status !== "resolved").length, 0
                ) || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Medium</span>
              <span className="text-sm font-medium text-yellow-600">
                {complianceReports?.reduce((acc: number, report: ComplianceReport) => 
                  acc + report.findings.filter((f) => f.severity === "medium" && f.status !== "resolved").length, 0
                ) || 0}
              </span>
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
              Schedule Audit
            </button>
            <button className="btn-secondary w-full text-sm">
              Export Findings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
