import { motion } from 'framer-motion';
import { useState } from 'react';

export default function TrustedStoresSection() {
  // US Retailers matching the reference image layout
  const retailers = [
    // Row 1
    {
      name: "Macy's",
      domain: 'macys.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/macys.svg',
      image_hover: './assets/brands/macys-white.svg',
    },
    {
      name: 'Nordstrom Rack',
      domain: 'nordstromrack.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/rack.svg',
      image_hover: './assets/brands/rack-white.svg',
    },
    {
      name: 'Sephora',
      domain: 'sephora.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/sephora.svg',
      image_hover: './assets/brands/sephora-white.svg',
    },
    {
      name: 'Coach',
      domain: 'coach.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/coach.svg',
      image_hover: './assets/brands/coach-white.svg',
    },
    {
      name: 'Michael Kors',
      domain: 'michaelkors.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/kors.svg',
      image_hover: './assets/brands/kors-white.svg',
    },
    {
      name: 'Barnes & Noble',
      domain: 'barnesandnoble.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/barnes.svg',
      image_hover: './assets/brands/barnes-white.svg',
    },

    // Row 2
    {
      name: 'Swappa',
      domain: 'swappa.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/swappa.svg',
      image_hover: './assets/brands/swappa-white.svg',
    },
    {
      name: 'Amazon',
      domain: 'amazon.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/amazon.svg',
      image_hover: './assets/brands/amazon-white.svg',
    },
    {
      name: 'eBay',
      domain: 'ebay.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/ebay.svg',
      image_hover: './assets/brands/ebay-white.svg',
    },
    {
      name: 'Apple',
      domain: 'apple.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/apple.svg',
      image_hover: './assets/brands/apple-white.svg',
    },

    {
      name: 'Walmart',
      domain: 'walmart.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/walmart.svg',
      image_hover: './assets/brands/walmart-white.svg',
    },
    {
      name: 'Zappos',
      domain: 'zappos.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/zappos.svg',
      image_hover: './assets/brands/zappos-white.svg',
    },

    // Row 3
    {
      name: 'GNC',
      domain: 'gnc.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/gnc.svg',
      image_hover: './assets/brands/gnc-white.svg',
    },
    {
      name: 'Prada',
      domain: 'prada.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/prada.svg',
      image_hover: './assets/brands/prada-white.svg',
    },
    {
      name: 'Bath & Body Works',
      domain: 'bathandbodyworks.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/bathand-body-works.svg',
      image_hover: './assets/brands/bathand-body-works-white.svg',
    },
    {
      name: "Carter's",
      domain: 'carters.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/carters-blue.svg',
      image_hover: './assets/brands/carters-white.svg',
    },
    {
      name: 'Gap',
      domain: 'gap.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/gap-invert.svg',
      image_hover: './assets/brands/gap-white.svg',
    },
    {
      name: 'Disney',
      domain: 'shopdisney.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/disney-dark.svg',
      image_hover: './assets/brands/disney-white.svg',
    },

    // Row 4
    {
      name: "The Children's Place",
      domain: 'thechildrensplace.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/the-childrens-place.svg',
      image_hover: './assets/brands/the-childrens-place-white.svg',
    },
    {
      name: 'DSW',
      domain: 'dsw.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/dsv-black.svg',
      image_hover: './assets/brands/dsv-white.svg',
    },
    {
      name: 'J.Crew',
      domain: 'jcrew.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/crew.svg',
      image_hover: './assets/brands/crew-white.svg',
    },
    {
      name: 'Nordstrom',
      domain: 'nordstrom.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/nordstrom.svg',
      image_hover: './assets/brands/nordstrom-white.svg',
    },
    {
      name: 'Zara',
      domain: 'zara.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/zara.svg',
      image_hover: './assets/brands/zara-white.svg',
    },
    {
      name: "OshKosh B'gosh",
      domain: 'oshkosh.com',
      hoverBg: '#000000',
      hoverText: 'light',
      image: './assets/brands/oshkosh.svg',
      image_hover: './assets/brands/oshkosh-white.svg',
    },
  ];

  // Store Card Component
  const StoreCard = ({
    store,
    index,
  }: {
    store: (typeof retailers)[0];
    index: number;
  }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <motion.a
        href={`https://${store.domain}`}
        target='_blank'
        rel='noopener noreferrer'
        className='relative aspect-[4/3] flex items-center justify-center p-4 cursor-pointer overflow-hidden no-underline transition-all duration-300 ease-out'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.03, duration: 0.4 }}
        style={{
          backgroundColor: isHovered ? store.hoverBg : '#f8fafc',
        }}
      >
        {/* Logo Container */}
        <div className='relative z-10 w-full h-full flex items-center justify-center'>
          {store.image ? (
            <img
              src={
                isHovered && store.image_hover ? store.image_hover : store.image
              }
              alt={store.name}
              className='max-w-full max-h-full w-auto h-auto object-contain transition-all duration-300'
              style={{
                // Only apply filter if hovering and no hover image exists
                filter:
                  isHovered && !store.image_hover
                    ? 'brightness(0) invert(1)'
                    : 'none',
              }}
              loading='lazy'
            />
          ) : (
            <span
              className='text-lg md:text-xl font-bold transition-colors duration-300 text-center'
              style={{
                color: isHovered ? '#ffffff' : '#64748b',
              }}
            >
              {store.name}
            </span>
          )}
        </div>
      </motion.a>
    );
  };

  return (
    <section className='py-20 px-6 bg-white'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center mb-12'
        >
          <h2 className='text-4xl md:text-5xl font-bold mb-4'>
            <span className='font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
              Shop from{' '}
            </span>
            <span className='font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent'>
              Top U.S. Retailers
            </span>
          </h2>
          <p className='text-lg text-slate-600 max-w-2xl mx-auto'>
            Click any logo to start shopping • We'll ship it to you
          </p>
        </motion.div>

        {/* Logo Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[1px] bg-slate-200 border border-slate-200'>
          {retailers.map((store, index) => (
            <StoreCard key={store.domain} store={store} index={index} />
          ))}
        </div>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className='text-center text-slate-500 mt-8'
        >
          ...and thousands more retailers available
        </motion.p>
      </div>
    </section>
  );
}
