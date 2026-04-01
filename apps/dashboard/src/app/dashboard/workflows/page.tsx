"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PlaceholderLayout from "../placeholder-layout";
import {
  Play,
  Pause,
  Plus,
  Clock,
  Zap,
  Calendar,
  Bell,
  FileText,
  MessageSquare,
  Trash2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Workflow,
} from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  type: string;
  schedule: string | null;
  trigger: string | null;
  steps: WorkflowStep[];
  enabled: boolean;
  status: string;
  lastRunAt: string | null;
  createdAt: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  agentType: string;
  action: string;
  condition?: {
    field: string;
    operator: string;
    value: unknown;
  };
}

const WORKFLOW_TEMPLATES = [
  {
    id: "daily-reminder-summary",
    name: "Daily Reminder Summary",
    description: "Send a summary of upcoming reminders every morning",
    icon: Bell,
    trigger: "SCHEDULED",
    schedule: "0 8 * * *",
    steps: [
      {
        id: "1",
        name: "Fetch Reminders",
        agentType: "reminder",
        action: "list",
      },
      {
        id: "2",
        name: "Format Summary",
        agentType: "conversation",
        action: "format",
      },
      {
        id: "3",
        name: "Send Message",
        agentType: "conversation",
        action: "send_message",
      },
    ],
  },
  {
    id: "proactive-calendar-check",
    name: "Proactive Calendar Suggestions",
    description: "Check calendar and suggest events based on patterns",
    icon: Calendar,
    trigger: "SCHEDULED",
    schedule: "0 9 * * *",
    steps: [
      {
        id: "1",
        name: "Check Calendar",
        agentType: "calendar",
        action: "sync",
      },
      {
        id: "2",
        name: "Analyze Patterns",
        agentType: "calendar",
        action: "analyze",
      },
      {
        id: "3",
        name: "Suggest Events",
        agentType: "calendar",
        action: "suggest",
      },
    ],
  },
  {
    id: "document-digest",
    name: "Weekly Document Digest",
    description: "Summarize important documents weekly",
    icon: FileText,
    trigger: "SCHEDULED",
    schedule: "0 10 * * 5",
    steps: [
      {
        id: "1",
        name: "Index Documents",
        agentType: "document",
        action: "index",
      },
      {
        id: "2",
        name: "Generate Summary",
        agentType: "document",
        action: "summarize",
      },
      {
        id: "3",
        name: "Send Digest",
        agentType: "conversation",
        action: "send_message",
      },
    ],
  },
  {
    id: "smart-reminder-suggestion",
    name: "Smart Reminder Suggestions",
    description: "Learn from user patterns and suggest reminders",
    icon: Sparkles,
    trigger: "EVENT",
    event: "message_received",
    steps: [
      {
        id: "1",
        name: "Analyze Message",
        agentType: "conversation",
        action: "analyze",
      },
      {
        id: "2",
        name: "Extract Intent",
        agentType: "conversation",
        action: "classify",
      },
      {
        id: "3",
        name: "Suggest Reminder",
        agentType: "reminder",
        action: "suggest",
      },
    ],
  },
];

const AGENT_ICONS: Record<string, typeof Bell> = {
  reminder: Bell,
  calendar: Calendar,
  document: FileText,
  conversation: MessageSquare,
};

const ACTION_LABELS: Record<string, string> = {
  list: "List",
  create: "Create",
  update: "Update",
  delete: "Delete",
  sync: "Sync",
  analyze: "Analyze",
  suggest: "Suggest",
  summarize: "Summarize",
  index: "Index",
  search: "Search",
  format: "Format",
  send_message: "Send Message",
  classify: "Classify",
};

