<template>
	<div class="vision-tabs" :class="{ 'vision-tabs--glass': glass }">
		<div
			ref="list"
			class="vision-tabs__list"
			role="tablist"
			:aria-label="ariaLabel"
			@keydown="onKeydown"
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
			list.scrollLeft = Math.max(0, left - 16);
		}
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
	scrollbar-width: thin;
	scrollbar-color: var(--rule-soft) transparent;
	-webkit-overflow-scrolling: touch;
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

.vision-tabs__tab--active .vision-tabs__count {
	background-color: var(--vision-primary);
	color: var(--vision-on-primary);
}
</style>
