<template>
	<teleport to="body">
		<div
			v-if="state.visible && card"
			:id="HOVER_CARD_ID"
			ref="card"
			class="vision-hovercard"
			:class="`vision-hovercard--${card.kind}`"
			role="dialog"
			:aria-label="ariaLabel"
			:style="positionStyle"
			@mouseenter="keepOpen"
			@mouseleave="scheduleHoverCardHide()"
		>
			<template v-if="card.kind === 'character'">
				<div
					class="vision-hovercard__banner"
					:style="card.bannerUrl ? { backgroundImage: `url('${card.bannerUrl}')` } : undefined"
					aria-hidden="true"
				></div>
				<div class="vision-hovercard__body vision-hovercard__body--character">
					<span class="vision-hovercard__avatar" aria-hidden="true">
						<img v-if="card.avatar" :src="card.avatar" alt="" />
						<q-icon v-else name="person" size="28px" />
					</span>
					<p v-if="card.title" class="vision-hovercard__lore">{{ card.title }}</p>
					<p class="vision-hovercard__name">{{ card.name }}</p>
					<p v-if="card.meta" class="vision-hovercard__meta">{{ card.meta }}</p>
					<div v-if="card.status" class="vision-hovercard__badges">
						<status-badge :type="card.status" />
					</div>
					<p v-if="card.freeCompany" class="vision-hovercard__line">
						<q-icon name="shield" size="16px" aria-hidden="true" />
						<span>{{ card.freeCompany }}</span>
					</p>
					<div class="vision-hovercard__actions">
						<router-link class="vision-hovercard__ghost" :to="card.link" tabindex="-1" @click="hideHoverCard">
							Profil
						</router-link>
					</div>
				</div>
			</template>

			<template v-else-if="card.kind === 'venue'">
				<div
					class="vision-hovercard__image"
					:style="card.imageUrl ? { backgroundImage: `url('${card.imageUrl}')` } : undefined"
					aria-hidden="true"
				></div>
				<div class="vision-hovercard__body">
					<div class="vision-hovercard__title-row">
						<p class="vision-hovercard__name">{{ card.name }}</p>
						<status-badge v-if="card.open" type="open" />
					</div>
					<p v-if="card.address" class="vision-hovercard__line">
						<q-icon name="place" size="16px" aria-hidden="true" />
						<span>{{ card.address }}</span>
					</p>
					<p v-if="card.server" class="vision-hovercard__meta">{{ card.server }}</p>
				</div>
			</template>

			<template v-else-if="card.kind === 'event'">
				<div class="vision-hovercard__body vision-hovercard__body--event">
					<div class="vision-hovercard__date" aria-hidden="true">
						<span class="vision-hovercard__date-day">{{ card.day }}</span>
						<span class="vision-hovercard__date-month">{{ card.month }}</span>
					</div>
					<div class="vision-hovercard__event-text">
						<p class="vision-hovercard__name">{{ card.title }}</p>
						<p class="vision-hovercard__line">
							<q-icon name="schedule" size="16px" aria-hidden="true" />
							<span>{{ card.when }}</span>
						</p>
						<p v-if="card.location" class="vision-hovercard__line">
							<q-icon name="place" size="16px" aria-hidden="true" />
							<span>{{ card.location }}</span>
						</p>
					</div>
				</div>
			</template>
		</div>
	</teleport>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import StatusBadge from './StatusBadge.vue';
import {
	HOVER_CARD_GAP,
	HOVER_CARD_ID,
	hideHoverCard,
	hoverCardState,
	keepHoverCardOpen,
	scheduleHoverCardHide,
} from './hover-card';
import type { HoverCardData } from './hover-card';

// ER2-208 — hover-card host. Mount once (layouts/MainLayout.vue does); opt a
// container in with `bindHoverCards(el)` from ./hover-card. Variants:
// character, venue, event. See README.md.

@Options({
	name: 'HoverCard',
	components: { StatusBadge },
	watch: {
		'state.visible'(visible: boolean) {
			if (visible) {
				void (this as HoverCard).$nextTick(() => (this as HoverCard).flipIfNeeded());
			}
		},
		'$route.fullPath'() {
			hideHoverCard();
		},
	},
})
export default class HoverCard extends Vue {
	readonly HOVER_CARD_ID = HOVER_CARD_ID;
	readonly state = hoverCardState;
	readonly scheduleHoverCardHide = scheduleHoverCardHide;
	readonly hideHoverCard = hideHoverCard;

	private scrollHandler: (() => void) | null = null;

	get card(): HoverCardData | null {
		return this.state.data;
	}

	get ariaLabel(): string {
		const card = this.card;
		if (!card) {
			return '';
		}
		return card.kind === 'event' ? `Event: ${card.title}` : card.kind === 'venue' ? `Treffpunkt: ${card.name}` : `Charakter: ${card.name}`;
	}

