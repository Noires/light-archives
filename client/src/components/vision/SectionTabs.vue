<template>
	<div
		class="vision-tabs"
		:class="{
			'vision-tabs--glass': glass,
			'vision-tabs--more-left': moreLeft,
			'vision-tabs--more-right': moreRight,
			'vision-tabs--compact': density >= 1,
			'vision-tabs--no-icons': density >= 2,
		}"
	>
		<!-- Overflow hints for pointer users; keyboard users move with the arrow keys. -->
		<button
			v-if="moreLeft"
			type="button"
			class="vision-tabs__scroll vision-tabs__scroll--left"
			tabindex="-1"
			aria-hidden="true"
			@click="scrollByPage(-1)"
		><q-icon name="chevron_left" /></button>
		<button
			v-if="moreRight"
			type="button"
			class="vision-tabs__scroll vision-tabs__scroll--right"
			tabindex="-1"
			aria-hidden="true"
			@click="scrollByPage(1)"
		><q-icon name="chevron_right" /></button>
		<div
			ref="list"
			class="vision-tabs__list"
			role="tablist"
			:aria-label="ariaLabel"
			@keydown="onKeydown"
			@scroll.passive="updateOverflow"
		>
			<template v-for="tab in visibleTabs" :key="tab.key">
				<router-link
					v-if="tab.to"
					class="vision-tabs__tab"
					:class="tabClasses(tab)"
					:to="tab.to"
					role="tab"
					:aria-selected="tab.key === activeKey ? 'true' : 'false'"
					:tabindex="tab.key === activeKey ? 0 : -1"
					:data-tab-key="tab.key"
					@click="select(tab)"
				>
					<q-icon v-if="tab.icon" class="vision-tabs__icon" :name="tab.icon" aria-hidden="true" />
					<span class="vision-tabs__label">{{ tab.label }}</span>
					<span v-if="hasCount(tab)" class="vision-tabs__count">{{ tab.count }}</span>
				</router-link>
				<button
					v-else
					type="button"
					class="vision-tabs__tab"
					:class="tabClasses(tab)"
					role="tab"
					:aria-selected="tab.key === activeKey ? 'true' : 'false'"
					:tabindex="tab.key === activeKey ? 0 : -1"
					:data-tab-key="tab.key"
					@click="select(tab)"
				>
					<q-icon v-if="tab.icon" class="vision-tabs__icon" :name="tab.icon" aria-hidden="true" />
					<span class="vision-tabs__label">{{ tab.label }}</span>
					<span v-if="hasCount(tab)" class="vision-tabs__count">{{ tab.count }}</span>
				</button>
			</template>
		</div>
	</div>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import type { LocationQueryRaw } from 'vue-router';
import type { SectionTab, SectionTabsSync } from './types';

// ER2-006 — labelled section tabs (icon + count pill).
//
// Sync modes:
//  - 'none'  (default) — plain v-model.
//  - 'query' — v-model mirrors `?<queryKey>=` via router.replace, so the tab
//              survives reload and back/forward.
//  - 'route' — tabs with `to` render as router-links; the active tab follows
//              the current route (child routes). Any tab with `to` behaves
//              like this regardless of `sync`.
//
// Keyboard: Left/Right (and Up/Down), Home, End move focus. Button tabs are
// activated on focus; link tabs are activated with Enter so arrowing through
// them does not navigate on every keystroke.

class Props {
	tabs = prop<SectionTab[]>({ required: true });
	modelValue = prop<string>({ default: '' });
	sync = prop<SectionTabsSync>({ default: 'none' });
	queryKey = prop<string>({ default: 'tab' });
	glass = prop<boolean>({ type: Boolean, default: false });
	ariaLabel = prop<string>({ default: 'Abschnitte' });
}

