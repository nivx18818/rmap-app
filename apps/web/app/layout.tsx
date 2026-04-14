import type { Metadata } from 'next';

import { Toaster } from '@repo/design-system/components/ui/sonner';
import { fonts } from '@repo/design-system/lib/fonts';
import '@repo/design-system/styles/globals.css';

import { AuthProvider } from '@/components/providers/auth-provider';
import { authServerData } from '@/data/auth-server';

export const metadata: Metadata = {
  title: 'RMap',
  description: 'Roadmap for IT Students',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await authServerData.getInitialUser();

  return (
    <html lang="en">
      <body className={fonts}>
        <AuthProvider initialUser={initialUser}>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
