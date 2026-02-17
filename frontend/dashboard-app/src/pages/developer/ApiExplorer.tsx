import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../utils/fetcher";

interface ApiEndpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  responses: {
    [key: string]: {
      description: string;
      schema?: any;
    };
  };
}

export default function ApiExplorer() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [requestBody, setRequestBody] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: endpoints } = useQuery({
    queryKey: ["api-endpoints"],
    queryFn: async () => {
      const response = await api.get("/developer/api/endpoints");
      return response.data;
    }
  });

  const handleTestEndpoint = async (endpoint: ApiEndpoint) => {
    setIsLoading(true);
    try {
      const response = await api.request({
        method: endpoint.method,
        url: endpoint.path,
        data: requestBody ? JSON.parse(requestBody) : undefined
      });
      setResponse(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setResponse(JSON.stringify(error, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">API Explorer</h1>
        <p className="text-gray-600">
          Test and explore API endpoints
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Endpoints</h2>
          <div className="space-y-2">
            {endpoints?.map((endpoint: ApiEndpoint, index: number) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => setSelectedEndpoint(endpoint)}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    endpoint.method === "GET" ? "bg-green-100 text-green-800" :
                    endpoint.method === "POST" ? "bg-blue-100 text-blue-800" :
                    endpoint.method === "PUT" ? "bg-yellow-100 text-yellow-800" :
                    endpoint.method === "DELETE" ? "bg-red-100 text-red-800" :
                    "bg-purple-100 text-purple-800"
                  }`}>
                    {endpoint.method}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{endpoint.path}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{endpoint.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Endpoint</h2>
          {selectedEndpoint ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  {selectedEndpoint.method} {selectedEndpoint.path}
                </h3>
                <p className="text-xs text-gray-500">{selectedEndpoint.description}</p>
              </div>
              
              {selectedEndpoint.parameters.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Parameters</h4>
                  <div className="space-y-2">
                    {selectedEndpoint.parameters.map((param, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{param.name}</span>
                        <span className="text-xs text-gray-500">{param.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(selectedEndpoint.method === "POST" || selectedEndpoint.method === "PUT") && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Request Body</h4>
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    className="w-full h-32 p-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Enter JSON request body"
                  />
                </div>
              )}
              
              <button
                onClick={() => handleTestEndpoint(selectedEndpoint)}
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? "Testing..." : "Test Endpoint"}
              </button>
              
              {response && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Response</h4>
                  <pre className="w-full h-64 p-2 bg-gray-50 rounded-md text-xs overflow-auto">
                    {response}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Select an endpoint to test</p>
          )}
        </div>
      </div>
    </div>
  );
}