@Options({
	name: 'SectionTabs',
	emits: [ 'update:modelValue' ],
	watch: {
		// Tabs or counts that arrive later change the natural width: re-fit.
		tabs: {
			handler() {
				void (this as SectionTabs).$nextTick(() => (this as SectionTabs).fit());
			},
			deep: true,
		},
		// Parent-driven changes in query mode are written back to the URL.
		modelValue(key: string) {
			(this as SectionTabs).onModelValueChange(key);
		},
		activeKey: {
			handler(key: string) {
				(this as SectionTabs).onActiveKeyChange(key);
			},
			immediate: true,
		},
	},
})
export default class SectionTabs extends Vue.with(Props) {
	moreLeft = false;
	moreRight = false;
	/** 0 = normal, 1 = compact spacing, 2 = compact without icons. */
	density = 0;
	private resizeObserver: ResizeObserver | null = null;
	private lastWidth = 0;
	private fitting = false;
	private fitPending = false;
	private boundFit: (() => void) | null = null;

	mounted() {
		const list = this.$refs.list as HTMLElement | undefined;
		if (list && typeof ResizeObserver !== 'undefined') {
			this.resizeObserver = new ResizeObserver(() => {
				if (list.clientWidth !== this.lastWidth) {
					void this.fit();
				}
			});
			this.resizeObserver.observe(list);
		}
		void this.fit();
		// Labels get wider once the web fonts arrive; the bar width does not
		// change then, so the ResizeObserver alone would miss it.
		if (typeof document !== 'undefined' && document.fonts) {
			void document.fonts.ready.then(() => this.fit());
			// Bound here, not as an arrow class field: vue-class-component
			// collects fields from a throwaway instance, so an arrow's `this`
			// would have no $refs ("reading 'list' of undefined").
			this.boundFit = () => void this.fit();
			document.fonts.addEventListener('loadingdone', this.boundFit);
		}
	}

	updated() {
		this.updateOverflow();
	}

	/**
	 * Picks the roomiest density at which every tab fits; only when even the
	 * densest one overflows does the bar scroll (with fades and chevrons).
	 */
	async fit() {
		const list = this.$refs.list as HTMLElement | undefined;
		if (!list) {
			return;
		}
		if (this.fitting) {
			// A change arrived mid-measurement: run once more afterwards.
			this.fitPending = true;
			return;
		}
		this.fitting = true;
		try {
			this.lastWidth = list.clientWidth;
			for (let level = 0; level <= 2; level++) {
				this.density = level;
				// eslint-disable-next-line no-await-in-loop -- each level must render before it can be measured
				await this.$nextTick();
				if (list.scrollWidth <= list.clientWidth + 1) {
					break;
				}
			}
		} finally {
			this.fitting = false;
		}
		if (this.fitPending) {
			this.fitPending = false;
			void this.fit();
			return;
		}
		this.updateOverflow();
		this.scrollIntoView(this.activeKey);
	}

	beforeUnmount() {
		if (this.boundFit) {
			document.fonts?.removeEventListener('loadingdone', this.boundFit);
			this.boundFit = null;
		}
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
	}

	/** Which edges hide tabs; drives the edge fades and chevrons. */
	updateOverflow() {
		const list = this.$refs.list as HTMLElement | undefined;
		if (!list) {
			return;
		}
		const max = list.scrollWidth - list.clientWidth;
		const left = max > 1 && list.scrollLeft > 1;
		const right = max > 1 && list.scrollLeft < max - 1;
		if (left !== this.moreLeft) {
			this.moreLeft = left;
		}
		if (right !== this.moreRight) {
			this.moreRight = right;
		}
	}

	scrollByPage(direction: 1 | -1) {
		const list = this.$refs.list as HTMLElement | undefined;
		if (!list) {
			return;
		}
		const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		list.scrollBy({ left: direction * list.clientWidth * 0.6, behavior: smooth ? 'smooth' : 'auto' });
	}

	get visibleTabs(): SectionTab[] {
		return this.tabs.filter((tab) => !tab.hidden);
	}

	get routeKey(): string | null {
		const routed = this.visibleTabs.filter((tab) => tab.to);
		if (routed.length === 0) {
			return null;
		}
		const current = this.$route.path;
		let best: SectionTab | null = null;
		let bestLength = -1;
		for (const tab of routed) {
			let path: string;
			try {
				path = this.$router.resolve(tab.to as never).path;
			} catch (e) {
				continue;
			}
			const matches = current === path || current.startsWith(path.endsWith('/') ? path : `${path}/`);
			if (matches && path.length > bestLength) {
				best = tab;
				bestLength = path.length;
			}
		}
		return best ? best.key : null;
	}

