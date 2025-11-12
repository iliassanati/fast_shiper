import CalculatorSection from '@/sections/home/CalculatorSection';
import FAQSection from '@/sections/home/FAQSection';
import FeaturesSection from '@/sections/home/FeaturesSection';
import FinalCTASection from '@/sections/home/FinalCTASection';
import HeroSection from '@/sections/home/HeroSection';
import HowItWorksSection from '@/sections/home/HowItWorksSection';
import TestimonialsSection from '@/sections/home/TestimonialsSection';
import TrustedStoresSection from '@/sections/home/TrustedStoresSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TrustedStoresSection />

      <CalculatorSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
    </>
  );
}
