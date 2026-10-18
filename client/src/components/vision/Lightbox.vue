<template>
	<q-dialog
		ref="dialog"
		maximized
		transition-show="fade"
		transition-hide="fade"
		aria-label="Bildbetrachter"
		@hide="onDialogHide"
	>
		<div
			v-if="current"
			class="vision-lightbox"
			@keydown="onKeydown"
			@touchstart.passive="onTouchStart"
			@touchend="onTouchEnd"
		>
			<div
				class="vision-lightbox__backdrop"
				:style="{ backgroundImage: `url(&quot;${current.thumbUrl || current.url}&quot;)` }"
				aria-hidden="true"
			/>

			<div class="vision-lightbox__main">
				<div class="vision-lightbox__bar">
					<span class="vision-lightbox__counter" aria-live="polite">
						<span class="sr-only">Bild </span>{{ index + 1 }} / {{ images.length }}
					</span>
					<q-btn
						class="vision-lightbox__icon-btn"
						flat
						round
						icon="close"
						aria-label="Schließen"
						autofocus
						@click="hide"
					/>
				</div>

				<div class="vision-lightbox__stage">
					<q-btn
						v-if="images.length > 1"
						class="vision-lightbox__nav vision-lightbox__nav--prev"
						flat
						round
						icon="chevron_left"
						aria-label="Vorheriges Bild"
						@click="prev"
					/>

					<transition :name="transitionName" mode="out-in">
						<figure :key="current.id" class="vision-lightbox__figure">
							<img
								class="vision-lightbox__image"
								:src="current.url"
								:alt="current.title || 'Bild ohne Titel'"
								:width="current.width || undefined"
								:height="current.height || undefined"
							/>
						</figure>
					</transition>

					<q-btn
						v-if="images.length > 1"
						class="vision-lightbox__nav vision-lightbox__nav--next"
						flat
						round
						icon="chevron_right"
						aria-label="Nächstes Bild"
						@click="next"
					/>
				</div>

				<ol v-if="images.length > 1" ref="thumbs" class="vision-lightbox__thumbs" aria-label="Alle Bilder">
					<li v-for="(image, i) in images" :key="image.id">
						<button
							type="button"
							class="vision-lightbox__thumb"
							:class="{ 'vision-lightbox__thumb--active': i === index }"
							:aria-current="i === index ? 'true' : undefined"
							:aria-label="`Bild ${i + 1}: ${image.title || 'ohne Titel'}`"
							:data-index="i"
							@click="go(i)"
						>
							<img :src="image.thumbUrl" alt="" loading="lazy" />
						</button>
					</li>
				</ol>
			</div>

			<aside class="vision-lightbox__info" aria-label="Bildinformationen">
				<h2 class="vision-lightbox__title">
					<router-link :to="`/image/${current.id}`" @click="hide">{{ current.title || 'Ohne Titel' }}</router-link>
				</h2>
				<p v-if="authorName" class="vision-lightbox__author">
					von
					<router-link v-if="authorLink" :to="authorLink" @click="hide">{{ authorName }}</router-link>
					<template v-else>{{ authorName }}</template>
				</p>

				<p v-if="description" class="vision-lightbox__description">{{ description }}</p>
				<p v-if="detail && detail.credits" class="vision-lightbox__credits">{{ detail.credits }}</p>

				<div v-if="tags.length" class="vision-lightbox__tags" aria-label="Verknüpft mit">
					<router-link
						v-for="tag in tags"
						:key="tag.key"
						class="vision-lightbox__tag"
						:to="tag.to"
						@click="hide"
					>
						<q-icon :name="tag.icon" aria-hidden="true" />
						<span>{{ tag.label }}</span>
					</router-link>
				</div>

				<!-- ER2 round 2: approved character tags only -->
				<div v-if="taggedCharacters.length" class="vision-lightbox__people">
					<p class="vision-lightbox__people-label">Auf dem Bild</p>
					<ul class="vision-lightbox__tags" aria-label="Markierte Charaktere">
						<li v-for="character in taggedCharacters" :key="character.id">
							<router-link class="vision-lightbox__tag vision-lightbox__tag--person" :to="characterLink(character)" @click="hide">
								<img v-if="character.avatar" class="vision-lightbox__tag-avatar" :src="character.avatar" alt="" />
								<q-icon v-else name="person" aria-hidden="true" />
								<span>{{ character.name }}</span>
							</router-link>
						</li>
					</ul>
				</div>

				<div v-if="reactions.length" class="vision-lightbox__reactions" role="group" aria-label="Reaktionen">
					<button
						v-for="reaction in reactions"
						:key="reaction.kind"
						type="button"
						class="vision-lightbox__reaction"
						:class="{ 'vision-lightbox__reaction--active': reaction.mine }"
						:aria-pressed="reaction.mine ? 'true' : 'false'"
						:disabled="!canReact || reacting"
						:title="canReact ? '' : 'Zum Reagieren mit einem Charakter anmelden'"
						@click="toggleReaction(reaction.kind)"
					>
						<span>{{ reaction.label }}</span>
						<span class="vision-lightbox__reaction-count">{{ reaction.count }}</span>
					</button>
				</div>

				<div class="vision-lightbox__actions">
					<a
						class="vision-lightbox__action"
						:href="current.url"
						:download="current.filename || ''"
						target="_blank"
						rel="noopener"
					>
						<q-icon name="download" aria-hidden="true" />
						<span>Herunterladen</span>
					</a>
					<button type="button" class="vision-lightbox__action" @click="share">
						<q-icon name="share" aria-hidden="true" />
						<span>Teilen</span>
					</button>
				</div>
			</aside>
		</div>
	</q-dialog>
