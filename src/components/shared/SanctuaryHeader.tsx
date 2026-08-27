import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DoorOpen } from 'lucide-react';
import { useAiConsent } from '../../context/AiConsentContext';
import SupportDialog from './SupportDialog';
import SanctuarySwitcher from './SanctuarySwitcher';
import { readSuggestedSanctuary } from '../../utils/solaceMemory';
import { SANCTUARIES, isSanctuaryType, type SanctuaryType } from '../../utils/sanctuaries';

interface Props {
  sanctuary?: SanctuaryType;
  textColor?: string;
}

export default function SanctuaryHeader({ sanctuary, textColor = 'text-current' }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = useParams<{ type: string }>();
  const { preference, openSettings } = useAiConsent();
  const [supportOpen, setSupportOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const current = isSanctuaryType(type) ? type : null;
  const suggested = readSuggestedSanctuary();
  const onCompanion = location.pathname === '/companion';
  const spaceLabel = sanctuary ? SANCTUARIES[sanctuary].label : 'companion';

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
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4"
      >
        <button
          type="button"
          onClick={() => setSwitcherOpen(true)}
          className="flex items-center gap-2 text-left rounded-sm"
          aria-label="Choose another space"
          aria-haspopup="dialog"
          aria-expanded={switcherOpen}
        >
          <span className={`font-serif text-sm sm:text-base font-light ${textColor} opacity-90`} style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
            Solace
          </span>
          <span className={`${textColor} opacity-50`} aria-hidden="true">/</span>
          <span className={`text-[10px] sm:text-xs font-light ${textColor} opacity-80 tracking-wide sm:tracking-widest uppercase truncate max-w-[7.5rem] sm:max-w-none`}>
            {spaceLabel}
          </span>
        </button>
        <nav className="flex items-center gap-2 sm:gap-4 shrink-0" aria-label="Sanctuary">
          <button
            type="button"
            onClick={() => navigate('/companion')}
            className={`text-[11px] sm:text-xs ${textColor} opacity-80 hover:opacity-100 transition-opacity duration-300 tracking-wide rounded-sm min-h-8`}
            aria-label="Solace Companion, an AI conversation"
            aria-current={onCompanion ? 'page' : undefined}
          >
            talk
          </button>
          <button
            type="button"
            onClick={openSettings}
            className={`text-[11px] sm:text-xs ${textColor} opacity-80 hover:opacity-100 transition-opacity duration-300 tracking-wide rounded-sm min-h-8`}
            aria-label={aiLabel}
            aria-haspopup="dialog"
          >
            AI
          </button>
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className={`text-[11px] sm:text-xs ${textColor} opacity-80 hover:opacity-100 transition-opacity duration-300 tracking-wide rounded-sm min-h-8`}
            aria-label="Support and urgent help"
            aria-haspopup="dialog"
            aria-expanded={supportOpen}
          >
            support
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className={`flex items-center gap-1.5 text-[11px] sm:text-xs ${textColor} opacity-80 hover:opacity-100 transition-opacity duration-300 rounded-sm min-h-8`}
            aria-label="return home"
          >
            <DoorOpen size={14} aria-hidden="true" />
            <span className="hidden sm:inline">home</span>
          </button>
        </nav>
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
