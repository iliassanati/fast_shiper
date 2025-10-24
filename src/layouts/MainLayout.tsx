import type { ReactNode } from 'react';
import AnimatedBackground from '../components/common/AnimatedBackground';
import Footer from '../components/common/Footer';
import Header from '../components/common/Header';

interface MainLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export default function MainLayout({
  children,
  showFooter = true,
}: MainLayoutProps) {
  return (
    <div className='min-h-screen bg-white overflow-hidden'>
      <AnimatedBackground />
      <Header variant='home' transparent />
      <main className='relative z-10'>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
