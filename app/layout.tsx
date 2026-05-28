import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aruma Invoice Generator',
  description: 'Aruma Properties invoice management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
