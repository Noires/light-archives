<template>
	<div class="character-overview">
		<section v-if="isOwner" class="character-overview__completeness" aria-labelledby="co-completeness">
			<div class="character-overview__completeness-text">
				<h2 id="co-completeness" class="character-overview__completeness-title">Profil zu {{ completeness.percent }} % ausgefüllt</h2>
				<p v-if="completeness.missing.length > 0" class="character-overview__card-text">
					Es fehlen noch: {{ missingSummary }}
				</p>
				<p v-else class="character-overview__card-text">Alles da. Besucher sehen ein vollständiges Profil.</p>
			</div>
			<div
				class="character-overview__meter"
				role="progressbar"
				aria-labelledby="co-completeness"
				aria-valuemin="0"
				aria-valuemax="100"
				:aria-valuenow="completeness.percent"
			>
				<span class="character-overview__meter-fill" :style="{ width: `${completeness.percent}%` }"></span>
			</div>
			<q-btn
				class="elpis-btn elpis-btn--secondary"
				flat
				no-caps
				icon="edit"
				label="Profil bearbeiten"
				:to="editLink('profile')"
			/>
		</section>

		<div class="character-overview__main">
			<section v-if="facts.length > 0 || missingFacts.length > 0" class="character-overview__section" aria-labelledby="co-facts">
				<h2 id="co-facts" class="character-overview__heading">Auf einen Blick</h2>
				<ul class="character-overview__facts">
					<li v-for="fact in facts" :key="fact.key" class="character-overview__fact">
						<q-icon class="character-overview__fact-icon" :name="fact.icon" aria-hidden="true" />
						<span class="character-overview__fact-label">{{ fact.label }}</span>
						<link-field class="character-overview__fact-value" :content="fact.value" />
					</li>
					<li v-for="fact in missingFacts" :key="fact.key" class="character-overview__fact-slot">
						<router-link class="character-overview__fact character-overview__fact--add" :to="editLink('profile')">
							<q-icon class="character-overview__fact-icon" name="add" aria-hidden="true" />
							<span class="character-overview__fact-label">{{ fact.label }}</span>
							<span class="character-overview__fact-value">Ergänzen</span>
						</router-link>
					</li>
				</ul>
			</section>

			<section v-if="hasBackground" class="character-overview__section" aria-labelledby="co-background">
				<h2 id="co-background" class="character-overview__heading">Hintergrund</h2>
				<div class="character-overview__background mat-parchment">
					<html-viewer class="character-overview__prose" :content="character.background" />
				</div>
			</section>
			<section v-else-if="isOwner" class="character-overview__section" aria-labelledby="co-background">
				<h2 id="co-background" class="character-overview__heading">Hintergrund</h2>
				<empty-state
					variant="owner"
					icon="history_edu"
					title="Noch kein Hintergrund"
					text="Woher kommt dein Charakter, und was hat ihn geprägt? Ein paar Absätze genügen."
					action-label="Hintergrund schreiben"
					:action-to="editLink('profile')"
				/>
			</section>

			<iframe
				v-if="character.carrdProfile"
				v-iframe-resize
				class="character-overview__carrd"
				:src="carrdLink"
				:title="`Carrd-Profil von ${character.name}`"
				width="100%"
				height="500px"
			></iframe>

			<section v-if="latestStory" class="character-overview__section" aria-labelledby="co-diary">
				<h2 id="co-diary" class="character-overview__heading">Aus dem Tagebuch</h2>
				<article
					class="character-overview__diary mat-parchment"
					:class="{ 'character-overview__diary--image': !!latestStoryImage }"
				>
					<!-- ER2 round 2: story cover image (optional) -->
					<img
						v-if="latestStoryImage"
						class="character-overview__diary-image"
						:src="latestStoryImage"
						alt=""
						loading="lazy"
					/>
					<p class="character-overview__eyebrow">
						{{ $display.storyTypes[latestStory.type] }} · {{ $display.relativeTime(latestStory.createdAt) }}
					</p>
					<h3 class="character-overview__diary-title">
						<router-link class="character-overview__stretched" :to="`/story/${latestStory.id}`">
							{{ latestStory.title }}
						</router-link>
					</h3>
					<p v-if="latestStory.excerpt" class="character-overview__diary-excerpt">{{ latestStory.excerpt }}</p>
				</article>
				<router-link
					v-if="stories.length > 1"
					class="character-overview__more"
					:to="tabLink('tagebuch')"
				>Alle {{ stories.length }} Einträge</router-link>
			</section>
			<section v-else-if="isOwner" class="character-overview__section" aria-labelledby="co-diary">
				<h2 id="co-diary" class="character-overview__heading">Aus dem Tagebuch</h2>
				<empty-state
					variant="owner"
					icon="auto_stories"
					:title="enabled('tagebuch') ? 'Noch keine Tagebucheinträge' : 'Tagebuch ausgeblendet'"
					:text="enabled('tagebuch')
						? 'Halte fest, was dein Charakter erlebt hat. Der neueste Eintrag erscheint hier.'
						: 'Besucher sehen dein Tagebuch erst, wenn du es im Editor einschaltest.'"
					:action-label="enabled('tagebuch') ? 'Geschichte erstellen' : 'Einstellungen öffnen'"
					:action-to="enabled('tagebuch') ? '/create-story' : editLink('diary')"
				/>
			</section>
		</div>

		<aside class="character-overview__rail" aria-label="Vorschau">
			<section v-if="rumors.length > 0" class="character-overview__card" aria-labelledby="co-rumors">
				<header class="character-overview__card-head">
					<h2 id="co-rumors" class="character-overview__card-title">Gerüchte</h2>
					<router-link class="character-overview__more" :to="tabLink('geruechte')">Alle</router-link>
				</header>
				<figure v-for="(rumor, index) in rumors" :key="index" class="character-overview__rumor">
					<blockquote class="character-overview__rumor-text">{{ rumor.text }}</blockquote>
					<figcaption>
						<span class="character-overview__pill" :class="`character-overview__pill--${rumor.tone}`">{{ rumor.label }}</span>
					</figcaption>
				</figure>
			</section>
			<empty-state
				v-else-if="isOwner"
				class="character-overview__rail-empty"
				variant="owner"
				icon="sms"
				title="Gerüchte"
				:text="enabled('geruechte') ? 'Was erzählt man sich über deinen Charakter?' : 'Für Besucher ausgeblendet.'"
				action-label="Ergänzen"
				:action-to="editLink('rumors')"
			/>

			<section v-if="showContacts" ref="contacts" class="character-overview__card" aria-labelledby="co-contacts">
				<header class="character-overview__card-head">
					<h2 id="co-contacts" class="character-overview__card-title">Kontakte</h2>
					<router-link class="character-overview__more" :to="tabLink('kontakte')">Alle</router-link>
				</header>
				<ul v-if="contacts.length > 0" class="character-overview__contacts">
					<li v-for="contact in contacts" :key="contact.target" class="character-overview__contact">
						<img
							v-if="contactAvatars[contact.target]"
							class="character-overview__monogram character-overview__monogram--avatar"
							:src="contactAvatars[contact.target]"
							alt=""
							loading="lazy"
						/>
						<span v-else class="character-overview__monogram" aria-hidden="true">{{ contact.initial }}</span>
						<span class="character-overview__contact-text">
							<router-link class="character-overview__contact-name" :to="contact.to">{{ contact.label }}</router-link>
							<span class="character-overview__contact-relation">{{ contact.relation }}</span>
						</span>
					</li>
				</ul>
				<p v-else class="character-overview__card-text">
					{{ character.name }} hat Kontakte ohne Verlinkung eingetragen.
				</p>
			</section>
			<empty-state
				v-else-if="isOwner"
				class="character-overview__rail-empty"
				variant="owner"
				icon="diversity_3"
				title="Kontakte"
				:text="enabled('kontakte') ? 'Verlinke Freunde, Familie und Rivalen mit [[Name]].' : 'Für Besucher ausgeblendet.'"
				action-label="Ergänzen"
				:action-to="editLink('contacts')"
			/>

			<section v-if="thumbs.length > 0" class="character-overview__card" aria-labelledby="co-gallery">
				<header class="character-overview__card-head">
					<h2 id="co-gallery" class="character-overview__card-title">Galerie</h2>
					<router-link class="character-overview__more" :to="tabLink('galerie')">Alle {{ images.length }}</router-link>
				</header>
				<div class="character-overview__thumbs">
					<a
						v-for="(image, index) in thumbs"
						:key="image.id"
						class="character-overview__thumb"
						:href="`/image/${image.id}`"
						@click.prevent="openImage(index)"
					>
						<img :src="image.thumbUrl" :alt="image.title || `Bild ${index + 1}`" loading="lazy" />
					</a>
				</div>
			</section>
			<empty-state
				v-else-if="isOwner"
				class="character-overview__rail-empty"
				variant="owner"
				icon="collections"
				title="Galerie"
				:text="enabled('galerie') ? 'Zeig deinen Charakter mit ein paar Bildern.' : 'Für Besucher ausgeblendet.'"
				action-label="Ergänzen"
				:action-to="editLink('gallery')"
			/>

			<!-- ER2 round 2: albums of the character (hidden without albums or API) -->
			<section v-if="albums.length > 0" class="character-overview__card" aria-labelledby="co-albums">
				<header class="character-overview__card-head">
					<h2 id="co-albums" class="character-overview__card-title">Alben</h2>
				</header>
				<ul class="character-overview__albums">
					<li v-for="album in albums" :key="album.id">
						<router-link class="character-overview__album" :to="`/album/${album.id}`">
							<span class="character-overview__album-cover" aria-hidden="true">
								<img v-if="album.coverThumbUrl" :src="album.coverThumbUrl" alt="" loading="lazy" />
								<q-icon v-else name="photo_album" size="20px" />
							</span>
							<span class="character-overview__album-text">
								<span class="character-overview__album-title">{{ album.title }}</span>
								<span class="character-overview__album-meta">{{ album.imageCount === 1 ? '1 Bild' : `${album.imageCount} Bilder` }}</span>
							</span>
						</router-link>
					</li>
				</ul>
			</section>
		</aside>
	</div>