	get positionStyle(): Record<string, string> {
		return { top: `${this.state.top}px`, left: `${this.state.left}px` };
	}

	keepOpen() {
		keepHoverCardOpen();
	}

	flipIfNeeded() {
		const el = this.$refs.card as HTMLElement | undefined;
		const anchor = this.state.anchor;
		if (!el || !anchor) {
			return;
		}
		const rect = anchor.getBoundingClientRect();
		const height = el.offsetHeight;
		if (rect.bottom + HOVER_CARD_GAP + height > window.innerHeight && rect.top - HOVER_CARD_GAP - height > 0) {
			this.state.top = rect.top - HOVER_CARD_GAP - height;
		}
	}

	mounted() {
		this.scrollHandler = () => {
			if (hoverCardState.visible) {
				hideHoverCard();
			}
		};
		window.addEventListener('scroll', this.scrollHandler, { passive: true, capture: true });
		window.addEventListener('resize', this.scrollHandler, { passive: true });
	}

	beforeUnmount() {
		if (this.scrollHandler) {
			window.removeEventListener('scroll', this.scrollHandler, { capture: true });
			window.removeEventListener('resize', this.scrollHandler);
		}
		hideHoverCard();
	}
}
</script>

<style lang="scss">
// Unscoped: teleported to <body>. Every rule is prefixed with .vision-hovercard.

.vision-hovercard {
	position: fixed;
	z-index: 5000;
	width: 320px;
	max-width: calc(100vw - 16px);
	overflow: hidden;
	font-family: var(--font-ui);
	color: var(--ink-primary);
	background: var(--vision-card);
	border: 1px solid var(--rule-soft);
	border-radius: 12px;
	box-shadow: 0 16px 40px rgba(43, 36, 24, 0.22);
	animation: vision-hovercard-in var(--motion-fast) var(--ease-elpis) both;

	p {
		margin: 0;
	}
}

body.body--dark .vision-hovercard {
	box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
}

@keyframes vision-hovercard-in {
	from {
		opacity: 0;
		transform: translateY(4px);
	}
	to {
		opacity: 1;
		transform: none;
	}
}

.vision-hovercard__banner,
.vision-hovercard__image {
	background-color: var(--rule-tint);
	background-image: linear-gradient(135deg, var(--rule-tint), var(--rule-soft));
	background-size: cover;
	background-position: center;
}

.vision-hovercard__banner {
	height: 72px;
}

.vision-hovercard__image {
	height: 120px;
}

.vision-hovercard__body {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 12px 16px 14px;
}

.vision-hovercard__body--character {
	position: relative;
	padding-top: 36px;
}

.vision-hovercard__avatar {
	position: absolute;
	top: -28px;
	left: 16px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 56px;
	height: 56px;
	overflow: hidden;
	color: var(--ink-muted);
	background: var(--surface-raised);
	border: 3px solid var(--vision-card);
	border-radius: 50%;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.vision-hovercard__lore {
	font: italic 400 14px/20px var(--font-lore);
	color: var(--ink-muted);
}

.vision-hovercard__name {
	font: 600 16px/22px var(--font-ui);
	color: var(--ink-primary);
	overflow-wrap: anywhere;
}

.vision-hovercard__meta {
	font: 400 13px/18px var(--font-ui);
	color: var(--ink-muted);
}

.vision-hovercard__line {
	display: flex;
	align-items: flex-start;
	gap: 6px;
	font: 400 13px/18px var(--font-ui);
	color: var(--ink-primary);

	.q-icon {
		flex: none;
		margin-top: 1px;
		color: var(--ink-muted);
	}
}

.vision-hovercard__badges {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin: 2px 0;
}

.vision-hovercard__title-row {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 8px;
}

.vision-hovercard__actions {
	display: flex;
	justify-content: flex-end;
	margin-top: 6px;
}

.vision-hovercard__ghost {
	padding: 4px 10px;
	font: 600 13px/20px var(--font-ui);
	color: var(--ink-link);
	text-decoration: none;
	border-bottom: none;
	border-radius: 999px;

	&:hover {
		background: var(--rule-tint);
	}
}

.vision-hovercard__body--event {
	flex-direction: row;
	align-items: flex-start;
	gap: 12px;
	padding-top: 14px;
}

.vision-hovercard__date {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	flex: none;
	width: 52px;
	height: 56px;
	color: var(--ink-primary);
	background: var(--rule-tint);
	border: 1px solid var(--rule-soft);
	border-radius: 10px;
}

.vision-hovercard__date-day {
	font: 700 20px/24px var(--font-ui);
}

.vision-hovercard__date-month {
	font: 600 11px/14px var(--font-ui);
	letter-spacing: var(--ls-eyebrow, 0.08em);
	text-transform: uppercase;
	color: var(--ink-muted);
}

.vision-hovercard__event-text {
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
}
</style>
