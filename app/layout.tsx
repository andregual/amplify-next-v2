import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@aws-amplify/ui-react/styles/reset.layer.css'; // global CSS reset
import '@aws-amplify/ui-react/styles/base.layer.css'; // base styling needed for Amplify UI
import '@aws-amplify/ui-react/styles/button.layer.css';
import '@aws-amplify/ui-react/styles.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Amplify Test App',
  description: 'Test application for AWS Amplify',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
