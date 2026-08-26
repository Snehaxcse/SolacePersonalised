import { ARTIST_PALETTE, BG_TEXTURES, COLOR_MOODS } from './studioUtils';
import type { BgTexture } from './studioTypes';

interface ArtistProps {
  color: string;
  onChange: (color: string) => void;
}

export function ArtistPalette({ color, onChange }: ArtistProps) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 grid grid-cols-2 gap-1.5 shadow-sm w-fit">
      {ARTIST_PALETTE.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`w-5 h-5 rounded-full transition-all duration-200 ${color === c ? 'ring-2 ring-[#C4622D] ring-offset-1' : ''}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

interface MoodProps {
  canvasBg: string | null;
  onChange: (bg: string) => void;
}

export function MoodPalette({ canvasBg, onChange }: MoodProps) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex flex-col gap-1.5 shadow-sm">
      {COLOR_MOODS.map(mood => (
        <button
          key={mood.name}
          onClick={() => onChange(mood.bg)}
          title={mood.name}
          className={`w-7 h-7 rounded-full transition-all duration-300 ${canvasBg === mood.bg ? 'ring-2 ring-[#6B4226] ring-offset-1' : ''}`}
          style={{ backgroundColor: mood.bg }}
        />
      ))}
    </div>
  );
}

interface TextureProps {
  bgTexture: BgTexture;
  onChange: (texture: BgTexture) => void;
}

export function TexturePalette({ bgTexture, onChange }: TextureProps) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex flex-col gap-1 shadow-sm">
      {BG_TEXTURES.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          title={t.key}
          className={`w-7 h-7 rounded-lg text-[10px] font-light transition-all duration-200 ${
            bgTexture === t.key ? 'bg-[#C4622D] text-white' : 'text-[#8B6914]/60 hover:bg-[#C4622D]/10'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
