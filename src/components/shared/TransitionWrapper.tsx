import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function TransitionWrapper({ children }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ height: '100%', minHeight: '100vh' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
