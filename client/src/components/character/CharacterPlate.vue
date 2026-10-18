<template>
	<div class="character-plate-wrap">
	<header class="character-plate" :class="{ 'character-plate--no-banner': !bannerUrl }">
		<img
			v-if="bannerUrl"
			class="character-plate__banner"
			:src="bannerUrl"
			alt=""
		/>
		<div class="character-plate__scrim" aria-hidden="true"></div>

		<div class="character-plate__crumbs">
			<breadcrumbs :items="crumbs" />
		</div>

		<div class="character-plate__row">
			<span class="character-plate__avatar">
				<img
					v-if="character.avatar"
					class="character-plate__avatar-img"
					:src="character.avatar"
					:alt="`Porträt von ${character.name}`"
				/>
				<q-icon v-else name="person" class="character-plate__avatar-placeholder" aria-hidden="true" />
				<span
					v-if="rpStatus"
					class="character-plate__avatar-dot"
					:class="`character-plate__avatar-dot--${rpStatus}`"
					aria-hidden="true"
				></span>
			</span>

			<div class="character-plate__names">
				<p v-if="loreLine" class="character-plate__lore">{{ loreLine }}</p>
				<h1 class="character-plate__name">{{ character.name }}</h1>
				<p class="character-plate__meta">
					<template v-for="(part, index) in metaParts" :key="part">
						<span v-if="index > 0" class="character-plate__meta-sep" aria-hidden="true">·</span>
						<span>{{ part }}</span>
					</template>
				</p>
				<ul v-if="rpStatus || fcLink" class="character-plate__chips" aria-label="Status">
					<li v-if="rpStatus" class="character-plate__chip">
						<span class="character-plate__chip-dot" :class="`character-plate__chip-dot--${rpStatus}`" aria-hidden="true"></span>
						<span>{{ rpLabel }}</span>
					</li>
					<li v-if="fcLink">
						<router-link class="character-plate__chip character-plate__chip--link" :to="fcLink">
							<q-icon name="shield" size="16px" aria-hidden="true" />
							<span>{{ fcName }}</span>
						</router-link>
					</li>
				</ul>
			</div>

			<div class="character-plate__actions">
				<character-rp-status-setter
					v-if="canSetRp"
					class="character-plate__btn-media"
					:character-id="character.id"
					:current="rpStatus"
					:current-location="character.rpLocation || null"
					@change="onRpChange"
					@unavailable="rpUnavailable = true"
				/>
				<q-btn
					v-if="character.mine"
					class="elpis-btn character-plate__btn-media"
					flat
					no-caps
					icon="edit"
					label="Bearbeiten"
					:to="`/edit-character/${character.id}/profile`"
				/>
				<q-btn
					class="elpis-btn character-plate__btn-media"
					flat
					no-caps
					icon="share"
					label="Teilen"
					@click="share"
				/>
				<!-- ER2 outlook: plate export -->
				<plate-export-button :character="character" />
				<!-- /ER2 outlook: plate export -->
				<q-btn
					v-if="contactUrl"
					class="elpis-btn elpis-btn--primary"
					unelevated
					no-caps
					icon="chat"
					label="Anschreiben"
					:href="contactUrl"
					target="_blank"
					rel="noopener noreferrer"
				/>
			</div>
		</div>
	</header>
	<div class="character-plate__accent" aria-hidden="true"></div>
	</div>
</template>

<script lang="ts">
// ER2-402 — adventurer-plate header: full-bleed banner with a bottom scrim,
// breadcrumb pill, 152 px portrait with a gold ring, lore title above the
// name, "Volk · Clan · Welt [Light] · Beruf", status chips and actions.
// Text sits on the scrim, so it uses fixed on-media colours in both themes.
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { RpPresenceFieldsDto } from '@app/shared/dto/characters/rp-presence.dto';
import { RpStatus } from '@app/shared/enums/rp-status.enum';
import Breadcrumbs from 'components/vision/Breadcrumbs.vue';
import type { BreadcrumbItem } from 'components/vision/types';
import { copyToClipboard } from 'quasar';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';
import CharacterRpStatusSetter from './CharacterRpStatusSetter.vue';
import PlateExportButton from '../outlook/PlateExportButton.vue'; // ER2 outlook: plate export
import { isEmptyFieldValue } from './empty-field';
import { stripWikilinks } from './profile-sections';
import { activeRpStatus, formatRpUntil, RP_STATUS_LABELS, supportsRpStatus } from './rp-status';

