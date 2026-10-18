<template>
	<section class="home-feed" aria-labelledby="home-feed-title">
		<div class="home-feed__head">
			<h3 id="home-feed-title" class="home-feed__title">Neu in der Community</h3>
			<div class="home-feed__chips" role="group" aria-label="Nach Bereich filtern">
				<button
					v-for="chip in chips"
					:key="chip.key"
					type="button"
					class="home-feed__chip"
					:class="{ 'home-feed__chip--active': chip.key === activeKey }"
					:aria-pressed="chip.key === activeKey ? 'true' : 'false'"
					@click="selectChip(chip.key)"
				>
					{{ chip.label }}
				</button>
			</div>
		</div>

		<ul v-if="loading && !rows.length" class="home-feed__list" aria-busy="true" aria-label="Aktivität wird geladen">
			<li v-for="n in limit" :key="n" class="home-feed__row">
				<q-skeleton type="QAvatar" size="40px" />
				<div class="home-feed__body">
					<q-skeleton type="text" width="75%" />
					<q-skeleton type="text" width="30%" />
				</div>
			</li>
		</ul>

		<p v-else-if="failed" class="home-feed__note">Die Aktivität konnte gerade nicht geladen werden.</p>

		<p v-else-if="!rows.length" class="home-feed__note">In diesem Bereich hat sich zuletzt nichts getan.</p>

		<ul v-else class="home-feed__list" :class="{ 'home-feed__list--busy': loading }" :aria-busy="loading ? 'true' : 'false'">
			<li v-for="row in rows" :key="row.id" class="home-feed__row">
				<q-avatar round size="40px" class="home-feed__avatar">
					<img v-if="row.avatar" :src="row.avatar" alt="" loading="lazy" />
					<q-icon v-else :name="row.icon" size="20px" aria-hidden="true" />
				</q-avatar>
				<div class="home-feed__body">
					<p class="home-feed__sentence">
						<template v-if="row.lead">
							<strong class="home-feed__author">{{ row.lead }}</strong>{{ ' ' }}
						</template>
						<span>{{ row.before }}</span>
						<router-link class="home-feed__link" :to="row.link">{{ row.linkText }}</router-link>
						<span>{{ row.after }}</span>
					</p>
					<p class="home-feed__meta">
						<q-icon :name="row.icon" size="14px" aria-hidden="true" />
						<span>{{ row.areaLabel }}</span>
						<span aria-hidden="true">·</span>
						<time :datetime="row.iso">{{ row.relative }}</time>
					</p>
				</div>
				<img v-if="row.thumb" class="home-feed__thumb" :src="row.thumb" alt="" loading="lazy" />
			</li>
		</ul>

		<div class="home-feed__foot">
			<q-btn
				class="elpis-btn elpis-btn--ghost"
				flat
				dense
				no-caps
				to="/changes"
				icon-right="arrow_forward"
				label="Alle Änderungen"
			/>
		</div>
	</section>
</template>

<script lang="ts">
import { ChangeItemDto } from '@app/shared/dto/changes/change-item.dto';
import { ChangeArea } from '@app/shared/enums/change-area.enum';
import { ChangeType } from '@app/shared/enums/change-type.enum';
import { DateTime } from 'luxon';
import { Options, prop, Vue } from 'vue-class-component';

// ER2-305 — activity feed from GET /changes: one sentence per change
// ("Name hat die Geschichte „…“ veröffentlicht"), area filter chips,
// relative time. Avatars and image thumbs are added when the home already
// knows them (new profiles, new images); the change DTO carries neither.

type ChipKey = 'all' | ChangeArea;

interface FeedRow {
	id: string;
	lead: string;
	before: string;
	linkText: string;
	after: string;
	link: string;
	icon: string;
	areaLabel: string;
	avatar: string | null;
	thumb: string | null;
	relative: string;
	iso: string;
}

const AREA_ICONS: Record<ChangeArea, string> = {
	[ChangeArea.PROFILE]: 'person',
	[ChangeArea.VENUE]: 'storefront',
	[ChangeArea.COMMUNITY]: 'groups',
	[ChangeArea.FREE_COMPANY]: 'shield',
	[ChangeArea.STORY]: 'auto_stories',
	[ChangeArea.NOTICEBOARD]: 'campaign',
	[ChangeArea.EVENT]: 'event',
	[ChangeArea.MEDIA]: 'photo_library',
};

