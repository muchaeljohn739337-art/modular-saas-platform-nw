import React from 'react';
import { Outlet } from 'react-router-dom';

interface SidebarProps {
  children?: React.ReactNode;
  role?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ children, role }) => {
  return (
    <div className="w-64 bg-gray-900 text-white h-screen">
      <div className="p-4">
        <h2 className="text-xl font-bold">
          {role ? `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard` : 'Dashboard'}
        </h2>
      </div>
      <nav className="mt-8">
        {children}
      </nav>
    </div>
  );
};

export default Sidebar;
