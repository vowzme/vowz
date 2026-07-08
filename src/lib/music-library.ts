// Curated background music library organized by mood/category.
// Tracks are royalty-free samples hosted publicly. Users can also paste
// their own custom URL (any direct .mp3 / .ogg / .m4a link).

export interface MusicTrack {
  id: string;
  name: string;
  url: string;
  duration?: string;
}

export interface MusicCategory {
  id: string;
  label: string;
  emoji: string;
  description: string;
  tracks: MusicTrack[];
}

// SoundHelix hosts stable royalty-free instrumental samples.
const sh = (n: number) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

export const MUSIC_CATEGORIES: MusicCategory[] = [
  {
    id: "romantic",
    label: "Romantic",
    emoji: "💕",
    description: "Soft, love-filled melodies for tender moments",
    tracks: [
      { id: "rom-1", name: "First Dance", url: sh(1) },
      { id: "rom-2", name: "Endless Love", url: sh(2) },
      { id: "rom-3", name: "Two Hearts", url: sh(3) },
    ],
  },
  {
    id: "instrumental",
    label: "Instrumental Piano",
    emoji: "🎹",
    description: "Elegant piano compositions",
    tracks: [
      { id: "ins-1", name: "Ivory Keys", url: sh(4) },
      { id: "ins-2", name: "Moonlight Vow", url: sh(5) },
      { id: "ins-3", name: "Golden Hour", url: sh(6) },
    ],
  },
  {
    id: "bollywood",
    label: "Bollywood",
    emoji: "🎬",
    description: "Upbeat celebratory grooves inspired by Bollywood weddings",
    tracks: [
      { id: "bol-1", name: "Sangeet Nights", url: sh(7) },
      { id: "bol-2", name: "Baraat Beats", url: sh(8) },
      { id: "bol-3", name: "Mehndi Melody", url: sh(9) },
    ],
  },
  {
    id: "classical",
    label: "Classical",
    emoji: "🎻",
    description: "Timeless classical strings and orchestra",
    tracks: [
      { id: "cls-1", name: "Wedding Waltz", url: sh(10) },
      { id: "cls-2", name: "String Serenade", url: sh(11) },
      { id: "cls-3", name: "Cathedral Vows", url: sh(12) },
    ],
  },
  {
    id: "traditional",
    label: "Traditional Indian",
    emoji: "🪔",
    description: "Sitar, flute and shehnai-inspired sounds",
    tracks: [
      { id: "tra-1", name: "Shehnai Blessings", url: sh(13) },
      { id: "tra-2", name: "Sitar Sunrise", url: sh(14) },
    ],
  },
  {
    id: "ambient",
    label: "Ambient",
    emoji: "✨",
    description: "Dreamy, atmospheric background textures",
    tracks: [
      { id: "amb-1", name: "Cloud Nine", url: sh(15) },
      { id: "amb-2", name: "Starlight", url: sh(16) },
    ],
  },
];

export function findTrack(url: string): { category: MusicCategory; track: MusicTrack } | null {
  for (const category of MUSIC_CATEGORIES) {
    const track = category.tracks.find((t) => t.url === url);
    if (track) return { category, track };
  }
  return null;
}
