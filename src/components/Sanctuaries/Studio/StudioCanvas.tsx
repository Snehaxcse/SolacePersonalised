import type { RefObject } from 'react';
import { getBgStyle } from './studioUtils';
import type { BgTexture } from './studioTypes';

interface Props {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  cursorStyle: string;
  bgTexture: BgTexture;
  canvasBg: string | null;
  onPointerDown: (e: React.MouseEvent | React.TouchEvent) => void;
  onPointerMove: (e: React.MouseEvent | React.TouchEvent) => void;
  onPointerUp: () => void;
}

export default function StudioCanvas({
  canvasRef,
  cursorStyle,
  bgTexture,
  canvasBg,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: Props) {
  const starryDots = bgTexture === 'starry'
    ? Array.from({ length: 60 }, (_, i) => ({
        left: `${(i * 17.3) % 100}%`,
        top: `${(i * 13.7) % 100}%`,
        size: 1 + (i % 2),
        opacity: 0.3 + (i % 4) * 0.15,
      }))
    : [];

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }}
      />
      <div
        className="absolute inset-0 pt-16 z-0 pointer-events-none"
        style={getBgStyle(bgTexture, canvasBg)}
      >
        {bgTexture === 'starry' && starryDots.map((d, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ left: d.left, top: d.top, width: d.size, height: d.size, opacity: d.opacity }} />
        ))}
      </div>
      <div className="absolute inset-0 pt-16 z-10">
        <canvas
          ref={canvasRef}
          className={`w-full h-full touch-none ${cursorStyle}`}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        />
      </div>
    </>
  );
}
