import { Outlet } from 'react-router-dom';
import AnimatedBackground from '../components/common/AnimatedBackground';
import Footer from '../components/common/Footer';
import Header from '../components/common/Header';

interface MainLayoutProps {
  showFooter?: boolean;
}

export default function MainLayout({ showFooter = true }: MainLayoutProps) {
  return (
    <div className='min-h-screen bg-white overflow-hidden'>
      <AnimatedBackground />
      <Header variant='home' transparent />
      <main className='relative z-10'>
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