</template>

<script lang="ts">
import type { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import type { ImageDto } from '@app/shared/dto/image/image.dto';
import type { TaggedCharacterDto } from '@app/shared/dto/image/image-tag.dto';
import { REACTION_KINDS_BY_TARGET, REACTION_LABELS, ReactionKind, ReactionTargetType } from '@app/shared/enums/reaction.enum';
import { wikify } from '@common/common/wikilinks';
import { copyToClipboard } from 'quasar';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';
import type { RouteLocationRaw } from 'vue-router';

// ER2-702 — image lightbox, replaces images/ImageSlidesDialog.vue (same
// props, opened through $q.dialog). Dark full-bleed stage in both themes,
// blurred copy of the current image behind it, prev/next, counter, thumbnail
// strip, info panel. QDialog provides Esc, the focus trap and refocusing the
// trigger; ←/→ are handled here. Details (credits, linked event/venue,
// reactions) come from GET /images/:id when available.
// ER2-704 — linked event and venue are shown as chips.
// ER2 round 2 — approved character tags (ImageDto.taggedCharacters) appear
// under "Auf dem Bild" as linked chips; pending or declined tags never do.

interface DialogRef {
	show(): void;
	hide(): void;
}

interface Tag {
	key: string;
	label: string;
	icon: string;
	to: RouteLocationRaw;
}

interface ReactionView {
	kind: ReactionKind;
	label: string;
	count: number;
	mine: boolean;
}

class Props {
	images = prop<ImageSummaryDto[]>({ required: true });
	initialIndex = prop<number>({ default: 0 });
}

@Options({
	name: 'Lightbox',
	emits: [ 'ok', 'hide' ],
	watch: {
		index() {
			(this as Lightbox).onIndexChange();
		},
	},
})
export default class Lightbox extends Vue.with(Props) {
	index = 0;
	direction: 'next' | 'prev' = 'next';
	details: Record<number, ImageDto | null> = {};
	reacting = false;

	private touchX: number | null = null;
	private touchY: number | null = null;

	created() {
		const max = Math.max(0, this.images.length - 1);
		this.index = Math.min(Math.max(0, this.initialIndex || 0), max);
	}

	mounted() {
		this.onIndexChange();
	}

	// --- QDialog plugin interface --------------------------------------------

	show() {
		(this.$refs.dialog as DialogRef).show();
	}

	hide() {
		(this.$refs.dialog as DialogRef).hide();
	}

	onDialogHide() {
		this.$emit('hide');
	}

	// --- Navigation -----------------------------------------------------------

	get current(): ImageSummaryDto | null {
		return this.images[this.index] || null;
	}

	get transitionName(): string {
		return `vision-lightbox-${this.direction}`;
	}

	go(i: number) {
		if (i === this.index || i < 0 || i >= this.images.length) {
			return;
		}
		this.direction = i > this.index ? 'next' : 'prev';
		this.index = i;
	}

	next() {
		if (this.images.length > 1) {
			this.direction = 'next';
			this.index = (this.index + 1) % this.images.length;
		}
	}

	prev() {
		if (this.images.length > 1) {
			this.direction = 'prev';
			this.index = (this.index - 1 + this.images.length) % this.images.length;
		}
	}

	onKeydown(event: KeyboardEvent) {
		if (event.altKey || event.ctrlKey || event.metaKey) {
			return;
		}
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			this.next();
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			this.prev();
		}
	}

	onTouchStart(event: TouchEvent) {
		const touch = event.touches[0];
		this.touchX = touch ? touch.clientX : null;
		this.touchY = touch ? touch.clientY : null;
	}

	onTouchEnd(event: TouchEvent) {
		const touch = event.changedTouches[0];
		if (!touch || this.touchX === null || this.touchY === null) {
			return;
		}
		const dx = touch.clientX - this.touchX;
		const dy = touch.clientY - this.touchY;
		this.touchX = null;
		this.touchY = null;
		if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
			if (dx < 0) {
				this.next();
			} else {
				this.prev();
			}
		}
	}

	onIndexChange() {
		this.preload(this.index + 1);
		this.preload(this.index - 1);
		void this.loadDetail();
		void this.$nextTick(() => {
			const strip = this.$refs.thumbs as HTMLElement | undefined;
			const active = strip?.querySelector<HTMLElement>(`[data-index="${this.index}"]`);
			active?.scrollIntoView({ block: 'nearest', inline: 'center' });
		});
	}

	private preload(i: number) {
		const image = this.images[(i + this.images.length) % this.images.length];
		if (image && typeof window !== 'undefined') {
			new window.Image().src = image.url;
		}
	}

	// --- Details --------------------------------------------------------------

	get detail(): ImageDto | null {
		return this.current ? this.details[this.current.id] || null : null;
	}

	async loadDetail() {
		const image = this.current;
		if (!image || image.id in this.details) {
			return;
		}
		this.details = { ...this.details, [image.id]: null };
		try {
			const detail = await this.$api.images.getImage(image.id);
			this.details = { ...this.details, [image.id]: detail };
		} catch (_) {
			// Summary data only; the panel still shows title, author, description.
		}
	}

	get authorName(): string {
		return this.detail?.author || this.current?.owner || '';
	}

	get authorLink(): RouteLocationRaw | null {
		const name = this.authorName;
		const server = this.detail?.authorServer || this.current?.ownerServer;
		return name && server ? `/${server}/${wikify(name)}` : null;
	}

	get description(): string {
		return this.detail?.description || this.current?.description || '';
	}

	get tags(): Tag[] {
		const detail = this.detail;
		if (!detail) {
			return [];
		}
		const tags: Tag[] = [];
		if (detail.eventId && detail.eventTitle) {
			tags.push({ key: `event-${detail.eventId}`, label: detail.eventTitle, icon: 'event', to: `/event/${detail.eventId}` });
		}
		if (detail.venueId && detail.venueName) {
			tags.push({ key: `venue-${detail.venueId}`, label: detail.venueName, icon: 'storefront', to: `/venue/${detail.venueId}` });
		}
		return tags;
	}

	get taggedCharacters(): TaggedCharacterDto[] {
		const tagged = this.detail?.taggedCharacters;
		return Array.isArray(tagged) ? tagged : [];
	}

	characterLink(character: TaggedCharacterDto): string {
		return `/${character.server}/${character.name.replace(/ /g, '_')}`;
	}

	// --- Reactions (ER2-807; hidden while the API has none) --------------------

	get reactions(): ReactionView[] {
		const detail = this.detail;
		if (!detail || !detail.reactionCounts || typeof this.$api.reactions?.toggleReaction !== 'function') {
			return [];
		}
		const counts = detail.reactionCounts;
		const mine = detail.myReactions || [];
		return REACTION_KINDS_BY_TARGET[ReactionTargetType.IMAGE].map((kind) => ({
			kind,
			label: REACTION_LABELS[kind],
			count: counts[kind] || 0,
			mine: mine.includes(kind),
		}));
	}

	get canReact(): boolean {
		return !!this.$store.getters.characterId;
	}

	async toggleReaction(kind: ReactionKind) {
		const image = this.current;
		const characterId = this.$store.getters.characterId;
		if (!image || !characterId || this.reacting) {
			return;
		}
		this.reacting = true;
		try {
			const summary = await this.$api.reactions.toggleReaction({
				targetType: ReactionTargetType.IMAGE,
				targetId: image.id,
				kind,
				characterId,
			});
			const detail = this.details[image.id];
			if (detail) {
				this.details = {
					...this.details,
					[image.id]: { ...detail, reactionCounts: summary.reactionCounts, myReactions: summary.myReactions },
				};
			}
		} catch (e) {
			notifyError(e);
		} finally {
			this.reacting = false;
		}
	}

	// --- Actions --------------------------------------------------------------

	async share() {
		const image = this.current;
		if (!image) {
			return;
		}
		const url = `${window.location.origin}/image/${image.id}`;
		const nav = window.navigator as Navigator & { share?: (data: { title?: string; url?: string }) => Promise<void> };
		if (typeof nav.share === 'function') {
			try {
				await nav.share({ title: image.title || 'Bild im Elpisgarten', url });
				return;
			} catch (e) {
				if ((e as Error)?.name === 'AbortError') {
					return;
				}
			}
		}
		try {
			await copyToClipboard(url);
			notifySuccess('Link zum Bild kopiert');
		} catch (e) {
			notifyError('Link konnte nicht kopiert werden');
		}
	}
}
</script>

