import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/components/LanguageProvider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#09090b',
};

export const metadata: Metadata = {
  title: 'HookAI Studio — 3s AI Micro-Tools Hub',
  description:
    'RoomTransform 3s AI Interior Simulator & ClauseGuard 3s Contract Toxic Clause Scanner.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HookAI Studio',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#FAFAFA] text-zinc-900 overflow-x-hidden"
      >
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
