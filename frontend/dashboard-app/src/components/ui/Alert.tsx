import React from "react";

interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export default function Alert({
  type = "info",
  title,
  children,
  dismissible = false,
  onDismiss,
  className = "",
}: AlertProps) {
  const typeStyles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    error: "bg-red-50 border-red-200 text-red-800"
  };

  const iconStyles = {
    info: "text-blue-400",
    success: "text-green-400",
    warning: "text-yellow-400",
    error: "text-red-400"
  };

  return (
    <div className={`rounded-md border p-4 ${typeStyles[type]} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {type === "info" && (
            <svg className={`h-5 w-5 ${iconStyles[type]}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116.32 3.912 3.912 0 015.644 0 0 3.912-3.912 0 00-5.644 0-3.912-3.912zM9 2a1 1 0 000 2v1a1 1 0 001 1h1a1 1 0 001-1V3z" clipRule="evenodd" />
            </svg>
          )}
          {type === "success" && (
            <svg className={`h-5 w-5 ${iconStyles[type]}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 7.707a1 1 0 01-1.414 1.414l2.829 2.829a1 1 0 001.414 1.414L11.586 10l-2.829-2.829a1 1 0 00-1.414-1.414z" clipRule="evenodd" />
            </svg>
          )}
          {type === "warning" && (
            <svg className={`h-5 w-5 ${iconStyles[type]}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58-9.92a11.813 11.813 0 01-3.486 0l-5.58-9.92zM11.813 11.813l-5.58 9.92L11.813 11.813z" clipRule="evenodd" />
            </svg>
          )}
          {type === "error" && (
            <svg className={`h-5 w-5 ${iconStyles[type]}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.414 1.414 4.293-4.293a1 1 0 001.414-1.414l-4.293-4.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3">
          {title && (
            <h3 className="text-sm font-medium">{title}</h3>
          )}
          <div className={`text-sm ${type === "error" ? "text-red-800" : "text-gray-700"}`}>
            {children}
          </div>
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className={`inline-flex text-gray-400 hover:text-gray-600 focus:outline-none ${iconStyles[type]}`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 1.414L10 10.586l-1.414 1.414-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10l-4.293-4.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
