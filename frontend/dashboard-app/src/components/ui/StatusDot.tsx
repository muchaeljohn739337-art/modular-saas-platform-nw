import React from "react";

interface StatusDotProps {
  status: "online" | "offline" | "busy" | "away" | "idle";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function StatusDot({
  status,
  size = "md",
  className = "",
}: StatusDotProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    busy: "bg-yellow-500",
    away: "bg-orange-500",
    idle: "bg-gray-300"
  };

  const statusLabels = {
    online: "Online",
    offline: "Offline",
    busy: "Busy",
    away: "Away",
    idle: "Idle"
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span
        className={`
          ${sizeClasses[size]} 
          ${statusColors[status]} 
          rounded-full
          ${status === "busy" ? "animate-pulse" : ""}
        `}
        title={statusLabels[status]}
      />
      <span className="text-sm text-gray-600">{statusLabels[status]}</span>
    </div>
  );
}
