import { Metadata } from 'next';
import Link from 'next/link';
import { Bot, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service - My Smart Assistant',
  description: 'Read the terms and conditions for using My Smart Assistant AI platform.',
};

export default function TermsOfService() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-gray-500 mb-8">Last updated: March 30, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600">
              By accessing or using My Smart Assistant (&quot;the Service&quot;), you agree to be bound by these Terms of Service 
              (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Service. These Terms constitute 
              a legally binding agreement between you and My Smart Assistant.
            </p>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Account Registration</h2>
            <p className="text-gray-600 mb-4">To use certain features of the Service, you must create an account. You agree to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Acceptable Use</h2>
            <p className="text-gray-600 mb-4">You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Send spam, malware, or malicious content</li>
              <li>Attempt to gain unauthorized access to systems</li>
              <li>Interfere with the normal operation of the Service</li>
              <li>Use automated systems that exceed reasonable request limits</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Content</h2>
            <p className="text-gray-600 mb-4">
              You retain ownership of content you submit to the Service. By submitting content, you grant us a 
              worldwide, non-exclusive, royalty-free license to use, copy, modify, and display your content solely 
              for the purpose of providing and improving the Service.
            </p>
            <p className="text-gray-600">
              You represent that you own or have the necessary rights to your content and that your content 
              does not violate the rights of any third party.
            </p>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property</h2>
            <p className="text-gray-600 mb-4">
              The Service and its original content, features, and functionality are owned by My Smart Assistant and 
              are protected by international copyright, trademark, and other intellectual property laws. You may not:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Copy, modify, or distribute our content without permission</li>
              <li>Use our trademarks without written consent</li>
              <li>Reverse engineer or decompile the Service</li>
              <li>Remove any copyright or proprietary notices</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Service Availability</h2>
            <p className="text-gray-600 mb-4">
              We reserve the right to modify, suspend, or discontinue the Service at any time, with or without notice. 
              We are not liable for any such modification, suspension, or discontinuation.
            </p>
            <p className="text-gray-600">
              We strive for 99.9% uptime but do not guarantee uninterrupted access to the Service. Scheduled 
              maintenance may occur periodically.
            </p>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-600">
              To the maximum extent permitted by law, My Smart Assistant shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, including without limitation, loss of profits, 
              data, use, goodwill, or other intangible losses resulting from your use of the Service.
            </p>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Indemnification</h2>
            <p className="text-gray-600">
              You agree to defend, indemnify, and hold harmless My Smart Assistant and its affiliates, licensors, 
              and service providers from any claims, liabilities, damages, judgments, awards, losses, costs, or 
              expenses arising out of your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Governing Law</h2>
            <p className="text-gray-600">
              These Terms shall be governed by and construed in accordance with the laws of the State of California, 
              without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of 
              San Francisco County, California.
            </p>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-600">
              We reserve the right to modify these Terms at any time. We will notify you of significant changes 
              by posting a notice on our website or sending an email. Your continued use of the Service after 
              such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
            <p className="text-gray-600">
              If you have any questions about these Terms, please contact us at:
            </p>
            <ul className="list-none mt-4 text-gray-600 space-y-2">
              <li><strong>Email:</strong> legal@smartassistant.ai</li>
              <li><strong>Address:</strong> 123 AI Street, San Francisco, CA 94102</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