</template>

<script lang="ts">
// ER2-403 — profile overview: fact tiles, background on parchment with a drop
// cap, the latest diary entry, and previews of rumours, contacts and gallery.
// Uses only the already loaded profile and content DTOs.
import type { AlbumSummaryDto } from '@app/shared/dto/albums/album.dto';
import { CharacterContentDto } from '@app/shared/dto/characters/character-content.dto';
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { StorySummaryDto } from '@app/shared/dto/stories/story-summary.dto';
import { wikify } from '@common/common/wikilinks';
import { bindHoverCards } from 'components/vision/hover-card';
import { Options, prop, Vue } from 'vue-class-component';
import EmptyState from 'components/vision/EmptyState.vue';
import HtmlViewer from '../common/HtmlViewer.vue';
import LinkField from '../common/LinkField.vue';
import { isEmptyFieldValue } from './empty-field';
import {
	CHARACTER_SECTIONS,
	CharacterTabKey,
	CONTACT_FIELDS,
	extractWikilinks,
	FactDef,
	FACTS,
	fieldText,
	profileCompleteness,
	ProfileCompleteness,
	RUMOR_FIELDS,
	sectionEnabled,
	splitEntries,
} from './profile-sections';

interface Fact extends FactDef {
	value: string;
}

interface RumorPreview {
	text: string;
	label: string;
	tone: string;
}

