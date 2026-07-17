import type { Metadata } from "next";
import "./globals.css";
import "../styles/mobile-chat.css";
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/error-boundary'
import { AuthProvider } from '@/contexts/auth-context'

export const metadata: Metadata = {
  title: "Brand Voice Transformer",
  description: "Transform your content with authentic brand voice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans bg-background text-foreground antialiased">
        <AuthProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </AuthProvider>
        <Toaster 
          position="bottom-left"
          closeButton
          toastOptions={{
            duration: 4000,
            classNames: {
              toast: 'brand-toast',
              title: 'brand-toast-title',
              description: 'brand-toast-description',
              actionButton: 'brand-toast-action',
            },
          }}
        />
      </body>
    </html>
  );
}
