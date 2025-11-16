import { Box, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface ConsolidatedBadgeProps {
  originalCount: number;
  onViewDetails?: () => void;
}

export default function ConsolidatedBadge({
  originalCount,
  onViewDetails,
}: ConsolidatedBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className='justify-end mb-2 w-[59%]'>
      <motion.div
        whileHover={{ scale: 1.05 }}
        className='bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg cursor-pointer'
        onClick={(e) => {
          e.stopPropagation();
          if (onViewDetails) {
            onViewDetails();
          } else {
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <Box className='w-3 h-3' />
        <span>Consolidated ({originalCount})</span>
        {!onViewDetails &&
          (isExpanded ? (
            <ChevronUp className='w-3 h-3' />
          ) : (
            <ChevronDown className='w-3 h-3' />
          ))}
      </motion.div>
    </div>
  );
}
