<template>
	<div class="group-plate-wrap">
		<header class="group-plate" :class="{ 'group-plate--no-banner': !bannerUrl }">
			<img v-if="bannerUrl" class="group-plate__banner" :src="bannerUrl" alt="" />
			<div class="group-plate__scrim" aria-hidden="true"></div>

			<div class="group-plate__crumbs">
				<breadcrumbs :items="crumbs" />
			</div>

			<div class="group-plate__row">
				<span class="group-plate__crest">
					<free-company-crest v-if="crest.length > 0" :images="crest" :size="104" />
					<q-icon v-else :name="placeholderIcon" class="group-plate__crest-icon" aria-hidden="true" />
				</span>

				<div class="group-plate__names">
					<p v-if="eyebrowParts.length > 0" class="group-plate__eyebrow">
						<template v-for="(part, index) in eyebrowParts" :key="part">
							<span v-if="index > 0" aria-hidden="true"> · </span>
							<span>{{ part }}</span>
						</template>
					</p>
					<h1 class="group-plate__name">{{ name }}</h1>
					<ul v-if="chips.length > 0" class="group-plate__chips" aria-label="Eckdaten">
						<li
							v-for="chip in chips"
							:key="chip.label"
							class="group-plate__chip"
							:class="{ 'group-plate__chip--live': chip.live }"
						>
							<span v-if="chip.live" class="group-plate__chip-dot" aria-hidden="true"></span>
							<q-icon v-else-if="chip.icon" :name="chip.icon" size="16px" aria-hidden="true" />
							<span>{{ chip.label }}</span>
						</li>
					</ul>
				</div>

				<div class="group-plate__actions">
					<slot name="actions" />
					<q-btn
						class="elpis-btn group-plate__btn-media"
						flat
						no-caps
						icon="share"
						label="Teilen"
						@click="share"
					/>
					<slot name="primary" />
				</div>
			</div>
		</header>
		<div class="group-plate__accent" aria-hidden="true"></div>
	</div>
</template>

<script lang="ts">
// ER2-410 — hero for free company and community detail pages: banner with a
// bottom scrim, breadcrumb pill, 112 px crest, «TAG» · type · founded,
// name, glass chips, "Teilen" plus an actions slot and a primary slot.
// Text sits on the scrim, so it uses fixed on-media colours in both themes.
import Breadcrumbs from 'components/vision/Breadcrumbs.vue';
import type { BreadcrumbItem } from 'components/vision/types';
import { copyToClipboard } from 'quasar';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';
import FreeCompanyCrest from '../free-company/FreeCompanyCrest.vue';
import type { GroupPlateChip } from './group-plate';

class Props {
	name = prop<string>({ required: true });
	bannerUrl = prop<string>({ default: '' });
	crest = prop<string[]>({ default: () => [] });
	placeholderIcon = prop<string>({ default: 'groups' });
	eyebrowParts = prop<string[]>({ default: () => [] });
	chips = prop<GroupPlateChip[]>({ default: () => [] });
	crumbs = prop<BreadcrumbItem[]>({ default: () => [] });
	/** Path copied by "Teilen"; defaults to the current path. */
	sharePath = prop<string>({ default: '' });
}

@Options({
	name: 'GroupPlate',
	components: {
		Breadcrumbs,
		FreeCompanyCrest,
	},
})
export default class GroupPlate extends Vue.with(Props) {
	async share() {
		try {
			await copyToClipboard(`${window.location.origin}${this.sharePath || this.$route.path}`);
			notifySuccess('Link kopiert.');
		} catch (e) {
			notifyError('Der Link konnte nicht kopiert werden.');
		}
	}
}
</script>

