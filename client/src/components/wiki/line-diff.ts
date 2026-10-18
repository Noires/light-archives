// ER2 round 2 — small line-based diff for the wiki version page.
// Classic LCS table (O(n·m)); wiki pages are short enough for that. Inputs
// larger than MAX_CELLS fall back to "everything removed, everything added".

export type DiffLineType = 'same' | 'added' | 'removed';

export interface DiffLine {
  type: DiffLineType;
  text: string;
  /** 1-based line number in the old text (same/removed) */
  oldNumber: number | null;
  /** 1-based line number in the new text (same/added) */
  newNumber: number | null;
}

const MAX_CELLS = 4_000_000;

export function diffLines(oldLines: string[], newLines: string[]): DiffLine[] {
  // Trim the common prefix and suffix first; most edits touch a few lines.
  let start = 0;
  while (start < oldLines.length && start < newLines.length && oldLines[start] === newLines[start]) {
    start++;
  }

  let oldEnd = oldLines.length;
  let newEnd = newLines.length;
  while (oldEnd > start && newEnd > start && oldLines[oldEnd - 1] === newLines[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }

  const result: DiffLine[] = [];

  for (let i = 0; i < start; i++) {
    result.push({ type: 'same', text: oldLines[i], oldNumber: i + 1, newNumber: i + 1 });
  }

  const a = oldLines.slice(start, oldEnd);
  const b = newLines.slice(start, newEnd);
  const n = a.length;
  const m = b.length;

  if ((n + 1) * (m + 1) > MAX_CELLS) {
    a.forEach((text, i) => result.push({ type: 'removed', text, oldNumber: start + i + 1, newNumber: null }));
    b.forEach((text, j) => result.push({ type: 'added', text, oldNumber: null, newNumber: start + j + 1 }));
  } else {
    // lcs[i][j] = LCS length of a[i..] and b[j..], stored row-major.
    const width = m + 1;
    const lcs = new Uint32Array((n + 1) * width);

    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        lcs[i * width + j] = a[i] === b[j]
          ? lcs[(i + 1) * width + j + 1] + 1
          : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1]);
      }
    }

    let i = 0;
    let j = 0;

    while (i < n || j < m) {
      if (i < n && j < m && a[i] === b[j]) {
        result.push({ type: 'same', text: a[i], oldNumber: start + i + 1, newNumber: start + j + 1 });
        i++;
        j++;
      } else if (i < n && (j >= m || lcs[(i + 1) * width + j] >= lcs[i * width + j + 1])) {
        result.push({ type: 'removed', text: a[i], oldNumber: start + i + 1, newNumber: null });
        i++;
      } else {
        result.push({ type: 'added', text: b[j], oldNumber: null, newNumber: start + j + 1 });
        j++;
      }
    }
  }

  const shift = newEnd - oldEnd;
  for (let k = oldEnd; k < oldLines.length; k++) {
    result.push({ type: 'same', text: oldLines[k], oldNumber: k + 1, newNumber: k + shift + 1 });
  }

  return result;
}

const BLOCK_END = /<\/(p|div|h[1-6]|li|tr|blockquote|pre|figure|figcaption|table|ul|ol|section|aside)>/gi;

/** Turns stored wiki HTML into readable text lines (one per block / line break). */
export function htmlToLines(content: string): string[] {
  if (!content) {
    return [];
  }

  const marked = content.replace(/<br\s*\/?>/gi, '\n').replace(BLOCK_END, (tag) => `${tag}\n`).replace(/<\/t[dh]>/gi, (tag) => `${tag} | `);
  let text = marked;

  if (typeof DOMParser !== 'undefined') {
    text = new DOMParser().parseFromString(`<body>${marked}</body>`, 'text/html').body.textContent || '';
  } else {
    text = marked.replace(/<[^>]*>/g, '');
  }

  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').replace(/\s*\|\s*$/, '').trim())
    .filter((line) => line.length > 0);
}

export interface DiffHunkLine extends DiffLine {
  key: string;
}

export interface DiffHunk {
  key: string;
  /** lines hidden before this hunk (unchanged context) */
  skipped: number;
  lines: DiffHunkLine[];
}

/** Groups a diff into hunks with `context` unchanged lines around each change. */
export function toHunks(lines: DiffLine[], context = 2): DiffHunk[] {
  const keep = new Array<boolean>(lines.length).fill(false);

  lines.forEach((line, index) => {
    if (line.type !== 'same') {
      for (let k = Math.max(0, index - context); k <= Math.min(lines.length - 1, index + context); k++) {
        keep[k] = true;
      }
    }
  });

  const hunks: DiffHunk[] = [];
  let skipped = 0;
  let current: DiffHunk | null = null;

  lines.forEach((line, index) => {
    if (!keep[index]) {
      skipped++;
      current = null;
      return;
    }

    if (!current) {
      current = { key: `h${index}`, skipped, lines: [] };
      hunks.push(current);
      skipped = 0;
    }

    current.lines.push({ ...line, key: `l${index}` });
  });

  return hunks;
}
