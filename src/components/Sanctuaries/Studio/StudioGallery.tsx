/* eslint-disable react-refresh/only-export-components -- gallery hook colocated with modal */
import { useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import type { GalleryEntry } from './studioTypes';
import { MAX_GALLERY } from './studioUtils';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function useStudioGallery() {
  const [gallery, setGallery] = useLocalStorage<GalleryEntry[]>('solace_studio_gallery', []);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryFull, setGalleryFull] = useState(false);

  const saveDrawing = (canvas: HTMLCanvasElement | null, moodColor: string | null) => {
    if (!canvas) return false;
    if (gallery.length >= MAX_GALLERY) {
      setGalleryFull(true);
      return false;
    }

    const dataURL = canvas.toDataURL('image/png');
    const now = new Date();
    const filename = `solace-studio-${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}.png`;

    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    a.click();

    const entry: GalleryEntry = {
      id: `${Date.now()}`,
      dataURL,
      date: now.toLocaleDateString(),
      moodColor,
    };
    setGallery(prev => [...prev.slice(-(MAX_GALLERY - 1)), entry]);
    return true;
  };

  return { gallery, setGallery, showGallery, setShowGallery, galleryFull, setGalleryFull, saveDrawing };
}

export default function StudioGallery({
  open,
  onOpenChange,
  gallery,
  onGalleryChange,
  galleryFull,
  onGalleryFullChange,
}: Props & {
  gallery: GalleryEntry[];
  onGalleryChange: (value: GalleryEntry[] | ((prev: GalleryEntry[]) => GalleryEntry[])) => void;
  galleryFull: boolean;
  onGalleryFullChange: (full: boolean) => void;
}) {
  const [expandedImage, setExpandedImage] = useState<GalleryEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const expandRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const expandTitleId = useId();
  useFocusTrap(open && !expandedImage, panelRef, () => onOpenChange(false));
  useFocusTrap(Boolean(expandedImage), expandRef, () => setExpandedImage(null));

  const deleteEntry = (id: string) => {
    onGalleryChange(prev => prev.filter(e => e.id !== id));
    setDeleteConfirm(null);
    if (expandedImage?.id === id) setExpandedImage(null);
  };

  return (
    <>
      <AnimatePresence>
        {galleryFull && (
          <motion.div
            role="status"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-md max-w-xs text-center"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <p className="text-[#6B4226] text-xs font-light mb-2">your gallery is full (50 pieces). remove one to make room.</p>
            <button type="button" onClick={() => { onGalleryFullChange(false); onOpenChange(true); }} className="text-[#C4622D] text-xs underline">open gallery</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(107,66,38,0.6)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) onOpenChange(false); }}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl overflow-hidden outline-none"
              style={{ backgroundColor: '#F5ECD7' }}
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#C4622D]/10">
                <div>
                  <h2 id={titleId} className="text-[#6B4226] text-base font-light" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>your gallery</h2>
                  <p className="text-[#6B4226]/80 text-xs">{gallery.length} / {MAX_GALLERY} pieces</p>
                </div>
                <button type="button" onClick={() => onOpenChange(false)} aria-label="Close gallery" className="text-[#6B4226] hover:text-[#C4622D] transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {gallery.length === 0 ? (
                  <p className="text-[#6B4226]/70 text-sm italic text-center py-12">nothing saved yet. something worth keeping will find its way here.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {gallery.map(entry => (
                      <div key={entry.id} className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setExpandedImage(entry)}
                          aria-label={`Open drawing from ${entry.date}`}
                          className="aspect-square rounded-2xl overflow-hidden border border-[#C4622D]/10 hover:border-[#C4622D]/30 transition-colors"
                          style={{ backgroundColor: entry.moodColor ? `${entry.moodColor}18` : '#fdf8f0' }}
                        >
                          <img src={entry.dataURL} alt={`Saved drawing from ${entry.date}`} className="w-full h-full object-contain" />
                        </button>
                        <p className="text-[#6B4226]/70 text-[10px] text-center">{entry.date}</p>
                        {deleteConfirm === entry.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <button type="button" onClick={() => deleteEntry(entry.id)} className="text-[#C4622D] text-[10px]">remove</button>
                            <button type="button" onClick={() => setDeleteConfirm(null)} className="text-[#6B4226] text-[10px]">keep</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(entry.id)}
                            aria-label={`Remove drawing from ${entry.date}`}
                            className="flex items-center justify-center text-[#6B4226]/70 hover:text-[#C4622D] transition-colors"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expandedImage && (
          <motion.div
            className="fixed inset-0 z-60 flex items-center justify-center p-6"
            style={{ backgroundColor: 'rgba(107,66,38,0.7)', backdropFilter: 'blur(12px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setExpandedImage(null); }}
          >
            <motion.div
              ref={expandRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={expandTitleId}
              tabIndex={-1}
              className="relative max-w-xl max-h-full outline-none"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            >
              <h2 id={expandTitleId} className="sr-only">Drawing from {expandedImage.date}</h2>
              <img src={expandedImage.dataURL} alt={`Saved drawing from ${expandedImage.date}`} className="rounded-2xl max-h-[75vh] object-contain" />
              <p className="text-white text-xs text-center mt-3">{expandedImage.date}</p>
              <button
                type="button"
                onClick={() => setExpandedImage(null)}
                aria-label="Close enlarged drawing"
                className="absolute top-2 right-2 text-white bg-black/40 rounded-full p-1"
              >
                <X size={14} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