const AREA_LABELS: Record<ChangeArea, string> = {
	[ChangeArea.PROFILE]: 'Profil',
	[ChangeArea.VENUE]: 'Treffpunkt',
	[ChangeArea.COMMUNITY]: 'Community',
	[ChangeArea.FREE_COMPANY]: 'Freie Gesellschaft',
	[ChangeArea.STORY]: 'Geschichte',
	[ChangeArea.NOTICEBOARD]: 'Anschlagbrett',
	[ChangeArea.EVENT]: 'Event',
	[ChangeArea.MEDIA]: 'Galerie',
};

/** [article + noun] used in the sentence, by area. */
function nounFor(item: ChangeItemDto): string {
	switch (item.area) {
		case ChangeArea.VENUE:
			return 'den Treffpunkt';
		case ChangeArea.COMMUNITY:
			return 'die Community';
		case ChangeArea.FREE_COMPANY:
			return 'die Freie Gesellschaft';
		case ChangeArea.STORY:
			return 'die Geschichte';
		case ChangeArea.NOTICEBOARD:
			return 'den Aushang';
		case ChangeArea.EVENT:
			return 'das Event';
		case ChangeArea.MEDIA:
			return (item.summary || '').startsWith('Kunstwerk') ? 'das Kunstwerk' : 'den Screenshot';
		default:
			return 'das Profil';
	}
}

function verbFor(item: ChangeItemDto): string {
	if (item.type === ChangeType.UPDATED) {
		return 'aktualisiert';
	}
	switch (item.area) {
		case ChangeArea.PROFILE:
			return 'angelegt';
		case ChangeArea.EVENT:
			return 'eingetragen';
		case ChangeArea.VENUE:
			return 'eröffnet';
		case ChangeArea.COMMUNITY:
		case ChangeArea.FREE_COMPANY:
			return 'gegründet';
		default:
			return 'veröffentlicht';
	}
}

class Props {
	/** First page for "Alles", loaded with the home page. */
	initialItems = prop<ChangeItemDto[]>({ default: () => [] });
	/** Character name → avatar URL (e.g. from the new profiles). */
	avatars = prop<Record<string, string>>({ default: () => ({}) });
	/** Image id → thumb URL (new screenshots and artwork). */
	thumbs = prop<Record<number, string>>({ default: () => ({}) });
	limit = prop<number>({ default: 8 });
}

@Options({
	name: 'HomeActivityFeed',
	watch: {
		initialItems(items: ChangeItemDto[]) {
			const self = this as HomeActivityFeed;
			if (self.activeKey === 'all') {
				self.items = items;
			}
		},
	},
})
export default class HomeActivityFeed extends Vue.with(Props) {
	activeKey: ChipKey = 'all';
	items: ChangeItemDto[] = [];
	loading = false;
	failed = false;

	private requestId = 0;

	readonly chips: { key: ChipKey; label: string }[] = [
		{ key: 'all', label: 'Alles' },
		{ key: ChangeArea.PROFILE, label: 'Profile' },
		{ key: ChangeArea.STORY, label: 'Geschichten' },
		{ key: ChangeArea.EVENT, label: 'Events' },
		{ key: ChangeArea.VENUE, label: 'Treffpunkte' },
		{ key: ChangeArea.MEDIA, label: 'Galerie' },
	];

	created() {
		this.items = this.initialItems;
	}

	async selectChip(key: ChipKey) {
		if (key === this.activeKey) {
			return;
		}
		this.activeKey = key;
		const requestId = ++this.requestId;
		this.loading = true;
		this.failed = false;
		try {
			const result = await this.$api.changes.getChanges({
				offset: 0,
				limit: this.limit,
				area: key === 'all' ? undefined : key,
			});
			if (requestId === this.requestId) {
				this.items = result.data;
			}
		} catch (e) {
			if (requestId === this.requestId) {
				console.log(e);
				this.failed = true;
				this.items = [];
			}
		} finally {
			if (requestId === this.requestId) {
				this.loading = false;
			}
		}
	}

	get rows(): FeedRow[] {
		return this.items.slice(0, this.limit).map((item) => this.toRow(item));
	}

