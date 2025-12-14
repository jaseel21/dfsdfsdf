// src/app/admin/(admin)/settings/users/page.tsx
"use client";
import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useSession } from "next-auth/react";
import NoAccess from "@/components/NoAccess";
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Users,
  Shield,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff,
  XCircle
} from "lucide-react";

// Admin type
interface Admin {
  _id?: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  permissions: string[];
}

// Props for AdminForm
interface AdminFormProps {
  initial?: Admin;
  onSave: (admin: Admin) => Promise<void>;
  onCancel: () => void;
}

// Master permission list
const ALL_PERMISSIONS = [
  { section: "Dashboard", permissions: [
    { key: "dashboard_overview", label: "Dashboard - Over View" },
  ]},
  { section: "Donation", permissions: [
    { key: "donation_all", label: "All Donations" },
    { key: "donation_create", label: "Create Donations" },
    { key: "donation_receipts", label: "Generate Receipts" },
    { key: "donation_management", label: "Donor Management" },
  ]},
  { section: "Campaigns", permissions: [
    { key: "campaigns_ongoing", label: "Ongoing Campaigns" },
    { key: "campaigns_all", label: "All Campaigns" },
    { key: "campaigns_create", label: "Create Campaign" },
  ]},
  { section: "Photo Framing", permissions: [
    { key: "photoframing_all", label: "View All Frames" },
    { key: "photoframing_create", label: "Create Frames" },
    { key: "photoframing_track", label: "Track Progress" },
  ]},
  { section: "Daily Status", permissions: [
    { key: "status_all", label: "View All Status" },
    { key: "status_create", label: "Create Status" },
    { key: "status_track", label: "Track Progress" },
  ]},
  { section: "Institutions", permissions: [
    { key: "institutions_list", label: "List Institutions" },
    { key: "institutions_add", label: "Add Institution" },
  ]},
  { section: "Notification System", permissions: [
    { key: "notifications_templates", label: "Manage Templates" },
    { key: "notifications_send", label: "Send Notifications" },
    { key: "notifications_track", label: "Track Delivery" },
  ]},
  { section: "Sponsorship Programs", permissions: [
    { key: "sponsorships_list", label: "List Sponsors" },
    { key: "sponsorships_create", label: "Create Sponsors" },
    { key: "sponsorships_yatheem", label: "Yatheem Sponsorships" },
    { key: "sponsorships_hafiz", label: "Hafiz Sponsorships" },
  ]},
  { section: "Subscriptions", permissions: [
    { key: "subscriptions_overview", label: "Subscriptions Overview" },
    { key: "subscriptions_list", label: "List Subscriptions" },
    { key: "subscriptions_auto", label: "Auto Subscriptions" },
    { key: "subscriptions_manual", label: "Manual Subscriptions" },
    { key: "subscriptions_logs", label: "View Logs" },
  ]},
  { section: "Volunteers", permissions: [
    { key: "volunteers_list", label: "List Volunteers" },
    { key: "volunteers_add", label: "Add Volunteer" },
  ]},
  { section: "Box Holders", permissions: [
    { key: "boxholders_all", label: "All Boxes" },
    { key: "boxholders_add", label: "Add Boxes" },
    { key: "boxholders_csv", label: "CSV Import" },
  ]},
  { section: "Backup & Restore", permissions: [
    { key: "backup_restore", label: "BackUp and Restore" },
  ]},
  { section: "Settings", permissions: [
    { key: "settings_users", label: "User Management" },
  ]},
];

