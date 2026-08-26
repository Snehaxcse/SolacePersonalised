import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DoorOpen } from 'lucide-react';
import { useAiConsent } from '../../context/AiConsentContext';
import SupportDialog from './SupportDialog';
import SanctuarySwitcher from './SanctuarySwitcher';
import { readSuggestedSanctuary } from '../../utils/solaceMemory';
import { SANCTUARIES, isSanctuaryType, type SanctuaryType } from '../../utils/sanctuaries';

interface Props {
  sanctuary: SanctuaryType;
  textColor?: string;
}

export default function SanctuaryHeader({ sanctuary, textColor = 'text-current' }: Props) {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();
  const { preference, openSettings } = useAiConsent();
  const [supportOpen, setSupportOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const current = isSanctuaryType(type) ? type : null;
  const suggested = readSuggestedSanctuary();

  const aiLabel = preference === 'enabled'
    ? 'AI features are on. Open AI settings.'
    : preference === 'declined'
      ? 'Solace is local. Open AI settings.'
      : 'Open AI settings';

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      >
        <button
          type="button"
          onClick={() => setSwitcherOpen(true)}
          className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-current rounded-sm"
          aria-label="Choose another space"
          aria-haspopup="dialog"
          aria-expanded={switcherOpen}
        >
          <span className={`font-serif text-base font-light ${textColor} opacity-90`} style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
            Solace
          </span>
          <span className={`${textColor} opacity-40`}>/</span>
          <span className={`text-xs font-light ${textColor} opacity-60 tracking-widest uppercase`}>
            {SANCTUARIES[sanctuary].label}
          </span>
        </button>
        <div className="flex items-center gap-3 sm:gap-4">
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
            onClick={() => setSupportOpen(true)}
            className={`text-xs ${textColor} opacity-50 hover:opacity-100 transition-opacity duration-300 tracking-wide focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-current rounded-sm`}
            aria-label="Support and urgent help"
            aria-haspopup="dialog"
            aria-expanded={supportOpen}
          >
            support
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className={`flex items-center gap-1.5 text-xs ${textColor} opacity-50 hover:opacity-100 transition-opacity duration-300 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-current rounded-sm`}
            aria-label="return home"
          >
            <DoorOpen size={14} />
            <span className="hidden sm:inline">home</span>
          </button>
        </div>
      </motion.header>
      <SupportDialog open={supportOpen} onClose={() => setSupportOpen(false)} />
      <SanctuarySwitcher
        open={switcherOpen}
        current={current}
        suggested={suggested}
        onClose={() => setSwitcherOpen(false)}
        onSelect={next => {
          setSwitcherOpen(false);
          if (next !== current) navigate(SANCTUARIES[next].route);
        }}
      />
    </>
  );
}
