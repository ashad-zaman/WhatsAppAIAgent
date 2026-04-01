import { Metadata } from 'next';
import Link from 'next/link';
import { Bot, ArrowLeft, Check, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Plans & Payment - whatsAppAgent',
  description: 'Choose the perfect plan for your needs. Free, Pro, and Enterprise options available.',
};

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    features: [
      '50 messages/month',
      '5 reminders/day',
      'Basic calendar sync',
      'Email support',
    ],
    cta: 'Get Started',
    href: '/',
    featured: false,
  },
  {
    name: 'Pro',
    price: 29,
    description: 'Best for personal productivity',
    features: [
      'Unlimited messages',
      'Unlimited reminders',
      'Advanced calendar sync',
      'Document Q&A',
      'Voice notes transcription',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    href: '/',
    featured: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 99,
    description: 'For teams and businesses',
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Team collaboration',
      'Analytics dashboard',
      'Dedicated support',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    featured: false,
  },
];

const faqs = [
  {
    question: 'Can I switch plans anytime?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time from your account settings. Upgrades take effect immediately, while downgrades apply at the start of your next billing cycle.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and UPI payments. All payments are processed securely through Razorpay.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! The Pro plan comes with a 14-day free trial. You get full access to all Pro features with no credit card required to start.',
  },
  {
    question: 'What happens after the free trial?',
    answer: 'After your 14-day trial, you\'ll be automatically charged $29/month unless you cancel. You can cancel anytime before the trial ends.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we have a 7-day refund policy. If you\'re not satisfied within the first 7 days of your subscription, contact us for a full refund. See our Cancellation and Refund Policy for details.',
  },
];

export default function PlansPage() {
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Start free and upgrade as you grow. All plans include our core AI assistant features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl p-6 shadow-sm border ${
                plan.featured
                  ? 'border-[#25D366] ring-2 ring-[#25D366]/20 relative'
                  : 'border-gray-200'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#25D366] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  {plan.price > 0 && (
                    <span className="text-gray-500">/month</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                    <Check className="h-5 w-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full py-3 rounded-full font-semibold text-center block transition ${
                  plan.featured
                    ? 'bg-[#25D366] text-white hover:bg-[#128C7E]'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-[#25D366]/10 to-[#128C7E]/10 rounded-2xl p-8 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-6 w-6 text-[#25D366]" />
            <h2 className="text-2xl font-bold text-gray-900">Enterprise Solutions</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Need a custom solution for your organization? We offer tailored Enterprise plans with:
          </p>
          <ul className="space-y-2 text-gray-600 mb-6">
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-[#25D366]" />
              Custom AI model training on your data
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-[#25D366]" />
              Dedicated account manager
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-[#25D366]" />
              On-premise deployment options
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-[#25D366]" />
              API access and integrations
            </li>
          </ul>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-full font-semibold hover:bg-[#128C7E] transition"
          >
            Contact Sales
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>All prices are in USD and billed monthly. Cancel anytime.</p>
          <p className="mt-2">
            Questions about our plans?{' '}
            <Link href="/contact" className="text-[#25D366] hover:underline">
              Contact us
            </Link>
            {' '}&middot;{' '}
            <Link href="/cancellation" className="text-[#25D366] hover:underline">
              Refund policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
