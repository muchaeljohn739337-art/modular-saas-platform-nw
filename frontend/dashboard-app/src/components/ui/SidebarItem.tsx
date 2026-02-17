import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";

interface SidebarItemProps {
  to: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  className?: string;
}

export default function SidebarItem({
  to,
  label,
  icon,
  badge,
  className = "",
}: SidebarItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to || (location.pathname.startsWith(to) && to !== "/");

  return (
    <NavLink
      to={to}
      className={`
        flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
        ${isActive
          ? "bg-blue-100 text-blue-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }
        ${className}
      `}
    >
      {icon && <span className="mr-3">{icon}</span>}
      <span>{label}</span>
      {badge && (
        <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