function AdminForm({ initial, onSave, onCancel }: AdminFormProps) {
  const [form, setForm] = useState<Admin>(
    initial || { name: "", phone: "", email: "", role: "Admin", permissions: [] }
  );
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePermChange = (perm: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
            {/* Admin Information Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white pb-2 border-b border-white/10 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Admin Information
          </h3>
          <div className="space-y-4">
                <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name*
                  </label>
                  <input 
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    placeholder="Enter full name" 
                    required 
                className="px-3 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border dark:border-white/20 border-gray-600/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-300" 
                  />
                </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number*
                  </label>
                  <input 
                    name="phone" 
                  type="tel"
                    value={form.phone} 
                    onChange={handleChange} 
                    placeholder="Enter phone number" 
                    required 
                  className="px-3 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border dark:border-white/20 border-gray-600/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-300" 
                  />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address*
                </label>
                <input 
                  name="email" 
                  type="email"
                  value={form.email} 
                  onChange={handleChange} 
                  placeholder="Enter email address" 
                  required 
                  className="px-3 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border dark:border-white/20 border-gray-600/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-300" 
                />
              </div>
            </div>
          </div>
              </div>
              
        {/* Role Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white pb-2 border-b border-white/10 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Role Assignment
          </h3>
              <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Role*
                </label>
                <select 
                  name="role" 
                  value={form.role} 
                  onChange={handleChange} 
              className="px-3 py-2 w-full bg-white/10 backdrop-blur-md rounded-lg border dark:border-white/20 border-gray-600/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 dark:text-gray-200"
                >
              <option className="text-black" value="Admin">Admin</option>
              <option className="text-black" value="Super Admin">Super Admin</option>
                </select>
              </div>
            </div>

            {/* Permissions Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white pb-2 border-b border-white/10 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Permissions
          </h3>
              <div className="space-y-3">
            {ALL_PERMISSIONS.map(group => (
              <div key={group.section} className="border border-white/10 rounded-lg overflow-hidden">
                          <button
                            type="button"
                  onClick={() => toggleSection(group.section)}
                  className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between text-left"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">{group.section}</span>
                  {expandedSections[group.section] ? 
                    <EyeOff className="h-4 w-4 text-gray-500" /> : 
                    <Eye className="h-4 w-4 text-gray-500" />
                  }
                          </button>
                {expandedSections[group.section] && (
                  <div className="p-4 bg-white/2 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {group.permissions.map(perm => (
                      <label key={perm.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={form.permissions?.includes(perm.key) ?? false}
                                  onChange={() => handlePermChange(perm.key)}
                          className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400 border-gray-300"
                                />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{perm.label}</span>
                              </label>
                            ))}
                        </div>
                      )}
                    </div>
            ))}
              </div>
        </div>

        {/* Actions Section */}
        <div className="flex gap-3 justify-end pt-4">
            <button 
              type="button" 
            className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-sm font-medium hover:bg-white/20 transition-all duration-300" 
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center ${
              saving
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600"
            }`}
              disabled={saving}
            >
              {saving ? (
                <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Admin
              </>
              )}
            </button>
          </div>
      </form>
    </div>
  );
}

export default function UserManagementPage() {
  const { data: session, status } = useSession();
  const isSuperAdmin = session?.user?.role === "Super Admin";
  const hasPermission = isSuperAdmin || (session?.user as { permissions?: string[] })?.permissions?.includes("settings_users");
  
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "Super Admin") {
      fetchAdmins();
    } else if (status === "authenticated") {
      setError("You do not have permission to access this page.");
      setLoading(false);
    }
  }, [status, session]);

  if (status === "loading") return null;
  if (!hasPermission) return <NoAccess />;

  async function fetchAdmins() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        headers: {
          'Content-Type': 'application/json',
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch admins");
      setAdmins(await res.json());
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
      setError(errorMessage);
    }
    setLoading(false);
  }

  async function handleSave(admin: Admin) {
    setError("");
    // Prevent saving if no permissions are selected
    if (!admin.permissions || admin.permissions.length === 0) {
      setError("Please select at least one permission for this admin.");
      return;
    }
    try {
      const method = editAdmin ? "PUT" : "POST";
      const res = await fetch("/api/admin", {
        method,
        headers: {
          'Content-Type': 'application/json',
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
        body: JSON.stringify(editAdmin ? { ...admin, id: editAdmin._id } : admin),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save admin");
      setShowForm(false);
      setEditAdmin(null);
      fetchAdmins();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
      setError(errorMessage);
    }
  }

  const handleDeleteClick = (admin: Admin) => {
    setAdminToDelete(admin);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!adminToDelete) return;
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
        body: JSON.stringify({ id: adminToDelete._id }),
      });
      if (!res.ok) throw new Error("Failed to delete admin");
      setDeleteConfirmOpen(false);
      setAdminToDelete(null);
      fetchAdmins();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setAdminToDelete(null);
  };

  const refreshData = () => {
    fetchAdmins();
  };

  const RoleBadge = ({ role }: { role: string }) => {
    const isSuper = role === "Super Admin";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isSuper 
          ? "bg-purple-500/20 text-purple-500" 
          : "bg-blue-500/20 text-blue-500"
      }`}>
        {role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="relative w-12 h-12">
          <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">Admin Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage all admin users and their permissions
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-green-600 transition-all duration-300 flex items-center"
            onClick={() => { setShowForm(true); setEditAdmin(null); }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Admin
          </button>
          <button
            className="px-3 py-2 bg-white/10 text-black dark:text-white backdrop-blur-md rounded-lg border dark:border-white/20 border-gray-600/20 text-sm font-medium hover:bg-white/20 transition-all duration-300 flex items-center"
            onClick={refreshData}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main content section */}
      <div className="bg-transparent md:bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-none md:border-white/20 shadow-xl">
            {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky top-0 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider rounded-tl-lg">
                    Name
                  </th>
                  <th className="sticky top-0 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="sticky top-0 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="sticky top-0 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="sticky top-0 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider rounded-tr-lg">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
              {admins.map((admin, index) => (
                  <tr
                    key={admin._id}
                    className={`hover:bg-white/5 dark:hover:bg-gray-800/50 backdrop-blur-md transition-all group ${
                      index % 2 === 0 ? "bg-white/2" : "bg-white/5 dark:bg-gray-800/20"
                    }`}
                  >
                    <td className="p-3 border-b border-white/10">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{admin.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{admin.email}</div>
                    </td>
                    <td className="p-3 border-b border-white/10">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{admin.phone}</div>
                    </td>
                    <td className="p-3 border-b border-white/10">
                      <RoleBadge role={admin.role} />
                    </td>
                    <td className="p-3 border-b border-white/10">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {admin.permissions && admin.permissions.length > 0
                        ? `${admin.permissions.length} permissions`
                        : <span className="text-gray-400">No permissions</span>}
                      </div>
                    </td>
                    <td className="p-3 border-b border-white/10">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                        <button
                        className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
                          onClick={() => { setEditAdmin(admin); setShowForm(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                        className="p-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                        onClick={() => handleDeleteClick(admin)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
          {admins.map((admin) => (
                <div
                  key={admin._id}
                  className="p-4 bg-white/5 dark:bg-gray-800/20 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
              <div className="flex justify-between items-start mb-2">
                      <div>
                  <div className="text-sm font-bold text-gray-800 dark:text-white mb-1">{admin.name}</div>
                  <div className="text-xs text-gray-500">{admin.phone}</div>
                    </div>
                    <RoleBadge role={admin.role} />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{admin.email}</div>
              <div className="mb-2">
                <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">Permissions: </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {admin.permissions && admin.permissions.length > 0
                    ? `${admin.permissions.length} permissions assigned`
                    : "No permissions"}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 px-3 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50 text-xs font-medium transition-colors flex items-center justify-center"
                  onClick={() => { setEditAdmin(admin); setShowForm(true); }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </button>
                <button
                  className="flex-1 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 text-xs font-medium transition-colors flex items-center justify-center"
                  onClick={() => handleDeleteClick(admin)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
                  </div>

        {/* Empty state */}
        {admins.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6">
              <Users className="h-12 w-12 text-gray-400" />
                    </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No admins found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding your first admin user
            </p>
                    </div>
        )}
                  </div>

      {/* Modal for Add/Edit */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full shadow-2xl max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                {editAdmin ? <Edit className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                {editAdmin ? "Edit Admin" : "Add New Admin"}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditAdmin(null); }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <AdminForm
                initial={editAdmin || undefined}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditAdmin(null); }}
              />
            </div>
                      </div>
                    </div>
                  )}

      {/* Delete Confirmation Modal - Continuation */}
      {deleteConfirmOpen && adminToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-red-500" />
              Confirm Deletion
            </h3>

            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete the admin{" "}
              <span className="font-semibold">{adminToDelete.name}</span>?
              <br />
              <br />
              <span className="text-red-600 dark:text-red-400 text-sm">
                This action cannot be undone and will remove all associated permissions.
              </span>
            </p>

            <div className="flex justify-end space-x-3">
                    <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-sm font-medium hover:bg-white/20 transition-all duration-300"
                disabled={isDeleting}
                    >
                Cancel
                    </button>
                    <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-300 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Admin
                  </>
                )}
                    </button>
                  </div>
                </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-3 rounded-lg shadow-lg z-50 max-w-md">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 mr-2" />
            <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
    </div>
  );
}

// Additional helper components and styles for the user management page

// Permission display component for detailed view
const PermissionsList = ({ permissions }: { permissions: string[] }) => {
  if (!permissions || permissions.length === 0) {
    return (
      <div className="text-gray-400 text-sm italic">
        No permissions assigned
            </div>
    );
  }

  const groupedPermissions: { [key: string]: string[] } = {};
  
  permissions.forEach(perm => {
    ALL_PERMISSIONS.forEach(group => {
      group.permissions.forEach(p => {
        if (p.key === perm) {
          if (!groupedPermissions[group.section]) {
            groupedPermissions[group.section] = [];
          }
          groupedPermissions[group.section].push(p.label);
        }
      });
    });
  });

  return (
    <div className="space-y-2">
      {Object.entries(groupedPermissions).map(([section, perms]) => (
        <div key={section} className="text-xs">
          <div className="font-medium text-gray-600 dark:text-gray-400 mb-1">
            {section}:
              </div>
          <div className="pl-2 space-y-1">
            {perms.map(perm => (
              <div key={perm} className="text-gray-500 dark:text-gray-500">
                • {perm}
              </div>
            ))}
            </div>
          </div>
      ))}
      </div>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="p-4 bg-white/5 dark:bg-gray-800/20 backdrop-blur-md rounded-xl border border-white/10 animate-pulse">
        <div className="flex justify-between items-start mb-2">
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
          </div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
        </div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
        </div>
      </div>
    ))}
    </div>
  );

// Stats component for admin overview
const AdminStats = ({ admins }: { admins: Admin[] }) => {
  const totalAdmins = admins.length;
  const superAdmins = admins.filter(admin => admin.role === "Super Admin").length;
  const regularAdmins = admins.filter(admin => admin.role === "Admin").length;
  const adminStats = [
    {
      label: "Total Admins",
      value: totalAdmins,
      icon: Users,
      color: "bg-blue-500/20 text-blue-500"
    },
    {
      label: "Super Admins",
      value: superAdmins,
      icon: Shield,
      color: "bg-purple-500/20 text-purple-500"
    },
    {
      label: "Regular Admins",
      value: regularAdmins,
      icon: Users,
      color: "bg-green-500/20 text-green-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {adminStats.map((stat, index) => (
        <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-full ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Export the additional components
export { PermissionsList, LoadingSkeleton, AdminStats };

// Custom CSS styles to be added to globals.css or component styles
const customStyles = `
/* Animations for modal transitions */
.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Custom scrollbar styles */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Hover effects for cards */
.admin-card {
  transition: all 0.3s ease;
}

.admin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Permission checkbox styles */
.permission-checkbox {
  accent-color: #10b981;
}

.permission-checkbox:checked {
  background-color: #10b981;
  border-color: #10b981;
}

/* Button hover animations */
.btn-hover {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-hover:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-hover:hover:before {
  left: 100%;
}
`;

// TypeScript interfaces for better type safety
interface AdminFormData {
  name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Super Admin';
  permissions: string[];
}

interface AdminTableProps {
  admins: Admin[];
  onEdit: (admin: Admin) => void;
  onDelete: (admin: Admin) => void;
  loading?: boolean;
}

interface PermissionGroup {
  section: string;
  permissions: Array<{
    key: string;
    label: string;
  }>;
}

// Utility functions for admin management
const adminUtils = {
  // Format admin data for display
  formatAdminData: (admin: Admin) => ({
    ...admin,
    displayName: admin.name || 'N/A',
    displayEmail: admin.email || 'N/A',
    displayPhone: admin.phone || 'N/A',
    permissionCount: admin.permissions?.length || 0
  }),

  // Validate admin form data
  validateAdminForm: (formData: AdminFormData): string[] => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push('Name is required');
    }
    
    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push('Invalid email format');
    }
    
    if (!formData.phone.trim()) {
      errors.push('Phone number is required');
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.push('Invalid phone number format');
    }
    
    return errors;
  },

  // Get permission summary
  getPermissionSummary: (permissions: string[]): string => {
    if (!permissions || permissions.length === 0) {
      return 'No permissions';
    }
    
    const sections = new Set<string>();
    permissions.forEach(perm => {
      ALL_PERMISSIONS.forEach(group => {
        if (group.permissions.some(p => p.key === perm)) {
          sections.add(group.section);
        }
      });
    });
    
    return `${permissions.length} permissions across ${sections.size} sections`;
  }
};

export { customStyles, adminUtils };
export type { AdminFormData, AdminTableProps, PermissionGroup };