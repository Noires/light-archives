<template>
	<q-dialog
		:model-value="modelValue"
		class="vision-palette-dialog"
		:aria-labelledby="`${uid}-title`"
		transition-show="fade"
		transition-hide="fade"
		@update:model-value="$emit('update:modelValue', $event)"
		@show="onShow"
		@hide="onHide"
	>
		<!-- QDialog renders role="dialog" + aria-modal on its root (labelled
		     via aria-labelledby above), closes on Esc and refocuses the trigger. -->
		<div
			class="vision-palette"
			@keydown="onKeydown"
		>
			<h2 :id="`${uid}-title`" class="vision-palette__sr">Suche und Befehle</h2>
			<div class="vision-palette__head">
				<q-icon class="vision-palette__search-icon" name="search" size="20px" aria-hidden="true" />
				<input
					ref="input"
					v-model="query"
					class="vision-palette__input"
					type="text"
					role="combobox"
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
					autofocus
					placeholder="Suchen…"
					aria-autocomplete="list"
					:aria-expanded="flatItems.length > 0 ? 'true' : 'false'"
					:aria-controls="`${uid}-list`"
					:aria-activedescendant="activeId || undefined"
					:aria-describedby="`${uid}-hint`"
				/>
				<kbd class="vision-palette__kbd">Esc</kbd>
			</div>

			<div :id="`${uid}-list`" class="vision-palette__body" role="listbox" aria-label="Ergebnisse">
				<div
					v-for="group in groups"
					:key="group.key"
					class="vision-palette__group"
					role="group"
					:aria-labelledby="`${uid}-group-${group.key}`"
				>
					<div :id="`${uid}-group-${group.key}`" class="vision-palette__group-label" role="presentation">
						{{ group.label }}
					</div>
					<div
						v-for="item in group.items"
						:id="optionId(item)"
						:key="item.id"
						class="vision-palette__option"
						:class="{ 'vision-palette__option--active': item.index === activeIndex }"
						role="option"
						:aria-selected="item.index === activeIndex ? 'true' : 'false'"
						@mousemove="activeIndex = item.index"
						@mousedown.prevent
						@click="activate(item)"
					>
						<span class="vision-palette__option-media" aria-hidden="true">
							<img v-if="item.avatar" class="vision-palette__avatar" :src="item.avatar" alt="" loading="lazy" />
							<q-icon v-else :name="item.icon || 'arrow_forward'" size="18px" />
						</span>
						<span class="vision-palette__option-text">
							<span class="vision-palette__option-label">{{ item.label }}</span>
							<span v-if="item.subtitle" class="vision-palette__option-sub">{{ item.subtitle }}</span>
						</span>
						<q-icon
							v-if="item.index === activeIndex"
							class="vision-palette__option-enter"
							name="keyboard_return"
							size="16px"
							aria-hidden="true"
						/>
					</div>
				</div>

				<p v-if="statusText" class="vision-palette__status" role="status" aria-live="polite">
					<q-spinner v-if="loading" size="16px" class="vision-palette__spinner" />
					{{ statusText }}
				</p>
			</div>

			<footer :id="`${uid}-hint`" class="vision-palette__foot">
				↑↓ navigieren · ↵ öffnen · Strg K überall
			</footer>
		</div>
	</q-dialog>
</template>

<script lang="ts">
import { SearchResultDto } from '@app/shared/dto/search/search-result.dto';
import { SearchResultsDto } from '@app/shared/dto/search/search-results.dto';
import { SessionCharacterDto } from '@app/shared/dto/user/session-character.dto';
import { PageType } from '@app/shared/enums/page-type.enum';
import { Role } from '@app/shared/enums/role.enum';
import { getPageLink } from 'src/common/pagelinks';
import { Options, prop, Vue } from 'vue-class-component';

// ER2-206 / ER2-207 — command palette (Ctrl/Cmd+K). Controlled via v-model;
// the shell (layouts/MainLayout.vue) owns the open state and the global
// shortcut and loads this file lazily with defineAsyncComponent.
// Data: `$api.search.suggest(q)` from 2 characters when the client has it
// (ER2-809 adds GET /search/suggest), else `$api.search.search(q)` from 3.
// Recently opened results are kept in localStorage. See README.md.

export interface PaletteItem {
	id: string;
	label: string;
	subtitle?: string;
	icon?: string;
	avatar?: string;
	to?: string;
	run?: () => void | Promise<void>;
}

interface PaletteGroup {
	key: string;
	label: string;
	items: (PaletteItem & { index: number })[];
}

