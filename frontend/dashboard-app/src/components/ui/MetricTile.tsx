import React from "react";

interface MetricTileProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export default function MetricTile({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  className = "",
}: MetricTileProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case "increase":
        return "text-green-600";
      case "decrease":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case "increase":
        return "↑";
      case "decrease":
        return "↓";
      default:
        return "→";
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      {change !== undefined && (
        <div className="mt-2 flex items-center text-sm">
          <span className={getChangeColor()}>
            {getChangeIcon()} {Math.abs(change)}%
          </span>
          <span className="text-gray-500 ml-1">
            from last period
          </span>
        </div>
      )}
    </div>
  );
}