	toRow(item: ChangeItemDto): FeedRow {
		const verb = verbFor(item);
		const author = (item.author || '').trim();
		const title = (item.title || '').trim();
		let lead = '';
		let before = '';
		let linkText = `„${title}“`;
		let after = ` ${verb}`;

		if (item.area === ChangeArea.PROFILE) {
			linkText = title || author;
			before = '';
			after = ` hat ${item.type === ChangeType.CREATED ? 'ein Profil' : 'das Profil'} ${verb}`;
		} else if (author) {
			lead = author;
			before = `hat ${nounFor(item)} `;
		} else {
			const noun = nounFor(item);
			before = `${noun.charAt(0).toUpperCase()}${noun.slice(1)} `;
			after = ` wurde ${verb}`;
		}

		const happened = DateTime.fromMillis(item.happenedAt);
		const avatarKey = item.area === ChangeArea.PROFILE ? title : author;
		return {
			id: item.id,
			lead,
			before,
			linkText,
			after,
			link: item.link,
			icon: AREA_ICONS[item.area] || 'history',
			areaLabel: AREA_LABELS[item.area] || '',
			avatar: (avatarKey && this.avatars[avatarKey]) || null,
			thumb: item.area === ChangeArea.MEDIA ? this.thumbs[item.entityId] || null : null,
			relative: this.$display.relativeTime(item.happenedAt),
			iso: happened.isValid ? happened.toISO() : '',
		};
	}
}
</script>

<style lang="scss" scoped>
.home-feed {
	display: flex;
	flex-direction: column;
	min-width: 0;
	padding: 18px 20px 10px;
	background-color: var(--vision-card);
	border: 1px solid var(--rule-soft);
	border-radius: 16px;
	color: var(--ink-primary);
}

.home-feed__head {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding-bottom: 8px;
}

.home-feed__title {
	margin: 0;
	font-family: var(--font-display);
	font-size: var(--type-scale-3);
	font-weight: 600;
	line-height: var(--lh-heading);
}

.home-feed__chips {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.home-feed__chip {
	min-height: 32px;
	padding: 4px 14px;
	border: 1px solid var(--rule-strong);
	border-radius: 999px;
	background-color: transparent;
	color: var(--ink-primary);
	font-family: var(--font-ui);
	font-size: 13px;
	font-weight: 600;
	line-height: 20px;
	cursor: pointer;
	transition:
		background-color var(--motion-fast) var(--ease-elpis),
		border-color var(--motion-fast) var(--ease-elpis);

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

.home-feed__chip--active,
.home-feed__chip--active:hover {
	background-color: var(--vision-primary);
	border-color: var(--vision-primary);
	color: var(--vision-on-primary);
}

.home-feed__list {
	margin: 0;
	padding: 0;
	list-style: none;
	transition: opacity var(--motion-fast) var(--ease-elpis);
}

.home-feed__list--busy {
	opacity: 0.6;
}

.home-feed__row {
	position: relative;
	display: grid;
	grid-template-columns: 40px minmax(0, 1fr) auto;
	align-items: center;
	gap: 12px;
	padding: 12px 0;
	border-top: 1px solid var(--rule-soft);

	&:first-child {
		border-top: 0;
	}
}

.home-feed__avatar {
	background-color: var(--rule-tint);
	color: var(--ink-muted);
}

.home-feed__body {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.home-feed__sentence {
	margin: 0;
	font-family: var(--font-ui);
	font-size: 14px;
	line-height: 20px;
	color: var(--ink-primary);
	overflow-wrap: anywhere;
}

.home-feed__author {
	font-weight: 700;
}

.home-feed__link {
	color: var(--ink-link);
	font-weight: 600;
	text-decoration: none;

	// The link covers the whole row.
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

.home-feed__meta {
	display: flex;
	align-items: center;
	gap: 6px;
	margin: 0;
	font-family: var(--font-ui);
	font-size: 12px;
	line-height: 16px;
	color: var(--ink-muted);
}

.home-feed__thumb {
	display: block;
	width: 48px;
	height: 48px;
	border-radius: 8px;
	object-fit: cover;
	background-color: var(--rule-tint);
}

.home-feed__note {
	margin: 0;
	padding: 16px 0;
	font-family: var(--font-section);
	font-style: italic;
	color: var(--ink-muted);
}

.home-feed__foot {
	display: flex;
	justify-content: flex-end;
	margin-top: auto;
	padding-top: 6px;
	border-top: 1px solid var(--rule-soft);
}

@media (prefers-reduced-motion: reduce) {
	.home-feed__chip,
	.home-feed__list {
		transition: none;
	}
}
</style>
