import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DoorOpen } from 'lucide-react';
import { useAiConsent } from '../../context/AiConsentContext';

interface Props {
  sanctuaryName: string;
  textColor?: string;
}

export default function SanctuaryHeader({ sanctuaryName, textColor = 'text-current' }: Props) {
  const navigate = useNavigate();
  const { preference, openSettings } = useAiConsent();

  const aiLabel = preference === 'enabled'
    ? 'AI features are on. Open AI settings.'
    : preference === 'declined'
      ? 'Solace is local. Open AI settings.'
      : 'Open AI settings';

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
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={openSettings}
          className={`text-xs ${textColor} opacity-50 hover:opacity-100 transition-opacity duration-300 tracking-wide focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-current rounded-sm`}
          aria-label={aiLabel}
          aria-haspopup="dialog"
        >
          AI
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className={`flex items-center gap-1.5 text-xs ${textColor} opacity-50 hover:opacity-100 transition-opacity duration-300 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-current rounded-sm`}
          aria-label="return home"
        >
          <DoorOpen size={14} />
          <span className="hidden sm:inline">leave</span>
        </button>
      </div>
    </motion.header>
  );
}
