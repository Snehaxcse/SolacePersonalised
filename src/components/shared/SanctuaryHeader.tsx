import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DoorOpen } from 'lucide-react';

interface Props {
  sanctuaryName: string;
  textColor?: string;
  borderColor?: string;
}

export default function SanctuaryHeader({ sanctuaryName, textColor = 'text-current', borderColor = 'border-current' }: Props) {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
    >
      <div className="flex items-center gap-2">
        <span className={`font-serif text-base font-light ${textColor} opacity-90`} style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
          Solace
        </span>
        <span className={`${textColor} opacity-40`}>/</span>
        <span className={`text-xs font-light ${textColor} opacity-60 tracking-widest uppercase`}>
          {sanctuaryName}
        </span>
      </div>
      <button
        onClick={() => navigate('/')}
        className={`flex items-center gap-1.5 text-xs ${textColor} opacity-50 hover:opacity-100 transition-opacity duration-300`}
        aria-label="return home"
      >
        <DoorOpen size={14} />
        <span className="hidden sm:inline">leave</span>
      </button>
    </motion.header>
  );
}
