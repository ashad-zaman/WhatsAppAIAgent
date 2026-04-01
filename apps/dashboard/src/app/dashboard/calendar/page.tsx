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
  Phone,
  Menu,
  X,
  Plus,
  Trash2,
  MapPin,
  Users,
  Edit2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees: string[];
  status: string;
  provider: string;
}

export default function CalendarPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    attendees: "",
  });

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEventData, setEditEventData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    attendees: "",
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/events?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          ...newEvent,
          attendees: newEvent.attendees
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setEvents([...events, created]);
        setShowCreateModal(false);
        setNewEvent({
          title: "",
          description: "",
          startTime: "",
          endTime: "",
          location: "",
          attendees: "",
        });
      }
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": user?.id || "" },
      });

      if (res.ok) {
        setEvents(events.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    setEditEventData({
      title: event.title,
      description: event.description || "",
      startTime: startDate.toISOString().slice(0, 16),
      endTime: endDate.toISOString().slice(0, 16),
      location: event.location || "",
      attendees: event.attendees.join(", "),
    });
    setShowEditModal(true);
  };

  const updateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingEvent) return;

    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          ...editEventData,
          attendees: editEventData.attendees
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setEvents(events.map((e) => (e.id === editingEvent.id ? updated : e)));
        setShowEditModal(false);
        setEditingEvent(null);
      }
    } catch (error) {
      console.error("Failed to update event:", error);
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
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasEvent = (date: Date) => {
    return events.some((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        new Date(event.startTime).toDateString() === date.toDateString(),
    );
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

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const calendarDays = getDaysInMonth(currentDate);
  const upcomingEvents = events
    .filter((e) => new Date(e.startTime) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    )
    .slice(0, 5);

  const pastEvents = events
    .filter((e) => new Date(e.startTime) < new Date())
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    )
    .slice(0, 5);

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
          <span className="font-bold text-gray-800">Calendar</span>
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
            <h1 className="text-xl font-bold text-gray-800">Calendar</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">New Event</span>
          </button>
        </header>

        <div className="p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() =>
                    setCurrentDate(
                      new Date(
                        currentDate.setMonth(currentDate.getMonth() - 1),
                      ),
                    )
                  }
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-bold text-gray-800">{monthYear}</h2>
                <button
                  onClick={() =>
                    setCurrentDate(
                      new Date(
                        currentDate.setMonth(currentDate.getMonth() + 1),
                      ),
                    )
                  }
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-gray-500 py-2"
                    >
                      {day}
                    </div>
                  ),
                )}
                {calendarDays.map((date, i) => (
                  <div
                    key={i}
                    className={`min-h-[60px] p-1 border border-gray-100 rounded ${
                      date ? "bg-white" : "bg-gray-50"
                    } ${date && isToday(date) ? "bg-[#25D366]/10 border-[#25D366]" : ""}`}
                  >
                    {date && (
                      <>
                        <span
                          className={`text-sm ${isToday(date) ? "font-bold text-[#25D366]" : "text-gray-700"}`}
                        >
                          {date.getDate()}
                        </span>
                        {hasEvent(date) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {getEventsForDate(date)
                              .slice(0, 2)
                              .map((event) => (
                                <div
                                  key={event.id}
                                  className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded truncate"
                                >
                                  {event.title}
                                </div>
                              ))}
                            {getEventsForDate(date).length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{getEventsForDate(date).length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Upcoming Events
              </h2>

              {isFetching ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#25D366]"></div>
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No upcoming events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 text-sm">
                            {event.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(event.startTime)} at{" "}
                            {formatTime(event.startTime)}
                          </p>
                          {event.location && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </p>
                          )}
                          {event.attendees.length > 0 && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Users className="h-3 w-3" />
                              {event.attendees.length} attendee(s)
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditClick(event)}
                            className="p-1 text-gray-400 hover:text-[#25D366]"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Events */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Past Events
              </h2>

              {isFetching ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#25D366]"></div>
                </div>
              ) : pastEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No past events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-gray-50 rounded-lg opacity-75"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 text-sm">
                            {event.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(event.startTime)} at{" "}
                            {formatTime(event.startTime)}
                          </p>
                          {event.location && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </p>
                          )}
                          {event.attendees.length > 0 && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Users className="h-3 w-3" />
                              {event.attendees.length} attendee(s)
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">
                Create New Event
              </h2>
            </div>
            <form onSubmit={createEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  placeholder="Team meeting with John"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  placeholder="Discuss Q2 roadmap"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={
                      newEvent.startTime ? newEvent.startTime.split("T")[0] : ""
                    }
                    onChange={(e) => {
                      const time = newEvent.startTime.includes("T")
                        ? newEvent.startTime.split("T")[1]
                        : "";
                      setNewEvent({
                        ...newEvent,
                        startTime: `${e.target.value}T${time}`,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={
                      newEvent.startTime
                        ? newEvent.startTime.split("T")[1]?.slice(0, 5) || ""
                        : ""
                    }
                    onChange={(e) => {
                      const date = newEvent.startTime
                        ? newEvent.startTime.split("T")[0]
                        : "";
                      setNewEvent({
                        ...newEvent,
                        startTime: date
                          ? `${date}T${e.target.value}`
                          : e.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={
                      newEvent.endTime ? newEvent.endTime.split("T")[0] : ""
                    }
                    onChange={(e) => {
                      const time = newEvent.endTime.includes("T")
                        ? newEvent.endTime.split("T")[1]
                        : "";
                      setNewEvent({
                        ...newEvent,
                        endTime: `${e.target.value}T${time}`,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={
                      newEvent.endTime
                        ? newEvent.endTime.split("T")[1]?.slice(0, 5) || ""
                        : ""
                    }
                    onChange={(e) => {
                      const date = newEvent.endTime
                        ? newEvent.endTime.split("T")[0]
                        : "";
                      setNewEvent({
                        ...newEvent,
                        endTime: date
                          ? `${date}T${e.target.value}`
                          : e.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  placeholder="Conference Room A or Zoom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendees (comma separated)
                </label>
                <input
                  type="text"
                  value={newEvent.attendees}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, attendees: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  placeholder="john@example.com, jane@example.com"
                />
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

      {showEditModal && editingEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">Edit Event</h2>
            </div>
            <form onSubmit={updateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editEventData.title}
                  onChange={(e) =>
                    setEditEventData({
                      ...editEventData,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  placeholder="Team meeting with John"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editEventData.description}
                  onChange={(e) =>
                    setEditEventData({
                      ...editEventData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  placeholder="Meeting description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={
                      editEventData.startTime
                        ? editEventData.startTime.split("T")[0]
                        : ""
                    }
                    onChange={(e) => {
                      const time = editEventData.startTime.includes("T")
                        ? editEventData.startTime.split("T")[1]
                        : "";
                      setEditEventData({
                        ...editEventData,
                        startTime: `${e.target.value}T${time}`,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={
                      editEventData.startTime
                        ? editEventData.startTime.split("T")[1]?.slice(0, 5) ||
                          ""
                        : ""
                    }
                    onChange={(e) => {
                      const date = editEventData.startTime
                        ? editEventData.startTime.split("T")[0]
                        : "";
                      setEditEventData({
                        ...editEventData,
                        startTime: date
                          ? `${date}T${e.target.value}`
                          : e.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={
                      editEventData.endTime
                        ? editEventData.endTime.split("T")[0]
                        : ""
                    }
                    onChange={(e) => {
                      const time = editEventData.endTime.includes("T")
                        ? editEventData.endTime.split("T")[1]
                        : "";
                      setEditEventData({
                        ...editEventData,
                        endTime: `${e.target.value}T${time}`,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={
                      editEventData.endTime
                        ? editEventData.endTime.split("T")[1]?.slice(0, 5) || ""
                        : ""
                    }
                    onChange={(e) => {
                      const date = editEventData.endTime
                        ? editEventData.endTime.split("T")[0]
                        : "";
                      setEditEventData({
                        ...editEventData,
                        endTime: date
                          ? `${date}T${e.target.value}`
                          : e.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editEventData.location}
                  onChange={(e) =>
                    setEditEventData({
                      ...editEventData,
                      location: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  placeholder="Conference Room A or Zoom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendees (comma separated)
                </label>
                <input
                  type="text"
                  value={editEventData.attendees}
                  onChange={(e) =>
                    setEditEventData({
                      ...editEventData,
                      attendees: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  placeholder="john@example.com, jane@example.com"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEvent(null);
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