interface ContactPreview {
	target: string;
	label: string;
	relation: string;
	initial: string;
	to: string;
}

const RUMOR_TONES: Record<string, string> = {
	commonrumors: 'common',
	openinformation: 'open',
	rarerumors: 'rare',
};

const MAX_RUMOR_LENGTH = 180;
const MAX_CONTACTS = 5;

class Props {
	character = prop<CharacterProfileDto>({ required: true });
	content = prop<CharacterContentDto>({ required: true });
	/** Canonical profile path (`/Server/Name`); tab links are built from it. */
	basePath = prop<string>({ required: true });
}

@Options({
	name: 'CharacterOverview',
	components: {
		EmptyState,
		HtmlViewer,
		LinkField,
	},
	watch: {
		'character.id'() {
			void (this as CharacterOverview).loadAlbums();
		},
		contactTargets() {
			void (this as CharacterOverview).loadContactAvatars();
		},
	},
})
export default class CharacterOverview extends Vue.with(Props) {
	private unbindHoverCards: (() => void) | null = null;
	albums: AlbumSummaryDto[] = [];
	/** ER2 round 2: contact target → avatar URL from POST /characters/lookup. */
	contactAvatars: Record<string, string> = {};
	private contactsToken = 0;

	mounted() {
		this.unbindHoverCards = bindHoverCards(this.$el as HTMLElement);
		void this.loadAlbums();
		void this.loadContactAvatars();
	}

