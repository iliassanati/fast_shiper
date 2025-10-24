import SignUpBenefitsSection from '@/sections/auth/signup/SignUpBenefitsSection';
import SignUpFormSection from '@/sections/auth/signup/SignUpFormSection';

export default function SignUpPage() {
  return (
    <div className='max-w-6xl mx-auto'>
      <div className='grid lg:grid-cols-2 gap-12 items-start'>
        <SignUpFormSection />
        <SignUpBenefitsSection />
      </div>
    </div>
  );
}
