import type { Metadata } from "next";
import "./globals.css";
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
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </body>
    </html>
  );
}
