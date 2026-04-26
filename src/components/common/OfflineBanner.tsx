import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  status: 'online' | 'offline';
}

export function OfflineBanner({ status }: OfflineBannerProps) {
  return (
    <AnimatePresence>
      {status === 'offline' && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-on-surface text-surface px-4 py-3 flex items-center justify-center gap-3 shadow-xl"
        >
          <WifiOff className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-[0.2em]">
            You are offline — changes will sync when reconnected
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
