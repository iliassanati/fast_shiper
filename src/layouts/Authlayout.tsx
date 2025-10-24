import type { ReactNode } from 'react';
import AnimatedBackground from '../components/common/AnimatedBackground';
import Header from '../components/common/Header';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 relative overflow-hidden'>
      <AnimatedBackground />
      <Header variant='auth' />
      <main className='relative z-10 w-full px-6 py-24'>{children}</main>

      {/* Footer */}
      <div className='relative z-10 py-6 text-center text-sm text-slate-600 bg-white bg-opacity-50 backdrop-blur-sm'>
        <p>© 2025 Shipzy. All rights reserved.</p>
      </div>
    </div>
  );
}