	get queryValue(): string | null {
		if (this.sync !== 'query') {
			return null;
		}
		const raw = this.$route.query[this.queryKey];
		const value = Array.isArray(raw) ? raw[0] : raw;
		if (typeof value === 'string' && this.visibleTabs.some((tab) => tab.key === value)) {
			return value;
		}
		return null;
	}

	get activeKey(): string {
		const key = this.routeKey || this.queryValue || this.modelValue;
		if (this.visibleTabs.some((tab) => tab.key === key)) {
			return key;
		}
		return this.visibleTabs.length > 0 ? this.visibleTabs[0].key : '';
	}

	onActiveKeyChange(key: string) {
		if (key && key !== this.modelValue) {
			this.$emit('update:modelValue', key);
		}
		void this.$nextTick(() => this.scrollIntoView(key));
	}

	onModelValueChange(key: string) {
		if (this.sync !== 'query' || key === this.queryValue) {
			return;
		}
		const tab = this.visibleTabs.find((t) => t.key === key);
		if (tab && !tab.to) {
			this.writeQuery(key);
		}
	}

	hasCount(tab: SectionTab): boolean {
		return tab.count !== undefined && tab.count !== null && tab.count !== '';
	}

	tabClasses(tab: SectionTab): Record<string, boolean> {
		return {
			'vision-tabs__tab--active': tab.key === this.activeKey,
			'vision-tabs__tab--dimmed': !!tab.dimmed,
		};
	}

	select(tab: SectionTab) {
		if (tab.key !== this.modelValue) {
			this.$emit('update:modelValue', tab.key);
		}
		if (this.sync === 'query' && !tab.to && this.queryValue !== tab.key) {
			this.writeQuery(tab.key);
		}
	}

	private writeQuery(key: string) {
		const query: LocationQueryRaw = { ...this.$route.query, [this.queryKey]: key };
		void this.$router.replace({ query });
	}

	onKeydown(event: KeyboardEvent) {
		const keys = [ 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End' ];
		if (!keys.includes(event.key)) {
			return;
		}
		const elements = this.tabElements();
		if (elements.length === 0) {
			return;
		}
		event.preventDefault();
		const current = elements.indexOf(document.activeElement as HTMLElement);
		let next: number;
		switch (event.key) {
			case 'Home': next = 0; break;
			case 'End': next = elements.length - 1; break;
			case 'ArrowLeft':
			case 'ArrowUp':
				next = current <= 0 ? elements.length - 1 : current - 1;
				break;
			default:
				next = current < 0 || current >= elements.length - 1 ? 0 : current + 1;
		}
		const target = elements[next];
		target.focus();
		const tab = this.visibleTabs.find((t) => t.key === target.dataset.tabKey);
		if (tab && !tab.to) {
			this.select(tab);
		}
	}

	private tabElements(): HTMLElement[] {
		const list = this.$refs.list as HTMLElement | undefined;
		if (!list) {
			return [];
		}
		return Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]'));
	}

	private scrollIntoView(key: string) {
		const target = this.tabElements().find((el) => el.dataset.tabKey === key);
		const list = this.$refs.list as HTMLElement | undefined;
		if (!target || !list || list.scrollWidth <= list.clientWidth) {
			return;
		}
		const left = target.offsetLeft - list.offsetLeft;
		const right = left + target.offsetWidth;
		if (left < list.scrollLeft || right > list.scrollLeft + list.clientWidth) {
			list.scrollLeft = Math.max(0, left - 40);
		}
		this.updateOverflow();
	}
}
</script>

<style lang="scss" scoped>
.vision-tabs {
	position: relative;
	min-width: 0;
}

.vision-tabs--glass {
	width: 100%;
	background-color: var(--surface-glass);
	border-bottom: 1px solid var(--rule-soft);
	backdrop-filter: blur(14px);
	-webkit-backdrop-filter: blur(14px);
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
	.vision-tabs--glass {
		background-color: var(--surface-raised);
	}
}

