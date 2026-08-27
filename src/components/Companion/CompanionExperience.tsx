import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAiConsent } from '../../context/AiConsentContext';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import {
  COMPANION_MODE_META,
  COMPANION_MODES,
  type CompanionMode,
} from '../../utils/companionModes';
import {
  readHeldNotes,
  sendCompanionMessage,
  writeHeldNote,
  type CompanionTurn,
} from '../../utils/companionService';
import { SANCTUARIES, type SanctuaryType } from '../../utils/sanctuaries';
import SupportDialog from '../shared/SupportDialog';

type ThreadItem =
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'ai'; text: string }
  | { id: string; kind: 'held'; text: string }
  | { id: string; kind: 'note'; text: string };

let nextId = 0;
const id = () => `c-${++nextId}`;

export default function CompanionExperience() {
  const navigate = useNavigate();
  const { preference, isEnabled, requestConsent, openSettings } = useAiConsent();
  const reduceMotion = usePrefersReducedMotion();
  const [mode, setMode] = useState<CompanionMode | null>(null);
  const [draft, setDraft] = useState('');
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [history, setHistory] = useState<CompanionTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState('');
  const [offer, setOffer] = useState<SanctuaryType | null>(null);
  const [alreadyOffered, setAlreadyOffered] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [held, setHeld] = useState(readHeldNotes);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [thread, loading, offer, reduceMotion]);

  const fade = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.35 } };

  const chooseMode = (next: CompanionMode) => {
    setMode(next);
    setOffer(null);
    const opener = COMPANION_MODE_META[next].opener;
    setThread(current => {
      if (current.length === 0) {
        return [{ id: id(), kind: 'note', text: opener }];
      }
      return [...current, { id: id(), kind: 'note', text: `You'll meet me as: ${COMPANION_MODE_META[next].title.toLowerCase()}.` }];
    });
    window.requestAnimationFrame(() => composerRef.current?.focus());
  };

  const holdThis = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    writeHeldNote(text);
    setHeld(readHeldNotes());
    if (mode) {
      setThread(current => [
        ...current,
        { id: id(), kind: 'held', text },
        { id: id(), kind: 'note', text: 'saved here. this stayed on this device — it was not sent to AI.' },
      ]);
    }
    setLive('Saved here. Not sent to AI.');
  };

  const talk = async () => {
    const text = draft.trim();
    if (!text || !mode || loading) return;

    const allowed = await requestConsent({ force: true });
    if (!allowed) {
      setLive('AI is off. You can still hold something here.');
      return;
    }

    const userItem: ThreadItem = { id: id(), kind: 'user', text };
    setDraft('');
    setThread(current => [...current, userItem]);
    setLoading(true);
    setLive('');
    setOffer(null);

    try {
      const reply = await sendCompanionMessage({
        mode,
        message: text,
        history,
        alreadyOffered,
      });
      const nextHistory: CompanionTurn[] = [...history, { role: 'user', text }, { role: 'ai', text: reply.text }].slice(-12);
      setHistory(nextHistory);
      setThread(current => [...current, { id: id(), kind: 'ai', text: reply.text }]);
      setLive(reply.crisis ? 'A support note is available.' : 'New reply from Solace Companion.');

      if (reply.crisis) {
        setSupportOpen(true);
      } else if (reply.offer) {
        setOffer(reply.offer);
        setAlreadyOffered(true);
      }
    } catch {
      setThread(current => [
        ...current,
        { id: id(), kind: 'note', text: 'I could not reach the companion just now. Your words stayed here.' },
      ]);
      setLive('The companion could not reply.');
    } finally {
      setLoading(false);
    }
  };

  const onComposerKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void talk();
    }
  };

  const privacyLine = isEnabled
    ? 'AI is on. When you choose Talk with me, that message is sent to an external AI service through Solace.'
    : preference === 'declined'
      ? 'AI is off. Nothing is sent out. You can still hold something here.'
      : 'AI stays off until you choose. Talk with me will ask first. Holding never leaves this device.';

  return (
    <div className="flex-1 pt-20 pb-8 px-4 sm:px-8 max-w-xl mx-auto w-full flex flex-col">
      <p className="sr-only" aria-live="polite">{live}</p>
      <SupportDialog open={supportOpen} onClose={() => setSupportOpen(false)} />

      <AnimatePresence mode="wait">
        {!mode ? (
          <motion.section key="arrive" {...fade} className="flex flex-col gap-8 pt-6" aria-labelledby={headingId}>
            <div>
              <h1
                id={headingId}
                className="text-[#F5ECD7] text-4xl sm:text-5xl font-light mb-4"
                style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
              >
                What would feel helpful right now?
              </h1>
              <p className="text-[#F5ECD7]/75 text-sm font-light leading-6 max-w-md">
                Solace Companion is an AI conversation. It is not therapy, not a diagnosis, and not emergency care.
                It stays with you. It does not try to fix you.
              </p>
            </div>

            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              {COMPANION_MODES.map(key => {
                const meta = COMPANION_MODE_META[key];
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => chooseMode(key)}
                      className="w-full text-left rounded-2xl px-5 py-4 border border-[#F5ECD7]/20 hover:border-[#F5ECD7]/45 hover:bg-white/5 transition-colors"
                    >
                      <span className="block text-[#F5ECD7] text-sm font-light">{meta.title}</span>
                      <span className="block text-[#F5ECD7]/70 text-xs font-light mt-1">{meta.prompt}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <p className="text-[#F5ECD7]/65 text-xs font-light leading-5">{privacyLine}</p>

            <form
              className="border-t border-[#F5ECD7]/15 pt-6"
              onSubmit={event => {
                event.preventDefault();
                holdThis();
              }}
            >
              <label htmlFor="companion-hold" className="block text-[#F5ECD7]/80 text-xs font-light mb-2">
                Or hold something here without sending it to AI
              </label>
              <textarea
                id="companion-hold"
                value={draft}
                onChange={event => setDraft(event.target.value)}
                rows={3}
                maxLength={4000}
                placeholder="This stays on this device."
                className="w-full bg-transparent text-[#F5ECD7] text-sm font-light leading-7 resize-none outline-none border-b border-[#F5ECD7]/25 pb-3 placeholder-[#F5ECD7]/40"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="mt-4 px-5 py-2.5 rounded-full border border-[#F5ECD7]/30 text-[#F5ECD7] text-xs tracking-wide disabled:opacity-40"
              >
                Just hold this
              </button>
            </form>

            {held.length > 0 && (
              <div>
                <p className="text-[#F5ECD7]/70 text-xs font-light mb-2">
                  held on this device · not sent to AI
                </p>
                <ul className="flex flex-col gap-2">
                  {held.map(note => (
                    <li key={note.at} className="text-[#F5ECD7]/80 text-sm font-light italic leading-6 whitespace-pre-wrap">
                      {note.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.section>
        ) : (
          <motion.section key="talk" {...fade} className="flex flex-col flex-1 min-h-0" aria-labelledby={headingId}>
            <header className="mb-6">
              <h1
                id={headingId}
                className="text-[#F5ECD7] text-2xl font-light mb-2"
                style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
              >
                Solace Companion
              </h1>
              <p className="text-[#F5ECD7]/75 text-xs font-light leading-5">
                An AI conversation · not therapy · this visit only
              </p>
            </header>

            <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Conversation mode">
              {COMPANION_MODES.map(key => {
                const meta = COMPANION_MODE_META[key];
                const selected = mode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => chooseMode(key)}
                    className={`px-3 py-1.5 rounded-full text-[11px] tracking-wide ${
                      selected
                        ? 'bg-[#F5ECD7] text-[#1a1612]'
                        : 'border border-[#F5ECD7]/30 text-[#F5ECD7]/80'
                    }`}
                  >
                    {meta.title}
                  </button>
                );
              })}
            </div>

            <p className="text-[#F5ECD7]/65 text-xs font-light mb-5 leading-5">{privacyLine}</p>

            <div className="flex-1 flex flex-col gap-6 mb-6">
              {thread.map(item => (
                <div key={item.id}>
                  {item.kind === 'user' && (
                    <p className="text-[#F5ECD7]/90 text-sm font-light leading-7 whitespace-pre-wrap">{item.text}</p>
                  )}
                  {item.kind === 'ai' && (
                    <p
                      className="text-[#F5ECD7] text-base font-light leading-8 whitespace-pre-wrap border-l border-[#F5ECD7]/30 pl-4"
                      style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
                    >
                      {item.text}
                    </p>
                  )}
                  {item.kind === 'held' && (
                    <p className="text-[#F5ECD7]/80 text-sm font-light leading-7 italic whitespace-pre-wrap">
                      {item.text}
                    </p>
                  )}
                  {item.kind === 'note' && (
                    <p className="text-[#F5ECD7]/60 text-xs font-light leading-5">{item.text}</p>
                  )}
                </div>
              ))}
              {loading && (
                <p className="text-[#F5ECD7]/55 text-xs font-light tracking-wide">listening…</p>
              )}
              <div ref={endRef} />
            </div>

            {offer && (
              <div
                className="mb-5 rounded-2xl border border-[#F5ECD7]/20 px-4 py-4"
                role="region"
                aria-label="A quieter place, if you want it"
              >
                <p className="text-[#F5ECD7]/80 text-sm font-light leading-6 mb-3">
                  Want to keep talking, or give your mind somewhere quieter to go?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setOffer(null)}
                    className="px-4 py-2 rounded-full border border-[#F5ECD7]/30 text-[#F5ECD7] text-xs"
                  >
                    keep talking
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(SANCTUARIES[offer].route)}
                    className="px-4 py-2 rounded-full border border-[#F5ECD7]/30 text-[#F5ECD7] text-xs"
                  >
                    go to {SANCTUARIES[offer].label}
                  </button>
                </div>
              </div>
            )}

            {!isEnabled && (
              <p className="text-[#F5ECD7]/70 text-xs font-light mb-4 leading-5">
                Talk with me needs AI. You can enable it from the header, or hold something here without sending it.
                {preference === 'declined' && (
                  <>
                    {' '}
                    <button type="button" onClick={openSettings} className="underline underline-offset-4">
                      Open AI settings
                    </button>
                  </>
                )}
              </p>
            )}

            <form
              className="mt-auto"
              onSubmit={event => {
                event.preventDefault();
                void talk();
              }}
            >
              <label htmlFor="companion-draft" className="block text-[#F5ECD7]/80 text-xs font-light mb-2">
                What you want to say
              </label>
              <textarea
                id="companion-draft"
                ref={composerRef}
                value={draft}
                onChange={event => setDraft(event.target.value)}
                onKeyDown={onComposerKey}
                rows={4}
                maxLength={4000}
                placeholder="You can say it plainly."
                className="w-full bg-transparent text-[#F5ECD7] text-sm font-light leading-7 resize-none outline-none border-b border-[#F5ECD7]/25 pb-3 placeholder-[#F5ECD7]/40"
              />
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={holdThis}
                  disabled={!draft.trim() || loading}
                  className="px-5 py-2.5 rounded-full border border-[#F5ECD7]/30 text-[#F5ECD7] text-xs tracking-wide disabled:opacity-40"
                >
                  Just hold this
                </button>
                <button
                  type="submit"
                  disabled={!draft.trim() || loading}
                  className="px-5 py-2.5 rounded-full border border-[#F5ECD7]/50 text-[#F5ECD7] text-xs tracking-wide disabled:opacity-40"
                >
                  Talk with me
                </button>
                <span className="text-[#F5ECD7]/55 text-[11px] font-light">
                  Enter to talk · Shift+Enter for a new line
                </span>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
