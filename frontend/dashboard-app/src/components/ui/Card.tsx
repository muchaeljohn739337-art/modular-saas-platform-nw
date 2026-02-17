import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  hover?: boolean;
}

export default function Card({
  children,
  className = "",
  padding = "md",
  shadow = "sm",
  hover = false,
}: CardProps) {
  const paddingClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6"
  };

  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl"
  };

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        ${hover ? "hover:shadow-md transition-shadow duration-200" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
