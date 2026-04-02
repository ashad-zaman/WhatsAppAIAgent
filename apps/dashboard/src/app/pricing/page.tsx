"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Zap,
  Shield,
  Users,
  MessageSquare,
  FileText,
  Bell,
  Calendar,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  features: string[];
  notIncluded: string[];
  cta: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    image: "/images/free-plan.svg",
    features: [
      "5 AI Agents",
      "100 messages/month",
      "One-time Reminders",
      "Basic Recurring Reminders",
      "Calendar Integration",
      "Calendar Sync",
      "Timezone Support",
      "Document Storage (100MB)",
      "Notes Saving",
      "Community support",
    ],
    notIncluded: [
      "Shared Reminders with Friends",
      "Schedule Notifications",
      "Call Reminder Notifications",
      "Voice messages",
      "Priority support",
      "Custom integrations",
    ],
    cta: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    description: "Best for growing teams",
    image: "/images/pro-plan.svg",
    features: [
      "All AI Agents",
      "Unlimited Messages",
      "One-time & Recurring Reminders",
      "Shared Reminders with Friends",
      "Schedule Notifications",
      "Call Reminder Notifications",
      "Priority Support",
      "Voice Message Processing",
      "Timezone Support",
      "Calendar Sync (Google & Outlook)",
      "Document Storage (10GB)",
      "Notes Saving & Organization",
      "Custom Integrations",
      "Analytics Dashboard",
    ],
    notIncluded: ["Dedicated account manager", "Custom SLA"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    description: "For large organizations",
    image: "/images/enterprise-plan.svg",
    features: [
      "Everything in Pro",
      "One-time & Recurring Reminders",
      "Shared Reminders with Friends",
      "Schedule Notifications",
      "Call Reminder Notifications",
      "Timezone Support",
      "Advanced Calendar Sync",
      "Document Storage (Unlimited)",
      "Notes with Advanced Organization",
      "Dedicated Account Manager",
      "Custom SLA",
      "On-premise Deployment",
      "Advanced Security",
      "Custom AI Training",
      "24/7 Phone Support",
      "SSO & SAML",
      "Audit Logs",
    ],
    notIncluded: [],
    cta: "Contact Sales",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );

  const handlePlanClick = (planId: string) => {
    if (planId === "enterprise") {
      window.location.href =
        "mailto:sales@whatsapp-ai.com?subject=Enterprise Plan Inquiry";
      return;
    }

    router.push(`/checkout/${planId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            Start free and scale as you grow. No credit card required to begin.
          </p>

          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-sm ${billingCycle === "monthly" ? "text-white" : "text-slate-400"}`}
            >
              Monthly
            </span>
            <button
              onClick={() =>
                setBillingCycle(
                  billingCycle === "monthly" ? "yearly" : "monthly",
                )
              }
              className="relative w-16 h-8 bg-slate-700 rounded-full p-1"
            >
              <div
                className={`absolute w-6 h-6 bg-[#25D366] rounded-full transition-transform ${
                  billingCycle === "yearly" ? "translate-x-8" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-sm ${billingCycle === "yearly" ? "text-white" : "text-slate-400"}`}
            >
              Yearly
              <span className="ml-2 text-xs text-[#25D366]">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-slate-800/50 backdrop-blur rounded-2xl p-8 border ${
                plan.popular
                  ? "border-[#25D366] shadow-lg shadow-[#25D366]/20"
                  : "border-slate-700"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#25D366] text-slate-900 text-sm font-bold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-slate-700/50 rounded-2xl flex items-center justify-center">
                  {plan.id === "free" && (
                    <Zap className="w-10 h-10 text-yellow-400" />
                  )}
                  {plan.id === "pro" && (
                    <Shield className="w-10 h-10 text-[#25D366]" />
                  )}
                  {plan.id === "enterprise" && (
                    <Users className="w-10 h-10 text-purple-400" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">
                    $
                    {billingCycle === "yearly"
                      ? Math.floor(plan.price * 0.8)
                      : plan.price}
                  </span>
                  <span className="text-slate-400">/month</span>
                </div>
                {billingCycle === "yearly" && plan.price > 0 && (
                  <p className="text-xs text-[#25D366] mt-1">
                    Save ${Math.floor(plan.price * 2.4)}/year
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </li>
                ))}
                {plan.notIncluded.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 opacity-50">
                    <X className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-500 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanClick(plan.id)}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  plan.popular
                    ? "bg-[#25D366] text-slate-900 hover:bg-[#20c55e]"
                    : "bg-slate-700 text-white hover:bg-slate-600"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div className="bg-slate-800/30 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-slate-400 text-sm">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-400 text-sm">
                We accept all major credit cards, PayPal, and bank transfers for
                enterprise plans.
              </p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">
                Is there a free trial?
              </h3>
              <p className="text-slate-400 text-sm">
                Yes! Pro plans include a 14-day free trial. No credit card
                required to start.
              </p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">
                What happens to my data if I cancel?
              </h3>
              <p className="text-slate-400 text-sm">
                Your data remains accessible for 30 days after cancellation. You
                can export it anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
