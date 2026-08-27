import { useCallback, useEffect, useRef, useState } from 'react';
import type { AIShapeResult } from '../../../utils/claudeService';
import type { BgTexture, BrushType } from './studioTypes';
import { drawAIShape, getPointerPos, MAX_HISTORY, rgbToName } from './studioUtils';

interface Options {
  onFirstStroke?: () => void;
}

export function useStudioCanvas({ onFirstStroke }: Options = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<ImageData[]>([]);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const strokeCount = useRef(0);
  const sessionStartRef = useRef<number>(Date.now());
  const hasFirstTouch = useRef(false);
  const onFirstStrokeRef = useRef(onFirstStroke);
  onFirstStrokeRef.current = onFirstStroke;

  const [isDrawing, setIsDrawing] = useState(false);
  const [brush, setBrush] = useState<BrushType>('pencil');
  const [color, setColor] = useState('#2C1810');
  const [brushSize, setBrushSize] = useState(3);
  const [canvasBg, setCanvasBg] = useState<string | null>(null);
  const [bgTexture, setBgTexture] = useState<BgTexture>('blank');
  const [releasing, setReleasing] = useState(false);
  const [historyLen, setHistoryLen] = useState(0);
  const [replaying, setReplaying] = useState(false);

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const getDominantColors = useCallback((): string => {
    const canvas = canvasRef.current;
    if (!canvas) return 'muted tones';
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'muted tones';
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let rS = 0, gS = 0, bS = 0, n = 0, dark = 0;
    const sampled = Math.floor(data.length / 16);
    for (let i = 0; i < data.length; i += 16) {
      if (data[i + 3] > 10) {
        rS += data[i];
        gS += data[i + 1];
        bS += data[i + 2];
        n++;
        const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        if (lum < 80) dark++;
      }
    }
    if (!n) return 'mostly open space, very few marks';
    const density = n / Math.max(sampled, 1);
    const space = density < 0.08
      ? 'a lot of open space'
      : density > 0.4
        ? 'marks covering much of the page'
        : 'marks and space sharing the page';
    const pressure = dark / n > 0.45 ? 'darker marks with more pressure' : 'lighter marks';
    const movement = strokeCount.current > 18
      ? 'many repeated strokes'
      : strokeCount.current > 6
        ? 'several separate movements'
        : 'only a few movements';
    return `${rgbToName(rS / n, gS / n, bS / n)} tones; ${pressure}; ${space}; ${movement}`;
  }, []);

  const getMinutesDrawing = () => Math.floor((Date.now() - sessionStartRef.current) / 60000);

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

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || replaying) return;
    e.preventDefault();

    if (!hasFirstTouch.current) {
      hasFirstTouch.current = true;
      onFirstStrokeRef.current?.();
    }

    setIsDrawing(true);
    const pos = getPointerPos(e, canvas);
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
    const pos = getPointerPos(e, canvas);

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

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokeCount.current = 0;
    historyRef.current = [];
    setHistoryLen(0);
  };

  const letItGo = (options?: { reduceMotion?: boolean }) => {
    const canvas = canvasRef.current;
    if (!canvas || releasing) return;
    setReleasing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (options?.reduceMotion) {
      clearCanvas();
      window.setTimeout(() => setReleasing(false), 400);
      return;
    }

    let alpha = 1;
    const fade = () => {
      alpha -= 0.015;
      if (alpha <= 0) {
        clearCanvas();
        window.setTimeout(() => setReleasing(false), 500);
        return;
      }
      ctx.fillStyle = `rgba(245, 236, 215, ${0.015})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      requestAnimationFrame(fade);
    };
    requestAnimationFrame(fade);
  };

  const confirmAiAdd = (pendingAdd: AIShapeResult) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);

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

  return {
    canvasRef,
    brush,
    setBrush,
    color,
    setColor,
    brushSize,
    setBrushSize,
    canvasBg,
    setCanvasBg,
    bgTexture,
    setBgTexture,
    isDrawing,
    releasing,
    replaying,
    historyLen,
    strokeCount,
    startDrawing,
    draw,
    stopDrawing,
    undo,
    replay,
    letItGo,
    confirmAiAdd,
    getDominantColors,
    getMinutesDrawing,
    cursorStyle: brush === 'eraser' ? 'cursor-cell' : 'cursor-crosshair',
  };
}
