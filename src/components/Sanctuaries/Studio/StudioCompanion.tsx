import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { getStudioCompanionMessage } from '../../../utils/claudeService';
import { useAiConsent } from '../../../context/AiConsentContext';
import { isAiEnabled } from '../../../utils/aiConsent';
import type { ConvoMessage } from './studioTypes';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFirstVisit: boolean;
  getDominantColors: () => string;
  getMinutesDrawing: () => number;
  messages: ConvoMessage[];
  onMessagesChange: (messages: ConvoMessage[] | ((prev: ConvoMessage[]) => ConvoMessage[])) => void;
}

export default function StudioCompanion({
  open,
  onOpenChange,
  isFirstVisit,
  getDominantColors,
  getMinutesDrawing,
  messages,
  onMessagesChange,
}: Props) {
  const { requestConsent } = useAiConsent();
  const [userInput, setUserInput] = useState('');
  const [convoLoading, setConvoLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastConvoTrigger = useRef(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const addMessage = (msg: ConvoMessage) => {
    onMessagesChange(prev => [...prev, msg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
  };

  const triggerConvo = async (
    trigger: Parameters<typeof getStudioCompanionMessage>[0]['trigger'],
    userMsg?: string
  ) => {
    if (trigger !== 'user_message' && !isAiEnabled()) return;
    const now = Date.now();
    if (trigger !== 'user_message' && now - lastConvoTrigger.current < 45000) return;
    lastConvoTrigger.current = now;
    setConvoLoading(true);
    const text = await getStudioCompanionMessage({
      dominantColors: getDominantColors(),
      minutesDrawing: getMinutesDrawing(),
      isFirstVisit,
      history: messages.slice(-4),
      trigger,
      userMessage: userMsg,
    });
    setConvoLoading(false);
    addMessage({ role: 'ai', text });
    if (!open) onOpenChange(true);
  };

  const sendUserMessage = async () => {
    const text = userInput.trim();
    if (!text) return;
    await requestConsent({ force: true });
    setUserInput('');
    addMessage({ role: 'user', text });
    await triggerConvo('user_message', text);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          aria-label="Companion"
          className="fixed right-0 top-16 bottom-0 z-30 flex flex-col w-72 sm:w-80"
          style={{ backgroundColor: 'rgba(245, 236, 215, 0.96)', backdropFilter: 'blur(12px)', borderLeft: '1px solid rgba(196,98,45,0.12)' }}
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#C4622D]/10">
            <span className="text-[#6B4226] text-xs tracking-widest uppercase">companion</span>
            <button type="button" onClick={() => onOpenChange(false)} aria-label="Close companion" className="text-[#6B4226] hover:text-[#C4622D] transition-colors">
              <X size={13} aria-hidden="true" />
            </button>
          </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <p className="text-[#6B4226]/70 text-xs italic text-center mt-8">begin, and something will be said.</p>
            )}
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={m.role === 'ai' ? 'self-start' : 'self-end'}
              >
                <p
                  className={`text-sm font-light leading-6 max-w-[220px] ${
                    m.role === 'ai'
                      ? 'text-[#6B4226] italic'
                      : 'text-[#6B4226] bg-white/60 rounded-2xl px-3 py-2'
                  }`}
                  style={m.role === 'ai' ? { fontFamily: 'Cormorant Garamond, Georgia, serif' } : {}}
                >
                  {m.text}
                </p>
              </motion.div>
            ))}
            {convoLoading && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#6B4226]/70 text-xs italic self-start">
                ...
              </motion.p>
            )}
            <div ref={messagesEndRef} />
            <p className="sr-only" aria-live="polite">
              {messages.filter(m => m.role === 'ai').slice(-1)[0]?.text ?? ''}
            </p>
          </div>

          <div className="border-t border-[#C4622D]/10 px-4 py-3 flex gap-2 items-center">
            <label className="flex-1 flex items-center">
              <span className="sr-only">Message to companion</span>
              <input
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendUserMessage()}
                placeholder="say something..."
                className="w-full bg-transparent text-[#6B4226] text-xs font-light outline-none placeholder-[#6B4226]/50"
              />
            </label>
            <button
              type="button"
              onClick={sendUserMessage}
              aria-label="Send message"
              className="text-[#C4622D] transition-colors text-xs"
            >
              →
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