const DISCORD_LINK_REGEX = /https?:\/\/(?:www\.)?(?:discord(?:app)?\.com\/users\/\d+|discord\.gg\/[\w-]+|discord\.com\/invite\/[\w-]+)/i;

class Props {
	character = prop<CharacterProfileDto>({ required: true });
	/** Canonical profile path (`/Server/Name`), used for the share link. */
	basePath = prop<string>({ required: true });
}

@Options({
	name: 'CharacterPlate',
	components: {
		Breadcrumbs,
		CharacterRpStatusSetter,
		PlateExportButton, // ER2 outlook: plate export
	},
	emits: [ 'rp-change' ],
})
export default class CharacterPlate extends Vue.with(Props) {
	rpUnavailable = false;

	get bannerUrl(): string {
		return this.character.banner?.url || '';
	}

	get crumbs(): BreadcrumbItem[] {
		return [
			{ label: 'Charaktere', to: '/profiles' },
			{ label: this.character.name },
		];
	}

	private text(value?: string | null): string {
		return value && !isEmptyFieldValue(value) ? stripWikilinks(value).trim() : '';
	}

	get loreLine(): string {
		const title = this.text(this.character.title);
		const nickname = this.text(this.character.nickname);
		return [ title, nickname ? `«${nickname}»` : '' ].filter((part) => !!part).join(' · ');
	}

	get metaParts(): string[] {
		const c = this.character;
		return [
			c.race ? this.$display.races[c.race] : '',
			c.tribe ? this.$display.tribes[c.tribe] : '',
			c.server ? `${c.server} [Light]` : '',
			this.text(c.profession),
		].filter((part) => !!part);
	}

	get rpStatus(): RpStatus | null {
		return activeRpStatus(this.character);
	}

	get rpLabel(): string {
		if (!this.rpStatus) {
			return '';
		}
		return [
			RP_STATUS_LABELS[this.rpStatus],
			this.character.rpLocation || '',
			formatRpUntil(this.character.rpStatusExpiresAt),
		].filter((part) => !!part).join(' · ');
	}

	get canSetRp(): boolean {
		return !!this.character.mine && !this.rpUnavailable && supportsRpStatus(this.character);
	}

	get fcLink(): string | null {
		const fc = this.character.freeCompany;
		return fc ? `/fc/${fc.server}/${fc.name.replace(/ /g, '_')}` : null;
	}

	get fcName(): string {
		return this.character.freeCompany?.name || '';
	}

	/** Discord profile or invite link from the OOC info; no other contact field exists. */
	get contactUrl(): string {
		const match = (this.character.oocInfo || '').match(DISCORD_LINK_REGEX);
		return match ? match[0] : '';
	}

	async share() {
		try {
			await copyToClipboard(`${window.location.origin}${this.basePath}`);
			notifySuccess('Link zum Profil kopiert.');
		} catch (e) {
			notifyError('Der Link konnte nicht kopiert werden.');
		}
	}

	onRpChange(presence: RpPresenceFieldsDto) {
		this.$emit('rp-change', presence);
	}
}
</script>

