'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bot, Calendar, Bell, FileText, Check, Star, Menu, X, MessageSquare, Users, Shield, Zap, Play, ArrowRight, ChevronDown, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  const faqItems = [
    {
      question: "How do I get started?",
      answer: "Simply click 'Try For Free' and enter your WhatsApp number. You'll receive a verification code to activate your AI assistant."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use end-to-end encryption and follow industry best practices to keep your data safe and private."
    },
    {
      question: "Can I use it on multiple devices?",
      answer: "Your AI assistant works on any device with WhatsApp - just message the same number from any phone."
    },
    {
      question: "What happens after the free trial?",
      answer: "You can continue with the Pro plan for $29/month or switch to the Free plan with limited features."
    },
  ];
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [checkoutData, setCheckoutData] = useState({
    mobile: '',
    email: '',
  });
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setCheckoutLoading(false);
    setCheckoutStep(2);
  };

  const closeCheckout = () => {
    setCheckoutOpen(false);
    setCheckoutStep(1);
    setCheckoutData({ mobile: '', email: '' });
  };

  const pricingPlans = [
    {
      name: 'Free',
      price: 0,
      features: [
        '50 messages/month',
        '5 reminders/day',
        'Basic calendar sync',
        'Email support',
      ],
      cta: 'Get Started',
      action: () => {},
    },
    {
      name: 'Pro',
      price: 29,
      features: [
        'Unlimited messages',
        'Unlimited reminders',
        'Advanced calendar sync',
        'Document Q&A',
        'Voice notes',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      featured: true,
      action: () => setCheckoutOpen(true),
    },
    {
      name: 'Enterprise',
      price: 99,
      features: [
        'Everything in Pro',
        'Custom integrations',
        'Team collaboration',
        'Analytics dashboard',
        'Dedicated support',
        'SLA guarantee',
      ],
      cta: 'Contact Sales',
      action: () => {},
    },
  ];

  return (
    <div className="landing-container">
      <div className="background-dots"></div>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeCheckout}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
              <button onClick={closeCheckout} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>

              {checkoutStep === 1 ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot className="h-8 w-8 text-[#25D366]" />
                    </div>
                    <h3 className="text-2xl font-bold">Start Your Free Trial</h3>
                    <p className="text-gray-500 mt-2">14 days free, then $29/month</p>
                  </div>

                  <form onSubmit={handleCheckout} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={checkoutData.mobile}
                        onChange={(e) => setCheckoutData({ ...checkoutData, mobile: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none"
                        placeholder="+91 98765 43210"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">We&apos;ll send you a verification code on WhatsApp</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={checkoutData.email}
                        onChange={(e) => setCheckoutData({ ...checkoutData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none"
                        placeholder="you@example.com"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={checkoutLoading || !checkoutData.mobile}
                      className="w-full py-3 rounded-full font-semibold bg-[#25D366] text-white hover:bg-[#128C7E] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {checkoutLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          Continue with Mobile
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-xs text-gray-400 text-center mt-4">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                  </p>
                </>
              ) : (
                <>
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-600 mb-2">Success!</h3>
                    <p className="text-gray-600 mb-4">
                      Check your WhatsApp for a verification message to complete setup.
                    </p>
                    <p className="text-sm text-gray-500">
                      Sent to: <span className="font-semibold">{checkoutData.mobile}</span>
                    </p>
                  </div>

                  <button
                    onClick={closeCheckout}
                    className="w-full py-3 rounded-full font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <Link href="#landing">
              <div className="flex items-center gap-2">
                <Bot className="h-8 w-8 text-[#25D366]" />
                <span className="text-xl font-bold">My Smart Assistant</span>
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366" className="h-12 w-12">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h1 className="hero-title">
              AI Assistant<br />
              on WhatsApp
            </h1>
            <p className="hero-para">
              One place to manage your meetings,<br />
              reminders, notes, and documents
            </p>
            <a href="#plans" className="cta-button-hero">
              Try For Free
            </a>
          </div>
          <div className="hero-right">
            <div className="phone-container">
              <div className="hero-image">
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="w-full h-full object-cover rounded-[28px]"
                  poster="/phone-poster.jpg"
                >
                  <source src="https://dfc3matr71m6w.cloudfront.net/Mysa/webpAssets/Phone_image_main_page.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="video-section">
        <div className="video-container">
          <div className="video-thumbnail-wrapper">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <Image
                src="https://dfc3matr71m6w.cloudfront.net/Mysa/webpAssets/outside_video.webp"
                alt="Video Thumbnail"
                fill
                className="object-cover"
                style={{ borderRadius: '16px' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="cursor-pointer hover:scale-110 transition-transform">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                    <svg className="w-8 h-8 md:w-10 md:h-10 ml-1" fill="white" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="section-title">Unlock the Full Power of Your Basic Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="feature-card">
              <div className="feature-icon meetings">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="feature-title">Smart Scheduling</h3>
              <p className="feature-description">Automatically schedule and manage your meetings with natural language commands.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon reminders">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="feature-title">Instant Reminders</h3>
              <p className="feature-description">Set reminders via voice or text and receive timely notifications on WhatsApp.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon notes">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="feature-title">Voice Notes</h3>
              <p className="feature-description">Send voice messages and get them transcribed and organized automatically.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon documents">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="feature-title">AI Q&A</h3>
              <p className="feature-description">Ask questions about your documents and get instant, accurate answers.</p>
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
                className={`pricing-card ${plan.featured ? 'featured' : ''}`}
              >
                <h3 className="pricing-name">{plan.name}</h3>
                <div className="pricing-price">
                  ${plan.price}
                  {plan.price > 0 && <span>/month</span>}
                </div>
                <ul className="pricing-features">
                  {plan.features.map((feature, i) => (
                    <li key={i}>
                      <Check className="h-5 w-5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={plan.action}
                  className={`w-full py-3 rounded-full font-semibold transition ${
                    plan.featured 
                      ? 'bg-[#25D366] text-white hover:bg-[#128C7E]' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
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
          <div className="relative" style={{ width: '100%', maxWidth: '426px', margin: '0 auto' }}>
            <Image
              src="https://dfc3matr71m6w.cloudfront.net/Mysa/webpAssets/replacegif1.webp"
              alt="AI Technology"
              width={426}
              height={426}
              className="w-full h-auto"
              unoptimized
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="faq-container">
          <h2 className="faq-title">Questions?<br />Let's make life simple.</h2>
          <div className="faq-list">
            {faqItems.map((item, index) => (
              <div 
                key={index} 
                className={`faq-item ${openFaqIndex === index ? 'open' : ''}`}
              >
                <button 
                  className="faq-question"
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                >
                  <span>{item.question}</span>
                  <ChevronDown className={`faq-chevron ${openFaqIndex === index ? 'rotated' : ''}`} />
                </button>
                <div className={`faq-answer ${openFaqIndex === index ? 'open' : ''}`}>
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
            Experience the future of personal productivity — powered by AI & WhatsApp
          </h2>
          <p className="cta-final-subtitle">
            Manage meetings, reminders and all your document content in one place
          </p>
          <a href="#plans" className="cta-button-hero">
            Try Free Now
          </a>
        </div>
      </section>

      {/* Sticky CTA */}
      <div className="cta-sticky-bottom">
        <div className="cta-sticky-container">
          <a href="#plans" className="cta-button-sticky">
            <span className="cta-text-sticky">
              <MessageSquare className="h-5 w-5" />
              Try For Free
            </span>
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <div className="footer-brand">
                <Bot className="h-8 w-8 text-[#25D366]" />
                <span className="font-bold text-lg">whatsAppAgent</span>
              </div>
              <a href="mailto:support@mysmartassistant.ai" className="footer-email">
                support@mysmartassistant.ai
              </a>
            </div>
            <div className="footer-links-col">
              <h4 className="footer-heading">Support</h4>
              <ul className="footer-links">
                <li><Link href="/contact" className="footer-link">Contact Us</Link></li>
                <li><Link href="/plans" className="footer-link">Plans & Payment</Link></li>
                <li><Link href="/faq" className="footer-link">FAQ</Link></li>
              </ul>
            </div>
            <div className="footer-links-col">
              <h4 className="footer-heading">Legal</h4>
              <ul className="footer-links">
                <li><Link href="/privacy" className="footer-link">Privacy Policy</Link></li>
                <li><Link href="/terms" className="footer-link">Terms and Conditions</Link></li>
                <li><Link href="/cancellation" className="footer-link">Cancellation and Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-social">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 whatsAppAgent powered by <a href="https://scriptotechnology.com" target="_blank" rel="noopener noreferrer" className="footer-powered">Scripto Technology</a>. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
