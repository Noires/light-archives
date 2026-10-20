// ER2-601 / ER2-604 — reader preferences and reading progress, kept in
// localStorage only (no account sync). Every access is guarded: blocked
// storage (private mode, quota) simply means nothing is remembered.

export type ReaderSurface = 'pergament' | 'nacht';

export interface ReadingProgressEntry {
  id: number;
  title: string;
  author: string;
  type?: string;
  /** Last position, 0..1 */
  percent: number;
  /** Furthest position reached, 0..1 */
  max: number;
  updatedAt: number;
}

const FONT_SIZE_KEY = 'elpis.reader.fontSize';
const SURFACE_KEY = 'elpis.reader.surface';
const PROGRESS_KEY = 'elpis.reading.progress';
const PROGRESS_LIMIT = 40;

export const READER_FONT_SIZES = [ 16, 17, 19, 21, 23 ];
export const READER_DEFAULT_FONT_SIZE = 19;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function loadReaderFontSize(): number {
  const value = parseInt(read(FONT_SIZE_KEY) || '', 10);
  return READER_FONT_SIZES.includes(value) ? value : READER_DEFAULT_FONT_SIZE;
}

export function saveReaderFontSize(size: number) {
  write(FONT_SIZE_KEY, String(size));
}

export function loadReaderSurface(): ReaderSurface | null {
  const value = read(SURFACE_KEY);
  return value === 'pergament' || value === 'nacht' ? value : null;
}

export function saveReaderSurface(surface: ReaderSurface) {
  write(SURFACE_KEY, surface);
}

export function loadReadingProgress(): ReadingProgressEntry[] {
  try {
    const parsed: unknown = JSON.parse(read(PROGRESS_KEY) || '[]');

    if (!Array.isArray(parsed)) {
      return [];
    }

    return (parsed as ReadingProgressEntry[])
      .filter((entry) => entry && typeof entry.id === 'number' && typeof entry.percent === 'number')
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function getReadingProgress(id: number): ReadingProgressEntry | null {
  return loadReadingProgress().find((entry) => entry.id === id) || null;
}

export function saveReadingProgress(entry: Omit<ReadingProgressEntry, 'max' | 'updatedAt'>) {
  const entries = loadReadingProgress();
  const previous = entries.find((item) => item.id === entry.id);
  const percent = Math.min(1, Math.max(0, entry.percent));
  const next: ReadingProgressEntry = {
    ...entry,
    percent,
    max: Math.max(percent, previous?.max || 0),
    updatedAt: Date.now(),
  };

  const rest = entries.filter((item) => item.id !== entry.id);
  write(PROGRESS_KEY, JSON.stringify([ next, ...rest ].slice(0, PROGRESS_LIMIT)));
}

/** Most recent story that was started but not finished, if any. */
export function getContinueReading(): ReadingProgressEntry | null {
  return loadReadingProgress().find((entry) => entry.percent >= 0.03 && entry.max < 0.95) || null;
}

/** Plain-text word count of an HTML body. */
export function countWords(html: string): number {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Reading time in minutes at ~200 words per minute (at least 1). */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}
