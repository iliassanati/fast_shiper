import { motion } from 'framer-motion';
import { useState } from 'react';

export default function TrustedStoresSection() {
  // US Retailers matching the reference image layout
  const retailers = [
    // Row 1
    {
      name: 'Amazon',
      domain: 'amazon.com',
      hoverBg: '#232F3E',
      hoverText: 'light',
      image: './assets/brands/macys.svg',
    },
    {
      name: 'eBay',
      domain: 'ebay.com',
      hoverBg: '#E53238',
      hoverText: 'light',
    },
    {
      name: 'Apple',
      domain: 'apple.com',
      hoverBg: '#000000',
      hoverText: 'light',
    },
    {
      name: 'Walmart',
      domain: 'walmart.com',
      hoverBg: '#0071CE',
      hoverText: 'light',
    },
    {
      name: 'Zappos',
      domain: 'zappos.com',
      hoverBg: '#0093D0',
      hoverText: 'light',
    },
    { name: '6pm', domain: '6pm.com', hoverBg: '#FF6600', hoverText: 'light' },

    // Row 2
    { name: 'GNC', domain: 'gnc.com', hoverBg: '#00529B', hoverText: 'light' },
    {
      name: 'Prada',
      domain: 'prada.com',
      hoverBg: '#000000',
      hoverText: 'light',
    },
    {
      name: 'Bath & Body Works',
      domain: 'bathandbodyworks.com',
      hoverBg: '#1E3A5F',
      hoverText: 'light',
    },
    {
      name: "Carter's",
      domain: 'carters.com',
      hoverBg: '#00A0D2',
      hoverText: 'light',
    },
    { name: 'Gap', domain: 'gap.com', hoverBg: '#000000', hoverText: 'light' },
    {
      name: 'Disney',
      domain: 'shopdisney.com',
      hoverBg: '#006E99',
      hoverText: 'light',
    },

    // Row 3
    {
      name: "The Children's Place",
      domain: 'childrensplace.com',
      hoverBg: '#E31837',
      hoverText: 'light',
    },
    { name: 'DSW', domain: 'dsw.com', hoverBg: '#000000', hoverText: 'light' },
    {
      name: 'J.Crew',
      domain: 'jcrew.com',
      hoverBg: '#8B7355',
      hoverText: 'light',
    },
    {
      name: 'Nordstrom',
      domain: 'nordstrom.com',
      hoverBg: '#000000',
      hoverText: 'light',
    },
    {
      name: 'Zara',
      domain: 'zara.com',
      hoverBg: '#000000',
      hoverText: 'light',
    },
    {
      name: "OshKosh B'gosh",
      domain: 'oshkosh.com',
      hoverBg: '#FF6600',
      hoverText: 'light',
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
    // const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
    // const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // // Multiple logo sources for fallback - using higher quality options
    // const logoSources = [
    //   `https://img.logo.dev/name/${store.domain}?token=pk_QFW9XlGVRb6Ke9ydetfYIQ`,
    //   // `https://cdn.brandfetch.io/${store.domain}/w/512/h/512`,
    //   // `https://img.logo.dev/${store.domain}?token=pk_VAZ6tvAVQHCDwKeqFPACAw&size=200`,
    // ];

    // const handleImageError = () => {
    //   if (currentSourceIndex < logoSources.length - 1) {
    //     setCurrentSourceIndex(currentSourceIndex + 1);
    //   } else {
    //     setImageError(true);
    //   }
    // };

    return (
      <motion.a
        href={`https://${store.domain}`}
        target='_blank'
        rel='noopener noreferrer'
        className='relative aspect-[4/3] bg-slate-100 flex items-center justify-center p-4 cursor-pointer overflow-hidden no-underline transition-all duration-300 ease-out'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.03, duration: 0.4 }}
        style={{
          backgroundColor: isHovered ? 'black' : '#f8fafc',
        }}
      >
        {/* Logo Container */}
        <div className='relative z-10 w-full h-full flex items-center justify-center'>
          {store.image ? (
            <img
              src={store.image}
              alt={store.name}
              className='max-w-[80%] max-h-[70%] w-auto h-auto object-contain transition-all duration-300'
              style={
                {
                  // filter: isHovered ? 'brightness(0) invert(1)' : 'none',
                }
              }
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
