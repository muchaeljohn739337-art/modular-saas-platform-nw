import React, { useState } from "react";

interface JsonViewerProps {
  data: any;
  expanded?: boolean;
  showLineNumbers?: boolean;
  className?: string;
}

export default function JsonViewer({
  data,
  expanded = false,
  showLineNumbers = false,
  className = "",
}: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const jsonString = JSON.stringify(data, null, 2);
  const lines = jsonString.split("\n");

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`bg-gray-900 rounded-lg ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <span className="text-sm font-medium text-gray-300">JSON</span>
        <button
          onClick={toggleExpanded}
          className="text-xs text-gray-400 hover:text-gray-200"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>
      
      <div className={`overflow-x-auto ${isExpanded ? "max-h-96" : "max-h-32"} overflow-y-auto`}>
        <pre className="text-xs text-green-400 p-4 font-mono">
          {lines.map((line, index) => (
            <div key={index} className="flex">
              {showLineNumbers && (
                <span className="text-gray-500 mr-4 select-none">
                  {String(index + 1).padStart(3, " ")}
                </span>
              )}
              <span className="text-green-300">{line}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
