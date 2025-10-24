import CalculatorSection from '@/sections/home/CalculatorSection';
import FAQSection from '@/sections/home/FAQSection';
import FeaturesSection from '@/sections/home/FeaturesSection';
import FinalCTASection from '@/sections/home/FinalCTASection';
import HeroSection from '@/sections/home/HeroSection';
import HowItWorksSection from '@/sections/home/HowItWorksSection';
import PricingSection from '@/sections/home/PricingSection';
import TestimonialsSection from '@/sections/home/TestimonialsSection';
import TrustedStoresSection from '@/sections/home/TrustedStoresSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustedStoresSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection />
      <CalculatorSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
    </>
  );
}