<style lang="scss" scoped>
// On-media colours: the text always sits on the dark scrim, in both themes.
.character-plate {
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
	min-height: 420px;
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

body.body--dark .character-plate {
	background: linear-gradient(160deg, var(--surface-deep) 0%, var(--rule-arcane) 140%);
}

.character-plate__banner {
	position: absolute;
	inset: 0;
	z-index: -2;
	width: 100%;
	height: 100%;
	object-fit: cover;
	object-position: center 30%;
}

.character-plate__scrim {
	position: absolute;
	inset: 0;
	z-index: -1;
	background: linear-gradient(
		180deg,
		rgba(11, 6, 18, 0.1) 0%,
		rgba(11, 6, 18, 0) 25%,
		rgba(11, 6, 18, 0.55) 55%,
		rgba(11, 6, 18, 0.88) 100%
	);
}

.character-plate--no-banner .character-plate__scrim {
	background: radial-gradient(circle at 80% 0%, rgba(255, 255, 255, 0.08), transparent 60%);
}

.character-plate__crumbs {
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

.character-plate__row {
	display: flex;
	align-items: flex-end;
	gap: 24px;
	margin-top: 96px;

	@media (max-width: 899px) {
		flex-wrap: wrap;
	}

	@media (max-width: 599px) {
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
		margin-top: 48px;
	}
}

.character-plate__avatar {
	position: relative;
	flex: 0 0 auto;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 152px;
	height: 152px;
	border-radius: 50%;
	background-color: var(--surface-raised);
	box-shadow: 0 0 0 4px var(--rule-gold), 0 12px 32px rgba(0, 0, 0, 0.45);
	color: var(--ink-muted);

	@media (max-width: 599px) {
		width: 112px;
		height: 112px;
	}
}

.character-plate__avatar-img {
	display: block;
	width: 100%;
	height: 100%;
	border-radius: 50%;
	object-fit: cover;
}

.character-plate__avatar-placeholder {
	font-size: 64px;
}

.character-plate__avatar-dot {
	position: absolute;
	right: 10px;
	bottom: 10px;
	width: 22px;
	height: 22px;
	border-radius: 50%;
	border: 3px solid var(--surface-ink);
}

.character-plate__avatar-dot--ic,
.character-plate__chip-dot--ic {
	background-color: #6EDCA8;
}

.character-plate__avatar-dot--lfrp,
.character-plate__chip-dot--lfrp {
	background-color: #F3D9A4;
}

.character-plate__avatar-dot--ooc,
.character-plate__chip-dot--ooc {
	background-color: #B5A6CB;
}

.character-plate__names {
	flex: 1 1 320px;
	min-width: 0;
	text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

.character-plate__lore {
	margin: 0 0 4px;
	font-family: var(--font-lore);
	font-style: italic;
	font-size: 20px;
	line-height: 1.3;
	color: var(--plate-lore);
	overflow-wrap: anywhere;
}

.character-plate__name {
	margin: 0;
	font-family: var(--font-display);
	font-weight: 500;
	font-size: 54px;
	line-height: 1.08;
	letter-spacing: 0;
	color: var(--plate-on-media);
	overflow-wrap: anywhere;

	@media (max-width: 899px) {
		font-size: 42px;
	}

	@media (max-width: 599px) {
		font-size: 32px;
	}
}

.character-plate__meta {
	display: flex;
	flex-wrap: wrap;
	gap: 0 8px;
	margin: 8px 0 0;
	font-family: var(--font-ui);
	font-size: 15px;
	line-height: 22px;
	color: var(--plate-on-media-soft);
}

.character-plate__chips {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin: 14px 0 0;
	padding: 0;
	list-style: none;
	text-shadow: none;
}

.character-plate__chip {
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
	text-decoration: none;

	@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
		background-color: rgba(11, 6, 18, 0.6);
	}
}

.character-plate__chip--link {
	transition: background-color var(--motion-fast) var(--ease-elpis);

	&:hover {
		background-color: var(--plate-glass-hover);
		text-decoration: underline;
	}

	&:focus-visible {
		outline: none;
		box-shadow: 0 0 0 2px var(--glow-aether);
	}
}

.character-plate__chip-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
}

.character-plate__actions {
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

// Secondary-on-media: white outline on glass, readable on any banner.
.q-btn.character-plate__btn-media {
	border: 1px solid var(--plate-glass-rule);
	background-color: var(--plate-glass);
	color: var(--plate-on-media);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);

	&:not(.disabled):hover {
		background-color: var(--plate-glass-hover);
	}

	@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
		background-color: rgba(11, 6, 18, 0.6);
	}
}

// Profile accent bar; --profile-accent is the slot for a per-profile colour.
.character-plate__accent {
	height: 4px;
	background: linear-gradient(
		90deg,
		var(--profile-accent, var(--vision-primary)) 0%,
		var(--rule-strong) 50%,
		var(--profile-accent, var(--vision-primary)) 100%
	);
}
</style>
