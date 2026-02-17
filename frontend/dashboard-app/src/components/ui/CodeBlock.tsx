import React from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export default function CodeBlock({
  code,
  language = "text",
  showLineNumbers = false,
  className = "",
}: CodeBlockProps) {
  const lines = code.split("\n");

  return (
    <div className={`bg-gray-900 rounded-lg p-4 overflow-x-auto ${className}`}>
      <pre className="text-sm">
        <code className={language}>
          {lines.map((line, index) => (
            <div key={index} className="flex">
              {showLineNumbers && (
                <span className="text-gray-500 mr-4 select-none">
                  {String(index + 1).padStart(3, " ")}
                </span>
              )}
              <span className="text-gray-300">{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