export default function WorkflowsPage() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<
    (typeof WORKFLOW_TEMPLATES)[0] | null
  >(null);

  useEffect(() => {
    fetchWorkflows();
  }, [user]);

  const fetchWorkflows = async () => {
    if (!user) return;

    try {
      const res = await fetch(`/api/workflows?userId=${user.id}`);
      const data = await res.json();
      setWorkflows(data);
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (workflowId: string, enabled: boolean) => {
    try {
      await fetch("/api/workflows", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, action: "toggle", enabled }),
      });
      setWorkflows(
        workflows.map((w) => (w.id === workflowId ? { ...w, enabled } : w)),
      );
    } catch (error) {
      console.error("Failed to toggle workflow:", error);
    }
  };

  const runWorkflow = async (workflowId: string) => {
    try {
      await fetch("/api/workflows", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, action: "run" }),
      });
      setWorkflows(
        workflows.map((w) =>
          w.id === workflowId
            ? { ...w, status: "RUNNING", lastRunAt: new Date().toISOString() }
            : w,
        ),
      );
    } catch (error) {
      console.error("Failed to run workflow:", error);
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    try {
      await fetch(`/api/workflows/${workflowId}`, { method: "DELETE" });
      setWorkflows(workflows.filter((w) => w.id !== workflowId));
    } catch (error) {
      console.error("Failed to delete workflow:", error);
    }
  };

  const createFromTemplate = async (
    template: (typeof WORKFLOW_TEMPLATES)[0],
  ) => {
    if (!user) return;

    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: template.name,
          type: "TEMPLATE",
          schedule: template.schedule,
          trigger: template.trigger,
          steps: template.steps,
          enabled: false,
        }),
      });

      if (res.ok) {
        const newWorkflow = await res.json();
        setWorkflows([newWorkflow, ...workflows]);
        setShowCreateModal(false);
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error("Failed to create workflow:", error);
    }
  };

  const getAgentIcon = (type: string) => AGENT_ICONS[type] || Bell;

  return (
    <PlaceholderLayout title="Workflows">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Autonomous Workflows
            </h2>
            <p className="text-gray-500 mt-1">
              Automate tasks with AI-powered workflows
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create Workflow</span>
          </button>
        </div>

        {/* Active Workflows */}
        {workflows.filter((w) => w.enabled).length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Active Workflows
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows
                .filter((w) => w.enabled)
                .map((workflow) => (
                  <div
                    key={workflow.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-green-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Sparkles className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {workflow.name}
                          </h4>
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                            {workflow.status === "RUNNING"
                              ? "Running"
                              : "Active"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {workflow.steps.slice(0, 3).map((step, idx) => {
                        const Icon = getAgentIcon(step.agentType);
                        return (
                          <div key={idx} className="flex items-center">
                            <div className="p-1.5 bg-gray-100 rounded">
                              <Icon className="h-3.5 w-3.5 text-gray-600" />
                            </div>
                            {idx < Math.min(workflow.steps.length, 3) - 1 && (
                              <ArrowRight className="h-3 w-3 text-gray-400 mx-1" />
                            )}
                          </div>
                        );
                      })}
                      {workflow.steps.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{workflow.steps.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => runWorkflow(workflow.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-colors"
                      >
                        <Play className="h-4 w-4" />
                        Run
                      </button>
                      <button
                        onClick={() => toggleWorkflow(workflow.id, false)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Pause className="h-4 w-4" />
                        Pause
                      </button>
                      <button
                        onClick={() => deleteWorkflow(workflow.id)}
                        className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Inactive Workflows */}
        {workflows.filter((w) => !w.enabled).length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              Inactive Workflows
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows
                .filter((w) => !w.enabled)
                .map((workflow) => (
                  <div
                    key={workflow.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 opacity-75"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Sparkles className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {workflow.name}
                          </h4>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            Paused
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => toggleWorkflow(workflow.id, true)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-colors"
                      >
                        <Play className="h-4 w-4" />
                        Activate
                      </button>
                      <button
                        onClick={() => deleteWorkflow(workflow.id)}
                        className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Workflow Templates */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Quick Start Templates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {WORKFLOW_TEMPLATES.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.id}
                  onClick={() => createFromTemplate(template)}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-[#25D366] hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-[#25D366]/10 transition-colors">
                      <Icon className="h-5 w-5 text-purple-600 group-hover:text-[#25D366] transition-colors" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-1">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {template.description}
                  </p>
                  {template.schedule && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{template.schedule}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {workflows.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Workflow className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No workflows yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first autonomous workflow to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Workflow
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                Create Workflow
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Choose a template or start from scratch
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WORKFLOW_TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => createFromTemplate(template)}
                      className="p-4 border border-gray-200 rounded-xl hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Icon className="h-5 w-5 text-purple-600" />
                        </div>
                        <h4 className="font-semibold text-gray-800">
                          {template.name}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-500">
                        {template.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PlaceholderLayout>
  );
}