	get contactTargets(): string {
		return this.contacts.map((contact) => contact.target).join('\n');
	}

	/** One lookup call for the shown contacts; initials stay when it fails or finds nobody. */
	async loadContactAvatars() {
		const contacts = this.showContacts ? this.contacts : [];
		const token = ++this.contactsToken;

		if (contacts.length === 0) {
			this.contactAvatars = {};
			return;
		}

		try {
			const results = await this.$api.characters.lookupCharacters(
				contacts.map((contact) => {
					const at = contact.target.lastIndexOf('@');
					return at > 0
						? { name: contact.target.substring(0, at).trim(), server: contact.target.substring(at + 1).trim() }
						: { name: contact.target };
				}),
			);

			if (token !== this.contactsToken) {
				return;
			}

			const avatars: Record<string, string> = {};
			contacts.forEach((contact) => {
				const at = contact.target.lastIndexOf('@');
				const query = at > 0 ? contact.target.substring(0, at).trim() : contact.target;
				const hit = results.find((result) => result.query === query && !!result.avatar);
				if (hit) {
					avatars[contact.target] = hit.avatar;
				}
			});
			this.contactAvatars = avatars;
		} catch {
			// Older API without the lookup endpoint: keep the initials.
			if (token === this.contactsToken) {
				this.contactAvatars = {};
			}
		}
	}


	/** ER2 round 2: GET /albums?characterId=; the production API may lack it. */
	async loadAlbums() {
		const characterId = this.character.id;
		try {
			const albums = await this.$api.albums.getAlbums(characterId);
			if (characterId === this.character.id) {
				this.albums = albums.filter((album) => album.ownerId === characterId).slice(0, 4);
			}
		} catch {
			this.albums = [];
		}
	}

	beforeUnmount() {
		this.unbindHoverCards?.();
	}

	get isOwner(): boolean {
		return !!this.character.mine;
	}

	/** Preview sections follow the visitor switches of their tabs. */
	enabled(key: CharacterTabKey): boolean {
		const section = CHARACTER_SECTIONS.find((s) => s.key === key);
		return !!section && sectionEnabled(section, this.character);
	}

	tabLink(key: CharacterTabKey): string {
		return `${this.basePath}/${key}`;
	}

	get facts(): Fact[] {
		return FACTS
			.map((def) => ({ ...def, value: fieldText(this.character, def.key) }))
			.filter((fact) => !isEmptyFieldValue(fact.value));
	}

	/** ER2-404 — empty facts become dashed "Ergänzen" tiles for the owner. */
	get missingFacts(): FactDef[] {
		if (!this.isOwner) {
			return [];
		}
		return FACTS.filter((def) => isEmptyFieldValue(fieldText(this.character, def.key)));
	}

	get completeness(): ProfileCompleteness {
		return profileCompleteness(this.character);
	}

	get missingSummary(): string {
		const missing = this.completeness.missing;
		const shown = missing.slice(0, 4).join(', ');
		return missing.length > 4 ? `${shown} und ${missing.length - 4} weitere` : shown;
	}

	editLink(editPath: string): string {
		return `/edit-character/${this.character.id}/${editPath}`;
	}

	get hasBackground(): boolean {
		return !isEmptyFieldValue(this.character.background);
	}

	get carrdLink(): string {
		return `${this.$api.prefix}carrd/character/${this.character.id}`;
	}

	get stories(): StorySummaryDto[] {
		if (!this.enabled('tagebuch')) {
			return [];
		}
		return [ ...this.content.stories ].sort((a, b) => b.createdAt - a.createdAt);
	}

	get latestStory(): StorySummaryDto | null {
		return this.stories.length > 0 ? this.stories[0] : null;
	}

	get latestStoryImage(): string {
		const story = this.latestStory;
		return story ? story.imageUrl || story.imageThumbUrl || '' : '';
	}