<style lang="scss" scoped>
// The stage is dark in both themes, so it pins the Zodiark values locally
// (same hex as --surface-obsidian, --surface-deep, --ink-luminous,
// --vision-primary in aetherium/color.scss) instead of the theme-flipping roles.
.vision-lightbox {
	--lb-bg: #0B0612;
	--lb-panel: rgba(21, 11, 35, 0.92);
	--lb-ink: #ECE3F7;
	--lb-muted: #B5A6CB;
	--lb-rule: rgba(236, 227, 247, 0.18);
	--lb-tint: rgba(236, 227, 247, 0.10);
	--lb-accent: #C19BFF;
	--lb-on-accent: #150B23;

	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 1fr) 340px;
	width: 100vw;
	height: 100vh;
	height: 100dvh;
	overflow: hidden;
	background-color: var(--lb-bg);
	color: var(--lb-ink);
	font-family: var(--font-ui);
}

.vision-lightbox__backdrop {
	position: absolute;
	inset: -40px;
	background-position: center;
	background-size: cover;
	filter: blur(40px) brightness(0.35) saturate(1.1);
	transform: scale(1.05);
	pointer-events: none;
}

.vision-lightbox__main {
	position: relative;
	display: flex;
	flex-direction: column;
	min-width: 0;
	min-height: 0;
}

