import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'My Smart Assistant – AI Assistant for WhatsApp',
  description: 'One place to manage your meetings, reminders, notes, and documents on WhatsApp. Powered by advanced AI.',
  keywords: ['AI assistant', 'WhatsApp', 'reminders', 'calendar', 'meetings', 'productivity'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