	get rumors(): RumorPreview[] {
		if (!this.enabled('geruechte')) {
			return [];
		}
		const result: RumorPreview[] = [];
		for (const field of RUMOR_FIELDS) {
			for (const entry of splitEntries(fieldText(this.character, field.key))) {
				result.push({
					text: entry.length > MAX_RUMOR_LENGTH ? `${entry.substring(0, MAX_RUMOR_LENGTH - 1).trimEnd()}…` : entry,
					label: field.label,
					tone: RUMOR_TONES[field.key] || 'common',
				});
				if (result.length === 2) {
					return result;
				}
			}
		}
		return result;
	}

	get contactFieldsFilled(): boolean {
		return CONTACT_FIELDS.some(({ key }) => !isEmptyFieldValue(fieldText(this.character, key)));
	}

	get showContacts(): boolean {
		return this.enabled('kontakte') && this.contactFieldsFilled;
	}

	get contacts(): ContactPreview[] {
		const seen = new Set<string>();
		const result: ContactPreview[] = [];
		for (const field of CONTACT_FIELDS) {
			for (const ref of extractWikilinks(fieldText(this.character, field.key))) {
				const id = ref.target.toLowerCase();
				if (seen.has(id)) {
					continue;
				}
				seen.add(id);
				result.push({
					target: ref.target,
					label: ref.label,
					relation: field.label,
					initial: ref.label.trim().charAt(0).toUpperCase(),
					to: `/link/${encodeURIComponent(wikify(ref.target))}`,
				});
				if (result.length === MAX_CONTACTS) {
					return result;
				}
			}
		}
		return result;
	}

	get images(): ImageSummaryDto[] {
		return this.enabled('galerie') && this.content.images ? this.content.images : [];
	}

	get thumbs(): ImageSummaryDto[] {
		return this.images.slice(0, 4);
	}

	async openImage(index: number) {
		const Lightbox = (await import('../vision/Lightbox.vue')).default;
		this.$q.dialog({
			component: Lightbox,
			componentProps: {
				images: this.images,
				initialIndex: index,
			},
		});
	}
}
</script>

<style lang="scss" scoped>
.character-overview {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 340px;
	gap: 32px;
	align-items: start;

	@media (max-width: 1023px) {
		grid-template-columns: minmax(0, 1fr);
	}
}

.character-overview__main,
.character-overview__rail {
	display: flex;
	flex-direction: column;
	gap: 32px;
	min-width: 0;
}

.character-overview__rail {
	gap: 20px;
}

.character-overview__heading {
	text-align: left;
	margin: 0 0 14px;
	font-family: var(--font-display);
	font-weight: 500;
	font-size: 22px;
	line-height: 1.3;
	letter-spacing: 0;
	color: var(--ink-primary);
}

.character-overview__eyebrow {
	margin: 0 0 6px;
	font-family: var(--font-ui);
	font-weight: 600;
	font-size: 11px;
	line-height: 16px;
	letter-spacing: 1.6px;
	text-transform: uppercase;
	color: var(--ink-link);
}

// Owner: completeness ---------------------------------------------------------
.character-overview__completeness {
	grid-column: 1 / -1;
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(160px, 280px) auto;
	align-items: center;
	gap: 12px 24px;
	padding: 16px 20px;
	border: 1px dashed var(--rule-strong);
	border-radius: 12px;
	background-color: var(--rule-tint);

	@media (max-width: 767px) {
		grid-template-columns: minmax(0, 1fr);
		justify-items: start;
	}
}

.character-overview__completeness-title {
	text-align: left;
	margin: 0 0 2px;
	font-family: var(--font-ui);
	font-weight: 600;
	font-size: 16px;
	line-height: 22px;
	color: var(--ink-primary);
}

.character-overview__meter {
	position: relative;
	width: 100%;
	height: 8px;
	overflow: hidden;
	border-radius: 999px;
	background-color: var(--rule-soft);
}

.character-overview__meter-fill {
	display: block;
	height: 100%;
	border-radius: inherit;
	background-color: var(--rule-strong);
	transition: width var(--motion-slow) var(--ease-elpis);
}

.character-overview__rail-empty {
	padding: 20px 16px;
}

