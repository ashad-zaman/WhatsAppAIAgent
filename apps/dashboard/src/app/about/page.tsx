import { Metadata } from 'next';
import Link from 'next/link';
import { Bot, MessageSquare, Calendar, Bell, FileText, Shield, Zap, Users, Globe, Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About - My Smart Assistant',
  description: 'Learn about My Smart Assistant - AI-powered WhatsApp assistant for managing your daily tasks.',
};

export default function AboutPage() {
  const features = [
    {
      icon: MessageSquare,
      title: 'WhatsApp Integration',
      description: 'Connect with your AI assistant directly through WhatsApp, no additional apps needed.',
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Automatically schedule meetings and sync with your Google Calendar and Outlook.',
    },
    {
      icon: Bell,
      title: 'Intelligent Reminders',
      description: 'Never miss an important task with smart, context-aware reminders.',
    },
    {
      icon: FileText,
      title: 'Document Intelligence',
      description: 'Upload documents and ask questions. Get instant answers powered by AI.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Your data is encrypted and protected with industry-leading security measures.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Get instant responses powered by advanced AI models and optimized infrastructure.',
    },
  ];

  const team = [
    { name: 'Alex Johnson', role: 'CEO & Co-Founder', initials: 'AJ' },
    { name: 'Sarah Chen', role: 'CTO & Co-Founder', initials: 'SC' },
    { name: 'Michael Park', role: 'Head of Engineering', initials: 'MP' },
    { name: 'Emily Davis', role: 'Head of Product', initials: 'ED' },
  ];

  const values = [
    { icon: Users, title: 'User-First', description: 'Every decision starts with how it benefits our users.' },
    { icon: Shield, title: 'Privacy & Security', description: 'Your data belongs to you. We never sell or misuse it.' },
    { icon: Globe, title: 'Accessibility', description: 'Making AI accessible to everyone through familiar platforms.' },
    { icon: Heart, title: 'Simplicity', description: 'Powerful technology should be simple to use.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-[#25D366]" />
            <span className="font-bold text-gray-800">My Smart Assistant</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-sm text-gray-600 hover:text-gray-900">Features</Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link href="/about" className="text-sm text-[#25D366] font-medium">About</Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 px-6 bg-gradient-to-b from-green-50 to-white text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              AI That Works Where You Already Work
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              My Smart Assistant brings the power of AI to WhatsApp, so you can manage your calendar, 
              set reminders, and get answers—all from a conversation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/" className="px-8 py-3 bg-[#25D366] text-white rounded-full font-semibold hover:bg-[#128C7E] transition-colors">
                Get Started Free
              </Link>
              <Link href="/#features" className="px-8 py-3 bg-white text-gray-700 rounded-full font-semibold border border-gray-300 hover:bg-gray-50 transition-colors">
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              We believe AI should be accessible to everyone, not just those who can learn complex tools. 
              By bringing AI to WhatsApp—one of the most widely used messaging platforms in the world—we&apos;re 
              making intelligent assistance available to billions of people in a way that feels natural and familiar.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What We Offer</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="w-12 h-12 bg-[#25D366]/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-[#25D366]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-8 w-8 text-[#25D366]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Meet Our Team</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {team.map((member, i) => (
                <div key={i} className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                    {member.initials}
                  </div>
                  <h3 className="font-bold text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 px-6 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold mb-2">10K+</p>
                <p className="text-white/80">Active Users</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2">1M+</p>
                <p className="text-white/80">Messages Processed</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2">99.9%</p>
                <p className="text-white/80">Uptime</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-2">4.8/5</p>
                <p className="text-white/80">User Rating</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of users who are already enjoying the convenience of AI assistance on WhatsApp.
            </p>
            <Link href="/" className="inline-block px-8 py-4 bg-[#25D366] text-white rounded-full font-semibold text-lg hover:bg-[#128C7E] transition-colors">
              Try My Smart Assistant Free
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-[#25D366]" />
            <span className="font-bold text-white">My Smart Assistant</span>
          </div>
          <p className="text-sm">2026 My Smart Assistant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
