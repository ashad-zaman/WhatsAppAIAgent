"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PlaceholderLayout from "../placeholder-layout";
import {
  User,
  Bell,
  Shield,
  Globe,
  Moon,
  Smartphone,
  Mail,
  Phone,
  MapPin,
  Camera,
  Key,
  LogOut,
  Save,
  X,
  Sun,
} from "lucide-react";
import { useRouter } from "next/navigation";

type SettingsTab =
  | "profile"
  | "notifications"
  | "privacy"
  | "appearance"
  | "password";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [preferences, setPreferences] = useState({
    pushNotifications: true,
    emailNotifications: true,
    language: "English",
    theme: "light",
  });

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [theme, setTheme] = useState("light");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions, setSessions] = useState<
    { id: string; device: string; location: string; lastActive: string }[]
  >([
    {
      id: "1",
      device: "Chrome - Mac",
      location: "New York, US",
      lastActive: "Now",
    },
  ]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme =
      localStorage.getItem("wa_theme") || user?.theme || "light";
    setTheme(savedTheme);
    setPreferences((prev) => ({ ...prev, theme: savedTheme }));
    applyTheme(savedTheme);
  }, [user]);

  const applyTheme = (themeName: string) => {
    if (typeof document === "undefined") return;
    if (themeName === "dark") {
      document.documentElement.classList.add("dark");
    } else if (themeName === "light") {
      document.documentElement.classList.remove("dark");
    } else if (themeName === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  useEffect(() => {
    if (user) {
      const nameParts = user.fullName?.split(" ") || ["", ""];
      setProfile({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
      setPreferences((prev) => ({
        ...prev,
        pushNotifications: user.pushNotifications ?? prev.pushNotifications,
        emailNotifications: user.emailNotifications ?? prev.emailNotifications,
      }));
      setTwoFactorEnabled(user.twoFactorEnabled ?? false);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        updateUser({
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          address: updatedUser.address,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
    setSaving(false);
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(preferences),
      });
      if (res.ok) {
        updateUser({
          pushNotifications: preferences.pushNotifications,
          emailNotifications: preferences.emailNotifications,
          theme: preferences.theme,
        });
        localStorage.setItem("wa_theme", preferences.theme);
        applyTheme(preferences.theme);
        setTheme(preferences.theme);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
    setSaving(false);
  };

  const handleUpdatePassword = async () => {
    if (!user) return;
    if (password.new !== password.confirm) {
      alert("Passwords do not match");
      return;
    }
    if (password.new.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          currentPassword: password.current,
          newPassword: password.new,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setPassword({ current: "", new: "", confirm: "" });
        setTimeout(() => setSaved(false), 2000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Failed to update password:", error);
    }
    setSaving(false);
  };

  const handleToggle2FA = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ enable: !twoFactorEnabled }),
      });
      if (res.ok) {
        const newValue = !twoFactorEnabled;
        setTwoFactorEnabled(newValue);
        updateUser({ twoFactorEnabled: newValue });
      }
    } catch (error) {
      console.error("Failed to toggle 2FA:", error);
    }
    setSaving(false);
  };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const res = await fetch("/api/user/export", {
        method: "POST",
        headers: { "x-user-id": user.id },
      });
      if (res.ok) {
        const blob = await res.blob();
        if (typeof window === "undefined") return;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "my-data-export.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to export data:", error);
    }
    setExporting(false);
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/user/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions(sessions.filter((s) => s.id !== sessionId));
      }
    } catch (error) {
      console.error("Failed to revoke session:", error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Personal Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) =>
                    setProfile({ ...profile, firstName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) =>
                    setProfile({ ...profile, lastName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) =>
                      setProfile({ ...profile, address: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="mt-6 px-6 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        );

      case "notifications":
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-800">
                      Push Notifications
                    </p>
                    <p className="text-sm text-gray-500">
                      Receive notifications on your device
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.pushNotifications}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        pushNotifications: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#25D366]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-800">
                      Email Notifications
                    </p>
                    <p className="text-sm text-gray-500">
                      Receive email updates
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        emailNotifications: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#25D366]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-800">Language</p>
                    <p className="text-sm text-gray-500">
                      Select your preferred language
                    </p>
                  </div>
                </div>
                <select
                  value={preferences.language}
                  onChange={(e) =>
                    setPreferences({ ...preferences, language: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleSavePreferences}
              disabled={saving}
              className="mt-6 px-6 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
            </button>
          </div>
        );

      case "privacy":
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Privacy & Security
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">
                    Two-Factor Authentication
                  </p>
                  <p className="text-sm text-gray-500">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <button
                  onClick={handleToggle2FA}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    twoFactorEnabled
                      ? "bg-green-100 text-green-700"
                      : "bg-[#25D366] text-white hover:bg-[#128C7E]"
                  }`}
                >
                  {twoFactorEnabled ? "Enabled" : "Enable"}
                </button>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="font-medium text-gray-800 mb-3">
                  Active Sessions
                </p>
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {session.device}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.location} • {session.lastActive}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Data Export</p>
                  <p className="text-sm text-gray-500">
                    Download a copy of your data
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  disabled={exporting}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  {exporting ? "Exporting..." : "Export"}
                </button>
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Appearance
            </h3>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="font-medium text-gray-800 mb-3">Theme</p>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      if (typeof document === "undefined") return;
                      setTheme("light");
                      setPreferences({ ...preferences, theme: "light" });
                      localStorage.setItem("wa_theme", "light");
                      document.documentElement.classList.remove("dark");
                    }}
                    className={`p-4 border-2 rounded-lg ${theme === "light" ? "border-[#25D366] bg-gray-50" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <Sun className="h-8 w-8 mx-auto text-gray-800 mb-2" />
                    <p className="text-sm font-medium text-center">Light</p>
                  </button>
                  <button
                    onClick={() => {
                      if (typeof document === "undefined") return;
                      setTheme("dark");
                      setPreferences({ ...preferences, theme: "dark" });
                      localStorage.setItem("wa_theme", "dark");
                      document.documentElement.classList.add("dark");
                    }}
                    className={`p-4 border-2 rounded-lg ${theme === "dark" ? "border-[#25D366] bg-gray-50" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <Moon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 text-center">Dark</p>
                  </button>
                  <button
                    onClick={() => {
                      if (typeof document === "undefined") return;
                      setTheme("system");
                      setPreferences({ ...preferences, theme: "system" });
                      localStorage.setItem("wa_theme", "system");
                      const isDark = window.matchMedia(
                        "(prefers-color-scheme: dark)",
                      ).matches;
                      if (isDark) {
                        document.documentElement.classList.add("dark");
                      } else {
                        document.documentElement.classList.remove("dark");
                      }
                    }}
                    className={`p-4 border-2 rounded-lg ${theme === "system" ? "border-[#25D366] bg-gray-50" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <Smartphone className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 text-center">System</p>
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={handleSavePreferences}
              disabled={saving}
              className="mt-6 px-6 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
            </button>
          </div>
        );

      case "password":
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Change Password
            </h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={password.current}
                  onChange={(e) =>
                    setPassword({ ...password, current: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={password.new}
                  onChange={(e) =>
                    setPassword({ ...password, new: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={password.confirm}
                  onChange={(e) =>
                    setPassword({ ...password, confirm: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  placeholder="Confirm new password"
                />
              </div>
              <button
                onClick={handleUpdatePassword}
                disabled={
                  saving ||
                  !password.current ||
                  !password.new ||
                  !password.confirm
                }
                className="px-6 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors disabled:opacity-50"
              >
                {saving
                  ? "Updating..."
                  : saved
                    ? "Updated!"
                    : "Update Password"}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PlaceholderLayout title="Settings">
      <div className="p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-[#25D366] flex items-center justify-center text-white text-3xl font-bold">
                    {user?.fullName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50">
                    <Camera className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                <h3 className="mt-4 font-semibold text-gray-800">
                  {user?.fullName || "User"}
                </h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === "profile"
                      ? "bg-[#25D366]/10 text-[#25D366]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <User className="h-5 w-5" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === "notifications"
                      ? "bg-[#25D366]/10 text-[#25D366]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Bell className="h-5 w-5" />
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab("privacy")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === "privacy"
                      ? "bg-[#25D366]/10 text-[#25D366]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </button>
                <button
                  onClick={() => setActiveTab("appearance")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === "appearance"
                      ? "bg-[#25D366]/10 text-[#25D366]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Moon className="h-5 w-5" />
                  Appearance
                </button>
                <button
                  onClick={() => setActiveTab("password")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === "password"
                      ? "bg-[#25D366]/10 text-[#25D366]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Key className="h-5 w-5" />
                  Change Password
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">{renderContent()}</div>
        </div>
      </div>
    </PlaceholderLayout>
  );
}
