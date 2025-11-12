import { motion } from 'framer-motion';
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  const footerLinks = {
    quickLinks: [
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Calculator', href: '#calculator' },
      { label: 'FAQ', href: '#faq' },
    ],
    support: [
      { label: 'Contact Us', href: '#' },
      { label: 'Help Center', href: '#' },
      { label: 'Shipping Guide', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
  ];

  return (
    <footer className='bg-slate-900 text-white py-16 px-6'>
      <div className='max-w-7xl mx-auto'>
        <div className='grid md:grid-cols-4 gap-12 mb-12'>
          {/* Brand */}
          <div>
            <div className='mb-4'>
              <Logo showSubtitle={false} />
            </div>
            <p className='text-slate-400 mb-4'>
              Your gateway to US shopping from Morocco
            </p>
            <div className='flex gap-4'>
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  className='w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors'
                  aria-label={social.label}
                >
                  <social.icon className='w-5 h-5' />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className='font-bold mb-4'>Quick Links</h4>
            <ul className='space-y-2 text-slate-400'>
              {footerLinks.quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className='hover:text-white transition-colors'
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className='font-bold mb-4'>Support</h4>
            <ul className='space-y-2 text-slate-400'>
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className='hover:text-white transition-colors'
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className='font-bold mb-4'>Contact</h4>
            <ul className='space-y-3 text-slate-400'>
              <li className='flex items-center gap-2'>
                <Mail className='w-5 h-5' />
                <span>support@shipzy.ma</span>
              </li>
              <li className='flex items-center gap-2'>
                <Phone className='w-5 h-5' />
                <span>+212 5XX-XXXXXX</span>
              </li>
              <li className='flex items-center gap-2'>
                <MapPin className='w-5 h-5' />
                <span>Casablanca, Morocco</span>
              </li>
            </ul>
          </div>
        </div>

        <div className='border-t border-slate-800 pt-8 text-center text-slate-400'>
          <p>© 2025 Shipzy. All rights reserved. Made with ❤️ in Morocco</p>
        </div>
      </div>
    </footer>
  );
}
