import type { Metadata } from 'next';

import { fonts } from '@repo/design-system/lib/fonts';
import '@repo/design-system/styles/globals.css';

export const metadata: Metadata = {
  title: 'RMap',
  description: 'Roadmap for IT Students',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={fonts}>{children}</body>
    </html>
  );
}