// Albums (ER2 round 2) ----------------------------------------------------------
.character-overview__albums {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.character-overview__album {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 4px;
	border-radius: 8px;
	color: var(--ink-primary);
	text-decoration: none;

	&:hover {
		background-color: var(--rule-tint);
	}

	&:focus-visible {
		outline: none;
		box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
	}
}

.character-overview__album-cover {
	display: inline-flex;
	flex: 0 0 44px;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	overflow: hidden;
	border-radius: 6px;
	background-color: var(--rule-tint);
	color: var(--ink-muted);

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.character-overview__album-text {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.character-overview__album-title {
	overflow: hidden;
	font-family: var(--font-ui);
	font-weight: 600;
	font-size: 14px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.character-overview__album-meta {
	font-family: var(--font-ui);
	font-size: 12px;
	color: var(--ink-muted);
}


// Fact tiles -----------------------------------------------------------------
.character-overview__facts {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12px;
	margin: 0;
	padding: 0;
	list-style: none;

	@media (max-width: 767px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 419px) {
		grid-template-columns: minmax(0, 1fr);
	}
}

.character-overview__fact {
	display: grid;
	grid-template-columns: auto minmax(0, 1fr);
	grid-template-areas:
		'icon label'
		'icon value';
	column-gap: 12px;
	row-gap: 2px;
	align-items: start;
	padding: 14px 16px;
	border: 1px solid var(--rule-soft);
	border-radius: 12px;
	background-color: var(--vision-card);
}

.character-overview__fact-slot {
	display: flex;
}

.character-overview__fact--add {
	flex: 1 1 auto;
	border-style: dashed;
	border-color: var(--rule-strong);
	background-color: transparent;
	color: var(--ink-primary);
	text-decoration: none;
	transition: background-color var(--motion-fast) var(--ease-elpis);

	.character-overview__fact-value {
		color: var(--ink-link);
		font-weight: 600;
	}

	&:hover {
		background-color: var(--rule-tint);
	}

	&:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 2px var(--glow-aether),
			0 0 0 3px var(--vision-focus-edge);
	}
}

.character-overview__fact-icon {
	grid-area: icon;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background-color: var(--rule-tint);
	color: var(--ink-link);
	font-size: 20px;
}

.character-overview__fact-label {
	grid-area: label;
	font-family: var(--font-ui);
	font-weight: 600;
	font-size: 11px;
	line-height: 16px;
	letter-spacing: 1.4px;
	text-transform: uppercase;
	color: var(--ink-muted);
}

.character-overview__fact-value {
	grid-area: value;
	font-family: var(--font-ui);
	font-size: 15px;
	line-height: 1.45;
	color: var(--ink-primary);
	overflow-wrap: anywhere;
	white-space: pre-line;
}

// Background with drop cap ---------------------------------------------------
.character-overview__background {
	padding: 28px 32px;
	border-radius: 12px;

	@media (max-width: 599px) {
		padding: 20px 18px;
	}
}

.character-overview__prose {
	font-family: var(--font-body, var(--font-section));
	font-size: 17px;
	line-height: 1.7;

	:deep(> p:first-of-type::first-letter) {
		float: left;
		margin: 6px 10px 0 0;
		font-family: var(--font-ornament, var(--font-display));
		font-size: 3.4em;
		line-height: 0.8;
		color: var(--ink-link);
	}

	:deep(> p:last-child) {
		margin-bottom: 0;
	}
}

.character-overview__carrd {
	border: none;
	min-height: 380px;
}

// Diary ----------------------------------------------------------------------
.character-overview__diary {
	position: relative;
	padding: 20px 24px;
	border-radius: 12px;
	transition: border-color var(--motion-fast) var(--ease-elpis);

	&:hover,
	&:focus-within {
		border-color: var(--rule-strong);
	}
}

.character-overview__diary--image {
	overflow: hidden;
}

.character-overview__diary-image {
	display: block;
	width: calc(100% + 48px);
	max-width: none;
	height: 200px;
	margin: -20px -24px 16px;
	object-fit: cover;
	border-bottom: 1px solid var(--rule-soft);

	@media (max-width: 599px) {
		height: 150px;
	}
}

.character-overview__diary-title {
	margin: 0;
	font-family: var(--font-display);
	font-weight: 500;
	font-size: 20px;
	line-height: 1.3;
	letter-spacing: 0;
}

.character-overview__stretched {
	color: var(--ink-primary);
	text-decoration: none;

	&::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 2;
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

.character-overview__diary-excerpt {
	margin: 8px 0 0;
	font-family: var(--font-lore);
	font-size: 16px;
	line-height: 1.55;
	color: var(--ink-muted);
	display: -webkit-box;
	-webkit-line-clamp: 4;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.character-overview__more {
	display: inline-block;
	margin-top: 10px;
	font-family: var(--font-ui);
	font-weight: 600;
	font-size: 14px;
	color: var(--ink-link);
	text-decoration: none;
	border-radius: 4px;

	&:hover {
		text-decoration: underline;
	}

	&:focus-visible {
		outline: none;
		text-decoration: underline;
		box-shadow:
			0 0 0 2px var(--glow-aether),
			0 0 0 3px var(--vision-focus-edge);
	}
}

// Rail cards -----------------------------------------------------------------
.character-overview__card {
	padding: 18px 20px 20px;
	border: 1px solid var(--rule-soft);
	border-radius: 12px;
	background-color: var(--vision-card);
}

.character-overview__card-head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 12px;

	.character-overview__more {
		margin-top: 0;
	}
}

.character-overview__card-title {
	text-align: left;
	margin: 0;
	font-family: var(--font-display);
	font-weight: 500;
	font-size: 18px;
	line-height: 1.3;
	letter-spacing: 0;
	color: var(--ink-primary);
}

.character-overview__card-text {
	margin: 0;
	font-family: var(--font-ui);
	font-size: 14px;
	line-height: 1.5;
	color: var(--ink-muted);
}

.character-overview__rumor {
	margin: 0;
	padding: 12px 0;
	border-top: 1px solid var(--rule-soft);

	&:first-of-type {
		padding-top: 0;
		border-top: 0;
	}
}

.character-overview__rumor-text {
	margin: 0 0 8px;
	padding: 0;
	font-family: var(--font-lore);
	font-style: italic;
	font-size: 16px;
	line-height: 1.5;
	color: var(--ink-primary);

	&::before {
		content: '„';
	}

	&::after {
		content: '“';
	}
}

.character-overview__pill {
	display: inline-flex;
	align-items: center;
	height: 22px;
	padding: 0 10px;
	border-radius: 999px;
	font-family: var(--font-ui);
	font-weight: 600;
	font-size: 12px;
	line-height: 1;
	color: var(--ink-primary);
	background-color: var(--rule-tint);
	border: 1px solid var(--rule-soft);
}

.character-overview__pill--common {
	background-color: var(--vision-live-bg);
	border-color: transparent;
	color: var(--vision-live-text);
}

.character-overview__pill--rare {
	background-color: var(--vision-cw-bg);
	border-color: var(--vision-cw-border);
	color: var(--vision-cw-text);
}

.character-overview__contacts {
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.character-overview__contact {
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
}

.character-overview__monogram {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background-color: var(--rule-tint);
	box-shadow: 0 0 0 2px var(--rule-strong);
	color: var(--ink-primary);
	font-family: var(--font-display);
	font-size: 16px;
}

.character-overview__monogram--avatar {
	object-fit: cover;
}

.character-overview__contact-text {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.character-overview__contact-name {
	font-family: var(--font-ui);
	font-weight: 600;
	font-size: 15px;
	line-height: 20px;
	color: var(--ink-link);
	text-decoration: none;
	overflow-wrap: anywhere;

	&:hover {
		text-decoration: underline;
	}

	&:focus-visible {
		outline: none;
		text-decoration: underline;
		box-shadow:
			0 0 0 2px var(--glow-aether),
			0 0 0 3px var(--vision-focus-edge);
	}
}

.character-overview__contact-relation {
	font-family: var(--font-ui);
	font-size: 13px;
	line-height: 18px;
	color: var(--ink-muted);
}

.character-overview__thumbs {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 8px;
}

.character-overview__thumb {
	display: block;
	aspect-ratio: 1 / 1;
	overflow: hidden;
	border-radius: 8px;
	background-color: var(--surface-raised);

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform var(--motion-base) var(--ease-elpis);
	}

	&:hover img {
		transform: scale(1.04);
	}

	&:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 2px var(--glow-aether),
			0 0 0 3px var(--vision-focus-edge);
	}
}
</style>
