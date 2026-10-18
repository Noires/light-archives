<template>
	<article class="vision-member" :class="{ 'vision-member--link': !!to }">
		<span class="vision-member__avatar">
			<aetheryte-badge size="md" shape="round" :src="avatarSrc" :alt="avatarAlt || name" />
			<span
				v-if="rpStatus"
				class="vision-member__dot"
				:class="`vision-member__dot--${rpStatus}`"
				aria-hidden="true"
			></span>
		</span>
		<div class="vision-member__body">
			<h3 class="vision-member__name">
				<router-link v-if="to" class="vision-member__link" :to="to">{{ name }}</router-link>
				<template v-else>{{ name }}</template>
			</h3>
			<p v-if="meta" class="vision-member__meta">{{ meta }}</p>
			<p v-if="subtitle" class="vision-member__subtitle">{{ subtitle }}</p>
			<p v-if="rankLabel || rpStatus" class="vision-member__tags">
				<span v-if="rankLabel" class="vision-member__rank" :class="role ? `vision-member__rank--${role}` : ''">{{ rankLabel }}</span>
				<span v-if="rpStatus" class="vision-member__rp">{{ rpLabel }}</span>
			</p>
		</div>
	</article>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import type { RouteLocationRaw } from 'vue-router';
import AetheryteBadge from '../aetherium/AetheryteBadge.vue';

// ER2-409 — member tile for free company and community member grids:
// round AetheryteBadge with an RP status dot, name (stretched link), meta,
// profession and an optional rank pill.
// ER2 round 2: `role` (community role) renders as the rank pill with a German
// label; an explicit `rank` text wins.

type MemberRpStatus = 'ic' | 'lfrp' | 'ooc';
type MemberRole = 'owner' | 'manager' | 'editor' | 'member' | 'applicant';

const ROLE_LABELS: Record<MemberRole, string> = {
	owner: 'Gründer:in',
	manager: 'Leitung',
	editor: 'Redaktion',
	member: 'Mitglied',
	applicant: 'Bewerbung offen',
};

const RP_LABELS: Record<MemberRpStatus, string> = {
	ic: 'Im RP',
	lfrp: 'Sucht RP',
	ooc: 'OOC',
};

class Props {
	name = prop<string>({ required: true });
	to = prop<RouteLocationRaw | null>({ default: null });
	avatarSrc = prop<string>({ default: '' });
	avatarAlt = prop<string>({ default: '' });
	meta = prop<string>({ default: '' });
	subtitle = prop<string>({ default: '' });
	rank = prop<string>({ default: '' });
	role = prop<MemberRole | null>({ default: null });
	rpStatus = prop<MemberRpStatus | null>({ default: null });
}

@Options({
	name: 'MemberCard',
	components: {
		AetheryteBadge,
	},
})
export default class MemberCard extends Vue.with(Props) {
	get rankLabel(): string {
		return this.rank || (this.role ? ROLE_LABELS[this.role] || '' : '');
	}

	get rpLabel(): string {
		return this.rpStatus ? RP_LABELS[this.rpStatus] || '' : '';
	}
}
</script>

<style lang="scss" scoped>
.vision-member {
	position: relative;
	display: flex;
	align-items: center;
	gap: 14px;
	min-width: 0;
	padding: 14px 16px;
	border: 1px solid var(--rule-soft);
	border-radius: 12px;
	background-color: var(--vision-card);
	color: var(--ink-primary);
	transition:
		transform var(--motion-fast) var(--ease-elpis),
		box-shadow var(--motion-fast) var(--ease-elpis),
		border-color var(--motion-fast) var(--ease-elpis);
}

.vision-member--link:hover,
.vision-member--link:focus-within {
	transform: translateY(-2px);
	border-color: var(--rule-strong);
	box-shadow: 0 2px 4px var(--rule-tint), 0 10px 24px var(--rule-soft);
}

.vision-member__avatar {
	position: relative;
	flex: 0 0 auto;
	display: inline-flex;
}

.vision-member__dot {
	position: absolute;
	right: 0;
	bottom: 0;
	width: 14px;
	height: 14px;
	border-radius: 50%;
	border: 2px solid var(--vision-card);
}

.vision-member__dot--ic {
	background-color: var(--vision-live);
}

.vision-member__dot--lfrp {
	background-color: var(--vision-primary);
}

.vision-member__dot--ooc {
	background-color: var(--ink-muted);
}

.vision-member__body {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.vision-member__name {
	margin: 0;
	font-family: var(--font-display);
	font-weight: 500;
	font-size: 16px;
	line-height: 1.3;
	letter-spacing: 0;
	color: var(--ink-primary);
	overflow-wrap: anywhere;
}

.vision-member__link {
	color: inherit;
	text-decoration: none;

	&::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
		border-radius: 12px;
	}

	&:hover {
		text-decoration: underline;
	}

	&:focus-visible {
		outline: none;

		&::after {
			box-shadow:
				inset 0 0 0 2px var(--glow-aether),
				inset 0 0 0 3px var(--vision-focus-edge);
		}
	}
}

.vision-member__meta,
.vision-member__subtitle,
.vision-member__tags {
	margin: 0;
}

.vision-member__meta {
	font-family: var(--font-ui);
	font-size: 13px;
	line-height: 18px;
	color: var(--ink-muted);
}

.vision-member__subtitle {
	font-family: var(--font-lore);
	font-style: italic;
	font-size: 14px;
	line-height: 1.4;
	color: var(--ink-muted);
	overflow-wrap: anywhere;
}

.vision-member__tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-top: 4px;
}

.vision-member__rank,
.vision-member__rp {
	display: inline-flex;
	align-items: center;
	height: 20px;
	padding: 0 8px;
	border-radius: 999px;
	font-family: var(--font-ui);
	font-size: 12px;
	font-weight: 600;
	line-height: 1;
}

.vision-member__rank {
	background-color: var(--rule-tint);
	color: var(--ink-primary);
	border: 1px solid var(--rule-soft);
}

.vision-member__rank--owner {
	border-color: var(--rule-strong);
	background-color: var(--vision-primary);
	color: var(--vision-on-primary);
}

.vision-member__rank--manager {
	border-color: var(--rule-strong);
}

.vision-member__rank--applicant {
	border-style: dashed;
	background-color: transparent;
}

.vision-member__rp {
	background-color: var(--vision-live-bg);
	color: var(--vision-live-text);
}
</style>
