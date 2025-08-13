import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';

// Using system fonts for now - can be replaced with proper Persian fonts later
const vazir = {
  variable: '--font-vazir',
  className: 'font-sans',
};

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'فیدمجیکس - تحلیل هوشمند غذای حیوانات خانگی',
  description:
    'پلتفرم هوشمند تحلیل غذای حیوانات خانگی با استفاده از هوش مصنوعی',
  keywords: [
    'غذای حیوانات',
    'تحلیل غذا',
    'هوش مصنوعی',
    'حیوانات خانگی',
    'سلامت حیوانات',
  ],
  authors: [{ name: 'FeedMagix Team' }],
  creator: 'FeedMagix',
  publisher: 'FeedMagix',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://feedmagix.com'),
  alternates: {
    canonical: '/',
    languages: {
      'fa-IR': '/',
    },
  },
  openGraph: {
    title: 'فیدمجیکس - تحلیل هوشمند غذای حیوانات خانگی',
    description:
      'پلتفرم هوشمند تحلیل غذای حیوانات خانگی با استفاده از هوش مصنوعی',
    url: 'https://feedmagix.com',
    siteName: 'فیدمجیکس',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'فیدمجیکس - تحلیل هوشمند غذای حیوانات خانگی',
    description:
      'پلتفرم هوشمند تحلیل غذای حیوانات خانگی با استفاده از هوش مصنوعی',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body
        className={`${vazir.variable} ${geistMono.variable} antialiased persian-text`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
