"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  Calendar,
  Bell,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  Phone,
  Menu,
  X,
  Plus,
  Trash2,
  Edit2,
  CalendarDays,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Reminder {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  status: string;
  repeatType: string;
}

let editingReminder: Reminder | null = null;

export default function RemindersPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    repeatType: "NONE",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editReminder, setEditReminder] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    repeatType: "NONE",
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user]);

  const fetchReminders = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/reminders?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const createReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(newReminder),
      });

      if (res.ok) {
        const created = await res.json();
        setReminders([...reminders, created]);
        setShowCreateModal(false);
        setNewReminder({
          title: "",
          description: "",
          scheduledAt: "",
          repeatType: "NONE",
        });
        toast.success("Reminder created successfully");
      }
    } catch (error) {
      console.error("Failed to create reminder:", error);
      toast.error("Failed to create reminder");
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm("Delete this reminder?")) return;

    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": user?.id || "" },
      });

      if (res.ok) {
        setReminders(reminders.filter((r) => r.id !== id));
        toast.success("Reminder deleted successfully");
      }
    } catch (error) {
      console.error("Failed to delete reminder:", error);
      toast.error("Failed to delete reminder");
    }
  };

  const handleEditClick = (reminder: Reminder) => {
    editingReminder = reminder;
    const scheduledDate = new Date(reminder.scheduledAt);
    const localDate = new Date(
      scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000,
    );
    setEditReminder({
      title: reminder.title,
      description: reminder.description || "",
      scheduledAt: localDate.toISOString().slice(0, 16),
      repeatType: reminder.repeatType,
    });
    setShowEditModal(true);
  };

  const updateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingReminder) return;

    try {
      const res = await fetch(`/api/reminders/${editingReminder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(editReminder),
      });

      if (res.ok) {
        const updated = await res.json();
        setReminders(
          reminders.map((r) => (r.id === editingReminder!.id ? updated : r)),
        );
        setShowEditModal(false);
        editingReminder = null;
        toast.success("Reminder updated successfully");
      }
    } catch (error) {
      console.error("Failed to update reminder:", error);
      toast.error("Failed to update reminder");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#25D366]"></div>
      </div>
    );
  }

  const navItems = [
    { icon: Bot, label: "Conversations", href: "/dashboard" },
    { icon: Bell, label: "Reminders", href: "/dashboard/reminders" },
    { icon: Calendar, label: "Calendar", href: "/dashboard/calendar" },
    { icon: FileText, label: "Documents", href: "/dashboard/documents" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50 lg:hidden">
        <div className="flex items-center gap-2">
          <Bot className="h-8 w-8 text-[#25D366]" />
          <span className="font-bold text-gray-800">Reminders</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </header>

      <nav
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white shadow-xl transform transition-transform duration-300 z-50 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-2">
          {navItems.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === item.href
                  ? "bg-[#25D366]/10 text-[#25D366]"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white font-semibold">
              {getInitials(user.fullName)}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800">
                {user.fullName}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </nav>

      <aside
        className={`hidden lg:flex bg-white border-r border-gray-200 flex-col fixed h-full transition-all duration-300 z-30 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="h-16 border-b border-gray-200 flex items-center justify-center px-2">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-[#25D366] flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="font-bold text-gray-800 truncate">
                My Assistant
              </span>
            )}
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                sidebarCollapsed ? "justify-center" : ""
              } ${pathname === item.href ? "bg-[#25D366]/10 text-[#25D366] font-medium" : "text-gray-700 hover:bg-gray-100"}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>
        <div
          className={`p-2 border-t border-gray-200 ${sidebarCollapsed ? "" : "p-4"}`}
        >
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white font-semibold">
                  {getInitials(user.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={logout}
              className="w-full flex items-center justify-center p-3 text-gray-600 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </aside>

      <main
        className={`flex-1 overflow-auto transition-all duration-300 pt-16 lg:pt-0 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}
      >
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight
                className={`h-5 w-5 transition-transform duration-300 ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Reminders</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">New Reminder</span>
            </button>
          </div>
        </header>

        <div className="p-6">
          {isFetching ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#25D366]"></div>
            </div>
          ) : reminders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No reminders yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first reminder to stay on track
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E]"
              >
                <Plus className="h-4 w-4" />
                Create Reminder
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4"
                >
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Bell className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {reminder.title}
                    </h3>
                    {reminder.description && (
                      <p className="text-sm text-gray-500 truncate">
                        {reminder.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(reminder.scheduledAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(reminder.scheduledAt)}
                      </span>
                      {reminder.repeatType !== "NONE" && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          {reminder.repeatType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        reminder.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {reminder.status}
                    </span>
                    <button
                      onClick={() => handleEditClick(reminder)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">
                Create New Reminder
              </h2>
            </div>
            <form onSubmit={createReminder} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newReminder.title}
                  onChange={(e) =>
                    setNewReminder({ ...newReminder, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  placeholder="Call mom at 5pm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newReminder.description}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  placeholder="Remember to ask about the recipe"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newReminder.scheduledAt}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      scheduledAt: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repeat
                </label>
                <select
                  value={newReminder.repeatType}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      repeatType: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                >
                  <option value="NONE">No repeat</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E]"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">Edit Reminder</h2>
            </div>
            <form onSubmit={updateReminder} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editReminder.title}
                  onChange={(e) =>
                    setEditReminder({ ...editReminder, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  placeholder="Call mom at 5pm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={editReminder.description}
                  onChange={(e) =>
                    setEditReminder({
                      ...editReminder,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  placeholder="Remember to ask about the recipe"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={editReminder.scheduledAt}
                  onChange={(e) =>
                    setEditReminder({
                      ...editReminder,
                      scheduledAt: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repeat
                </label>
                <select
                  value={editReminder.repeatType}
                  onChange={(e) =>
                    setEditReminder({
                      ...editReminder,
                      repeatType: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                >
                  <option value="NONE">No repeat</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    editingReminder = null;
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E]"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
