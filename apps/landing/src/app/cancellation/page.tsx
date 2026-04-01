import { Metadata } from 'next';
import Link from 'next/link';
import { Bot, ArrowLeft, Check, Clock, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cancellation and Refund Policy - whatsAppAgent',
  description: 'Learn about our cancellation process and refund policy for whatsAppAgent subscriptions.',
};

export default function CancellationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-[#25D366]" />
            <span className="font-bold text-gray-800">whatsAppAgent</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Cancellation and Refund Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: March 30, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#25D366]/10 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-[#25D366]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">1. Cancellation Policy</h2>
            </div>
            <p className="text-gray-600 mb-4">
              You may cancel your subscription to whatsAppAgent at any time. Cancellation takes effect at the end of your current billing period.
            </p>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">How to Cancel</h3>
            <ol className="list-decimal pl-6 text-gray-600 space-y-2 mb-4">
              <li>Log in to your whatsAppAgent account</li>
              <li>Go to Settings &gt; Subscription</li>
              <li>Click &quot;Cancel Subscription&quot;</li>
              <li>Confirm your cancellation</li>
            </ol>
            <p className="text-gray-600">
              Alternatively, you can contact our support team at{' '}
              <a href="mailto:support@whatsappagent.com" className="text-[#25D366] hover:underline">
                support@whatsappagent.com
              </a>{' '}
              to request cancellation.
            </p>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">2. Refund Policy</h2>
            </div>
            <p className="text-gray-600 mb-4">
              We offer a <strong>7-day money-back guarantee</strong> for all new paid subscriptions. If you&apos;re not completely satisfied with whatsAppAgent within the first 7 days of your subscription, you can request a full refund.
            </p>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Refund Eligibility</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>First-time subscribers only (one refund per customer)</li>
              <li>Request must be made within 7 days of initial subscription</li>
              <li>Applies to monthly and annual plans</li>
              <li>Refunds are processed to the original payment method</li>
            </ul>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Non-Refundable Items</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Refunds requested after 7 days from subscription date</li>
              <li>Renewed subscriptions (cancellation must be done before renewal)</li>
              <li>Usage beyond the trial period for converted trials</li>
              <li>Partial month refunds for annual plans</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#25D366]/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-[#25D366]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">3. Important Notes</h2>
            </div>
            <div className="space-y-4 text-gray-600">
              <p>
                <strong>Access After Cancellation:</strong> You will retain access to all paid features until the end of your current billing period. After that, your account will be automatically downgraded to the Free plan.
              </p>
              <p>
                <strong>Data Retention:</strong> Your data and content will be retained for 30 days after cancellation. You can reactivate your subscription at any time during this period to restore full access.
              </p>
              <p>
                <strong>Automatic Downgrade:</strong> After cancellation, your account will automatically be moved to the Free plan, which includes limited features (50 messages/month, 5 reminders/day).
              </p>
              <p>
                <strong>Refund Processing Time:</strong> Refunds are typically processed within 5-10 business days. The refund will appear in your account depending on your bank&apos;s processing times.
              </p>
            </div>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How to Request a Refund</h2>
            <p className="text-gray-600 mb-4">To request a refund within the 7-day period:</p>
            <ol className="list-decimal pl-6 text-gray-600 space-y-2 mb-6">
              <li>Email us at <a href="mailto:support@whatsappagent.com" className="text-[#25D366] hover:underline">support@whatsappagent.com</a> with subject line &quot;Refund Request&quot;</li>
              <li>Include your registered email address and account details</li>
              <li>Briefly explain the reason for your refund request</li>
              <li>Our team will review and process your request within 24-48 hours</li>
            </ol>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">
                <strong>Note:</strong> For security purposes, we may require additional verification before processing your refund request.
              </p>
            </div>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Subscription Billing</h2>
            <p className="text-gray-600 mb-4">Understanding your billing cycle:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Monthly Plans:</strong> Billed on the same day each month</li>
              <li><strong>Annual Plans:</strong> Billed once per year with discount</li>
              <li><strong>Free Trial:</strong> No charges during trial; card on file for subsequent billing</li>
              <li><strong>Plan Changes:</strong> Upgrades take effect immediately; downgrades apply at next billing date</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about our cancellation or refund policies, please don&apos;t hesitate to contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600">
                <strong>Email:</strong>{' '}
                <a href="mailto:support@whatsappagent.com" className="text-[#25D366] hover:underline">
                  support@whatsappagent.com
                </a>
              </p>
              <p className="text-gray-600 mt-2">
                <strong>Support Hours:</strong> Monday - Friday, 9 AM - 6 PM EST
              </p>
            </div>
          </section>

          <section className="bg-[#25D366]/5 rounded-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">We&apos;re Here to Help</h2>
            <p className="text-gray-600 mb-4">
              Before requesting a refund, consider reaching out to our support team. We&apos;re always happy to help resolve any issues you may be experiencing with whatsAppAgent.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-full font-semibold hover:bg-[#128C7E] transition"
            >
              Contact Support
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
