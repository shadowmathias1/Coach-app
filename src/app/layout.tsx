import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import ThemeToaster from '@/components/shared/ThemeToaster';
import { LanguageProvider } from '@/components/shared/LanguageProvider';
import { UnitProvider } from '@/components/shared/UnitProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export const metadata: Metadata = {
  title: 'Coach App - Professional Training Management',
  description: 'Manage clients, programs, and track progress with ease',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} theme-dark`}>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <UnitProvider>
              {children}
              <ThemeToaster />
            </UnitProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
