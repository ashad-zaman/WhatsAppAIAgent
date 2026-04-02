"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";
  const name = searchParams.get("name") || "";
  const plan = searchParams.get("plan") || "FREE";
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    handleSignup();
  }, []);

  const handleSignup = async () => {
    if (!email || !name) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, name, plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
        router.push("/login");
        return;
      }

      setSuccess(true);
      localStorage.setItem("wa_user", JSON.stringify(data.user));
      localStorage.setItem("wa_token", data.token);

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      toast.error("Signup failed");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#25D366] mx-auto mb-4" />
          <p className="text-white text-lg">Setting up your account...</p>
          <p className="text-slate-400 text-sm mt-2">
            Creating your {plan} plan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        {success ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Account Created!
            </h1>
            <p className="text-slate-400 mb-4">
              Welcome to WhatsApp AI Platform
            </p>
            <p className="text-sm text-[#25D366]">
              Redirecting to dashboard...
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">
              Something went wrong
            </h1>
            <button
              onClick={() => router.push("/login")}
              className="text-[#25D366] hover:underline"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