.vision-lightbox__bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 12px 16px;
}

.vision-lightbox__counter {
	padding: 4px 12px;
	border-radius: 999px;
	background-color: var(--lb-tint);
	font-size: 14px;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}

.vision-lightbox__stage {
	position: relative;
	display: flex;
	flex: 1 1 auto;
	align-items: center;
	justify-content: center;
	min-height: 0;
	padding: 0 72px;
}

.vision-lightbox__figure {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	margin: 0;
	min-height: 0;
}

.vision-lightbox__image {
	display: block;
	max-width: 100%;
	max-height: 100%;
	width: auto;
	height: auto;
	object-fit: contain;
	border-radius: 6px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.vision-lightbox__icon-btn,
.vision-lightbox__nav {
	color: var(--lb-ink);
	background-color: var(--lb-tint);

	&:hover {
		background-color: var(--lb-rule);
	}

	&:focus-visible {
		outline: none;
		box-shadow: 0 0 0 2px var(--glow-aether);
	}

	:deep(.q-focus-helper) {
		display: none;
	}
}

.vision-lightbox__nav {
	position: absolute;
	top: 50%;
	z-index: 1;
	width: 48px;
	height: 48px;
	transform: translateY(-50%);
	font-size: 20px;
}

.vision-lightbox__nav--prev {
	left: 12px;
}

.vision-lightbox__nav--next {
	right: 12px;
}

.vision-lightbox__thumbs {
	display: flex;
	gap: 8px;
	margin: 0;
	padding: 12px 16px 16px;
	overflow-x: auto;
	list-style: none;
	scrollbar-width: thin;
}

.vision-lightbox__thumb {
	display: block;
	width: 64px;
	height: 64px;
	padding: 0;
	overflow: hidden;
	border: 2px solid transparent;
	border-radius: 8px;
	background-color: var(--lb-tint);
	opacity: 0.6;
	cursor: pointer;
	transition: opacity var(--motion-fast) var(--ease-elpis), border-color var(--motion-fast) var(--ease-elpis);

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	&:hover {
		opacity: 1;
	}

	&:focus-visible {
		outline: none;
		opacity: 1;
		box-shadow: 0 0 0 2px var(--glow-aether);
	}
}

.vision-lightbox__thumb--active {
	border-color: var(--lb-accent);
	opacity: 1;
}

.vision-lightbox__info {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 64px 24px 24px;
	overflow-y: auto;
	background-color: var(--lb-panel);
	border-left: 1px solid var(--lb-rule);

	a {
		color: var(--lb-ink);
	}

	a:focus-visible,
	button:focus-visible {
		outline: none;
		box-shadow: 0 0 0 2px var(--glow-aether);
	}
}

.vision-lightbox__title {
	text-align: left;
	margin: 0;
	font-family: var(--font-display);
	font-size: 22px;
	font-weight: 600;
	line-height: 1.25;
	overflow-wrap: anywhere;

	a {
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}
}

.vision-lightbox__author {
	margin: -8px 0 0;
	font-size: 14px;
	color: var(--lb-muted);

	a {
		font-weight: 600;
	}
}

.vision-lightbox__description {
	margin: 0;
	font-family: var(--font-section);
	font-size: 15px;
	line-height: 1.6;
	white-space: pre-line;
	overflow-wrap: anywhere;
}

.vision-lightbox__credits {
	margin: 0;
	font-size: 13px;
	color: var(--lb-muted);
}

.vision-lightbox__tags,
.vision-lightbox__reactions,
.vision-lightbox__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.vision-lightbox__people {
	display: flex;
	flex-direction: column;
	gap: 6px;

	.vision-lightbox__tags {
		margin: 0;
		padding: 0;
		list-style: none;
	}
}

.vision-lightbox__people-label {
	margin: 0;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--lb-muted);
}

