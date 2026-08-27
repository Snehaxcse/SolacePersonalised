import type { BgTexture } from './studioTypes';

export const ARTIST_SWATCHES = [
  { hex: '#2C1810', name: 'ink brown' },
  { hex: '#8B3A3A', name: 'brick' },
  { hex: '#C4622D', name: 'ember' },
  { hex: '#E8A87C', name: 'clay' },
  { hex: '#F5E6C8', name: 'cream' },
  { hex: '#8B7355', name: 'oak' },
  { hex: '#4A6741', name: 'moss' },
  { hex: '#6B8F71', name: 'sage' },
  { hex: '#3D5A73', name: 'slate' },
  { hex: '#7B9EC0', name: 'sky' },
  { hex: '#9B8EA8', name: 'lilac' },
  { hex: '#F0D5C8', name: 'blush' },
];

export const ARTIST_PALETTE = ARTIST_SWATCHES.map(s => s.hex);

export const COLOR_MOODS = [
  { name: 'Ember', bg: '#C4622D' },
  { name: 'Storm', bg: '#3D5A73' },
  { name: 'Meadow', bg: '#4A6741' },
  { name: 'Dusk', bg: '#9B8EA8' },
  { name: 'Dawn', bg: '#E8A87C' },
  { name: 'Ocean', bg: '#7B9EC0' },
  { name: 'Petal', bg: '#F0C5C5' },
];

export const BG_TEXTURES: { key: BgTexture; label: string; name: string }[] = [
  { key: 'blank', label: '—', name: 'blank paper' },
  { key: 'dots', label: '·', name: 'dotted paper' },
  { key: 'watercolor', label: '~', name: 'watercolor wash' },
  { key: 'starry', label: '✦', name: 'starry night' },
  { key: 'foggy', label: '○', name: 'foggy paper' },
];

export const MAX_HISTORY = 30;
/** Cap for gallery entries. Existing pieces are never silently deleted. */
export const MAX_GALLERY = 50;
const GALLERY_MAX_EDGE = 900;
const GALLERY_JPEG_QUALITY = 0.72;

/**
 * Gallery storage key: solace_studio_gallery
 * Schema: { id, dataURL, date, moodColor }[]
 * New saves use compressed JPEG data URLs. Existing PNG data URLs are left as-is.
 */
export function canvasToGalleryDataURL(canvas: HTMLCanvasElement, paperColor = '#F5ECD7'): string {
  const max = GALLERY_MAX_EDGE;
  const scale = Math.min(1, max / Math.max(canvas.width, canvas.height, 1));
  const width = Math.max(1, Math.round(canvas.width * scale));
  const height = Math.max(1, Math.round(canvas.height * scale));
  try {
    const tmp = document.createElement('canvas');
    tmp.width = width;
    tmp.height = height;
    const ctx = tmp.getContext('2d');
    if (!ctx) return canvas.toDataURL('image/jpeg', GALLERY_JPEG_QUALITY);
    ctx.fillStyle = paperColor;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(canvas, 0, 0, width, height);
    return tmp.toDataURL('image/jpeg', GALLERY_JPEG_QUALITY);
  } catch {
    return canvas.toDataURL('image/png');
  }
}

export function getPointerPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  if ('touches' in e) {
    return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
  }
  return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
}

export function rgbToName(r: number, g: number, b: number): string {
  if (r > 180 && g < 100) return 'warm terracotta';
  if (r > 150 && g > 100 && b < 80) return 'golden';
  if (b > 150 && r < 100) return 'cool blue';
  if (g > 130 && r < 120) return 'soft green';
  if (r < 80 && g < 80 && b < 80) return 'deep dark';
  return 'muted';
}

export function getBgStyle(texture: BgTexture, moodColor: string | null): React.CSSProperties {
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

export function drawAIShape(
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
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(ox, oy);
        }
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
        if (a === 0) ctx.moveTo(cx2, cy2);
        else ctx.lineTo(cx2, cy2);
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
