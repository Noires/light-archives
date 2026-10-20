// ER2 outlook — adventurer plate as a PNG (1200 × 630, social card size).
//
// Layers: banner (cover-fit) with a dark scrim, avatar circle with a gold
// ring, italic serif title, name in Cinzel, "Volk · Clan · Welt [Light]", up
// to three chips and an "Elpisgarten" wordmark. Images load with
// crossOrigin='anonymous'; when they fail or taint the canvas, the plate is
// redrawn with a gradient background and the initial instead of the avatar,
// so the export never throws for image reasons.

export const PLATE_WIDTH = 1200;
export const PLATE_HEIGHT = 630;

export interface PlateChip {
	label: string;
	/** Optional status dot colour. */
	dot?: string;
}

export interface PlateData {
	name: string;
	title?: string;
	meta?: string;
	chips?: PlateChip[];
	avatarUrl?: string;
	bannerUrl?: string;
}

interface PlateImages {
	banner: HTMLImageElement | null;
	avatar: HTMLImageElement | null;
}

const FONT_DISPLAY = '"Cinzel", "Cinzel Eorzea", Georgia, serif';
const FONT_LORE = '"IM Fell English", "Spectral", Georgia, serif';
const FONT_BODY = '"Spectral", "Noto Sans", Georgia, serif';
const FONT_UI = '"Inter", "Noto Sans", system-ui, sans-serif';

const GOLD = '#DDB476';
const GOLD_DEEP = '#BA9B5B';
const LORE = '#F3D9A4';
const IMAGE_TIMEOUT_MS = 8000;

function loadImageOnce(url: string): Promise<HTMLImageElement | null> {
	return new Promise((resolve) => {
		const img = new Image();
		let done = false;
		const finish = (result: HTMLImageElement | null) => {
			if (!done) {
				done = true;
				resolve(result);
			}
		};
		const timer = window.setTimeout(() => finish(null), IMAGE_TIMEOUT_MS);
		img.crossOrigin = 'anonymous';
		img.decoding = 'async';
		img.onload = () => {
			window.clearTimeout(timer);
			finish(img.naturalWidth > 0 ? img : null);
		};
		img.onerror = () => {
			window.clearTimeout(timer);
			finish(null);
		};
		img.src = url;
	});
}

/**
 * Loads with CORS. A copy cached without CORS headers (the page shows the same
 * image) can make the first try fail, so it retries once with a cache-buster
 * unless the URL is signed.
 */
async function loadImage(url: string | undefined): Promise<HTMLImageElement | null> {
	if (!url) {
		return null;
	}
	const first = await loadImageOnce(url);
	if (first || /[?&]X-Amz-|[?&]Signature=/i.test(url)) {
		return first;
	}
	const busted = `${url}${url.includes('?') ? '&' : '?'}plate=${Date.now()}`;
	return loadImageOnce(busted);
}

async function waitForFonts(): Promise<void> {
	const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
	if (!fonts) {
		return;
	}
	try {
		await Promise.race([
			Promise.all([
				fonts.load(`500 72px ${FONT_DISPLAY}`),
				fonts.load(`italic 30px ${FONT_LORE}`),
				fonts.load(`28px ${FONT_BODY}`),
				fonts.load(`600 22px ${FONT_UI}`),
			]).then(() => fonts.ready),
			new Promise((resolve) => window.setTimeout(resolve, 3000)),
		]);
	} catch {
		// Fallback fonts are fine.
	}
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, focusY = 0.3) {
	const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
	const sw = w / scale;
	const sh = h / scale;
	const sx = (img.naturalWidth - sw) / 2;
	const sy = Math.max(0, Math.min(img.naturalHeight - sh, (img.naturalHeight - sh) * focusY));
	ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
	if (ctx.measureText(text).width <= maxWidth) {
		return text;
	}
	let result = text;
	while (result.length > 1 && ctx.measureText(`${result}…`).width > maxWidth) {
		result = result.slice(0, -1);
	}
	return `${result.trimEnd()}…`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}

