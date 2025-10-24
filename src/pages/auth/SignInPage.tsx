import SignInBrandingSection from '@/sections/auth/signin/SignInBrandingSection';
import SignInFormSection from '@/sections/auth/signin/SignInFormSection';

export default function SignInPage() {
  return (
    <div className='max-w-6xl mx-auto'>
      <div className='grid lg:grid-cols-2 gap-16 items-center'>
        <SignInFormSection />
        <SignInBrandingSection />
      </div>
    </div>
  );
}
