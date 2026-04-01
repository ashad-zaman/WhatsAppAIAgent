'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, ChevronDown, Search, MessageSquare } from 'lucide-react';

const faqCategories = [
  {
    name: 'Getting Started',
    faqs: [
      {
        question: 'How do I get started with whatsAppAgent?',
        answer: "Getting started is easy! Click 'Try for Free' on our homepage, enter your WhatsApp number, and you'll receive a verification code. Once verified, you can start using your AI assistant right away. The free tier includes 50 messages per month to get you started.",
      },
      {
        question: 'What do I need to use whatsAppAgent?',
        answer: "You only need a WhatsApp account and a smartphone or computer with internet access. No additional apps or software required - everything works directly through WhatsApp.",
      },
      {
        question: 'Is there a free trial?',
        answer: "Yes! We offer a 14-day free trial of our Pro plan. You get access to all Pro features including unlimited messages, reminders, and voice notes. After the trial, you can choose to continue with Pro ($29/month) or switch to our Free plan.",
      },
      {
        question: 'How does the WhatsApp integration work?',
        answer: "whatsAppAgent connects directly to WhatsApp through their official API. Once you verify your number, you can chat with your AI assistant just like you would with any other WhatsApp contact. No extra apps needed!",
      },
    ]
  },
  {
    name: 'Features & Capabilities',
    faqs: [
      {
        question: 'What can the AI assistant help me with?',
        answer: "Our AI assistant can help you with: Scheduling meetings and calendar management, setting reminders and getting notifications, taking and organizing notes, answering questions about your documents, transcribing voice notes, and general Q&A on various topics.",
      },
      {
        question: 'Can I use voice messages with whatsAppAgent?',
        answer: "Absolutely! Send a voice message and our AI will transcribe it, understand your intent, and take the appropriate action. This is perfect for setting reminders or creating notes on the go.",
      },
      {
        question: 'How accurate is the calendar integration?',
        answer: "Our calendar sync supports Google Calendar and Outlook. The AI can read your existing events, create new ones, and send reminders - all through simple chat commands like 'Schedule a meeting with John tomorrow at 3pm'.",
      },
      {
        question: 'Can I upload documents for the AI to analyze?',
        answer: "Yes! Pro and Enterprise users can share documents (PDF, Word, text files) directly in chat. The AI will read, analyze, and answer questions about the content. This is great for reviewing contracts, reports, or research materials.",
      },
    ]
  },
  {
    name: 'Billing & Payments',
    faqs: [
      {
        question: 'What payment methods do you accept?',
        answer: "We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and UPI payments. All payments are processed securely through Razorpay.",
      },
      {
        question: 'Can I change my plan later?',
        answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, the change takes effect at the start of your next billing cycle.",
      },
      {
        question: 'What happens if I cancel my subscription?',
        answer: "If you cancel, you'll retain access to paid features until the end of your current billing period. After that, you'll automatically be moved to the Free plan with limited features. Your data is never deleted.",
      },
      {
        question: 'Do you offer refunds?',
        answer: "Yes, we have a 7-day refund policy. If you're not satisfied with our service within the first 7 days of your subscription, contact us for a full refund. Please see our Cancellation and Refund Policy for full details.",
      },
    ]
  },
  {
    name: 'Security & Privacy',
    faqs: [
      {
        question: 'Is my data secure?',
        answer: "Security is our top priority. We use end-to-end encryption for all data in transit, store data in encrypted databases, and follow industry best practices including GDPR compliance. Your conversations and data are never shared with third parties.",
      },
      {
        question: 'Who can see my conversations?',
        answer: "Only you and our AI systems can see your conversations. Our AI processes messages to generate responses - human review only happens in cases of flagged content or explicit support requests. We never sell or share your data.",
      },
      {
        question: 'Can I delete my data?',
        answer: "Yes, you can request data deletion at any time through your account settings or by contacting support. We comply with all data deletion requests within 30 days per GDPR requirements.",
      },
      {
        question: 'Where is my data stored?',
        answer: "Your data is stored in secure, SSAE 16 compliant data centers. We use cloud infrastructure from AWS and Google Cloud Platform with data centers in the US and Europe.",
      },
    ]
  },
  {
    name: 'Troubleshooting',
    faqs: [
      {
        question: "Why am I not receiving responses?",
        answer: "First, check that you have a stable internet connection. Make sure you're messaging the correct WhatsApp number. Also, check that our number isn't blocked. If issues persist, try re-verifying your number from the dashboard.",
      },
      {
        question: "The AI isn't understanding my requests",
        answer: "Try being more specific in your requests. For complex tasks, break them into smaller steps. You can also use commands like 'Help' to see available actions. If problems continue, contact support with an example of what you tried.",
      },
      {
        question: "My reminders aren't working",
        answer: "Ensure notifications are enabled for WhatsApp in your phone settings. Check that the reminder time hasn't already passed. You can view and manage all reminders in your dashboard.",
      },
    ]
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const allCategories = ['All', ...faqCategories.map(c => c.name)];

  const filteredFAQs = searchQuery
    ? faqCategories.flatMap(c => c.faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    : activeCategory === 'All'
      ? faqCategories.flatMap(c => c.faqs)
      : faqCategories.find(c => c.name === activeCategory)?.faqs || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-[#25D366]" />
            <span className="font-bold text-lg">whatsAppAgent</span>
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-[#25D366] transition">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-600 text-center mb-8">
          Find answers to common questions about whatsAppAgent
        </p>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-300 focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none"
          />
        </div>

        {!searchQuery && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeCategory === category
                    ? 'bg-[#25D366] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {filteredFAQs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`px-6 pb-5 text-gray-600 leading-relaxed ${
                  openIndex === index ? 'block' : 'hidden'
                }`}
              >
                {faq.answer}
              </div>
            </div>
          ))}

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No questions found matching your search.</p>
            </div>
          )}
        </div>

        <div className="mt-12 bg-gradient-to-r from-[#25D366]/10 to-[#128C7E]/10 rounded-2xl p-8 text-center">
          <MessageSquare className="h-12 w-12 text-[#25D366] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Still have questions?</h2>
          <p className="text-gray-600 mb-4">Cannot find what you are looking for? Our support team is here to help.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-full font-semibold hover:bg-[#128C7E] transition"
          >
            <MessageSquare className="h-5 w-5" />
            Contact Support
          </Link>
        </div>
      </main>
    </div>
  );
}
