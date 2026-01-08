import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { WaitlistNotification } from '../notifications/WaitlistNotification';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        <WaitlistNotification />
        {children}
      </main>
      <Footer />
    </div>
  );
}

