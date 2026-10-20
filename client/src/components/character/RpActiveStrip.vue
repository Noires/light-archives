<template>
	<section v-if="entries.length > 0" class="rp-strip" aria-labelledby="rp-strip-title">
		<header class="rp-strip__head">
			<span class="rp-strip__pulse" aria-hidden="true"></span>
			<h2 id="rp-strip-title" class="rp-strip__title">Gerade im RP</h2>
			<span class="rp-strip__count">{{ entries.length }}</span>
		</header>
		<ul class="rp-strip__list">
			<li v-for="entry in entries" :key="entry.characterId" class="rp-strip__item">
				<router-link class="rp-strip__link" :to="entry.to">
					<span class="rp-strip__avatar">
						<img v-if="entry.avatar" :src="entry.avatar" alt="" loading="lazy" />
						<q-icon v-else name="person" aria-hidden="true" />
						<span class="rp-strip__dot" :class="`rp-strip__dot--${entry.status}`" aria-hidden="true"></span>
					</span>
					<span class="rp-strip__text">
						<span class="rp-strip__name">{{ entry.name }}</span>
						<span class="rp-strip__status">{{ entry.label }}</span>
					</span>
				</router-link>
			</li>
		</ul>
	</section>
</template>

<script lang="ts">
// ER2-407 — characters with an active RP status (ER2-806). The production API
// has no /characters/rp-active yet; any error hides the strip.
import { RpPresenceDto } from '@app/shared/dto/characters/rp-presence.dto';
import { RpStatus } from '@app/shared/enums/rp-status.enum';
import { Options, prop, Vue } from 'vue-class-component';
import { activeRpStatus, RP_STATUS_LABELS } from './rp-status';

interface StripEntry {
	characterId: number;
	name: string;
	avatar: string;
	status: RpStatus;
	label: string;
	to: string;
}

class Props {
	limit = prop<number>({ default: 12 });
}

@Options({
	name: 'RpActiveStrip',
})
export default class RpActiveStrip extends Vue.with(Props) {
	presences: RpPresenceDto[] = [];

	async mounted() {
		try {
			const result = await this.$api.characters.getRpActiveCharacters(this.limit);
			this.presences = Array.isArray(result) ? result : [];
		} catch (e) {
			this.presences = [];
		}
	}

	get entries(): StripEntry[] {
		const result: StripEntry[] = [];
		for (const presence of this.presences) {
			const status = activeRpStatus(presence);
			if (!status) {
				continue;
			}
			result.push({
				characterId: presence.characterId,
				name: presence.name,
				avatar: presence.avatar,
				status,
				label: [ RP_STATUS_LABELS[status], presence.rpLocation || '' ].filter((part) => !!part).join(' · '),
				to: `/${presence.server}/${presence.name.replace(/ /g, '_')}`,
			});
		}
		return result;
	}
}
</script>

<style lang="scss" scoped>
.rp-strip {
	margin-bottom: 24px;
	padding: 14px 16px 16px;
	border: 1px solid var(--rule-soft);
	border-radius: 12px;
	background-color: var(--vision-card);
}

.rp-strip__head {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 12px;
}

.rp-strip__pulse {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background-color: var(--vision-live);
	box-shadow: 0 0 0 4px var(--vision-live-bg);
}

.rp-strip__title {
	text-align: left;
	margin: 0;
	font-family: var(--font-display);
	font-weight: 500;
	font-size: 18px;
	line-height: 1.3;
	letter-spacing: 0;
	color: var(--ink-primary);
}

.rp-strip__count {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 22px;
	height: 20px;
	padding: 0 7px;
	border-radius: 999px;
	background-color: var(--vision-live-bg);
	color: var(--vision-live-text);
	font-family: var(--font-ui);
	font-size: 12px;
	font-weight: 600;
}

.rp-strip__list {
	display: flex;
	gap: 8px;
	margin: 0;
	padding: 0 0 4px;
	list-style: none;
	overflow-x: auto;
	scrollbar-width: thin;
	scrollbar-color: var(--rule-soft) transparent;
}

.rp-strip__item {
	flex: 0 0 auto;
}

.rp-strip__link {
	display: flex;
	align-items: center;
	gap: 10px;
	max-width: 240px;
	padding: 6px 14px 6px 6px;
	border: 1px solid var(--rule-soft);
	border-radius: 999px;
	color: var(--ink-primary);
	text-decoration: none;
	transition:
		background-color var(--motion-fast) var(--ease-elpis),
		border-color var(--motion-fast) var(--ease-elpis);

	&:hover {
		background-color: var(--rule-tint);
		border-color: var(--rule-strong);
	}

	&:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 2px var(--glow-aether),
			0 0 0 3px var(--vision-focus-edge);
	}
}

.rp-strip__avatar {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background-color: var(--surface-raised);
	color: var(--ink-muted);

	img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
	}
}

.rp-strip__dot {
	position: absolute;
	right: -1px;
	bottom: -1px;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	border: 2px solid var(--vision-card);
}

.rp-strip__dot--ic {
	background-color: var(--vision-live);
}

.rp-strip__dot--lfrp {
	background-color: var(--vision-primary);
}

.rp-strip__dot--ooc {
	background-color: var(--ink-muted);
}

.rp-strip__text {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.rp-strip__name,
.rp-strip__status {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.rp-strip__name {
	font-family: var(--font-ui);
	font-weight: 600;
	font-size: 14px;
	line-height: 20px;
}

.rp-strip__status {
	font-family: var(--font-ui);
	font-size: 12px;
	line-height: 16px;
	color: var(--ink-muted);
}
</style>
