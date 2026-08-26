export type BrushType = 'pencil' | 'marker' | 'watercolor' | 'eraser';
export type BgTexture = 'blank' | 'dots' | 'watercolor' | 'starry' | 'foggy';

export interface ConvoMessage {
  role: 'ai' | 'user';
  text: string;
}

export interface GalleryEntry {
  id: string;
  dataURL: string;
  date: string;
  moodColor: string | null;
}
