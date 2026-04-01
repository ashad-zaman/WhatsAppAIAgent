import { Metadata } from 'next';
import Link from 'next/link';
import { Bot, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - My Smart Assistant',
  description: 'Learn how My Smart Assistant collects, uses, and protects your personal information.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-[#25D366]" />
            <span className="font-bold text-gray-800">My Smart Assistant</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: March 30, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="text-gray-600 mb-4">We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, and profile picture when you create an account.</li>
              <li><strong>WhatsApp Data:</strong> Messages you send to our AI assistant, including text, voice notes, and documents.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our services, including message frequency, features used, and timestamps.</li>
              <li><strong>Device Information:</strong> Device type, operating system, and unique device identifiers.</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Provide, maintain, and improve our AI assistant services</li>
              <li>Process and respond to your messages and requests</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent or unauthorized activities</li>
              <li>Personalize and improve your experience</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
            <p className="text-gray-600 mb-4">We do not sell, trade, or otherwise transfer your personal information to third parties except:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Service Providers:</strong> We share information with vendors who assist in operating our services (e.g., cloud hosting, analytics).</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid requests by public authorities.</li>
              <li><strong>Business Transfers:</strong> Information may be transferred in connection with a merger, acquisition, or sale of assets.</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Retention</h2>
            <p className="text-gray-600">
              We retain your information for as long as your account is active or as needed to provide services. 
              You may request deletion of your data at any time. We will delete or anonymize your data within 30 days 
              of a valid deletion request, except where retention is required by law.
            </p>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights Under GDPR</h2>
            <p className="text-gray-600 mb-4">If you are located in the European Economic Area, you have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Restrict Processing:</strong> Request limitation of data processing</li>
              <li><strong>Data Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Object:</strong> Object to processing based on legitimate interests</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Childrens Privacy</h2>
            <p className="text-gray-600">
              Our services are not intended for individuals under the age of 13. We do not knowingly collect 
              personal information from children under 13. If we become aware that we have collected data from 
              a child under 13, we will take steps to delete that information promptly.
            </p>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. International Data Transfers</h2>
            <p className="text-gray-600">
              Your information may be transferred to and processed in countries other than your country of residence. 
              These countries may have different data protection laws. We ensure appropriate safeguards are in place 
              for such transfers, including Standard Contractual Clauses.
            </p>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <ul className="list-none mt-4 text-gray-600 space-y-2">
              <li><strong>Email:</strong> privacy@smartassistant.ai</li>
              <li><strong>Address:</strong> 123 AI Street, San Francisco, CA 94102</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
