import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from 'sonner';
import { RealtimeNotifications } from '@/components/realtime-notifications';

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${inter.className} antialiased transition-colors duration-300 bg-[var(--color-background)] text-[var(--color-foreground)]`}>
        <Providers>
          <div className="fixed top-4 right-4 z-50">
            <RealtimeNotifications />
          </div>
          {children}
        </Providers>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
