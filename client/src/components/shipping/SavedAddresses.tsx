// client/src/components/shipping/SavedAddresses.tsx
import { type SavedAddress } from '@/hooks/useSavedAddresses';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

interface SavedAddressesProps {
  addresses: SavedAddress[];
  selectedAddressId: string | null;
  onSelectAddress: (address: SavedAddress) => void;
  onDeleteAddress: (id: string) => void;
  onSetDefault: (id: string) => void;
  onAddNew: () => void;
}

export default function SavedAddresses({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onDeleteAddress,
  onSetDefault,
  onAddNew,
}: SavedAddressesProps) {
  const [expanded, setExpanded] = useState(true);

  if (addresses.length === 0) {
    return (
      <div className='p-6 bg-slate-50 rounded-xl border-2 border-slate-200'>
        <div className='text-center'>
          <MapPin className='w-12 h-12 text-slate-400 mx-auto mb-3' />
          <p className='text-slate-600 mb-4'>No saved addresses yet</p>
          <button
            onClick={onAddNew}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto'
          >
            <Plus className='w-4 h-4' />
            Add New Address
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <button
          onClick={() => setExpanded(!expanded)}
          className='flex items-center gap-2 text-slate-700 font-semibold hover:text-slate-900 transition-colors'
        >
          <MapPin className='w-5 h-5' />
          <span>Saved Addresses ({addresses.length})</span>
          {expanded ? (
            <ChevronUp className='w-4 h-4' />
          ) : (
            <ChevronDown className='w-4 h-4' />
          )}
        </button>
        <button
          onClick={onAddNew}
          className='px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1'
        >
          <Plus className='w-4 h-4' />
          New
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='space-y-3'
          >
            {addresses.map((address) => {
              const isSelected = address.id === selectedAddressId;

              return (
                <motion.div
                  key={address.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onSelectAddress(address)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className='flex items-start gap-3'>
                    {/* Radio/Check Button */}
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className='w-4 h-4 text-white' />}
                    </div>

                    {/* Address Details */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='font-bold text-slate-900'>
                          {address.label}
                        </span>
                        {address.isDefault && (
                          <span className='px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full flex items-center gap-1'>
                            <Star className='w-3 h-3 fill-yellow-600' />
                            Default
                          </span>
                        )}
                      </div>
                      <p className='text-sm text-slate-600 leading-relaxed'>
                        {address.fullName}
                        <br />
                        {address.street}
                        <br />
                        {address.city}, {address.postalCode}
                        <br />
                        {address.country}
                        <br />
                        📞 {address.phone}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex items-center gap-2 flex-shrink-0'>
                      {!address.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetDefault(address.id);
                          }}
                          className='p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors'
                          title='Set as default'
                        >
                          <Star className='w-4 h-4' />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `Delete address "${address.label}"? This cannot be undone.`
                            )
                          ) {
                            onDeleteAddress(address.id);
                          }
                        }}
                        className='p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                        title='Delete address'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