.vision-tabs__list {
	display: flex;
	align-items: stretch;
	gap: 4px;
	overflow-x: auto;
	overflow-y: hidden;
	// No visible scrollbar: overflow is shown with edge fades and chevrons.
	scrollbar-width: none;
	-webkit-overflow-scrolling: touch;

	&::-webkit-scrollbar {
		display: none;
	}
}

.vision-tabs--more-right .vision-tabs__list {
	mask-image: linear-gradient(to right, #000 calc(100% - 56px), transparent);
}

.vision-tabs--more-left .vision-tabs__list {
	mask-image: linear-gradient(to left, #000 calc(100% - 56px), transparent);
}

.vision-tabs--more-left.vision-tabs--more-right .vision-tabs__list {
	mask-image: linear-gradient(to right, transparent, #000 56px, #000 calc(100% - 56px), transparent);
}

.vision-tabs__scroll {
	position: absolute;
	top: 50%;
	z-index: 2;
	display: none;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	margin-top: -14px;
	padding: 0;
	border: 1px solid var(--rule-soft);
	border-radius: 999px;
	background-color: var(--vision-card);
	color: var(--ink-primary);
	font-size: 18px;
	cursor: pointer;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);

	&:hover {
		background-color: var(--rule-tint);
	}

	@media (hover: hover) and (pointer: fine) {
		display: inline-flex;
	}
}

.vision-tabs__scroll--left {
	left: 2px;
}

.vision-tabs__scroll--right {
	right: 2px;
}

.vision-tabs--glass .vision-tabs__list {
	padding: 0 16px;
}

.vision-tabs__tab {
	position: relative;
	display: inline-flex;
	align-items: center;
	flex: 0 0 auto;
	gap: 8px;
	min-height: 44px;
	padding: 10px 14px;
	margin: 0;
	border: 0;
	border-radius: 8px 8px 0 0;
	background: transparent;
	color: var(--ink-muted);
	font-family: var(--font-ui);
	font-weight: 600;
	font-size: 14px;
	line-height: 20px;
	letter-spacing: 0;
	text-decoration: none;
	white-space: nowrap;
	cursor: pointer;
	transition:
		background-color var(--motion-fast) var(--ease-elpis),
		color var(--motion-fast) var(--ease-elpis);

	&::after {
		content: '';
		position: absolute;
		left: 8px;
		right: 8px;
		bottom: 0;
		height: 3px;
		border-radius: 3px 3px 0 0;
		background-color: transparent;
		transition: background-color var(--motion-fast) var(--ease-elpis);
	}

	&:hover {
		background-color: var(--rule-tint);
		color: var(--ink-primary);
	}

	&:focus-visible {
		outline: none;
		box-shadow:
			inset 0 0 0 2px var(--glow-aether),
			inset 0 0 0 3px var(--vision-focus-edge);
	}
}

.vision-tabs__tab--active {
	color: var(--ink-primary);

	&::after {
		background-color: var(--rule-strong);
	}
}

// Dimmed = section exists but is empty. The label keeps full AA contrast;
// only the icon and count recede.
.vision-tabs__tab--dimmed:not(.vision-tabs__tab--active) {
	font-weight: 500;

	.vision-tabs__icon,
	.vision-tabs__count {
		opacity: 0.6;
	}
}

.vision-tabs__icon {
	font-size: 18px;
}

.vision-tabs__count {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 22px;
	height: 20px;
	padding: 0 7px;
	border-radius: 999px;
	background-color: var(--rule-tint);
	color: var(--ink-primary);
	font-size: 12px;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}

// Density steps chosen by fit(): roomy first, then tighter, then no icons.
.vision-tabs--compact {
	.vision-tabs__list {
		gap: 2px;
	}

	.vision-tabs__tab {
		gap: 6px;
		padding: 10px 10px;
		font-size: 13px;
	}
}

.vision-tabs--no-icons .vision-tabs__icon {
	display: none;
}

.vision-tabs__tab--active .vision-tabs__count {
	background-color: var(--vision-primary);
	color: var(--vision-on-primary);
}
</style>
