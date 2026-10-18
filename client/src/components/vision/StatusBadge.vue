<template>
	<span class="vision-badge" :class="`vision-badge--${tone}`">
		<span v-if="hasDot" class="vision-badge__dot" aria-hidden="true"></span>
		<q-icon v-if="resolvedIcon" class="vision-badge__icon" :name="resolvedIcon" aria-hidden="true" />
		<span class="vision-badge__label">{{ resolvedLabel }}</span>
	</span>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import type { StatusBadgeType } from './types';

// ER2-005 — status pill used on cards, lists and detail heads.
// Colour comes from the type's tone; see components/vision/README.md.

type Tone = 'live' | 'cw' | 'accent' | 'outline';

const TONES: Record<StatusBadgeType, Tone> = {
	live: 'live',
	open: 'live',
	'rp-ic': 'live',
	'rp-lfrp': 'accent',
	cw: 'cw',
	soon: 'accent',
	countdown: 'accent',
	server: 'outline',
	recurring: 'outline',
	'rp-ooc': 'outline',
};

const DEFAULT_LABELS: Record<StatusBadgeType, string> = {
	live: 'Live',
	open: 'Geöffnet',
	soon: 'Bald',
	recurring: 'Wiederkehrend',
	countdown: 'Countdown',
	server: 'Server',
	cw: 'Inhaltswarnung',
	'rp-ic': 'Im RP',
	'rp-lfrp': 'Sucht RP',
	'rp-ooc': 'OOC',
};

const DEFAULT_ICONS: Partial<Record<StatusBadgeType, string>> = {
	cw: 'warning',
	recurring: 'repeat',
	countdown: 'schedule',
};

const DOT_TYPES: StatusBadgeType[] = [ 'live', 'open', 'rp-ic', 'rp-lfrp', 'rp-ooc' ];

class Props {
	type = prop<StatusBadgeType>({ required: true });
	label = prop<string>({ default: '' });
	icon = prop<string>({ default: '' });
}

@Options({
	name: 'StatusBadge',
})
export default class StatusBadge extends Vue.with(Props) {
	get tone(): Tone {
		return TONES[this.type] || 'outline';
	}

	get hasDot(): boolean {
		return DOT_TYPES.includes(this.type);
	}

	get resolvedIcon(): string {
		return this.icon || DEFAULT_ICONS[this.type] || '';
	}

	get resolvedLabel(): string {
		return this.label || DEFAULT_LABELS[this.type] || '';
	}
}
</script>

<style lang="scss" scoped>
.vision-badge {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-height: 22px;
	padding: 2px 10px;
	border-radius: 999px;
	border: 1px solid transparent;
	font-family: var(--font-ui);
	font-weight: 600;
	font-size: 12px;
	line-height: 16px;
	letter-spacing: 0;
	white-space: nowrap;
	vertical-align: middle;
}

.vision-badge__dot {
	flex: 0 0 auto;
	width: 7px;
	height: 7px;
	border-radius: 50%;
	background-color: currentColor;
}

.vision-badge__icon {
	font-size: 14px;
}

.vision-badge--live {
	background-color: var(--vision-live-bg);
	color: var(--vision-live-text);

	.vision-badge__dot {
		background-color: var(--vision-live);
	}
}

.vision-badge--cw {
	background-color: var(--vision-cw-bg);
	border-color: var(--vision-cw-border);
	color: var(--vision-cw-text);
}

.vision-badge--accent {
	background-color: var(--rule-tint);
	color: var(--ink-link);
}

.vision-badge--outline {
	background-color: transparent;
	border-color: var(--rule-soft);
	color: var(--ink-muted);
}
</style>
