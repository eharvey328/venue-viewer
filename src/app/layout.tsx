import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Venue Viewer',
  description: 'Browse European wedding venues',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold text-gray-900">
              Venue Viewer
            </Link>
            <Link
              href="/venues/new"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              + Add Venue
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
      </body>
    </html>
  );
}