.vision-lightbox__tag-avatar {
	width: 20px;
	height: 20px;
	margin-left: -6px;
	border-radius: 50%;
	object-fit: cover;
}

.vision-lightbox__tag {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	max-width: 100%;
	padding: 4px 12px;
	border: 1px solid var(--lb-rule);
	border-radius: 999px;
	font-size: 13px;
	font-weight: 600;
	text-decoration: none;

	span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&:hover {
		background-color: var(--lb-tint);
	}
}

.vision-lightbox__reaction {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	min-height: 36px;
	padding: 4px 14px;
	border: 1px solid var(--lb-rule);
	border-radius: 999px;
	background-color: transparent;
	color: var(--lb-ink);
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;

	&:hover:not(:disabled) {
		background-color: var(--lb-tint);
	}

	&:disabled {
		cursor: default;
		opacity: 0.7;
	}
}

.vision-lightbox__reaction--active,
.vision-lightbox__reaction--active:hover:not(:disabled) {
	border-color: var(--lb-accent);
	background-color: var(--lb-accent);
	color: var(--lb-on-accent);
}

.vision-lightbox__reaction-count {
	font-variant-numeric: tabular-nums;
}

.vision-lightbox__actions {
	margin-top: auto;
	padding-top: 14px;
	border-top: 1px solid var(--lb-rule);
}

.vision-lightbox__action {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	min-height: 40px;
	padding: 6px 14px;
	border: 1px solid var(--lb-rule);
	border-radius: 8px;
	background-color: transparent;
	color: var(--lb-ink);
	font: inherit;
	font-size: 14px;
	font-weight: 600;
	text-decoration: none;
	cursor: pointer;

	&:hover {
		background-color: var(--lb-tint);
	}
}

.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip: rect(0 0 0 0);
	white-space: nowrap;
}

// Slide + fade between images; reduced motion keeps the swap instant.
.vision-lightbox-next-enter-active,
.vision-lightbox-next-leave-active,
.vision-lightbox-prev-enter-active,
.vision-lightbox-prev-leave-active {
	transition:
		opacity var(--motion-fast) var(--ease-elpis),
		transform var(--motion-fast) var(--ease-elpis);
}

.vision-lightbox-next-enter-from,
.vision-lightbox-prev-leave-to {
	opacity: 0;
	transform: translateX(24px);
}

.vision-lightbox-next-leave-to,
.vision-lightbox-prev-enter-from {
	opacity: 0;
	transform: translateX(-24px);
}

@media (max-width: 1023px) {
	.vision-lightbox {
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr) auto;
	}

	.vision-lightbox__info {
		max-height: 38vh;
		padding: 16px;
		border-left: 0;
		border-top: 1px solid var(--lb-rule);
	}

	.vision-lightbox__actions {
		margin-top: 0;
	}
}

@media (max-width: 599px) {
	.vision-lightbox__stage {
		padding: 0 8px;
	}

	.vision-lightbox__nav {
		top: auto;
		bottom: 8px;
		transform: none;
		width: 44px;
		height: 44px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.vision-lightbox-next-enter-active,
	.vision-lightbox-next-leave-active,
	.vision-lightbox-prev-enter-active,
	.vision-lightbox-prev-leave-active,
	.vision-lightbox__thumb {
		transition: none;
	}

	.vision-lightbox-next-enter-from,
	.vision-lightbox-next-leave-to,
	.vision-lightbox-prev-enter-from,
	.vision-lightbox-prev-leave-to {
		transform: none;
	}
}
</style>
