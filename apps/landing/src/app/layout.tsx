import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'whatsAppAgent - AI Assistant for WhatsApp',
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
      <body>{children}</body>
    </html>
  );
}
