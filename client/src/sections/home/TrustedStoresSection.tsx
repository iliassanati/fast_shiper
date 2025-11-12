import { motion } from 'framer-motion';
import { useState } from 'react';

export default function TrustedStoresSection() {
  // US Retailers with domains and brand colors
  const retailers = [
    // Row 1
    { name: 'Amazon', domain: 'amazon.com', color: '#FF9900' },
    { name: 'eBay', domain: 'ebay.com', color: '#E53238' },
    { name: 'Walmart', domain: 'walmart.com', color: '#0071CE' },
    { name: 'Target', domain: 'target.com', color: '#CC0000' },
    { name: 'Best Buy', domain: 'bestbuy.com', color: '#0046BE' },
    { name: 'Nike', domain: 'nike.com', color: '#000000' },
    { name: "Macy's", domain: 'macys.com', color: '#E21A22' },
    { name: 'Sephora', domain: 'sephora.com', color: '#000000' },
    { name: 'Nordstrom', domain: 'nordstrom.com', color: '#000000' },
    { name: 'Home Depot', domain: 'homedepot.com', color: '#F96302' },

    // Row 2
    { name: 'Apple', domain: 'apple.com', color: '#000000' },
    { name: 'Costco', domain: 'costco.com', color: '#0066B2' },
    { name: 'Adidas', domain: 'adidas.com', color: '#000000' },
    { name: 'Gap', domain: 'gap.com', color: '#003087' },
    { name: "Kohl's", domain: 'kohls.com', color: '#000000' },
    { name: 'Etsy', domain: 'etsy.com', color: '#F56400' },
    { name: 'Newegg', domain: 'newegg.com', color: '#FF6600' },
    { name: 'REI', domain: 'rei.com', color: '#006633' },
    { name: 'Ulta', domain: 'ulta.com', color: '#FF6BBD' },
    { name: 'Wayfair', domain: 'wayfair.com', color: '#7B1FA2' },

    // Row 3
    { name: 'Old Navy', domain: 'oldnavy.com', color: '#004B87' },
    {
      name: "Victoria's Secret",
      domain: 'victoriassecret.com',
      color: '#FF69B4',
    },
    { name: 'Forever 21', domain: 'forever21.com', color: '#FFD700' },
    { name: 'H&M', domain: 'hm.com', color: '#E50010' },
    { name: 'Zara', domain: 'zara.com', color: '#000000' },
    { name: 'IKEA', domain: 'ikea.com', color: '#0058A3' },
    { name: 'Lululemon', domain: 'lululemon.com', color: '#D31334' },
    { name: 'Coach', domain: 'coach.com', color: '#000000' },
    { name: 'Ralph Lauren', domain: 'ralphlauren.com', color: '#002868' },
    { name: 'Under Armour', domain: 'underarmour.com', color: '#000000' },
  ];

  const row1 = retailers.slice(0, 10);
  const row2 = retailers.slice(10, 20);
  const row3 = retailers.slice(20, 30);

  // Store Card Component - CLICKABLE VERSION
  const StoreCard = ({
    store,
    index,
  }: {
    store: (typeof retailers)[0];
    index: number;
  }) => {
    const [imageError, setImageError] = useState(false);

    const logoSources = [
      `https://logo.clearbit.com/${store.domain}`,
      `https://img.logo.dev/${store.domain}?token=pk_X-zqKlezSGWsyně5fA0QiQ`,
      `https://logo.uplead.com/${store.domain}`,
    ];

    return (
      <motion.a
        href={`https://${store.domain}`}
        target='_blank'
        rel='noopener noreferrer'
        className='flex-shrink-0 w-52 h-32 bg-white rounded-2xl shadow-lg border-2 border-slate-200 flex items-center justify-center p-6 group hover:shadow-2xl hover:border-slate-300 transition-all duration-500 cursor-pointer relative overflow-hidden no-underline'
        whileHover={{ scale: 1.08, y: -8 }}
        whileTap={{ scale: 1.02 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Gradient overlay on hover */}
        <div
          className='absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500'
          style={{
            background: `linear-gradient(135deg, ${store.color}22, ${store.color}44)`,
          }}
        ></div>

        {/* Logo Container */}
        <div className='relative z-10 w-full h-full flex items-center justify-center'>
          {!imageError ? (
            <img
              src={logoSources[0]}
              alt={`Visit ${store.name} official website`}
              className='max-w-full max-h-full object-contain filter grayscale brightness-90 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700 ease-out group-hover:scale-110'
              loading='lazy'
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src === logoSources[0]) {
                  img.src = logoSources[1];
                } else if (img.src === logoSources[1]) {
                  img.src = logoSources[2];
                } else {
                  setImageError(true);
                }
              }}
            />
          ) : (
            <div className='text-center'>
              <span
                className='text-2xl font-bold transition-colors duration-500'
                style={
                  {
                    color: '#94a3b8',
                    '--hover-color': store.color,
                  } as React.CSSProperties
                }
              >
                {store.name}
              </span>
            </div>
          )}
        </div>

        {/* Shine effect */}
        <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none'>
          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000'></div>
        </div>

        {/* Border glow */}
        <div
          className='absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none'
          style={{
            boxShadow: `0 0 20px ${store.color}40, inset 0 0 20px ${store.color}10`,
          }}
        ></div>

        {/* External link icon */}
        <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
          <svg
            className='w-5 h-5 text-slate-400 drop-shadow-md'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
            />
          </svg>
        </div>

        {/* Tooltip on hover */}
        <div className='absolute -bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'>
          <div className='bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl'>
            Visit {store.name}
          </div>
        </div>
      </motion.a>
    );
  };

  return (
    <section className='py-28 px-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden relative'>
      {/* Animated background */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-20 left-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob'></div>
        <div className='absolute top-40 right-20 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000'></div>
        <div className='absolute bottom-20 left-1/3 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000'></div>
      </div>

      {/* Header */}
      <div className='max-w-7xl mx-auto mb-20 relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className='text-center'
        >
          <motion.span
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className='inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-100 via-cyan-100 to-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-8 border-2 border-blue-200 shadow-lg'
          >
            <span className='text-xl'>🛍️</span>
            <span>Click to visit • 1000+ US Retailers</span>
          </motion.span>

          <h2 className='text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight'>
            Shop{' '}
            <span className='relative inline-block'>
              <span className='bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent animate-gradient'>
                any U.S. retailer
              </span>
              <motion.span
                className='absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-full'
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.8 }}
              ></motion.span>
            </span>
          </h2>

          <p className='text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed'>
            Click any logo to start shopping • We'll ship it to Morocco 🇲🇦
          </p>
        </motion.div>
      </div>

      {/* Three rows of scrolling, clickable logos */}
      <div className='space-y-8 relative z-10'>
        {/* Row 1 */}
        <div className='relative'>
          <div className='flex gap-6 animate-scroll-left-fast'>
            {[...row1, ...row1, ...row1, ...row1].map((store, index) => (
              <StoreCard key={`row1-${index}`} store={store} index={index} />
            ))}
          </div>
          <div className='absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-10'></div>
          <div className='absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-10'></div>
        </div>

        {/* Row 2 */}
        <div className='relative'>
          <div className='flex gap-6 animate-scroll-right-medium'>
            {[...row2, ...row2, ...row2, ...row2].map((store, index) => (
              <StoreCard key={`row2-${index}`} store={store} index={index} />
            ))}
          </div>
          <div className='absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10'></div>
          <div className='absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10'></div>
        </div>

        {/* Row 3 */}
        <div className='relative'>
          <div className='flex gap-6 animate-scroll-left-slow'>
            {[...row3, ...row3, ...row3, ...row3].map((store, index) => (
              <StoreCard key={`row3-${index}`} store={store} index={index} />
            ))}
          </div>
          <div className='absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-10'></div>
          <div className='absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-10'></div>
        </div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className='text-center mt-24 relative z-10'
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className='inline-block bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl px-12 py-10 border-2 border-slate-200'
        >
          <p className='text-slate-600 text-lg mb-3'>
            <span className='font-bold text-slate-900 text-2xl'>
              ...and hundreds more!
            </span>
          </p>
          <p className='text-slate-500 text-base mb-6'>
            Click any brand to start shopping • We'll ship it to Morocco 🇲🇦
          </p>
          <div className='flex justify-center gap-2 flex-wrap'>
            <span className='px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold'>
              Fashion
            </span>
            <span className='px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold'>
              Electronics
            </span>
            <span className='px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold'>
              Beauty
            </span>
            <span className='px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold'>
              Home
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Styles */}
      <style>{`
        @keyframes scroll-left-fast {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }

        @keyframes scroll-right-medium {
          0% { transform: translateX(-25%); }
          100% { transform: translateX(0); }
        }

        @keyframes scroll-left-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }

        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-scroll-left-fast {
          animation: scroll-left-fast 30s linear infinite;
        }

        .animate-scroll-right-medium {
          animation: scroll-right-medium 40s linear infinite;
        }

        .animate-scroll-left-slow {
          animation: scroll-left-slow 50s linear infinite;
        }

        .animate-blob {
          animation: blob 7s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-scroll-left-fast:hover,
        .animate-scroll-right-medium:hover,
        .animate-scroll-left-slow:hover {
          animation-play-state: paused;
        }

        .group:hover span[style*='--hover-color'] {
          color: var(--hover-color) !important;
        }

        /* Remove underline from links */
        a.no-underline {
          text-decoration: none;
        }
      `}</style>
    </section>
  );
}
