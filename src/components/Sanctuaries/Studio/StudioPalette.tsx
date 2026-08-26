import { ARTIST_SWATCHES, BG_TEXTURES, COLOR_MOODS } from './studioUtils';
import type { BgTexture } from './studioTypes';

interface ArtistProps {
  color: string;
  onChange: (color: string) => void;
}

export function ArtistPalette({ color, onChange }: ArtistProps) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 grid grid-cols-2 gap-1.5 shadow-sm w-fit" role="group" aria-label="Ink colors">
      {ARTIST_SWATCHES.map(swatch => (
        <button
          key={swatch.hex}
          type="button"
          onClick={() => onChange(swatch.hex)}
          aria-label={swatch.name}
          aria-pressed={color === swatch.hex}
          className={`w-5 h-5 rounded-full transition-all duration-200 ${color === swatch.hex ? 'ring-2 ring-[#C4622D] ring-offset-1' : ''}`}
          style={{ backgroundColor: swatch.hex }}
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
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex flex-col gap-1.5 shadow-sm" role="group" aria-label="Paper mood">
      {COLOR_MOODS.map(mood => (
        <button
          key={mood.name}
          type="button"
          onClick={() => onChange(mood.bg)}
          aria-label={`${mood.name} mood`}
          aria-pressed={canvasBg === mood.bg}
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
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 flex flex-col gap-1 shadow-sm" role="group" aria-label="Paper texture">
      {BG_TEXTURES.map(t => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          aria-label={t.name}
          aria-pressed={bgTexture === t.key}
          className={`w-7 h-7 rounded-lg text-[10px] font-light transition-all duration-200 ${
            bgTexture === t.key ? 'bg-[#C4622D] text-white' : 'text-[#6B4226] hover:bg-[#C4622D]/10'
          }`}
        >
          <span aria-hidden="true">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
