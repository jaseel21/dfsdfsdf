import React from "react";
import { PlusCircle, Download, Users } from "lucide-react";
import Link from "next/link";

interface AdminHeaderProps {
  title: string;
  description: string;
  onAddNew: () => void;
  showYatheemButton?: boolean;
  icon?: React.ElementType;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ title, description, onAddNew, showYatheemButton = false, icon: Icon = PlusCircle }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">
          {title}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
      </div>

      <div className="flex gap-2 w-full sm:w-auto flex-wrap">
        {showYatheemButton && (
          <Link
            href="/admin/sponsorships/yatheem-list"
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 flex items-center shadow-lg"
          >
            <Users className="h-4 w-4 mr-2" /> Manage Yatheem
          </Link>
        )}
        {onAddNew && (
          <button
            onClick={onAddNew}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 flex items-center shadow-lg"
          >
            <Icon className="h-4 w-4 mr-2" /> Add New
          </button>
        )}
        <button
          onClick={() => {
            // Export functionality can be added here
            alert("Export functionality will be implemented");
          }}
          className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-sm font-medium hover:bg-white/20 transition-all duration-300 flex items-center"
        >
          <Download className="h-4 w-4 mr-2" /> Export
        </button>
        {!showYatheemButton && (
          <Link
            href="/admin/sponsorships/create"
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-green-600 transition-all duration-300 flex items-center shadow-lg"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add Sponsorship
          </Link>
        )}
      </div>
    </div>
  );
};

export default AdminHeader;