'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, Calendar, Bell, FileText, MessageSquare, Settings, LogOut, ChevronRight, ChevronLeft, Clock, CheckCircle2, Phone, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function UserDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#25D366]"></div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const stats = [
    { label: 'Total Messages', value: '1,234', icon: MessageSquare, color: 'bg-green-100 text-green-600' },
    { label: 'Reminders Set', value: '89', icon: Bell, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Meetings Scheduled', value: '24', icon: Calendar, color: 'bg-blue-100 text-blue-600' },
    { label: 'Documents Analyzed', value: '12', icon: FileText, color: 'bg-purple-100 text-purple-600' },
  ];

  const recentConversations = [
    { id: 1, preview: 'Schedule a meeting with John tomorrow at 2pm', time: '2 min ago', status: 'completed' },
    { id: 2, preview: 'Remind me to call mom at 5pm', time: '15 min ago', status: 'completed' },
    { id: 3, preview: 'What did I write in my notes about the project?', time: '1 hour ago', status: 'completed' },
    { id: 4, preview: 'Set reminder for my dentist appointment next week', time: '3 hours ago', status: 'pending' },
  ];

  const upcomingReminders = [
    { id: 1, text: 'Call mom', time: '5:00 PM', date: 'Today' },
    { id: 2, text: 'Meeting with John', time: '2:00 PM', date: 'Tomorrow' },
    { id: 3, text: 'Dentist appointment', time: '10:00 AM', date: 'Mar 5' },
  ];

  const navItems = [
    { icon: Bot, label: 'Conversations', href: '/dashboard' },
    { icon: Bell, label: 'Reminders', href: '/dashboard/reminders' },
    { icon: Calendar, label: 'Calendar', href: '/dashboard/calendar' },
    { icon: FileText, label: 'Documents', href: '/dashboard/documents' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50 lg:hidden">
        <div className="flex items-center gap-2">
          <Bot className="h-8 w-8 text-[#25D366]" />
          <span className="font-bold text-gray-800">Dashboard</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 hover:text-gray-900"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Navigation Menu */}
      <nav className={`fixed top-16 left-0 bottom-0 w-64 bg-white shadow-xl transform transition-transform duration-300 z-50 lg:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 space-y-2">
          {navItems.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-[#25D366]/10 hover:text-[#25D366] transition-colors"
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
              <p className="font-semibold text-sm text-gray-800">{user.fullName}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex bg-white border-r border-gray-200 flex-col fixed h-full transition-all duration-300 z-30 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="h-16 border-b border-gray-200 flex items-center justify-center px-2">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-[#25D366] flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-bold text-gray-800 truncate">My Assistant</span>}
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-[#25D366]/10 hover:text-[#25D366] transition-colors ${
                sidebarCollapsed ? 'justify-center' : ''
              } ${pathname === item.href ? 'bg-[#25D366]/10 text-[#25D366] font-medium' : ''}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className={`p-2 border-t border-gray-200 ${sidebarCollapsed ? '' : 'p-4'}`}>
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {getInitials(user.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{user.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={logout} 
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </>
          ) : (
            <button 
              onClick={logout} 
              className="w-full flex items-center justify-center p-3 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto transition-all duration-300 pt-16 lg:pt-0 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className={`h-5 w-5 transition-transform duration-300 ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[#25D366] hover:underline flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Open WhatsApp
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* User Welcome */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Welcome back, {user.fullName.split(' ')[0]}!</h2>
            <p className="text-gray-500">Here&apos;s what&apos;s happening with your WhatsApp assistant today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Conversations */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">Recent Conversations</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {recentConversations.map((conv) => (
                  <div key={conv.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${conv.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                        {conv.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 text-sm">{conv.preview}</p>
                        <p className="text-xs text-gray-500 mt-1">{conv.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Reminders */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">Upcoming Reminders</h2>
              </div>
              <div className="p-4 space-y-3">
                {upcomingReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Bell className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{reminder.text}</p>
                      <p className="text-xs text-gray-500">{reminder.date} at {reminder.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100">
                <Link href="/dashboard/reminders" className="text-sm text-[#25D366] hover:underline flex items-center gap-1">
                  View all reminders <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-xl p-6 text-white">
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/" className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center transition-colors">
                <MessageSquare className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">New Chat</span>
              </Link>
              <button className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center transition-colors">
                <Bell className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Set Reminder</span>
              </button>
              <button className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center transition-colors">
                <Calendar className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Schedule Meeting</span>
              </button>
              <button className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center transition-colors">
                <FileText className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Upload Document</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
