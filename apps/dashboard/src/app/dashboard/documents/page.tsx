"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  Calendar,
  Bell,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Phone,
  Menu,
  Plus,
  Trash2,
  File,
  FileText as FileTextIcon,
  Image,
  FileSpreadsheet,
  Eye,
  Download,
  Search,
  Brain,
  Loader2,
  Sparkles,
  X as XIcon,
  MessageSquare as MessageSquareIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Document {
  id: string;
  title: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  status: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface QueryResult {
  answer: string;
  sources: {
    documentId: string;
    documentTitle: string;
    text: string;
    score: number;
  }[];
  metadata: {
    tokensUsed: number;
    chunksSearched: number;
  };
}

export default function DocumentsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [query, setQuery] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [filter, setFilter] = useState("all");

  const [newDocument, setNewDocument] = useState({
    title: "",
    fileType: "PDF",
    description: "",
  });

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const ext = file.name.split(".").pop()?.toUpperCase() || "PDF";
      setSelectedFile(file);
      setNewDocument({
        ...newDocument,
        title: file.name.replace(/\.[^/.]+$/, ""),
        fileType: ext,
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const ext = file.name.split(".").pop()?.toUpperCase() || "PDF";
      setSelectedFile(file);
      setNewDocument({
        ...newDocument,
        title: file.name.replace(/\.[^/.]+$/, ""),
        fileType: ext,
      });
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/documents?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const createDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const formData = new FormData();
      formData.append("title", newDocument.title);
      formData.append("description", newDocument.description);
      formData.append("userId", user.id);
      formData.append("orgId", "");

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: {
          "x-user-id": user.id,
        },
        body: formData,
      });

      if (res.ok) {
        const created = await res.json();
        setDocuments([created, ...documents]);
        setShowCreateModal(false);
        setNewDocument({ title: "", fileType: "PDF", description: "" });
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("Failed to create document:", error);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm("Delete this document?")) return;

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": user?.id || "" },
      });

      if (res.ok) {
        setDocuments(documents.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const viewDocument = async (doc: Document) => {
    const extension = doc.fileType.toLowerCase();
    const validExtensions = [
      "pdf",
      "jpg",
      "jpeg",
      "png",
      "gif",
      "docx",
      "xlsx",
      "csv",
    ];
    const ext = validExtensions.includes(extension) ? extension : "pdf";
    window.open(`/api/documents/${doc.id}/download`, "_blank");
  };

  const downloadDocument = async (doc: Document) => {
    if (typeof window === "undefined") return;
    const extension = doc.fileType.toLowerCase();
    const fileName = doc.title.includes(".")
      ? doc.title
      : `${doc.title}.${extension}`;
    const link = document.createElement("a");
    link.href = `/api/documents/${doc.id}/download`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toUpperCase()) {
      case "PDF":
        return <FileTextIcon className="h-8 w-8 text-red-500" />;
      case "IMAGE":
      case "JPG":
      case "JPEG":
      case "PNG":
      case "GIF":
        return <Image className="h-8 w-8 text-green-500" />;
      case "XLSX":
      case "XLS":
      case "CSV":
        return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const filteredDocuments =
    filter === "all"
      ? documents
      : filter === "pdf"
        ? documents.filter((d) => d.fileType.toUpperCase() === "PDF")
        : filter === "image"
          ? documents.filter((d) =>
              ["IMAGE", "JPG", "JPEG", "PNG", "GIF"].some((t) =>
                d.fileType.toUpperCase().includes(t),
              ),
            )
          : filter === "spreadsheet"
            ? documents.filter((d) =>
                ["XLSX", "XLS", "CSV"].some((t) =>
                  d.fileType.toUpperCase().includes(t),
                ),
              )
            : documents;

  const fileTypeCounts = {
    all: documents.length,
    pdf: documents.filter((d) => d.fileType.toUpperCase() === "PDF").length,
    image: documents.filter((d) =>
      ["IMAGE", "JPG", "JPEG", "PNG", "GIF"].includes(d.fileType.toUpperCase()),
    ).length,
    spreadsheet: documents.filter((d) =>
      ["XLSX", "XLS", "CSV"].includes(d.fileType.toUpperCase()),
    ).length,
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
          <span className="font-bold text-gray-800">Documents</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600"
        >
          {mobileMenuOpen ? (
            <XIcon className="h-6 w-6" />
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
            <h1 className="text-xl font-bold text-gray-800">Documents</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Upload Document</span>
          </button>
          <button
            onClick={() => setShowQueryModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ml-2"
          >
            <Brain className="h-4 w-4" />
            <span className="text-sm font-medium">Ask AI</span>
          </button>
        </header>

        <div className="p-6">
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { key: "all", label: "All Files", count: fileTypeCounts.all },
              { key: "pdf", label: "PDFs", count: fileTypeCounts.pdf },
              { key: "image", label: "Images", count: fileTypeCounts.image },
              {
                key: "spreadsheet",
                label: "Spreadsheets",
                count: fileTypeCounts.spreadsheet,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? "bg-[#25D366] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {isFetching ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#25D366]"></div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No documents yet
              </h3>
              <p className="text-gray-500 mb-6">
                Upload your first document to get started
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E]"
              >
                <Plus className="h-4 w-4" />
                Upload Document
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(doc.fileSize)} •{" "}
                        {formatDate(doc.createdAt)}
                      </p>
                      <span
                        className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
                          doc.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : doc.status === "PROCESSING"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => viewDocument(doc)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
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
                Upload Document
              </h2>
            </div>
            <form onSubmit={createDocument} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={newDocument.title}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  placeholder="Q4 Financial Report"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Type
                </label>
                <select
                  value={newDocument.fileType}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, fileType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                >
                  <option value="PDF">PDF</option>
                  <option value="DOCX">Word Document</option>
                  <option value="IMAGE">Image</option>
                  <option value="XLSX">Excel Spreadsheet</option>
                  <option value="CSV">CSV</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newDocument.description}
                  onChange={(e) =>
                    setNewDocument({
                      ...newDocument,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  placeholder="Brief description of the document"
                  rows={3}
                />
              </div>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging
                    ? "border-[#25D366] bg-[#25D366]/10"
                    : "border-gray-300"
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif"
                />
                {selectedFile ? (
                  <div>
                    <File className="h-10 w-10 text-[#25D366] mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-800">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-xs text-red-500 mt-2 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <File className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Drag and drop a file here, or click to browse
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Maximum file size: 10MB
                    </p>
                  </label>
                )}
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
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ask AI Query Modal */}
      {showQueryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Ask AI about your documents
                  </h2>
                  <p className="text-sm text-gray-500">
                    Get answers from your document knowledge base
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowQueryModal(false);
                  setQueryResult(null);
                  setQuery("");
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!queryResult ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Question
                    </label>
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask something like: What are the key points in this document?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  {documents.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search in specific documents (optional)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {documents.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => {
                              setSelectedDocs((prev) =>
                                prev.includes(doc.id)
                                  ? prev.filter((id) => id !== doc.id)
                                  : [...prev, doc.id],
                              );
                            }}
                            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                              selectedDocs.includes(doc.id)
                                ? "bg-purple-100 border-purple-300 text-purple-700"
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {doc.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      if (!query.trim() || !user) return;
                      setQueryLoading(true);
                      try {
                        const res = await fetch("/api/documents/query", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            userId: user.id,
                            query,
                            documentIds:
                              selectedDocs.length > 0
                                ? selectedDocs
                                : undefined,
                            topK: 5,
                          }),
                        });
                        const data = await res.json();
                        setQueryResult(data);
                      } catch (error) {
                        console.error("Query failed:", error);
                      } finally {
                        setQueryLoading(false);
                      }
                    }}
                    disabled={!query.trim() || queryLoading}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {queryLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Ask AI
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold text-purple-800">
                        AI Answer
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {queryResult.answer}
                    </p>
                  </div>

                  {queryResult.sources.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Sources ({queryResult.sources.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-auto">
                        {queryResult.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 rounded-lg p-3 text-sm"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-800">
                                {source.documentTitle}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Math.round(source.score * 100)}% match
                              </span>
                            </div>
                            <p className="text-gray-600 text-xs line-clamp-2">
                              {source.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setQueryResult(null);
                      setQuery("");
                    }}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Ask Another Question
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
