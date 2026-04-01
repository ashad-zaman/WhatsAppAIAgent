"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  FileText,
  MessageSquare,
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Save,
  CheckCircle,
  Lock,
  Key,
  Brain,
  Workflow,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  fullName: string;
  plan: string;
  createdAt: string;
  _count?: { reminders: number; documents: number };
}

interface Agent {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  systemPrompt?: string;
  apiKey?: string;
  config?: Record<string, unknown>;
  description?: string;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  time: string;
  type: "user" | "reminder" | "document" | "system";
}

interface Workflow {
  id: string;
  name: string;
  type: string;
  status: string;
  enabled: boolean;
  schedule?: string | null;
  trigger?: string | null;
  steps?: string | [];
  createdAt: string;
  updatedAt?: string;
}

export default function AdminDashboard() {
  const { user, logout, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [saving, setSaving] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const [userForm, setUserForm] = useState({
    email: "",
    fullName: "",
    plan: "FREE",
    password: "",
  });

  const [agentForm, setAgentForm] = useState({
    name: "",
    type: "REMINDER",
    systemPrompt: "",
    apiKey: "",
    isActive: true,
  });

  const [settingsForm, setSettingsForm] = useState({
    platformName: "WhatsApp AI Platform",
    adminEmail: user?.email || "",
    openaiApiKey: "",
    defaultModel: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 1000,
  });

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [user, isAdmin, isLoading, router]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
      fetchAgents();
      fetchWorkflows();
      fetchSettings();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (user) {
      setSettingsForm((prev) => ({ ...prev, adminEmail: user.email }));
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          setSettingsForm((prev) => ({
            ...prev,
            platformName: data.platformName || prev.platformName,
            openaiApiKey: data.openaiApiKey || "",
            defaultModel: data.defaultModel || "gpt-4o-mini",
            temperature: data.temperature ?? 0.7,
            maxTokens: data.maxTokens ?? 1000,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/admin/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const res = await fetch("/api/workflows?userId=admin");
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
      }
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({ email: "", fullName: "", plan: "FREE", password: "" });
    setShowUserModal(true);
  };

  const handleEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({
      email: u.email,
      fullName: u.fullName,
      plan: u.plan,
      password: "",
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (u: User) => {
    if (!confirm(`Are you sure you want to delete user "${u.fullName}"?`))
      return;
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter((us) => us.id !== u.id));
        toast.success("User deleted successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user. Please try again.");
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingUser) {
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userForm.email,
            fullName: userForm.fullName,
            plan: userForm.plan,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setUsers(
            users.map((u) =>
              u.id === editingUser.id ? { ...u, ...updated } : u,
            ),
          );
          setShowUserModal(false);
          toast.success("User updated successfully");
        } else {
          const error = await res.json();
          toast.error(error.error || "Failed to update user");
        }
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
        if (res.ok) {
          const created = await res.json();
          setUsers([created, ...users]);
          setShowUserModal(false);
          toast.success("User created successfully");
        } else {
          const error = await res.json();
          toast.error(error.error || "Failed to create user");
        }
      }
    } catch (error) {
      console.error("Failed to save user:", error);
      toast.error("Failed to save user. Please try again.");
    }

    setSaving(false);
  };

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setAgentForm({
      name: "",
      type: "REMINDER",
      systemPrompt: "",
      apiKey: "",
      isActive: true,
    });
    setShowAgentModal(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setAgentForm({
      name: agent.name,
      type: agent.type,
      systemPrompt: agent.systemPrompt || "",
      apiKey: (agent as any).apiKey || "",
      isActive: agent.isActive,
    });
    setShowAgentModal(true);
  };

  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingAgent) {
        const res = await fetch(`/api/admin/agents/${editingAgent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(agentForm),
        });
        if (res.ok) {
          const updated = await res.json();
          setAgents(
            agents.map((a) => (a.id === editingAgent.id ? updated : a)),
          );
          toast.success("Agent updated successfully");
        } else {
          toast.error("Failed to update agent");
        }
      } else {
        const res = await fetch("/api/admin/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(agentForm),
        });
        if (res.ok) {
          const created = await res.json();
          setAgents([created, ...agents]);
          toast.success("Agent created successfully");
        } else {
          toast.error("Failed to create agent");
        }
      }
      setShowAgentModal(false);
    } catch (error) {
      console.error("Failed to save agent:", error);
      toast.error("Failed to save agent");
    }

    setSaving(false);
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    try {
      const res = await fetch(`/api/admin/agents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAgents(agents.filter((a) => a.id !== id));
        toast.success("Agent deleted successfully");
      } else {
        toast.error("Failed to delete agent");
      }
    } catch (error) {
      console.error("Failed to delete agent:", error);
      toast.error("Failed to delete agent");
    }
  };

  const handleToggleWorkflow = async (workflow: Workflow) => {
    try {
      const res = await fetch("/api/workflows", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: workflow.id,
          action: "toggle",
          enabled: !workflow.enabled,
        }),
      });
      if (res.ok) {
        setWorkflows(
          workflows.map((w) =>
            w.id === workflow.id ? { ...w, enabled: !workflow.enabled } : w,
          ),
        );
        toast.success(
          workflow.enabled ? "Workflow disabled" : "Workflow enabled",
        );
      }
    } catch (error) {
      console.error("Failed to toggle workflow:", error);
      toast.error("Failed to toggle workflow");
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      if (res.ok) {
        setWorkflows(workflows.filter((w) => w.id !== id));
        toast.success("Workflow deleted successfully");
      } else {
        toast.error("Failed to delete workflow");
      }
    } catch (error) {
      console.error("Failed to delete workflow:", error);
      toast.error("Failed to delete workflow");
    }
  };

  const handleSaveWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingWorkflow ? "PUT" : "POST";
      const url = editingWorkflow
        ? `/api/workflows/${editingWorkflow.id}`
        : "/api/workflows";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...workflowForm,
          userId: user?.id,
        }),
      });

      if (res.ok) {
        toast.success(
          editingWorkflow ? "Workflow updated" : "Workflow created",
        );
        setShowWorkflowModal(false);
        fetchWorkflows();
      } else {
        toast.error("Failed to save workflow");
      }
    } catch (error) {
      console.error("Failed to save workflow:", error);
      toast.error("Failed to save workflow");
    }
    setSaving(false);
  };

  const [workflowForm, setWorkflowForm] = useState({
    name: "",
    type: "CUSTOM",
    schedule: "",
    trigger: "",
    enabled: true,
  });

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      if (res.ok) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const stats = [
    {
      title: "Total Users",
      value: users.length.toString(),
      change: "+12%",
      trend: "up" as const,
      icon: <Users className="w-6 h-6" />,
    },
    {
      title: "Active Sessions",
      value: "89",
      change: "+5%",
      trend: "up" as const,
      icon: <Activity className="w-6 h-6" />,
    },
    {
      title: "Messages Today",
      value: "2,847",
      change: "+18%",
      trend: "up" as const,
      icon: <MessageSquare className="w-6 h-6" />,
    },
    {
      title: "System Uptime",
      value: "99.9%",
      change: "0%",
      trend: "up" as const,
      icon: <Clock className="w-6 h-6" />,
    },
  ];

  const recentActivity: RecentActivity[] = [
    {
      id: "1",
      user: "John Doe",
      action: "Created a new reminder",
      time: "2 min ago",
      type: "reminder",
    },
    {
      id: "2",
      user: "Sarah Smith",
      action: "Uploaded a document",
      time: "5 min ago",
      type: "document",
    },
    {
      id: "3",
      user: "System",
      action: "AI model updated",
      time: "15 min ago",
      type: "system",
    },
    {
      id: "4",
      user: "Mike Johnson",
      action: "Logged in",
      time: "20 min ago",
      type: "user",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 z-40">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <span className="font-semibold">Admin Panel</span>
        </div>
        <button
          onClick={logout}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-800 border-r border-slate-700 z-50 transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-700">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold">Admin Panel</h1>
              <p className="text-xs text-slate-400">WhatsApp AI Platform</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {[
              {
                id: "dashboard",
                label: "Dashboard",
                icon: <LayoutDashboard className="w-5 h-5" />,
              },
              {
                id: "users",
                label: "User Management",
                icon: <Users className="w-5 h-5" />,
              },
              {
                id: "agents",
                label: "AI Agents",
                icon: <Bot className="w-5 h-5" />,
              },
              {
                id: "workflows",
                label: "Workflows",
                icon: <Workflow className="w-5 h-5" />,
              },
              {
                id: "analytics",
                label: "Analytics",
                icon: <BarChart3 className="w-5 h-5" />,
              },
              {
                id: "monitoring",
                label: "Monitoring",
                icon: <Activity className="w-5 h-5" />,
              },
              {
                id: "security",
                label: "Security",
                icon: <Shield className="w-5 h-5" />,
              },
              {
                id: "settings",
                label: "Settings",
                icon: <Settings className="w-5 h-5" />,
              },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? "bg-purple-500/20 text-purple-400" : "text-slate-400 hover:bg-slate-700/50 hover:text-white"}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-700/50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{user.fullName}</p>
                <p className="text-xs text-slate-400">Administrator</p>
              </div>
              <button
                onClick={logout}
                className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <>
              <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                        {stat.icon}
                      </div>
                      <span
                        className={`flex items-center gap-1 text-sm ${stat.trend === "up" ? "text-green-400" : "text-red-400"}`}
                      >
                        {stat.trend === "up" ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {stat.change}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                    <p className="text-slate-400 text-sm">{stat.title}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === "user" ? "bg-blue-500/20 text-blue-400" : activity.type === "reminder" ? "bg-green-500/20 text-green-400" : activity.type === "document" ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-500/20 text-slate-400"}`}
                      >
                        {activity.type === "user" && (
                          <Users className="w-5 h-5" />
                        )}
                        {activity.type === "reminder" && (
                          <Clock className="w-5 h-5" />
                        )}
                        {activity.type === "document" && (
                          <FileText className="w-5 h-5" />
                        )}
                        {activity.type === "system" && (
                          <Activity className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-slate-400">
                          {activity.user}
                        </p>
                      </div>
                      <span className="text-sm text-slate-500">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">User Management</h1>
                <button
                  onClick={handleAddUser}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 rounded-xl hover:bg-purple-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add User
                </button>
              </div>

              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-4 font-medium text-slate-400">
                        User
                      </th>
                      <th className="text-left p-4 font-medium text-slate-400">
                        Plan
                      </th>
                      <th className="text-left p-4 font-medium text-slate-400">
                        Created
                      </th>
                      <th className="text-left p-4 font-medium text-slate-400">
                        Status
                      </th>
                      <th className="text-right p-4 font-medium text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-slate-700/50 hover:bg-slate-700/30"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                {u.fullName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">{u.fullName}</p>
                                <p className="text-sm text-slate-400">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm ${u.plan === "ENTERPRISE" ? "bg-purple-500/20 text-purple-400" : u.plan === "PRO" ? "bg-blue-500/20 text-blue-400" : "bg-slate-500/20 text-slate-400"}`}
                            >
                              {u.plan}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <span className="flex items-center gap-2 text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              Active
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditUser(u)}
                                className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-slate-400"
                        >
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* AI Agents Tab */}
          {activeTab === "agents" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">AI Agents Configuration</h1>
                <button
                  onClick={handleCreateAgent}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 rounded-xl hover:bg-purple-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Agent
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                        <Bot className="w-6 h-6" />
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${agent.isActive ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}`}
                      >
                        {agent.isActive ? "active" : "inactive"}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1">{agent.name}</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      {agent.systemPrompt || agent.type}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditAgent(agent)}
                        className="flex-1 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm"
                      >
                        Configure
                      </button>
                      <button
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="p-2 bg-slate-700 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Workflows Tab */}
          {activeTab === "workflows" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Workflows Management</h1>
                <button
                  onClick={() => {
                    setEditingWorkflow(null);
                    setShowWorkflowModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 rounded-xl hover:bg-purple-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Workflow
                </button>
              </div>

              {workflows.length === 0 ? (
                <div className="text-center py-12">
                  <Workflow className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">
                    No workflows configured yet
                  </p>
                  <button
                    onClick={() => {
                      setEditingWorkflow(null);
                      setShowWorkflowModal(true);
                    }}
                    className="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Create your first workflow
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                          <Workflow className="w-6 h-6" />
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${workflow.enabled ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}`}
                        >
                          {workflow.enabled ? "active" : "inactive"}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-1">{workflow.name}</h3>
                      <p className="text-sm text-slate-400 mb-4">
                        {workflow.type || "Custom workflow"}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingWorkflow(workflow);
                            setShowWorkflowModal(true);
                          }}
                          className="flex-1 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm"
                        >
                          Configure
                        </button>
                        <button
                          onClick={() => handleToggleWorkflow(workflow)}
                          className="p-2 bg-slate-700 rounded-lg hover:bg-green-500/20 hover:text-green-400 transition-colors"
                          title={workflow.enabled ? "Disable" : "Enable"}
                        >
                          {workflow.enabled ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Key className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                          className="p-2 bg-slate-700 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <>
              <h1 className="text-2xl font-bold mb-6">Analytics & Reports</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h2 className="text-lg font-semibold mb-4">
                    Usage by Feature
                  </h2>
                  <div className="space-y-4">
                    {[
                      {
                        name: "Reminders",
                        percent: 45,
                        color: "bg-purple-500",
                      },
                      { name: "Calendar", percent: 30, color: "bg-blue-500" },
                      { name: "Documents", percent: 15, color: "bg-green-500" },
                      { name: "Chat", percent: 10, color: "bg-yellow-500" },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span>{item.name}</span>
                          <span className="text-slate-400">
                            {item.percent}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full`}
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h2 className="text-lg font-semibold mb-4">User Growth</h2>
                  <div className="flex items-end gap-2 h-40">
                    {[40, 55, 45, 70, 65, 80, 75, 90, 85, 95, 88, 100].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"
                          style={{ height: `${h}%` }}
                        />
                      ),
                    )}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-slate-400">
                    <span>Jan</span>
                    <span>Dec</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <>
              <h1 className="text-2xl font-bold mb-6">System Settings</h1>
              <div className="max-w-2xl space-y-6">
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h2 className="text-lg font-semibold mb-4">
                    General Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Platform Name
                      </label>
                      <input
                        type="text"
                        value={settingsForm.platformName}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            platformName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Admin Email
                      </label>
                      <input
                        type="email"
                        value={settingsForm.adminEmail}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            adminEmail: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    AI Configuration
                  </h2>
                  <p className="text-sm text-slate-400 mb-4">
                    Configure the default AI model and API keys for all agents
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        OpenAI API Key
                      </label>
                      <input
                        type="password"
                        value={settingsForm.openaiApiKey}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            openaiApiKey: e.target.value,
                          })
                        }
                        placeholder="sk-..."
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Leave empty to use system environment variable
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Default AI Model
                      </label>
                      <select
                        value={settingsForm.defaultModel}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            defaultModel: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="gpt-4o">GPT-4O (Latest)</option>
                        <option value="gpt-4o-mini">GPT-4O Mini (Fast)</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">
                          GPT-3.5 Turbo (Budget)
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Temperature: {settingsForm.temperature}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settingsForm.temperature}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            temperature: parseFloat(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Precise</span>
                        <span>Creative</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Max Tokens: {settingsForm.maxTokens}
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="32000"
                        value={settingsForm.maxTokens}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            maxTokens: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h2 className="text-lg font-semibold mb-4">Danger Zone</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <div>
                        <p className="font-medium text-red-400">
                          Reset All Data
                        </p>
                        <p className="text-sm text-slate-400">
                          This action cannot be undone
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="w-full py-3 bg-purple-500 rounded-xl hover:bg-purple-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </>
          )}

          {/* Monitoring Tab */}
          {activeTab === "monitoring" && (
            <>
              <h1 className="text-2xl font-bold mb-6">System Monitoring</h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Activity className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-slate-400">Prometheus</span>
                  </div>
                  <p className="text-2xl font-bold">http://localhost:9090</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Metrics collection
                  </p>
                  <a
                    href="http://localhost:9090"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30"
                  >
                    Open Prometheus
                  </a>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-orange-400" />
                    </div>
                    <span className="text-slate-400">Grafana</span>
                  </div>
                  <p className="text-2xl font-bold">http://localhost:3002</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Dashboards & metrics
                  </p>
                  <a
                    href="http://localhost:3002"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30"
                  >
                    Open Grafana
                  </a>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-slate-400">Kibana</span>
                  </div>
                  <p className="text-2xl font-bold">http://localhost:5601</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Log management (ELK)
                  </p>
                  <a
                    href="http://localhost:5601"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30"
                  >
                    Open Kibana
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h2 className="text-lg font-semibold mb-4">
                    Prometheus Metrics
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <span className="text-slate-300">HTTP Requests</span>
                      <code className="text-green-400 text-sm">
                        whatsappai_http_requests_total
                      </code>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <span className="text-slate-300">Agent Requests</span>
                      <code className="text-purple-400 text-sm">
                        whatsappai_agent_requests_total
                      </code>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <span className="text-slate-300">WhatsApp Messages</span>
                      <code className="text-blue-400 text-sm">
                        whatsappai_whatsapp_messages_*
                      </code>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <span className="text-slate-300">Queue Processing</span>
                      <code className="text-yellow-400 text-sm">
                        whatsappai_queue_*
                      </code>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <span className="text-slate-300">Database Queries</span>
                      <code className="text-orange-400 text-sm">
                        whatsappai_database_*
                      </code>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h2 className="text-lg font-semibold mb-4">ELK Stack Logs</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <span className="text-slate-300">Elasticsearch</span>
                      <span className="text-green-400 text-sm">
                        localhost:9200
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <span className="text-slate-300">Kibana UI</span>
                      <span className="text-green-400 text-sm">
                        localhost:5601
                      </span>
                    </div>
                    <div className="p-3 bg-slate-700/30 rounded-lg">
                      <p className="text-sm text-slate-400 mb-2">
                        Available Indices:
                      </p>
                      <div className="space-y-1">
                        <code className="text-xs text-blue-400">
                          logs-*-application
                        </code>
                        <code className="text-xs text-blue-400">
                          logs-*-system
                        </code>
                        <code className="text-xs text-blue-400">
                          logs-*-access
                        </code>
                        <code className="text-xs text-blue-400">
                          metrics-*-host
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <a
                    href="http://localhost:3002/datasources"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors text-center"
                  >
                    <p className="text-sm font-medium">Grafana Data Sources</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure Prometheus
                    </p>
                  </a>
                  <a
                    href="http://localhost:3002/dashboards"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors text-center"
                  >
                    <p className="text-sm font-medium">Grafana Dashboards</p>
                    <p className="text-xs text-slate-400 mt-1">View metrics</p>
                  </a>
                  <a
                    href="http://localhost:5601/app/discover"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors text-center"
                  >
                    <p className="text-sm font-medium">Kibana Discover</p>
                    <p className="text-xs text-slate-400 mt-1">Search logs</p>
                  </a>
                  <a
                    href="http://localhost:5601/app/management"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors text-center"
                  >
                    <p className="text-sm font-medium">Kibana Management</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure indices
                    </p>
                  </a>
                </div>
              </div>
            </>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <>
              <h1 className="text-2xl font-bold mb-6">Security Settings</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Shield className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="font-semibold">Authentication</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">JWT Token</span>
                      <span className="text-xs text-green-400">✓ Enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        2FA Support
                      </span>
                      <span className="text-xs text-green-400">✓ Enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        Password Hash
                      </span>
                      <span className="text-xs text-green-400">✓ PBKDF2</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Lock className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="font-semibold">Encryption</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        Data at Rest
                      </span>
                      <span className="text-xs text-green-400">
                        ✓ AES-256-GCM
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Webhooks</span>
                      <span className="text-xs text-green-400">
                        ✓ Signature Verify
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">TLS/SSL</span>
                      <span className="text-xs text-yellow-400">
                        ⚠ External
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="font-semibold">RBAC & Roles</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">User Roles</span>
                      <span className="text-xs text-green-400">✓ 4 Roles</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        Permissions
                      </span>
                      <span className="text-xs text-green-400">✓ 9 Perms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        Org Members
                      </span>
                      <span className="text-xs text-green-400">✓ Enabled</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6">
                <h2 className="text-lg font-semibold mb-4">Rate Limiting</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-700/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">
                        Auth Endpoints
                      </span>
                    </div>
                    <p className="text-xl font-bold text-white">5/min</p>
                    <p className="text-xs text-slate-500">15 min window</p>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">
                        API General
                      </span>
                    </div>
                    <p className="text-xl font-bold text-white">100/min</p>
                    <p className="text-xs text-slate-500">1 min window</p>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">Messaging</span>
                    </div>
                    <p className="text-xl font-bold text-white">30/min</p>
                    <p className="text-xs text-slate-500">1 min window</p>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">
                        File Upload
                      </span>
                    </div>
                    <p className="text-xl font-bold text-white">10/min</p>
                    <p className="text-xs text-slate-500">1 min window</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6">
                <h2 className="text-lg font-semibold mb-4">
                  RBAC Roles & Permissions
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                        <th className="pb-3 pr-4">Role</th>
                        <th className="pb-3 pr-4">Create</th>
                        <th className="pb-3 pr-4">Read</th>
                        <th className="pb-3 pr-4">Update</th>
                        <th className="pb-3 pr-4">Delete</th>
                        <th className="pb-3 pr-4">Manage Users</th>
                        <th className="pb-3 pr-4">Manage Agents</th>
                        <th className="pb-3">View Analytics</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b border-slate-700/50">
                        <td className="py-3 pr-4 font-medium text-white">
                          Owner
                        </td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 text-green-400">✓</td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="py-3 pr-4 font-medium text-white">
                          Admin
                        </td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 text-green-400">✓</td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="py-3 pr-4 font-medium text-white">
                          Member
                        </td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 pr-4 text-slate-500">✗</td>
                        <td className="py-3 pr-4 text-slate-500">✗</td>
                        <td className="py-3 pr-4 text-slate-500">✗</td>
                        <td className="py-3 text-slate-500">✗</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-medium text-white">
                          Viewer
                        </td>
                        <td className="py-3 pr-4 text-slate-500">✗</td>
                        <td className="py-3 pr-4 text-green-400">✓</td>
                        <td className="py-3 pr-4 text-slate-500">✗</td>
                        <td className="py-3 pr-4 text-slate-500">✗</td>
                        <td className="py-3 pr-4 text-slate-500">✗</td>
                        <td className="py-3 pr-4 text-slate-500">✗</td>
                        <td className="py-3 text-slate-500">✗</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-semibold mb-4">Security Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <Key className="w-5 h-5 text-purple-400" />
                      <span className="font-medium">Rotate JWT Secret</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Generate new JWT signing key
                    </p>
                  </button>
                  <button className="p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-5 h-5 text-blue-400" />
                      <span className="font-medium">Enable 2FA Globally</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Force 2FA for all users
                    </p>
                  </button>
                  <button className="p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="w-5 h-5 text-green-400" />
                      <span className="font-medium">View Audit Logs</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Access security event logs
                    </p>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-lg font-bold">
                {editingUser ? "Edit User" : "Add New User"}
              </h2>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  value={userForm.fullName}
                  onChange={(e) =>
                    setUserForm({ ...userForm, fullName: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="new-password"
                    autoComplete="new-password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required={!editingUser}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Plan
                </label>
                <select
                  value={userForm.plan}
                  onChange={(e) =>
                    setUserForm({ ...userForm, plan: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="FREE">Free</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-3 border border-slate-600 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-purple-500 rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Agent Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-lg font-bold">
                {editingAgent ? "Edit Agent" : "Create New Agent"}
              </h2>
            </div>
            <form onSubmit={handleSaveAgent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={agentForm.name}
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Type
                </label>
                <select
                  value={agentForm.type}
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, type: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="REMINDER">Reminder</option>
                  <option value="CALENDAR">Calendar</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="VOICE">Voice</option>
                  <option value="CONVERSATION">Conversation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  System Prompt
                </label>
                <textarea
                  value={agentForm.systemPrompt}
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, systemPrompt: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  API Key (LangChain/LangGraph)
                </label>
                <input
                  type="text"
                  value={agentForm.apiKey}
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, apiKey: e.target.value })
                  }
                  placeholder="sk-agent-..."
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={agentForm.isActive}
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, isActive: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-400">
                  Active
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAgentModal(false)}
                  className="flex-1 py-3 border border-slate-600 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-500 rounded-xl hover:bg-purple-600 transition-colors"
                >
                  {editingAgent ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workflow Modal */}
      {showWorkflowModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-lg font-bold">
                {editingWorkflow ? "Edit Workflow" : "Create New Workflow"}
              </h2>
            </div>
            <form onSubmit={handleSaveWorkflow} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={workflowForm.name}
                  onChange={(e) =>
                    setWorkflowForm({ ...workflowForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Type
                </label>
                <select
                  value={workflowForm.type}
                  onChange={(e) =>
                    setWorkflowForm({ ...workflowForm, type: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="CUSTOM">Custom</option>
                  <option value="WELCOME">Welcome Message</option>
                  <option value="REMINDER">Reminder</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="TRIGGER">Trigger-based</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Schedule (cron expression)
                </label>
                <input
                  type="text"
                  value={workflowForm.schedule}
                  onChange={(e) =>
                    setWorkflowForm({
                      ...workflowForm,
                      schedule: e.target.value,
                    })
                  }
                  placeholder="0 9 * * *"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Trigger Event
                </label>
                <input
                  type="text"
                  value={workflowForm.trigger}
                  onChange={(e) =>
                    setWorkflowForm({
                      ...workflowForm,
                      trigger: e.target.value,
                    })
                  }
                  placeholder="user.signup, payment.due"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="workflowEnabled"
                  checked={workflowForm.enabled}
                  onChange={(e) =>
                    setWorkflowForm({
                      ...workflowForm,
                      enabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500"
                />
                <label
                  htmlFor="workflowEnabled"
                  className="text-sm text-slate-400"
                >
                  Enable Workflow
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWorkflowModal(false)}
                  className="flex-1 py-3 border border-slate-600 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-purple-500 rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingWorkflow ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
