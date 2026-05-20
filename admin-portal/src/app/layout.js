import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata = {
  title: 'IEEE Bootcamp — Admin Portal',
  description: 'Admin and Volunteer management portal for IEEE Bootcamp platform',
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning prevents extension-injected attributes from breaking React
    // data-scroll-behavior="smooth" fixes the Next.js routing scroll warning
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#07070f" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}