function drawPlate(ctx: CanvasRenderingContext2D, data: PlateData, images: PlateImages) {
	const W = PLATE_WIDTH;
	const H = PLATE_HEIGHT;
	ctx.clearRect(0, 0, W, H);

	// 1. Background: banner or the plate gradient.
	const base = ctx.createLinearGradient(0, 0, W, H);
	base.addColorStop(0, '#2B2418');
	base.addColorStop(1, '#5C4A2C');
	ctx.fillStyle = base;
	ctx.fillRect(0, 0, W, H);
	if (images.banner) {
		drawCover(ctx, images.banner, 0, 0, W, H);
	} else {
		// Soft aether glow so the plain plate is not flat.
		const glow = ctx.createRadialGradient(W * 0.78, H * 0.2, 20, W * 0.78, H * 0.2, W * 0.6);
		glow.addColorStop(0, 'rgba(221, 180, 118, 0.35)');
		glow.addColorStop(1, 'rgba(221, 180, 118, 0)');
		ctx.fillStyle = glow;
		ctx.fillRect(0, 0, W, H);
	}

	// Dark scrim: bottom-heavy plus a left wash behind the text.
	const scrim = ctx.createLinearGradient(0, 0, 0, H);
	scrim.addColorStop(0, 'rgba(13, 17, 24, 0.10)');
	scrim.addColorStop(0.45, 'rgba(13, 17, 24, 0.45)');
	scrim.addColorStop(1, 'rgba(13, 17, 24, 0.90)');
	ctx.fillStyle = scrim;
	ctx.fillRect(0, 0, W, H);
	const wash = ctx.createLinearGradient(0, 0, W, 0);
	wash.addColorStop(0, 'rgba(13, 17, 24, 0.45)');
	wash.addColorStop(0.7, 'rgba(13, 17, 24, 0)');
	ctx.fillStyle = wash;
	ctx.fillRect(0, 0, W, H);

	// 2. Avatar circle with a gold ring (or the initial).
	const cx = 190;
	const cy = 410;
	const r = 118;
	ctx.save();
	ctx.beginPath();
	ctx.arc(cx, cy, r, 0, Math.PI * 2);
	ctx.closePath();
	ctx.clip();
	if (images.avatar) {
		drawCover(ctx, images.avatar, cx - r, cy - r, r * 2, r * 2, 0.2);
	} else {
		const fill = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
		fill.addColorStop(0, '#5C4A2C');
		fill.addColorStop(1, '#2B2418');
		ctx.fillStyle = fill;
		ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
		ctx.fillStyle = GOLD;
		ctx.font = `500 120px ${FONT_DISPLAY}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText((data.name || '?').trim().charAt(0).toUpperCase(), cx, cy + 6);
	}
	ctx.restore();
	ctx.lineWidth = 8;
	ctx.strokeStyle = GOLD;
	ctx.beginPath();
	ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
	ctx.stroke();
	ctx.lineWidth = 2;
	ctx.strokeStyle = GOLD_DEEP;
	ctx.beginPath();
	ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
	ctx.stroke();

	// 3. Text column.
	const x = 360;
	const maxWidth = W - x - 60;
	ctx.textAlign = 'left';
	ctx.textBaseline = 'alphabetic';
	ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
	ctx.shadowBlur = 12;

	if (data.title) {
		ctx.fillStyle = LORE;
		ctx.font = `italic 30px ${FONT_LORE}`;
		ctx.fillText(fitText(ctx, data.title, maxWidth), x, 330);
	}

	let nameSize = 76;
	ctx.font = `500 ${nameSize}px ${FONT_DISPLAY}`;
	while (nameSize > 44 && ctx.measureText(data.name).width > maxWidth) {
		nameSize -= 4;
		ctx.font = `500 ${nameSize}px ${FONT_DISPLAY}`;
	}
	ctx.fillStyle = '#FFFFFF';
	ctx.fillText(fitText(ctx, data.name, maxWidth), x, 410);

	if (data.meta) {
		ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
		ctx.font = `28px ${FONT_BODY}`;
		ctx.fillText(fitText(ctx, data.meta, maxWidth), x, 458);
	}
	ctx.shadowBlur = 0;
	ctx.shadowColor = 'transparent';

	// 4. Chips.
	let chipX = x;
	const chipY = 490;
	const chipH = 44;
	ctx.font = `600 21px ${FONT_UI}`;
	for (const chip of (data.chips || []).filter((c) => !!c.label).slice(0, 3)) {
		const dotSpace = chip.dot ? 22 : 0;
		const label = fitText(ctx, chip.label, 300);
		const width = Math.ceil(ctx.measureText(label).width) + 36 + dotSpace;
		if (chipX + width > W - 60) {
			break;
		}
		roundRect(ctx, chipX, chipY, width, chipH, chipH / 2);
		ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
		ctx.fill();
		ctx.lineWidth = 1.5;
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
		ctx.stroke();
		if (chip.dot) {
			ctx.fillStyle = chip.dot;
			ctx.beginPath();
			ctx.arc(chipX + 24, chipY + chipH / 2, 6, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.fillStyle = '#FFFFFF';
		ctx.textBaseline = 'middle';
		ctx.fillText(label, chipX + 18 + dotSpace, chipY + chipH / 2 + 1);
		ctx.textBaseline = 'alphabetic';
		chipX += width + 12;
	}

	// 5. Wordmark and accent bar.
	ctx.textAlign = 'right';
	ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
	ctx.font = `500 24px ${FONT_DISPLAY}`;
	ctx.fillText('Elpisgarten', W - 40, H - 34);
	const markWidth = ctx.measureText('Elpisgarten').width;
	ctx.strokeStyle = GOLD;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(W - 40 - markWidth - 46, H - 42);
	ctx.lineTo(W - 40 - markWidth - 14, H - 42);
	ctx.stroke();

	const accent = ctx.createLinearGradient(0, 0, W, 0);
	accent.addColorStop(0, GOLD);
	accent.addColorStop(0.5, '#9C7A3C');
	accent.addColorStop(1, GOLD);
	ctx.fillStyle = accent;
	ctx.fillRect(0, H - 6, W, 6);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
	return new Promise((resolve) => {
		try {
			canvas.toBlob((blob) => resolve(blob), 'image/png');
		} catch {
			// SecurityError on a tainted canvas.
			resolve(null);
		}
	});
}

function isTainted(ctx: CanvasRenderingContext2D): boolean {
	try {
		ctx.getImageData(0, 0, 1, 1);
		return false;
	} catch {
		return true;
	}
}

function paint(data: PlateData, images: PlateImages): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
	const canvas = document.createElement('canvas');
	canvas.width = PLATE_WIDTH;
	canvas.height = PLATE_HEIGHT;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		return null;
	}
	drawPlate(ctx, data, images);
	return { canvas, ctx };
}

/** Renders the plate; returns null only if the browser cannot encode a PNG at all. */
export async function renderPlate(data: PlateData): Promise<Blob | null> {
	const [ banner, avatar ] = await Promise.all([ loadImage(data.bannerUrl), loadImage(data.avatarUrl), waitForFonts() ]);
	const hasImages = !!banner || !!avatar;

	const painted = paint(data, { banner, avatar });
	if (!painted) {
		return null;
	}
	// A tainted canvas stays tainted, so the fallback always paints a fresh one.
	if (!hasImages || !isTainted(painted.ctx)) {
		const blob = await canvasToBlob(painted.canvas);
		if (blob || !hasImages) {
			return blob;
		}
	}
	const clean = paint(data, { banner: null, avatar: null });
	return clean ? canvasToBlob(clean.canvas) : null;
}

export function plateFileName(name: string): string {
	const safe = (name || 'Charakter').replace(/[\\/:*?"<>|\u0000-\u001F]+/g, '').trim() || 'Charakter';
	return `${safe}-Plakette.png`;
}

/** Renders and downloads `<Name>-Plakette.png`. Resolves false when no PNG could be made. */
export async function downloadPlate(data: PlateData): Promise<boolean> {
	const blob = await renderPlate(data);
	if (!blob) {
		return false;
	}
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = plateFileName(data.name);
	link.rel = 'noopener';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.setTimeout(() => URL.revokeObjectURL(url), 10000);
	return true;
}
