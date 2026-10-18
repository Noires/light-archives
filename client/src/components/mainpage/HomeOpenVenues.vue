<template>
	<section class="home-open-venues" aria-labelledby="home-open-venues-title">
		<div class="home-open-venues__head">
			<h2 id="home-open-venues-title" class="home-open-venues__title">Jetzt geöffnet</h2>
			<span v-if="!loading && available" class="home-open-venues__count">
				{{ openCount === 1 ? '1 Treffpunkt' : `${openCount} Treffpunkte` }}
			</span>
		</div>

		<ul v-if="loading" class="home-open-venues__list" aria-busy="true" aria-label="Treffpunkte werden geladen">
			<li v-for="n in limit" :key="n" class="home-open-venues__row">
				<q-skeleton class="home-open-venues__image" type="rect" />
				<div class="home-open-venues__text">
					<q-skeleton type="text" width="60%" />
					<q-skeleton type="text" width="80%" />
				</div>
			</li>
		</ul>

		<p v-else-if="!available" class="home-open-venues__note">
			Die Treffpunkte konnten gerade nicht geladen werden.
		</p>

		<ul v-else-if="shown.length" class="home-open-venues__list">
			<li v-for="venue in shown" :key="venue.id" class="home-open-venues__row">
				<div class="home-open-venues__image">
					<img v-if="venue.imageSrc" :src="venue.imageSrc" alt="" loading="lazy" />
					<q-icon v-else name="storefront" aria-hidden="true" />
				</div>
				<div class="home-open-venues__text">
					<router-link class="home-open-venues__name" :to="`/venue/${venue.id}`">{{ venue.name }}</router-link>
					<span class="home-open-venues__address">{{ venue.address || venue.server }}</span>
				</div>
				<div class="home-open-venues__status">
					<status-badge v-if="venue.info.state === 'open'" type="open" :label="venue.info.label" />
					<status-badge v-else-if="venue.info.state === 'soon'" type="soon" :label="venue.info.label" />
					<span v-else-if="venue.info.label" class="home-open-venues__later">{{ venue.info.label }}</span>
				</div>
			</li>
		</ul>

		<p v-else class="home-open-venues__note">
			Gerade hat kein Treffpunkt geöffnet, und für die nächsten Tage sind keine Öffnungszeiten eingetragen.
		</p>

		<div class="home-open-venues__foot">
			<q-btn
				class="elpis-btn elpis-btn--ghost"
				flat
				dense
				no-caps
				to="/venues"
				icon-right="arrow_forward"
				label="Alle Treffpunkte"
			/>
		</div>
	</section>
</template>

<script lang="ts">
import StatusBadge from 'components/vision/StatusBadge.vue';
import { Options, prop, Vue } from 'vue-class-component';
import type { HomeVenue } from './home-data';

// ER2-304 — venues open now / opening soon. The open state comes from
// common/opening-status.ts (server fields when present, else the weekly
// template); when nothing is open the next openings fill the list.

class Props {
	/** Already sorted (open, soon, next openings). */
	venues = prop<HomeVenue[]>({ default: () => [] });
	openCount = prop<number>({ default: 0 });
	loading = prop<boolean>({ default: false });
	available = prop<boolean>({ default: true });
	limit = prop<number>({ default: 4 });
}

@Options({
	name: 'HomeOpenVenues',
	components: { StatusBadge },
})
export default class HomeOpenVenues extends Vue.with(Props) {
	get shown(): HomeVenue[] {
		return this.venues.filter((venue) => venue.info.state !== 'unknown').slice(0, this.limit);
	}
}
</script>

<style lang="scss" scoped>
.home-open-venues {
	display: flex;
	flex-direction: column;
	min-width: 0;
	padding: 16px 18px 10px;
	background-color: var(--vision-card);
	border: 1px solid var(--rule-soft);
	border-radius: 16px;
	color: var(--ink-primary);
}

.home-open-venues__head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
	padding-bottom: 8px;
}

.home-open-venues__title {
	text-align: left;
	margin: 0;
	font-family: var(--font-display);
	font-size: var(--type-scale-3);
	font-weight: 600;
	line-height: var(--lh-heading);
}

.home-open-venues__count {
	font-family: var(--font-ui);
	font-size: 13px;
	color: var(--ink-muted);
}

.home-open-venues__list {
	margin: 0;
	padding: 0;
	list-style: none;
}

.home-open-venues__row {
	position: relative;
	display: grid;
	grid-template-columns: 52px minmax(0, 1fr) auto;
	align-items: center;
	gap: 12px;
	padding: 10px 0;
	border-top: 1px solid var(--rule-soft);

	&:first-child {
		border-top: 0;
	}

	@media (max-width: 420px) {
		grid-template-columns: 52px minmax(0, 1fr);

		.home-open-venues__status {
			grid-column: 2;
		}
	}
}

.home-open-venues__image {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 52px;
	height: 52px;
	overflow: hidden;
	border-radius: 10px;
	background-color: var(--rule-tint);
	color: var(--ink-muted);
	font-size: 24px;

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.home-open-venues__text {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.home-open-venues__name {
	overflow: hidden;
	font-family: var(--font-ui);
	font-size: 15px;
	font-weight: 600;
	line-height: 20px;
	color: var(--ink-primary);
	text-decoration: none;
	text-overflow: ellipsis;
	white-space: nowrap;

	// The name link covers the whole row.
	&::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 8px;
	}

	&:hover {
		text-decoration: underline;
	}

	&:focus-visible {
		outline: none;

		&::after {
			box-shadow:
				0 0 0 2px var(--glow-aether),
				0 0 0 3px var(--vision-focus-edge);
		}
	}
}

.home-open-venues__address {
	overflow: hidden;
	font-family: var(--font-ui);
	font-size: 13px;
	line-height: 18px;
	color: var(--ink-muted);
	text-overflow: ellipsis;
	white-space: nowrap;
}

.home-open-venues__later {
	font-family: var(--font-ui);
	font-size: 12px;
	line-height: 16px;
	color: var(--ink-muted);
	white-space: nowrap;
}

.home-open-venues__note {
	margin: 0;
	padding: 12px 0;
	font-family: var(--font-section);
	font-style: italic;
	color: var(--ink-muted);
}

.home-open-venues__foot {
	display: flex;
	justify-content: flex-end;
	margin-top: 4px;
	padding-top: 6px;
	border-top: 1px solid var(--rule-soft);
}
</style>
