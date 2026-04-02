"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  CheckCircle,
  Lock,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
}

const plans: Plan[] = [
  { id: "free", name: "Free", price: 0, yearlyPrice: 0 },
  { id: "pro", name: "Pro", price: 29, yearlyPrice: 23 },
  { id: "enterprise", name: "Enterprise", price: 99, yearlyPrice: 79 },
];

export default function CheckoutPage({
  params,
}: {
  params: { planId: string };
}) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "details" | "payment">(
    "phone",
  );
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sessionToken, setSessionToken] = useState("");

  const selectedPlan = plans.find((p) => p.id === params.planId) || plans[1];
  const displayPrice =
    billingCycle === "yearly" ? selectedPlan.yearlyPrice : selectedPlan.price;

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, action: "send" }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      setOtpSent(true);
      setOtpExpiresAt(data.expiresAt);
      setStep("otp");
      toast.success("OTP sent to your phone!");

      const interval = setInterval(() => {
        const remaining = Math.max(
          0,
          Math.floor((otpExpiresAt - Date.now()) / 1000),
        );
        setCountdown(remaining);
        if (remaining <= 0) clearInterval(interval);
      }, 1000);
    } catch (error) {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, action: "verify", otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      setPhoneVerified(true);
      setSessionToken(data.sessionToken);
      setStep("details");
      toast.success("Phone verified!");
    } catch (error) {
      toast.error("Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = () => {
    if (!email || !fullName) {
      toast.error("Please fill in all details");
      return;
    }

    if (!phoneVerified) {
      toast.error("Please verify your phone first");
      return;
    }

    setStep("payment");
  };

  const handlePayment = async () => {
    if (selectedPlan.id === "free") {
      router.push(
        `/signup?plan=${selectedPlan.id}&phone=${phone}&email=${email}&name=${encodeURIComponent(fullName)}`,
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          price: displayPrice,
          billingCycle,
          email,
          phone,
          name: fullName,
          sessionToken,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Plans
        </button>

        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700 p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white">
              {step === "phone" && "Verify Phone"}
              {step === "otp" && "Enter OTP"}
              {step === "details" && "Your Details"}
              {step === "payment" && "Payment"}
            </h1>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${step === "phone" ? "bg-[#25D366]" : "bg-slate-600"}`}
              />
              <span
                className={`w-3 h-3 rounded-full ${step === "otp" || step === "details" || step === "payment" ? "bg-[#25D366]" : "bg-slate-600"}`}
              />
              <span
                className={`w-3 h-3 rounded-full ${step === "details" || step === "payment" ? "bg-[#25D366]" : "bg-slate-600"}`}
              />
              <span
                className={`w-3 h-3 rounded-full ${step === "payment" ? "bg-[#25D366]" : "bg-slate-600"}`}
              />
            </div>
          </div>

          {step === "phone" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  WhatsApp Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="+1234567890"
                    className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  We'll send an OTP to verify your WhatsApp number
                </p>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full py-4 bg-[#25D366] text-slate-900 rounded-xl font-medium hover:bg-[#20c55e] transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Send OTP"
                )}
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <p className="text-slate-400">Enter the 6-digit code sent to</p>
                <p className="text-white font-medium">{phone}</p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  maxLength={6}
                />
                {countdown > 0 ? (
                  <p className="text-sm text-slate-500 mt-2 text-center">
                    Resend in {countdown}s
                  </p>
                ) : (
                  <button
                    onClick={handleSendOTP}
                    className="text-sm text-[#25D366] mt-2 block w-full text-center hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full py-4 bg-[#25D366] text-slate-900 rounded-xl font-medium hover:bg-[#20c55e] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Verify OTP"
                )}
              </button>

              <button
                onClick={() => {
                  setStep("phone");
                  setOtpSent(false);
                }}
                className="w-full text-slate-400 hover:text-white text-sm"
              >
                Change phone number
              </button>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-6">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400">
                  Phone verified successfully
                </span>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Phone Number (for WhatsApp)
                </label>
                <input
                  type="text"
                  value={phone}
                  disabled
                  className="w-full px-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-400 cursor-not-allowed"
                />
              </div>

              <button
                onClick={handleProceedToPayment}
                className="w-full py-4 bg-[#25D366] text-slate-900 rounded-xl font-medium hover:bg-[#20c55e] transition-colors flex items-center justify-center gap-2"
              >
                Continue to Payment
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-700/30 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">Plan</span>
                  <span className="text-white font-medium">
                    {selectedPlan.name}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">Billing</span>
                  <span className="text-white">{billingCycle}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                  <span className="text-white font-medium">Total</span>
                  <span className="text-2xl font-bold text-[#25D366]">
                    ${displayPrice}/mo
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="billing"
                    checked={billingCycle === "monthly"}
                    onChange={() => setBillingCycle("monthly")}
                    className="w-4 h-4 text-[#25D366]"
                  />
                  <span className="text-white">Monthly billing</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="billing"
                    checked={billingCycle === "yearly"}
                    onChange={() => setBillingCycle("yearly")}
                    className="w-4 h-4 text-[#25D366]"
                  />
                  <span className="text-white">
                    Yearly billing
                    <span className="ml-2 text-xs text-[#25D366]">
                      Save 20%
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Lock className="w-4 h-4" />
                <span>Secure payment powered by Stripe</span>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full py-4 bg-[#25D366] text-slate-900 rounded-xl font-medium hover:bg-[#20c55e] transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : selectedPlan.id === "free" ? (
                  "Create Free Account"
                ) : (
                  `Pay $${displayPrice}`
                )}
              </button>

              <button
                onClick={() => setStep("details")}
                className="w-full text-slate-400 hover:text-white text-sm"
              >
                Back to details
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