interface ResultGroupDef {
	key: string;
	label: string;
	icon: string;
	types: string[];
}

export const PALETTE_RESULT_GROUPS: ResultGroupDef[] = [
	{ key: 'characters', label: 'Charaktere', icon: 'person', types: [PageType.PROFILE] },
	{ key: 'venues', label: 'Treffpunkte', icon: 'place', types: [PageType.VENUE] },
	{ key: 'events', label: 'Events', icon: 'event', types: [PageType.EVENT] },
	{ key: 'stories', label: 'Geschichten', icon: 'auto_stories', types: [PageType.STORY] },
	{ key: 'wiki', label: 'Wiki', icon: 'menu_book', types: [PageType.WIKI_PAGE] },
	{ key: 'noticeboard', label: 'Anschlagbrett', icon: 'push_pin', types: [PageType.NOTICEBOARD_ITEM] },
	{ key: 'communities', label: 'Gemeinschaften', icon: 'groups', types: [PageType.COMMUNITY, PageType.FREE_COMPANY] },
];

const SEARCH_MIN_LENGTH = 3;
const SUGGEST_MIN_LENGTH = 2;
const DEBOUNCE_MS = 250;
const RESULTS_PER_GROUP = 5;
const RECENT_STORAGE_KEY = 'elpis.palette.recent';
const RECENT_MAX = 5;

/** Response shape of GET /search/suggest (ER2-809). */
export interface SuggestResultDto {
	id: number | string;
	title: string;
	subtitle?: string | null;
	link: string;
	avatar?: string | null;
}

export interface SuggestGroupDto {
	type: string;
	results: SuggestResultDto[];
}

type SuggestFn = (query: string) => Promise<SuggestGroupDto[]>;

function readRecent(): PaletteItem[] {
	try {
		const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
		const parsed: unknown = raw ? JSON.parse(raw) : [];
		if (!Array.isArray(parsed)) {
			return [];
		}
		return (parsed as PaletteItem[])
			.filter((item) => item && typeof item.label === 'string' && typeof item.to === 'string')
			.slice(0, RECENT_MAX);
	} catch (e) {
		return [];
	}
}

function writeRecent(items: PaletteItem[]): void {
	try {
		window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(items.slice(0, RECENT_MAX)));
	} catch (e) {
		// Storage unavailable (private mode, quota): recent items are a convenience only.
	}
}

let paletteCounter = 0;

