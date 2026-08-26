import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Feather, RotateCcw, Save, Play, Image, X, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import SanctuaryHeader from '../../shared/SanctuaryHeader';
import { getStudioSuggestion, getAIDrawShape, getStudioCompanionMessage, type AIShapeResult } from '../../../utils/claudeService';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useAiConsent } from '../../../context/AiConsentContext';
import { isAiEnabled } from '../../../utils/aiConsent';

// ─── Types ────────────────────────────────────────────────────────────────────
type BrushType = 'pencil' | 'marker' | 'watercolor' | 'eraser';
type BgTexture = 'blank' | 'dots' | 'watercolor' | 'starry' | 'foggy';

interface ConvoMessage { role: 'ai' | 'user'; text: string; }
interface GalleryEntry { id: string; dataURL: string; date: string; moodColor: string | null; }

// ─── Constants ────────────────────────────────────────────────────────────────
const ARTIST_PALETTE = [
  '#2C1810', '#8B3A3A', '#C4622D', '#E8A87C',
  '#F5E6C8', '#8B7355', '#4A6741', '#6B8F71',
  '#3D5A73', '#7B9EC0', '#9B8EA8', '#F0D5C8',
];

const COLOR_MOODS = [
  { name: 'Ember', bg: '#C4622D' },
  { name: 'Storm', bg: '#3D5A73' },
  { name: 'Meadow', bg: '#4A6741' },
  { name: 'Dusk', bg: '#9B8EA8' },
  { name: 'Dawn', bg: '#E8A87C' },
  { name: 'Ocean', bg: '#7B9EC0' },
  { name: 'Petal', bg: '#F0C5C5' },
];

const BG_TEXTURES: { key: BgTexture; label: string }[] = [
  { key: 'blank', label: '—' },
  { key: 'dots', label: '·' },
  { key: 'watercolor', label: '~' },
  { key: 'starry', label: '✦' },
  { key: 'foggy', label: '○' },
];

const MAX_HISTORY = 30;
const MAX_GALLERY = 50;

// ─── AI Shape Drawing ──────────────────────────────────────────────────────────
function drawAIShape(
  ctx: CanvasRenderingContext2D,
  shape: string,
  x: number,
  y: number,
  color: string,
  canvasW: number,
  canvasH: number
) {
  const px = (x / 100) * canvasW;
  const py = (y / 100) * canvasH;
  const size = Math.min(canvasW, canvasH) * 0.04;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (shape) {
    case 'leaf':
      ctx.beginPath();
      ctx.moveTo(px, py - size);
      ctx.bezierCurveTo(px + size, py - size / 2, px + size, py + size / 2, px, py + size);
      ctx.bezierCurveTo(px - size, py + size / 2, px - size, py - size / 2, px, py - size);
      ctx.stroke();
      break;
    case 'star':
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const ix = px + size * 0.4 * Math.cos(angle);
        const iy = py + size * 0.4 * Math.sin(angle);
        const ox = px + size * Math.cos((i * 4 * Math.PI) / 5 - Math.PI / 2 - (2 * Math.PI) / 5);
        const oy = py + size * Math.sin((i * 4 * Math.PI) / 5 - Math.PI / 2 - (2 * Math.PI) / 5);
        i === 0 ? ctx.beginPath() && ctx.moveTo(ox, oy) : null;
        ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      ctx.stroke();
      break;
    case 'crescent':
      ctx.beginPath();
      ctx.arc(px, py, size, 0.2, Math.PI * 1.8);
      ctx.arc(px + size * 0.3, py, size * 0.8, Math.PI * 1.8, 0.2, true);
      ctx.stroke();
      break;
    case 'loose_circle':
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.1) {
        const jitter = (Math.random() - 0.5) * size * 0.15;
        const r = size + jitter;
        const cx2 = px + r * Math.cos(a);
        const cy2 = py + r * Math.sin(a);
        a === 0 ? ctx.moveTo(cx2, cy2) : ctx.lineTo(cx2, cy2);
      }
      ctx.closePath();
      ctx.stroke();
      break;
    case 'bird':
      ctx.beginPath();
      ctx.moveTo(px - size, py);
      ctx.quadraticCurveTo(px - size / 2, py - size * 0.6, px, py);
      ctx.quadraticCurveTo(px + size / 2, py - size * 0.6, px + size, py);
      ctx.stroke();
      break;
    case 'petal':
      ctx.beginPath();
      ctx.moveTo(px, py - size);
      ctx.bezierCurveTo(px + size * 0.6, py - size * 0.5, px + size * 0.6, py + size * 0.5, px, py + size);
      ctx.bezierCurveTo(px - size * 0.6, py + size * 0.5, px - size * 0.6, py - size * 0.5, px, py - size);
      ctx.fill();
      break;
    case 'small_branch':
      ctx.beginPath();
      ctx.moveTo(px, py + size);
      ctx.lineTo(px, py - size);
      ctx.moveTo(px, py);
      ctx.lineTo(px + size * 0.6, py - size * 0.5);
      ctx.moveTo(px, py - size * 0.4);
      ctx.lineTo(px - size * 0.5, py - size * 0.9);
      ctx.stroke();
      break;
    case 'teardrop':
    default:
      ctx.beginPath();
      ctx.moveTo(px, py - size);
      ctx.bezierCurveTo(px + size * 0.8, py, px + size * 0.5, py + size, px, py + size);
      ctx.bezierCurveTo(px - size * 0.5, py + size, px - size * 0.8, py, px, py - size);
      ctx.fill();
      break;
  }
  ctx.restore();
}

