"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PlaceholderLayout from "../placeholder-layout";
import {
  Bot,
  Calendar,
  Bell,
  FileText,
  MessageSquare,
  Mic,
  Brain,
  Cpu,
  Zap,
  Settings,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  systemPrompt?: string;
  description?: string;
}

const agentTypes = [
  {
    type: "REMINDER",
    name: "Reminder Agent",
    description: "智能提醒助手，帮助用户管理日常提醒和任务",
    icon: Bell,
    color: "bg-yellow-500",
    features: ["创建和管理提醒", "重复提醒设置", "提醒优先级", "WhatsApp 通知"],
  },
  {
    type: "CALENDAR",
    name: "Calendar Agent",
    description: "日历管理助手，帮助用户安排和跟踪日程",
    icon: Calendar,
    color: "bg-blue-500",
    features: ["日程创建和编辑", "日历同步", "会议安排", "事件提醒"],
  },
  {
    type: "DOCUMENT",
    name: "Document Agent",
    description: "文档处理助手，帮助用户管理和分析文档",
    icon: FileText,
    color: "bg-purple-500",
    features: ["文档上传和管理", "内容分析和摘要", "智能搜索", "文档分类"],
  },
  {
    type: "CONVERSATION",
    name: "Conversation Agent",
    description: "对话式AI助手，提供智能对话和问答服务",
    icon: MessageSquare,
    color: "bg-green-500",
    features: ["自然语言处理", "上下文理解", "多轮对话", "知识问答"],
  },
  {
    type: "VOICE",
    name: "Voice Agent",
    description: "语音助手，支持语音交互和语音合成",
    icon: Mic,
    color: "bg-red-500",
    features: ["语音识别", "语音合成", "语音命令", "语音转文字"],
  },
];

export default function AgentsPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/admin/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAgentStatus = (type: string) => {
    const agent = agents.find((a) => a.type === type);
    return agent?.isActive ?? false;
  };

  const getAgentConfig = (type: string) => {
    return agents.find((a) => a.type === type);
  };

  return (
    <PlaceholderLayout title="AI Agents">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Available AI Agents
          </h2>
          <p className="text-gray-500 text-sm">
            All AI agents available in the system. Configure and manage them
            from the admin panel.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#25D366]" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentTypes.map((agentType) => {
              const isActive = getAgentStatus(agentType.type);
              const config = getAgentConfig(agentType.type);
              const Icon = agentType.icon;

              return (
                <div
                  key={agentType.type}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl ${agentType.color} flex items-center justify-center`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                        isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {isActive ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          <span>Inactive</span>
                        </>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {agentType.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {agentType.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-gray-700">
                      Features:
                    </p>
                    <ul className="space-y-1">
                      {agentType.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-500"
                        >
                          <Zap className="h-4 w-4 text-[#25D366]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {config && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-2">
                        Configuration
                      </p>
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 truncate">
                          {config.name || agentType.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Cpu className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Admin Configuration
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                To configure and customize AI agents, visit the admin panel. You
                can set system prompts, API keys, and other settings.
              </p>
              <a
                href="/admin?tab=agents"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Go to Admin Panel
              </a>
            </div>
          </div>
        </div>
      </div>
    </PlaceholderLayout>
  );
}
