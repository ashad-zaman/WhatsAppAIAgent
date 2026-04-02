"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bot,
  Calendar,
  Bell,
  FileText,
  Check,
  X,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Loader2,
} from "lucide-react";

export default function HomePage() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [signupStep, setSignupStep] = useState<"phone" | "otp" | "name">(
    "phone",
  );
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleProTrial = () => {
    setCheckoutOpen(true);
    setSignupStep("phone");
    setPhone("");
    setOtp("");
    setName("");
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSignupStep("otp");
    }, 1000);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSignupStep("name");
    }, 1000);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = "/dashboard";
    }, 1500);
  };

  const closeCheckout = () => {
    setCheckoutOpen(false);
    setSignupStep("phone");
  };

  const faqItems = [
    {
      question: "How do I get started?",
      answer:
        "Simply click 'Try For Free' and enter your WhatsApp number. You'll receive a verification code to activate your AI assistant.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Yes, we use end-to-end encryption and follow industry best practices to keep your data safe and private.",
    },
    {
      question: "Can I use it on multiple devices?",
      answer:
        "Your AI assistant works on any device with WhatsApp - just message the same number from any phone.",
    },
    {
      question: "What happens after the free trial?",
      answer:
        "You can continue with the Pro plan for $29/month or switch to the Free plan with limited features.",
    },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: 0,
      features: [
        "50 messages/month",
        "5 reminders/day",
        "Basic calendar sync",
        "Email support",
      ],
      cta: "Get Started",
    },
    {
      name: "Pro",
      price: 29,
      features: [
        "Unlimited messages",
        "Unlimited reminders",
        "Advanced calendar sync",
        "Document Q&A",
        "Voice notes",
        "Priority support",
      ],
      cta: "Start Free Trial",
      featured: true,
    },
    {
      name: "Enterprise",
      price: 99,
      features: [
        "Everything in Pro",
        "Custom integrations",
        "Team collaboration",
        "Analytics dashboard",
        "Dedicated support",
        "SLA guarantee",
      ],
      cta: "Contact Sales",
    },
  ];

  return (
    <div className="landing-container">
      <div className="background-dots"></div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <Link href="#landing">
              <div className="navbar-brand-content">
                <Bot className="h-8 w-8" style={{ color: "#25D366" }} />
                <span className="navbar-brand-text">whatsAppAgent</span>
              </div>
            </Link>
          </div>
          <div className="navbar-menu">
            <Link href="#plans" className="cta-button-nav">
              Try for Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="landing" className="hero-section">
        <div className="hero-content">
          <div className="hero-left">
            <div className="sparkle-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#25D366"
                className="h-12 w-12"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h1 className="hero-title">
              AI Assistant
              <br />
              on WhatsApp
            </h1>
            <p className="hero-para">
              One place to manage your meetings,
              <br />
              reminders, notes, and documents
            </p>
            <a href="#plans" className="cta-button-hero">
              Try For Free
            </a>
          </div>
          <div className="hero-right">
            <div className="phone-container">
              <div className="hero-image">
                <div className="whatsapp-chat-demo">
                  {/* Chat Header */}
                  <div className="chat-header">
                    <div className="chat-avatar">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="chat-header-info">
                      <span className="chat-name">AI Assistant</span>
                      <span className="chat-status">online</span>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="chat-messages">
                    <div className="message received">
                      <div className="message-bubble">
                        Hi! I'm your AI assistant. How can I help you today?
                      </div>
                      <span className="message-time">10:30</span>
                    </div>

                    <div className="message sent">
                      <div className="message-bubble">
                        Can you remind me about my meeting at 2pm?
                      </div>
                      <span className="message-time">10:31</span>
                    </div>

                    <div className="message received">
                      <div className="message-bubble">
                        Sure! I've set a reminder for your 2pm meeting. You'll
                        receive a notification 15 minutes before.
                      </div>
                      <span className="message-time">10:31</span>
                    </div>

                    <div className="message sent">
                      <div className="message-bubble">
                        Great! Also, add it to my calendar.
                      </div>
                      <span className="message-time">10:32</span>
                    </div>

                    <div className="message received typing">
                      <div className="message-bubble typing">
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                      </div>
                    </div>
                  </div>

                  {/* Chat Input */}
                  <div className="chat-input">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      disabled
                    />
                    <button className="send-button">
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="video-section">
        <div className="video-container">
          <div className="video-thumbnail-wrapper">
            <video
              className="video-thumbnail-inner"
              autoPlay
              muted
              loop
              playsInline
              style={{ width: "100%", borderRadius: "16px" }}
              onError={(e) => {
                const video = e.currentTarget;
                video.style.display = "none";
                const fallback = document.getElementById("video-fallback");
                if (fallback) fallback.style.display = "block";
              }}
            >
              <source src="/Phone_image_main_page.mp4" type="video/mp4" />
              <source
                src="https://dfc3matr71m6w.cloudfront.net/Mysa/webpAssets/Phone_image_main_page.mp4"
                type="video/mp4"
              />
            </video>
            <div
              id="video-fallback"
              style={{
                display: "none",
                width: "100%",
                height: "300px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "white",
                  fontSize: "18px",
                }}
              >
                🎥 Video Preview
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="section-title">
            Unlock the Full Power of Your Basic Plan
          </h2>
          <div className="features-grid">
            <div className="feature-card">
              <div
                className="feature-icon"
                style={{ background: "#dcf8c6", color: "#128C7E" }}
              >
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="feature-title">Smart Scheduling</h3>
              <p className="feature-description">
                Automatically schedule and manage your meetings with natural
                language commands.
              </p>
            </div>
            <div className="feature-card">
              <div
                className="feature-icon"
                style={{ background: "#fef3c7", color: "#d97706" }}
              >
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="feature-title">Instant Reminders</h3>
              <p className="feature-description">
                Set reminders via voice or text and receive timely notifications
                on WhatsApp.
              </p>
            </div>
            <div className="feature-card">
              <div
                className="feature-icon"
                style={{ background: "#dbeafe", color: "#2563eb" }}
              >
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="feature-title">Voice Notes</h3>
              <p className="feature-description">
                Send voice messages and get them transcribed and organized
                automatically.
              </p>
            </div>
            <div className="feature-card">
              <div
                className="feature-icon"
                style={{ background: "#f3e8ff", color: "#9333ea" }}
              >
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="feature-title">AI Q&A</h3>
              <p className="feature-description">
                Ask questions about your documents and get instant, accurate
                answers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="plans" className="pricing-section">
        <div className="pricing-container">
          <h2 className="section-title">Choose Your Plan</h2>
          <div className="pricing-grid">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`pricing-card ${plan.featured ? "featured" : ""}`}
              >
                <h3 className="pricing-name">{plan.name}</h3>
                <div className="pricing-price">
                  ${plan.price}
                  {plan.price > 0 && <span>/month</span>}
                </div>
                <ul className="pricing-features">
                  {plan.features.map((feature, i) => (
                    <li key={i}>
                      <Check className="h-5 w-5" style={{ color: "#25D366" }} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`pricing-button ${plan.featured ? "featured" : ""}`}
                  onClick={plan.featured ? handleProTrial : undefined}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="ai-section">
        <div className="ai-container">
          <Image
            src="https://dfc3matr71m6w.cloudfront.net/Mysa/webpAssets/replacegif1.webp"
            alt="AI Technology"
            width={426}
            height={426}
            style={{ width: "100%", height: "auto" }}
            unoptimized
          />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="faq-container">
          <h2 className="faq-title">
            Questions?
            <br />
            Let's make life simple.
          </h2>
          <div className="faq-list">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className={`faq-item ${openFaqIndex === index ? "open" : ""}`}
              >
                <button
                  className="faq-question"
                  onClick={() =>
                    setOpenFaqIndex(openFaqIndex === index ? null : index)
                  }
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    className={`faq-chevron ${openFaqIndex === index ? "rotated" : ""}`}
                  />
                </button>
                <div
                  className={`faq-answer ${openFaqIndex === index ? "open" : ""}`}
                >
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-final-section">
        <div className="cta-final-container">
          <div className="cta-final-image-wrapper">
            <Image
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face"
              alt="AI Assistant"
              width={280}
              height={280}
              className="cta-final-image"
              unoptimized
            />
            <div className="cta-final-image-glow"></div>
          </div>
          <h2 className="cta-final-title">
            Experience the future of personal productivity — powered by AI &
            WhatsApp
          </h2>
          <p className="cta-final-subtitle">
            Manage meetings, reminders and all your document content in one
            place
          </p>
          <a href="#plans" className="cta-button-hero">
            Try Free Now
          </a>
        </div>
      </section>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="modal-overlay" onClick={closeCheckout}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeCheckout}>
              <X className="h-5 w-5" />
            </button>

            <div className="modal-header">
              <div className="modal-icon">
                <Bot className="h-8 w-8" style={{ color: "#25D366" }} />
              </div>
              <h2 className="modal-title">
                {signupStep === "phone" && "Start your free trial"}
                {signupStep === "otp" && "Verify your number"}
                {signupStep === "name" && "Almost there!"}
              </h2>
              <p className="modal-subtitle">
                {signupStep === "phone" &&
                  "Enter your WhatsApp number to get started"}
                {signupStep === "otp" && `We sent a code to ${phone}`}
                {signupStep === "name" && "Tell us your name"}
              </p>
            </div>

            {signupStep === "phone" && (
              <form onSubmit={handlePhoneSubmit} className="modal-form">
                <div className="input-group">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="modal-input"
                    autoFocus
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="modal-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Continue"
                  )}
                </button>
              </form>
            )}

            {signupStep === "otp" && (
              <form onSubmit={handleOtpSubmit} className="modal-form">
                <div className="otp-inputs">
                  {[...Array(6)].map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      className="otp-input"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d$/.test(val)) {
                          const newOtp = otp.split("");
                          newOtp[i] = val;
                          setOtp(newOtp.join(""));
                          if (i < 5) {
                            const nextInput = document.querySelectorAll(
                              ".otp-input",
                            )[i + 1] as HTMLInputElement;
                            nextInput?.focus();
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[i] && i > 0) {
                          const prevInput = document.querySelectorAll(
                            ".otp-input",
                          )[i - 1] as HTMLInputElement;
                          prevInput?.focus();
                        }
                      }}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  className="modal-button"
                  disabled={isLoading || otp.length < 6}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </button>
                <button
                  type="button"
                  className="modal-resend"
                  onClick={() => setSignupStep("phone")}
                >
                  Change phone number
                </button>
              </form>
            )}

            {signupStep === "name" && (
              <form onSubmit={handleNameSubmit} className="modal-form">
                <div className="input-group">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="modal-input"
                    autoFocus
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="modal-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Complete Setup"
                  )}
                </button>
              </form>
            )}

            <p className="modal-terms">
              By continuing, you agree to our <Link href="/terms">Terms</Link>{" "}
              and <Link href="/privacy">Privacy Policy</Link>
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <div className="footer-brand">
                <Bot className="h-8 w-8" style={{ color: "#25D366" }} />
                <span className="footer-brand-text">whatsAppAgent</span>
              </div>
              <a
                href="mailto:support@whatsappagent.com"
                className="footer-email"
              >
                support@whatsappagent.com
              </a>
            </div>
            <div className="footer-links-col">
              <h4 className="footer-heading">Support</h4>
              <ul className="footer-links">
                <li>
                  <Link href="/contact" className="footer-link">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/plans" className="footer-link">
                    Plans & Payment
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="footer-link">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div className="footer-links-col">
              <h4 className="footer-heading">Legal</h4>
              <ul className="footer-links">
                <li>
                  <Link href="/privacy" className="footer-link">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="footer-link">
                    Terms and Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/cancellation" className="footer-link">
                    Cancellation and Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-social">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
          <div className="footer-bottom">
            <p>
              &copy; 2026 whatsAppAgent powered by{" "}
              <a
                href="https://scriptotechnology.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-powered"
              >
                Scripto Technology
              </a>
              . All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