function plainSnippet(content: string | undefined, max = 80): string {
	if (!content) {
		return '';
	}
	const text = content
		.replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2')
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
	return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Link for a search result. pagelinks.ts points noticeboard items at a path the router does not have. */
export function searchResultLink(type: PageType, result: SearchResultDto): string {
	if (type === PageType.NOTICEBOARD_ITEM) {
		return `/noticeboard/${result.id!}`;
	}
	return getPageLink(type, result);
}

class Props {
	modelValue = prop<boolean>({ type: Boolean, default: false });
}

@Options({
	name: 'CommandPalette',
	emits: ['update:modelValue'],
	watch: {
		query() {
			(this as CommandPalette).onQueryChange();
		},
	},
})
export default class CommandPalette extends Vue.with(Props) {
	readonly uid = `vision-palette-${++paletteCounter}`;

	query = '';
	activeIndex = -1;
	loading = false;
	error = false;
	resultGroups: { def: ResultGroupDef; items: PaletteItem[] }[] = [];
	searchedQuery = '';
	recentItems: PaletteItem[] = readRecent();

	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private requestSeq = 0;

	get trimmedQuery(): string {
		return this.query.trim();
	}

	get minLength(): number {
		return this.suggestFn() ? SUGGEST_MIN_LENGTH : SEARCH_MIN_LENGTH;
	}

	/** `$api.search.suggest` once client-common has it (runtime check, ER2-207). */
	suggestFn(): SuggestFn | null {
		const api = this.$api.search as unknown as { suggest?: SuggestFn };
		return typeof api.suggest === 'function' ? (q: string) => api.suggest!.call(api, q) : null;
	}

	get actionItems(): PaletteItem[] {
		const items: PaletteItem[] = [];
		const role = this.$store.getters.role;
		const character = this.$store.getters.character;
		const verified = !!role && role !== Role.UNVERIFIED;

		if (this.trimmedQuery) {
			items.push({
				id: 'action-search',
				label: `Alle Ergebnisse für „${this.trimmedQuery}“`,
				icon: 'manage_search',
				to: `/search?q=${encodeURIComponent(this.trimmedQuery)}`,
			});
		}
		if (verified) {
			items.push({ id: 'action-create-event', label: 'Event erstellen', icon: 'add', to: '/create-event' });
		}
		if (verified && character) {
			items.push({
				id: 'action-my-profile',
				label: 'Zu meinem Profil',
				subtitle: character.name,
				icon: 'person',
				to: `/${character.server}/${character.name.replace(/ /g, '_')}`,
			});
			items.push({
				id: 'action-switch-character',
				label: 'Charakter wechseln',
				icon: 'swap_horiz',
				run: () => this.switchCharacter(),
			});
		}

		const q = this.trimmedQuery.toLowerCase();
		return items.filter((item) => item.id === 'action-search' || !q || item.label.toLowerCase().includes(q));
	}

	get groups(): PaletteGroup[] {
		const groups: { key: string; label: string; items: PaletteItem[] }[] = [];
		groups.push(...this.extraGroups());
		for (const entry of this.resultGroups) {
			if (entry.items.length) {
				groups.push({ key: entry.def.key, label: entry.def.label, items: entry.items });
			}
		}
		const actions = this.actionItems;
		if (actions.length) {
			groups.push({ key: 'actions', label: 'Aktionen', items: actions });
		}

		let index = 0;
		return groups.map((group) => ({
			...group,
			items: group.items.map((item) => ({ ...item, index: index++ })),
		}));
	}

	get flatItems(): (PaletteItem & { index: number })[] {
		return this.groups.flatMap((group) => group.items);
	}

	get activeId(): string {
		const item = this.flatItems[this.activeIndex];
		return item ? this.optionId(item) : '';
	}

	get statusText(): string {
		const q = this.trimmedQuery;
		if (!q) {
			return '';
		}
		if (this.loading) {
			return 'Suche läuft …';
		}
		if (q.length < this.minLength) {
			return `Mindestens ${this.minLength} Zeichen eingeben, Enter sucht auf der Ergebnisseite.`;
		}
		if (this.error) {
			return 'Die Suche ist gerade nicht erreichbar. Enter öffnet die Ergebnisseite.';
		}
		if (this.searchedQuery === q && !this.resultGroups.some((group) => group.items.length)) {
			return `Keine Treffer für „${q}“.`;
		}
		return '';
	}

	/** Groups shown above the search results: recent items while the input is empty. */
	extraGroups(): { key: string; label: string; items: PaletteItem[] }[] {
		if (this.trimmedQuery || !this.recentItems.length) {
			return [];
		}
		return [{
			key: 'recent',
			label: 'Zuletzt geöffnet',
			items: this.recentItems.map((item) => ({ ...item, id: `recent-${item.id}`, icon: item.icon || 'history' })),
		}];
	}

	rememberItem(item: PaletteItem) {
		if (!item.to || item.run || item.id.startsWith('action-')) {
			return;
		}
		const id = item.id.replace(/^recent-/, '');
		const entry: PaletteItem = { id, label: item.label, subtitle: item.subtitle, icon: item.icon, avatar: item.avatar, to: item.to };
		this.recentItems = [entry, ...readRecent().filter((recent) => recent.to !== entry.to)].slice(0, RECENT_MAX);
		writeRecent(this.recentItems);
	}

	optionId(item: PaletteItem): string {
		return `${this.uid}-opt-${item.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
	}

	onShow() {
		this.recentItems = readRecent();
		const input = this.$refs.input as HTMLInputElement | undefined;
		input?.focus();
		input?.select();
	}

	onHide() {
		this.clearDebounce();
		this.requestSeq++;
		this.loading = false;
		this.activeIndex = -1;
	}

	onQueryChange() {
		this.activeIndex = -1;
		this.error = false;
		this.clearDebounce();
		const q = this.trimmedQuery;

		if (q.length < this.minLength) {
			this.requestSeq++;
			this.loading = false;
			this.resultGroups = [];
			this.searchedQuery = '';
			return;
		}

		this.loading = true;
		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = null;
			void this.runSearch(q);
		}, DEBOUNCE_MS);
	}

	async runSearch(q: string) {
		const seq = ++this.requestSeq;
		try {
			const groups = await this.fetchGroups(q);
			if (seq !== this.requestSeq) {
				return;
			}
			this.resultGroups = groups;
			this.searchedQuery = q;
		} catch (e) {
			if (seq !== this.requestSeq) {
				return;
			}
			this.resultGroups = [];
			this.searchedQuery = q;
			this.error = true;
		} finally {
			if (seq === this.requestSeq) {
				this.loading = false;
			}
		}
	}

	async fetchGroups(q: string): Promise<{ def: ResultGroupDef; items: PaletteItem[] }[]> {
		const suggest = this.suggestFn();
		if (suggest) {
			try {
				const groups = await suggest(q);
				if (!Array.isArray(groups)) {
					throw new Error('Unexpected suggest response');
				}
				return this.mapSuggest(groups);
			} catch (e) {
				if (q.length < SEARCH_MIN_LENGTH) {
					throw e;
				}
				// Fall back to the full-text search below.
			}
		}
		return this.fetchSearchGroups(q);
	}

	/** v2: autocomplete (`GET /search/suggest?q=`), already carrying links. */
	mapSuggest(groups: SuggestGroupDto[]): { def: ResultGroupDef; items: PaletteItem[] }[] {
		return PALETTE_RESULT_GROUPS.map((def) => ({
			def,
			items: groups
				.filter((group) => group && def.types.includes(group.type) && Array.isArray(group.results))
				.flatMap((group) => group.results
					.filter((result) => result && result.title && result.link)
					.map((result) => ({
						id: `${group.type}-${result.id}`,
						label: result.title,
						subtitle: result.subtitle || '',
						icon: def.icon,
						avatar: result.avatar || undefined,
						to: result.link,
					})))
				.slice(0, RESULTS_PER_GROUP),
		}));
	}

	/** v1: full-text search (`GET /search?q=`), mapped to the palette groups. */
	async fetchSearchGroups(q: string): Promise<{ def: ResultGroupDef; items: PaletteItem[] }[]> {
		const results: SearchResultsDto[] = await this.$api.search.search(q);
		return PALETTE_RESULT_GROUPS.map((def) => ({
			def,
			items: results
				.filter((set) => def.types.includes(set.type))
				.flatMap((set) => set.results.map((result) => this.toItem(set.type, result, def)))
				.slice(0, RESULTS_PER_GROUP),
		}));
	}

	toItem(type: PageType, result: SearchResultDto, def: ResultGroupDef): PaletteItem {
		let subtitle = '';
		switch (type) {
		case PageType.PROFILE:
		case PageType.VENUE:
			subtitle = result.server || '';
			break;
		case PageType.FREE_COMPANY:
			subtitle = ['Freie Gesellschaft', result.server].filter(Boolean).join(' · ');
			break;
		case PageType.COMMUNITY:
			subtitle = 'Community';
			break;
		default:
			subtitle = plainSnippet(result.content);
		}
		return {
			id: `${type}-${result.id ?? result.name ?? ''}`,
			label: result.name || 'Ohne Titel',
			subtitle,
			icon: def.icon,
			avatar: result.image?.thumbUrl || undefined,
			to: searchResultLink(type, result),
		};
	}

	onKeydown(event: KeyboardEvent) {
		const count = this.flatItems.length;
		switch (event.key) {
		case 'ArrowDown':
			event.preventDefault();
			if (count) {
				this.activeIndex = (this.activeIndex + 1) % count;
				this.scrollActiveIntoView();
			}
			break;
		case 'ArrowUp':
			event.preventDefault();
			if (count) {
				this.activeIndex = this.activeIndex <= 0 ? count - 1 : this.activeIndex - 1;
				this.scrollActiveIntoView();
			}
			break;
		case 'Enter': {
			if (event.isComposing) {
				return;
			}
			event.preventDefault();
			const item = this.flatItems[this.activeIndex];
			if (item) {
				void this.activate(item);
			} else if (this.trimmedQuery) {
				void this.openItem({
					id: 'action-search',
					label: this.trimmedQuery,
					to: `/search?q=${encodeURIComponent(this.trimmedQuery)}`,
				});
			}
			break;
		}
		case 'Tab':
			// Focus trap: the input is the only tab stop; options use aria-activedescendant.
			event.preventDefault();
			(this.$refs.input as HTMLInputElement | undefined)?.focus();
			break;
		default:
			break;
		}
	}

	scrollActiveIntoView() {
		void this.$nextTick(() => {
			const el = this.activeId ? document.getElementById(this.activeId) : null;
			el?.scrollIntoView({ block: 'nearest' });
		});
	}

	async activate(item: PaletteItem) {
		await this.openItem(item);
	}

	async openItem(item: PaletteItem) {
		this.rememberItem(item);
		this.close();
		if (item.run) {
			await item.run();
		} else if (item.to && /^https?:\/\//.test(item.to)) {
			window.location.assign(item.to);
		} else if (item.to) {
			await this.$router.push(item.to);
		}
	}

	close() {
		this.$emit('update:modelValue', false);
	}

	async switchCharacter() {
		const SwitchCharacterDialog = (await import('components/character/SwitchCharacterDialog.vue')).default;
		this.$q.dialog({ component: SwitchCharacterDialog }).onOk((character: SessionCharacterDto) => {
			void this.$router.push(character.verified ? '/' : '/verify');
		});
	}

	private clearDebounce() {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
	}

	beforeUnmount() {
		this.clearDebounce();
	}
}
</script>

<style lang="scss">
// Unscoped: the dialog is teleported to <body>. Every rule is prefixed with
// .vision-palette.

.q-dialog__inner--minimized > div.vision-palette {
	width: 640px;
	max-width: calc(100vw - 32px);
	max-height: min(560px, calc(100vh - 96px));
}

.vision-palette-dialog .q-dialog__inner {
	align-items: flex-start;
	padding-top: max(10vh, 48px);
}

.vision-palette {
	display: flex;
	flex-direction: column;
	overflow: hidden;
	font-family: var(--font-ui);
	color: var(--ink-primary);
	background: var(--surface-raised);
	border: 1px solid var(--rule-soft);
	border-radius: 14px;
	box-shadow: 0 24px 64px rgba(20, 12, 4, 0.28), 0 2px 8px rgba(20, 12, 4, 0.12);
}

body.body--dark .vision-palette {
	box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4);
}

.vision-palette__sr {
	position: absolute;
	width: 1px;
	height: 1px;
	margin: -1px;
	padding: 0;
	overflow: hidden;
	clip: rect(0 0 0 0);
	white-space: nowrap;
	border: 0;
}

.vision-palette__head {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 14px 16px;
	border-bottom: 1px solid var(--rule-soft);
}

.vision-palette__search-icon {
	color: var(--ink-muted);
	flex: none;
}

.vision-palette__input {
	flex: 1;
	min-width: 0;
	border: 0;
	outline: 0;
	background: transparent;
	color: var(--ink-primary);
	font: 400 16px/24px var(--font-ui);

	&::placeholder {
		color: var(--ink-muted);
		opacity: 1;
	}
}

.vision-palette__kbd {
	flex: none;
	padding: 1px 6px;
	font: 500 11px/18px var(--font-ui);
	color: var(--ink-muted);
	background: var(--rule-tint);
	border: 1px solid var(--rule-soft);
	border-radius: 5px;
}

.vision-palette__body {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	padding: 6px 8px 8px;
	overscroll-behavior: contain;
}

.vision-palette__group + .vision-palette__group {
	margin-top: 4px;
}

.vision-palette__group-label {
	padding: 10px 10px 4px;
	font: 600 11px/16px var(--font-ui);
	letter-spacing: var(--ls-eyebrow, 0.08em);
	text-transform: uppercase;
	color: var(--ink-muted);
}

.vision-palette__option {
	display: flex;
	align-items: center;
	gap: 12px;
	min-height: 44px;
	padding: 6px 10px;
	border-radius: 8px;
	border-left: 2px solid transparent;
	cursor: pointer;
	transition: background-color var(--motion-fast) var(--ease-elpis);
}

.vision-palette__option--active {
	background: var(--rule-tint);
	border-left-color: var(--rule-strong);
}

.vision-palette__option-media {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	color: var(--ink-muted);
	background: var(--rule-tint);
	overflow: hidden;
}

.vision-palette__avatar {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.vision-palette__option-text {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
}

.vision-palette__option-label,
.vision-palette__option-sub {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.vision-palette__option-label {
	font: 500 14px/20px var(--font-ui);
	color: var(--ink-primary);
}

.vision-palette__option-sub {
	font: 400 12px/16px var(--font-ui);
	color: var(--ink-muted);
}

.vision-palette__option-enter {
	flex: none;
	color: var(--ink-muted);
}

.vision-palette__status {
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0;
	padding: 14px 10px;
	font: 400 13px/20px var(--font-ui);
	color: var(--ink-muted);
}

.vision-palette__spinner {
	color: var(--ink-muted);
}

.vision-palette__foot {
	padding: 10px 16px;
	font: 400 12px/16px var(--font-ui);
	color: var(--ink-muted);
	border-top: 1px solid var(--rule-soft);
	background: var(--rule-tint);
}

@media screen and (max-width: 599px) {
	.vision-palette-dialog .q-dialog__inner {
		padding-top: 16px;
	}

	.vision-palette__foot {
		display: none;
	}
}
</style>
