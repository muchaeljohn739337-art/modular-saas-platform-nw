import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  lines?: number;
  animate?: boolean;
}

export default function Skeleton({
  className = "",
  width = "100%",
  height = "1rem",
  lines = 1,
  animate = true,
}: SkeletonProps) {
  const widthClass = typeof width === "number" ? "w-" + width : width;
  const heightClass = typeof height === "number" ? "h-" + height : height;

  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`
              ${widthClass} ${heightClass}
              bg-gray-300 rounded
              ${animate ? "animate-pulse" : ""}
            `}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`
        ${widthClass} ${heightClass}
        bg-gray-300 rounded
        ${animate ? "animate-pulse" : ""}
        ${className}
      `}
    />
  );
}
