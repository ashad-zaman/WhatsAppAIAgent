import { Metadata } from 'next';
import Link from 'next/link';
import { Bot, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cookie Policy - My Smart Assistant',
  description: 'Learn about how My Smart Assistant uses cookies and similar technologies.',
};

export default function CookiePolicy() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: March 30, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies</h2>
            <p className="text-gray-600">
              Cookies are small text files that are stored on your device when you visit a website. They help 
              websites remember your preferences and understand how you interact with the site. Similar 
              technologies include local storage, session storage, and pixel tags.
            </p>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Essential Cookies</h3>
            <p className="text-gray-600 mb-4">These cookies are necessary for the Service to function properly:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Session cookies:</strong> Maintain your logged-in state during a session</li>
              <li><strong>Security cookies:</strong> Protect against unauthorized access</li>
              <li><strong>Load balancing:</strong> Distribute traffic across servers</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Analytics Cookies</h3>
            <p className="text-gray-600 mb-4">These cookies help us understand how visitors interact with our Service:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Google Analytics:</strong> Tracks page views, session duration, and user flows</li>
              <li><strong>Error tracking:</strong> Identifies and reports technical issues</li>
              <li><strong>Performance monitoring:</strong> Measures service response times</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Functional Cookies</h3>
            <p className="text-gray-600 mb-4">These cookies enhance your experience:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Preferences:</strong> Remember your settings and preferences</li>
              <li><strong>Language:</strong> Store your language selection</li>
              <li><strong>Theme:</strong> Remember your display preferences</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Third-Party Cookies</h2>
            <p className="text-gray-600 mb-4">Some cookies are set by third-party services we use:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-gray-600">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">Provider</th>
                    <th className="text-left py-2">Purpose</th>
                    <th className="text-left py-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2">Google Analytics</td>
                    <td className="py-2">Usage analytics</td>
                    <td className="py-2">2 years</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2">Stripe</td>
                    <td className="py-2">Payment processing</td>
                    <td className="py-2">Session</td>
                  </tr>
                  <tr>
                    <td className="py-2">WhatsApp</td>
                    <td className="py-2">Message delivery</td>
                    <td className="py-2">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How Long We Keep Cookies</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Persistent cookies:</strong> Remain for a specified period (typically 1-24 months)</li>
              <li><strong>Security tokens:</strong> Valid for the duration of your session plus a short grace period</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Managing Your Cookie Preferences</h2>
            <p className="text-gray-600 mb-4">You can manage your cookie preferences in several ways:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Cookie Consent Banner:</strong> Accept or decline non-essential cookies when first visiting</li>
              <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies</li>
              <li><strong>Privacy Settings:</strong> Use our in-app privacy settings to customize preferences</li>
              <li><strong>Opt-Out Links:</strong> Use opt-out links provided by third-party analytics services</li>
            </ul>
            <p className="text-gray-600 mt-4">
              Note: Disabling certain cookies may affect the functionality of the Service.
            </p>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Updates to This Policy</h2>
            <p className="text-gray-600">
              We may update this Cookie Policy periodically to reflect changes in our practices or for other 
              operational, legal, or regulatory reasons. We will notify you of any material changes by posting 
              the updated policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Us</h2>
            <p className="text-gray-600">
              If you have questions about our use of cookies, please contact us at:
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