<style lang="scss" scoped>
.group-plate {
	--plate-on-media: #FFFFFF;
	--plate-on-media-soft: rgba(255, 255, 255, 0.85);
	--plate-lore: #F3D9A4;
	--plate-glass: rgba(255, 255, 255, 0.14);
	--plate-glass-hover: rgba(255, 255, 255, 0.24);
	--plate-glass-rule: rgba(255, 255, 255, 0.32);

	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	min-height: 360px;
	padding: 20px 32px 28px;
	overflow: hidden;
	border-radius: 29px 29px 0 0;
	isolation: isolate;
	color: var(--plate-on-media);
	background: linear-gradient(160deg, var(--surface-ink) 0%, #5C4A2C 100%);

	@media (max-width: 599px) {
		min-height: 0;
		padding: 16px 16px 20px;
	}
}

body.body--dark .group-plate {
	background: linear-gradient(160deg, var(--surface-deep) 0%, var(--rule-arcane) 140%);
}

.group-plate__banner {
	position: absolute;
	inset: 0;
	z-index: -2;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.group-plate__scrim {
	position: absolute;
	inset: 0;
	z-index: -1;
	background: linear-gradient(
		180deg,
		rgba(13, 17, 24, 0.1) 0%,
		rgba(13, 17, 24, 0) 25%,
		rgba(13, 17, 24, 0.55) 55%,
		rgba(13, 17, 24, 0.88) 100%
	);
}

.group-plate--no-banner .group-plate__scrim {
	background: radial-gradient(circle at 80% 0%, rgba(255, 255, 255, 0.08), transparent 60%);
}

.group-plate__crumbs {
	align-self: flex-start;
	max-width: 100%;
	padding: 4px 14px;
	border-radius: 999px;
	background-color: var(--surface-glass);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);

	@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
		background-color: var(--surface-raised);
	}
}

.group-plate__row {
	display: flex;
	align-items: flex-end;
	gap: 24px;
	margin-top: 72px;

	@media (max-width: 899px) {
		flex-wrap: wrap;
	}

	@media (max-width: 599px) {
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
		margin-top: 40px;
	}
}

.group-plate__crest {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	width: 112px;
	height: 112px;
	overflow: hidden;
	border-radius: 18px 18px 52px 52px;
	background-color: var(--surface-raised);
	box-shadow: 0 0 0 4px var(--rule-gold), 0 12px 32px rgba(0, 0, 0, 0.45);
	color: var(--ink-muted);
}

.group-plate__crest-icon {
	font-size: 56px;
}

.group-plate__names {
	flex: 1 1 320px;
	min-width: 0;
	text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

.group-plate__eyebrow {
	margin: 0 0 4px;
	font-family: var(--font-lore);
	font-style: italic;
	font-size: 19px;
	line-height: 1.3;
	color: var(--plate-lore);
}

.group-plate__name {
	margin: 0;
	font-family: var(--font-display);
	font-weight: 500;
	font-size: 48px;
	line-height: 1.1;
	letter-spacing: 0;
	color: var(--plate-on-media);
	overflow-wrap: anywhere;

	@media (max-width: 899px) {
		font-size: 38px;
	}

	@media (max-width: 599px) {
		font-size: 30px;
	}
}

.group-plate__chips {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin: 14px 0 0;
	padding: 0;
	list-style: none;
	text-shadow: none;
}

.group-plate__chip {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-height: 30px;
	padding: 4px 12px;
	border: 1px solid var(--plate-glass-rule);
	border-radius: 999px;
	background-color: var(--plate-glass);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	color: var(--plate-on-media);
	font-family: var(--font-ui);
	font-size: 13px;
	font-weight: 600;
	line-height: 18px;

	@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
		background-color: rgba(13, 17, 24, 0.6);
	}
}

.group-plate__chip-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: #6EDCA8;
}

.group-plate__actions {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 8px;
	flex: 0 1 auto;

	@media (max-width: 899px) {
		flex-basis: 100%;
		justify-content: flex-start;
	}
}

// Secondary-on-media; slotted buttons can use the same class.
.group-plate__actions :deep(.q-btn.group-plate__btn-media),
.q-btn.group-plate__btn-media {
	border: 1px solid var(--plate-glass-rule);
	background-color: var(--plate-glass);
	color: var(--plate-on-media);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);

	&:not(.disabled):hover {
		background-color: var(--plate-glass-hover);
	}

	@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
		background-color: rgba(13, 17, 24, 0.6);
	}
}

.group-plate__accent {
	height: 4px;
	background: linear-gradient(
		90deg,
		var(--profile-accent, var(--vision-primary)) 0%,
		var(--rule-strong) 50%,
		var(--profile-accent, var(--vision-primary)) 100%
	);
}
</style>