// ─── Background Texture Renderer ──────────────────────────────────────────────
function getBgStyle(texture: BgTexture, moodColor: string | null): React.CSSProperties {
  switch (texture) {
    case 'dots':
      return {
        backgroundColor: '#fdf8f0',
        backgroundImage: 'radial-gradient(circle, #c8b89a 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      };
    case 'watercolor':
      return {
        background: moodColor
          ? `radial-gradient(ellipse at 30% 30%, ${moodColor}22 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, ${moodColor}14 0%, transparent 55%), #fdf8f0`
          : 'radial-gradient(ellipse at 40% 40%, #C4622D18 0%, transparent 50%), #fdf8f0',
      };
    case 'starry':
      return { backgroundColor: '#0f1624' };
    case 'foggy':
      return { background: 'linear-gradient(160deg, #eef2f5 0%, #dde3e8 100%)' };
    default:
      return { backgroundColor: moodColor ? `${moodColor}18` : '#fdf8f0' };
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function StudioSanctuary() {
  const { requestConsent } = useAiConsent();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [brush, setBrush] = useState<BrushType>('pencil');
  const [color, setColor] = useState('#2C1810');
  const [brushSize, setBrushSize] = useState(3);
  const [canvasBg, setCanvasBg] = useState<string | null>(null);
  const [bgTexture, setBgTexture] = useState<BgTexture>('blank');
  const [releasing, setReleasing] = useState(false);

  // History for undo + replay
  const historyRef = useRef<ImageData[]>([]);
  const [historyLen, setHistoryLen] = useState(0);

  // Timers & refs
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const strokeCount = useRef(0);
  const sessionStartRef = useRef<number>(Date.now());
  const hasFirstTouch = useRef(false);
  const lastConvoTrigger = useRef<number>(0);
  const isDrawingSession = useRef(false);

  // Replay
  const [replaying, setReplaying] = useState(false);

  // Whisper mode
  const [whisperMode, setWhisperMode] = useState(false);

  // Old suggestion toast (kept from original)
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Conversation panel
  const [convoOpen, setConvoOpen] = useState(false);
  const [messages, setMessages] = useState<ConvoMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [convoLoading, setConvoLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Gallery
  const [gallery, setGallery] = useLocalStorage<GalleryEntry[]>('solace_studio_gallery', []);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryFull, setGalleryFull] = useState(false);
  const [expandedImage, setExpandedImage] = useState<GalleryEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingAdd, setPendingAdd] = useState<AIShapeResult | null>(null);
  const [aiActionLoading, setAiActionLoading] = useState(false);

  // First visit tracking
  const [isFirstVisit] = useLocalStorage<boolean>('solace_studio_first_visit', true);
  const [, setFirstVisitDone] = useLocalStorage<boolean>('solace_studio_first_visit', true);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const getDominantColors = useCallback((): string => {
    const canvas = canvasRef.current;
    if (!canvas) return 'muted tones';
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'muted tones';
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let rS = 0, gS = 0, bS = 0, n = 0;
    for (let i = 0; i < data.length; i += 16) {
      if (data[i + 3] > 10) { rS += data[i]; gS += data[i + 1]; bS += data[i + 2]; n++; }
    }
    if (!n) return 'bare canvas, just beginning';
    return `${rgbToName(rS / n, gS / n, bS / n)} tones, ${n > 1000 ? 'richly layered' : 'lightly touched'}`;
  }, []);

  const getMinutesDrawing = () => Math.floor((Date.now() - sessionStartRef.current) / 60000);

  // ── Snapshot / Undo ────────────────────────────────────────────────────────
  const pushSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), snap];
    setHistoryLen(historyRef.current.length);
  }, []);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const newHistory = [...historyRef.current];
    newHistory.pop();
    historyRef.current = newHistory;
    setHistoryLen(newHistory.length);
    if (newHistory.length > 0) {
      ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // ── Replay ────────────────────────────────────────────────────────────────
  const replay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length < 5 || replaying) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const frames = [...historyRef.current];
    setReplaying(true);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let i = 0;
    const step = () => {
      if (i >= frames.length) {
        ctx.putImageData(frames[frames.length - 1], 0, 0);
        setReplaying(false);
        return;
      }
      ctx.putImageData(frames[i], 0, 0);
      i++;
      setTimeout(step, 40);
    };
    step();
  }, [replaying]);

  // ── Conversation ──────────────────────────────────────────────────────────
  const addMessage = (msg: ConvoMessage) => {
    setMessages(prev => [...prev, msg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const triggerConvo = useCallback(async (
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
    if (!convoOpen) setConvoOpen(true);
  }, [getDominantColors, isFirstVisit, messages, convoOpen]);

  const sendUserMessage = async () => {
    const text = userInput.trim();
    if (!text) return;
    await requestConsent({ force: true });
    setUserInput('');
    addMessage({ role: 'user', text });
    await triggerConvo('user_message', text);
  };

  const askSolace = async () => {
    await requestConsent({ force: true });
    if (!isAiEnabled()) return;
    setAiActionLoading(true);
    const text = await getStudioSuggestion(getDominantColors());
    setAiActionLoading(false);
    setSuggestion(text);
    setShowSuggestion(true);
    setTimeout(() => setShowSuggestion(false), 6000);
  };

  const offerAiAdd = async () => {
    await requestConsent({ force: true });
    if (!isAiEnabled()) return;
    setAiActionLoading(true);
    const result = await getAIDrawShape(
      `canvas has ${getDominantColors()}, stroke count around ${strokeCount.current}`
    );
    setAiActionLoading(false);
    if (result) setPendingAdd(result);
  };

  const confirmAiAdd = () => {
    const canvas = canvasRef.current;
    if (!canvas || !pendingAdd) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.globalAlpha = 0.7;
    drawAIShape(
      ctx,
      pendingAdd.shape,
      pendingAdd.position.x,
      pendingAdd.position.y,
      pendingAdd.color,
      canvas.width,
      canvas.height
    );
    ctx.restore();
    pushSnapshot();
    setPendingAdd(null);
  };

  // ── Drawing Events ────────────────────────────────────────────────────────
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || replaying) return;
    e.preventDefault();

    if (!hasFirstTouch.current) {
      hasFirstTouch.current = true;
      setFirstVisitDone(false);
    }

    setIsDrawing(true);
    isDrawingSession.current = true;
    const pos = getPos(e, canvas);
    lastPos.current = pos;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas || !lastPos.current) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e, canvas);

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = brush === 'eraser' ? 'destination-out' : 'source-over';

    if (brush === 'pencil') {
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize * 0.8;
    } else if (brush === 'marker') {
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize * 2;
    } else if (brush === 'watercolor') {
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize * 4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x + (Math.random() - 0.5) * 4, lastPos.current.y + (Math.random() - 0.5) * 4);
        ctx.lineTo(pos.x + (Math.random() - 0.5) * 4, pos.y + (Math.random() - 0.5) * 4);
        ctx.stroke();
      }
    } else {
      // eraser
      ctx.globalAlpha = 1;
      ctx.lineWidth = brushSize === 1 ? 10 : 30;
    }

    if (brush !== 'watercolor') {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    lastPos.current = pos;
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;
    strokeCount.current++;
    const ctx = getCtx();
    if (ctx) {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    pushSnapshot();
  };

  // ── Let It Go ─────────────────────────────────────────────────────────────
  const letItGo = () => {
    const canvas = canvasRef.current;
    if (!canvas || releasing) return;
    setReleasing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let alpha = 1;
    const fade = () => {
      alpha -= 0.015;
      if (alpha <= 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        strokeCount.current = 0;
        historyRef.current = [];
        setHistoryLen(0);
        setTimeout(() => {
          setReleasing(false);
        }, 500);
        return;
      }
      ctx.fillStyle = `rgba(245, 236, 215, ${0.015})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      requestAnimationFrame(fade);
    };
    requestAnimationFrame(fade);
  };

  // ── Save Drawing ──────────────────────────────────────────────────────────
  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (gallery.length >= MAX_GALLERY) {
      setGalleryFull(true);
      return;
    }

    const dataURL = canvas.toDataURL('image/png');
    const now = new Date();
    const filename = `solace-studio-${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}.png`;

    // Trigger download
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    a.click();

    // Save to gallery
    const entry: GalleryEntry = {
      id: `${Date.now()}`,
      dataURL,
      date: now.toLocaleDateString(),
      moodColor: canvasBg,
    };
    setGallery(prev => [...prev.slice(-(MAX_GALLERY - 1)), entry]);
  };

  // ── Delete gallery entry ──────────────────────────────────────────────────
  const deleteEntry = (id: string) => {
    setGallery(prev => prev.filter(e => e.id !== id));
    setDeleteConfirm(null);
    if (expandedImage?.id === id) setExpandedImage(null);
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if (e.key === 'Escape') setWhisperMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);

  // ── Canvas resize ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const snap = canvas.width > 0 ? canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height) : null;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      if (snap) canvas.getContext('2d')?.putImageData(snap, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Starry background dots ─────────────────────────────────────────────────
  const starryDots = bgTexture === 'starry'
    ? Array.from({ length: 60 }, (_, i) => ({
        left: `${(i * 17.3) % 100}%`,
        top: `${(i * 13.7) % 100}%`,
        size: 1 + (i % 2),
        opacity: 0.3 + (i % 4) * 0.15,
      }))
    : [];

  // ── Cursor style ──────────────────────────────────────────────────────────
  const cursorStyle = brush === 'eraser' ? 'cursor-cell' : 'cursor-crosshair';

  // ── Whisper mode toolbar opacity ──────────────────────────────────────────
  const toolbarOpacity = whisperMode ? 'opacity-10 hover:opacity-100 transition-opacity duration-500' : '';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#F5ECD7' }}>
      <SanctuaryHeader sanctuaryName="the studio" textColor="text-[#6B4226]" />

      {/* Paper texture */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }}
      />

      {/* Background texture layer */}
      <div
        className="absolute inset-0 pt-16 z-0 pointer-events-none"
        style={getBgStyle(bgTexture, canvasBg)}
      >
        {bgTexture === 'starry' && starryDots.map((d, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ left: d.left, top: d.top, width: d.size, height: d.size, opacity: d.opacity }} />
        ))}
      </div>

      {/* Canvas */}
      <div className="absolute inset-0 pt-16 z-10">
        <canvas
          ref={canvasRef}
          className={`w-full h-full touch-none ${cursorStyle}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Whisper mode watermark */}
      <AnimatePresence>
        {whisperMode && (
          <motion.p
            className="fixed bottom-3 right-4 z-30 text-[10px] text-[#6B4226]/20 tracking-widest pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            whisper mode
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Left toolbar ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className={`fixed left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 ${toolbarOpacity}`}
      >
        {/* Brush types */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex flex-col gap-1 shadow-sm">
          {(['pencil', 'marker', 'watercolor', 'eraser'] as BrushType[]).map(b => (
            <button
              key={b}
              onClick={() => setBrush(b)}
              title={b}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-all duration-200 ${
                brush === b ? 'bg-[#C4622D] text-white' : 'text-[#8B6914] hover:bg-[#C4622D]/10'
              }`}
            >
              {b === 'pencil' ? '✏️' : b === 'marker' ? '🖊️' : b === 'watercolor' ? '💧' : '○'}
            </button>
          ))}
        </div>

        {/* Brush size */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex flex-col items-center shadow-sm">
          <input
            type="range" min={1} max={12} value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
            className="h-16 appearance-none cursor-pointer"
            style={{ writingMode: 'vertical-lr', direction: 'rtl', accentColor: '#C4622D' }}
          />
        </div>

        {/* Colors */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 grid grid-cols-2 gap-1.5 shadow-sm w-fit">
          {ARTIST_PALETTE.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full transition-all duration-200 ${color === c ? 'ring-2 ring-[#C4622D] ring-offset-1' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Undo */}
        <button
          onClick={undo}
          disabled={historyLen === 0}
          title="undo (Ctrl+Z)"
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-sm flex items-center justify-center text-[#8B6914]/60 hover:text-[#C4622D] disabled:opacity-25 transition-colors duration-200"
        >
          <RotateCcw size={14} />
        </button>
      </motion.div>

      {/* ── Right panel ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className={`fixed right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 ${toolbarOpacity}`}
      >
        {/* Color moods */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex flex-col gap-1.5 shadow-sm">
          {COLOR_MOODS.map(mood => (
            <button
              key={mood.name}
              onClick={() => setCanvasBg(mood.bg)}
              title={mood.name}
              className={`w-7 h-7 rounded-full transition-all duration-300 ${canvasBg === mood.bg ? 'ring-2 ring-[#6B4226] ring-offset-1' : ''}`}
              style={{ backgroundColor: mood.bg }}
            />
          ))}
        </div>

        {/* Background textures */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex flex-col gap-1 shadow-sm">
          {BG_TEXTURES.map(t => (
            <button
              key={t.key}
              onClick={() => setBgTexture(t.key)}
              title={t.key}
              className={`w-7 h-7 rounded-lg text-[10px] font-light transition-all duration-200 ${
                bgTexture === t.key ? 'bg-[#C4622D] text-white' : 'text-[#8B6914]/60 hover:bg-[#C4622D]/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex flex-col gap-1.5 shadow-sm">
          {/* Let it go */}
          <button
            onClick={letItGo}
            disabled={releasing}
            className="text-[10px] text-[#8B6914]/70 hover:text-[#C4622D] transition-colors duration-300 tracking-wide py-1"
          >
            let it go
          </button>

          <button
            type="button"
            onClick={askSolace}
            disabled={aiActionLoading}
            className="text-[10px] text-[#8B6914]/70 hover:text-[#C4622D] transition-colors duration-300 tracking-wide py-1 disabled:opacity-40"
          >
            ask Solace
          </button>

          <button
            type="button"
            onClick={offerAiAdd}
            disabled={aiActionLoading}
            className="text-[10px] text-[#8B6914]/70 hover:text-[#C4622D] transition-colors duration-300 tracking-wide py-1 disabled:opacity-40"
          >
            add something
          </button>

          {/* Save */}
          <button
            onClick={saveDrawing}
            title="save"
            className="flex items-center justify-center text-[#8B6914]/60 hover:text-[#C4622D] transition-colors duration-200 py-1"
          >
            <Save size={13} />
          </button>

          {/* Replay */}
          {historyLen >= 5 && (
            <button
              onClick={replay}
              disabled={replaying}
              title="replay"
              className="flex items-center justify-center text-[#8B6914]/60 hover:text-[#C4622D] transition-colors duration-200 py-1 disabled:opacity-30"
            >
              <Play size={13} />
            </button>
          )}

          {/* Gallery */}
          <button
            onClick={() => setShowGallery(true)}
            title="gallery"
            className="flex items-center justify-center text-[#8B6914]/60 hover:text-[#C4622D] transition-colors duration-200 py-1"
          >
            <Image size={13} />
          </button>
        </div>

        {/* Whisper mode toggle */}
        <button
          onClick={() => setWhisperMode(w => !w)}
          title="whisper mode"
          className={`bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-sm flex items-center justify-center transition-colors duration-300 ${
            whisperMode ? 'text-[#C4622D]' : 'text-[#8B6914]/40 hover:text-[#8B6914]/80'
          }`}
        >
          <Feather size={13} />
        </button>

        {/* Conversation toggle */}
        <button
          onClick={() => setConvoOpen(o => !o)}
          title="companion"
          aria-label={convoOpen ? 'close companion' : 'open companion'}
          aria-expanded={convoOpen}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-sm flex items-center justify-center text-[#8B6914]/40 hover:text-[#8B6914]/80 transition-colors duration-300"
        >
          {convoOpen ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </motion.div>

      {/* ── Replaying indicator ───────────────────────────────────────────── */}
      <AnimatePresence>
        {replaying && (
          <motion.div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <p className="text-[#8B6914]/60 text-xs tracking-widest">replaying...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Release message ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {releasing && (
          <motion.div
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[#8B6914]/60 text-sm font-light tracking-widest italic" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              released.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Gallery full warning ──────────────────────────────────────────── */}
      <AnimatePresence>
        {galleryFull && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-md max-w-xs text-center"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <p className="text-[#6B4226]/70 text-xs font-light mb-2">your gallery is full (50 pieces). remove one to make room.</p>
            <button onClick={() => { setGalleryFull(false); setShowGallery(true); }} className="text-[#C4622D] text-xs underline">open gallery</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Suggestion toast ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showSuggestion && suggestion && !convoOpen && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-xs sm:max-w-sm px-5 py-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-md"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[#6B4226]/80 text-sm font-light leading-relaxed text-center italic" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              {suggestion}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI add preview ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {pendingAdd && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-md max-w-xs text-center"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-add-title"
          >
            <p id="ai-add-title" className="text-[#6B4226]/80 text-sm font-light leading-relaxed italic mb-3" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              {pendingAdd.description}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button type="button" onClick={confirmAiAdd} className="text-[#C4622D] text-xs">
                add to drawing
              </button>
              <button type="button" onClick={() => setPendingAdd(null)} className="text-[#8B6914]/50 text-xs">
                keep my work
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Conversation Panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {convoOpen && (
          <motion.div
            className="fixed right-0 top-16 bottom-0 z-30 flex flex-col w-72 sm:w-80"
            style={{ backgroundColor: 'rgba(245, 236, 215, 0.96)', backdropFilter: 'blur(12px)', borderLeft: '1px solid rgba(196,98,45,0.12)' }}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#C4622D]/10">
              <span className="text-[#6B4226]/60 text-xs tracking-widest uppercase">companion</span>
              <button onClick={() => setConvoOpen(false)} className="text-[#8B6914]/40 hover:text-[#C4622D] transition-colors">
                <X size={13} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {messages.length === 0 && (
                <p className="text-[#8B6914]/30 text-xs italic text-center mt-8">begin, and something will be said.</p>
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
                        ? 'text-[#6B4226]/75 italic'
                        : 'text-[#6B4226] bg-white/60 rounded-2xl px-3 py-2'
                    }`}
                    style={m.role === 'ai' ? { fontFamily: 'Cormorant Garamond, Georgia, serif' } : {}}
                  >
                    {m.text}
                  </p>
                </motion.div>
              ))}
              {convoLoading && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#8B6914]/30 text-xs italic self-start">
                  ...
                </motion.p>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[#C4622D]/10 px-4 py-3 flex gap-2 items-center">
              <input
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendUserMessage()}
                placeholder="say something..."
                aria-label="Message to companion"
                className="flex-1 bg-transparent text-[#6B4226] text-xs font-light outline-none placeholder-[#8B6914]/30"
              />
              <button
                type="button"
                onClick={sendUserMessage}
                aria-label="Send message"
                className="text-[#C4622D]/50 hover:text-[#C4622D] transition-colors text-xs"
              >
                →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Whisper mode: latest message bar when panel closed */}
      <AnimatePresence>
        {whisperMode && !convoOpen && messages.length > 0 && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-30 px-6 py-2"
            style={{ backgroundColor: 'rgba(245,236,215,0.85)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <p className="text-[#6B4226]/50 text-xs italic text-center truncate" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              {messages[messages.length - 1].text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Gallery Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showGallery && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(107,66,38,0.6)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setShowGallery(false); }}
          >
            <motion.div
              className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl overflow-hidden"
              style={{ backgroundColor: '#F5ECD7' }}
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Gallery header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#C4622D]/10">
                <div>
                  <h2 className="text-[#6B4226] text-base font-light" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>your gallery</h2>
                  <p className="text-[#8B6914]/50 text-xs">{gallery.length} / {MAX_GALLERY} pieces</p>
                </div>
                <button onClick={() => setShowGallery(false)} className="text-[#8B6914]/50 hover:text-[#C4622D] transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Gallery grid */}
              <div className="flex-1 overflow-y-auto p-5">
                {gallery.length === 0 ? (
                  <p className="text-[#8B6914]/30 text-sm italic text-center py-12">nothing saved yet. something worth keeping will find its way here.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {gallery.map(entry => (
                      <div key={entry.id} className="flex flex-col gap-1">
                        <button
                          onClick={() => setExpandedImage(entry)}
                          className="aspect-square rounded-2xl overflow-hidden border border-[#C4622D]/10 hover:border-[#C4622D]/30 transition-colors"
                          style={{ backgroundColor: entry.moodColor ? `${entry.moodColor}18` : '#fdf8f0' }}
                        >
                          <img src={entry.dataURL} alt="saved piece" className="w-full h-full object-contain" />
                        </button>
                        <p className="text-[#8B6914]/40 text-[10px] text-center">{entry.date}</p>
                        {deleteConfirm === entry.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => deleteEntry(entry.id)} className="text-[#C4622D] text-[10px]">remove</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-[#8B6914]/40 text-[10px]">keep</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(entry.id)}
                            className="flex items-center justify-center text-[#8B6914]/20 hover:text-[#8B6914]/50 transition-colors"
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

      {/* Expanded image view */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            className="fixed inset-0 z-60 flex items-center justify-center p-6"
            style={{ backgroundColor: 'rgba(107,66,38,0.7)', backdropFilter: 'blur(12px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setExpandedImage(null); }}
          >
            <motion.div
              className="relative max-w-xl max-h-full"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            >
              <img src={expandedImage.dataURL} alt="piece" className="rounded-2xl max-h-[75vh] object-contain" />
              <p className="text-white/40 text-xs text-center mt-3">{expandedImage.date}</p>
              <button
                onClick={() => setExpandedImage(null)}
                className="absolute top-2 right-2 text-white/60 hover:text-white bg-black/20 rounded-full p-1"
              >
                <X size={14} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rgbToName(r: number, g: number, b: number): string {
  if (r > 180 && g < 100) return 'warm terracotta';
  if (r > 150 && g > 100 && b < 80) return 'golden';
  if (b > 150 && r < 100) return 'cool blue';
  if (g > 130 && r < 120) return 'soft green';
  if (r < 80 && g < 80 && b < 80) return 'deep dark';
  return 'muted';
}
