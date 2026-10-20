<template>
	<article class="vision-dir-card" :class="{ 'vision-dir-card--link': !!to }">
		<div class="vision-dir-card__banner">
			<img v-if="bannerSrc" class="vision-dir-card__banner-img" :src="bannerSrc" alt="" loading="lazy" />
		</div>
		<div class="vision-dir-card__body">
			<div class="vision-dir-card__head">
				<span class="vision-dir-card__avatar" :class="`vision-dir-card__avatar--${avatarShape}`">
					<!-- Optional custom avatar content, e.g. a layered FC crest
					     (64 px fits inside the 68 px frame with its 2 px border). -->
					<slot v-if="$slots.avatar" name="avatar" />
					<img
						v-else-if="avatarSrc"
						class="vision-dir-card__avatar-img"
						:src="avatarSrc"
						:alt="avatarAlt || title"
						loading="lazy"
					/>
					<q-icon v-else class="vision-dir-card__avatar-placeholder" :name="placeholderIcon" aria-hidden="true" />
				</span>
				<div v-if="$slots.badges" class="vision-dir-card__badges">
					<slot name="badges" />
				</div>
			</div>
			<h3 class="vision-dir-card__title">
				<router-link v-if="to" class="vision-dir-card__link" :to="to">{{ title }}</router-link>
				<template v-else>{{ title }}</template>
			</h3>
			<p v-if="subtitle" class="vision-dir-card__subtitle">{{ subtitle }}</p>
			<p v-if="meta" class="vision-dir-card__meta">{{ meta }}</p>
			<div v-if="$slots.default" class="vision-dir-card__content">
				<slot />
			</div>
			<div v-if="$slots.tags" class="vision-dir-card__tags">
				<slot name="tags" />
			</div>
		</div>
		<footer v-if="$slots.footer" class="vision-dir-card__footer">
			<slot name="footer" />
		</footer>
	</article>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import type { RouteLocationRaw } from 'vue-router';

// ER2-007 — directory tile for characters, free companies, communities,
// venues. When `to` is set the title link is stretched over the whole card;
// interactive content in the badges/tags/footer slots stays clickable above
// it (those slots sit on a higher layer). The default slot stays under the
// link, so keep it to plain text.
//
// Not built on AetheryteBadge: the directory avatar is 68 px with a 3 px
// --rule-strong ring and a crest shape, which AetheryteBadge's fixed sizes
// and stamped chrome do not cover.

class Props {
	to = prop<RouteLocationRaw | null>({ default: null });
	bannerSrc = prop<string>({ default: '' });
	avatarSrc = prop<string>({ default: '' });
	avatarAlt = prop<string>({ default: '' });
	avatarShape = prop<'round' | 'crest'>({ default: 'round' });
	placeholderIcon = prop<string>({ default: 'person' });
	title = prop<string>({ required: true });
	subtitle = prop<string>({ default: '' });
	meta = prop<string>({ default: '' });
}

@Options({
	name: 'DirectoryCard',
})
export default class DirectoryCard extends Vue.with(Props) {}
</script>

<style lang="scss" scoped>
.vision-dir-card {
	position: relative;
	display: flex;
	flex-direction: column;
	min-width: 0;
	overflow: hidden;
	background-color: var(--vision-card);
	border: 1px solid var(--rule-soft);
	border-radius: 12px;
	box-shadow: 0 1px 2px var(--rule-tint), 0 6px 18px var(--rule-tint);
	color: var(--ink-primary);
	transition:
		transform var(--motion-fast) var(--ease-elpis),
		box-shadow var(--motion-fast) var(--ease-elpis),
		border-color var(--motion-fast) var(--ease-elpis);
}

.vision-dir-card--link:hover,
.vision-dir-card--link:focus-within {
	transform: translateY(-2px);
	border-color: var(--rule-strong);
	box-shadow: 0 2px 4px var(--rule-tint), 0 12px 28px var(--rule-soft);
}

.vision-dir-card__banner {
	height: 104px;
	background:
		linear-gradient(135deg, var(--rule-soft), var(--rule-tint)),
		var(--surface-raised);
}

.vision-dir-card__banner-img {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.vision-dir-card__body {
	display: flex;
	flex-direction: column;
	gap: 4px;
	flex: 1 1 auto;
	padding: 0 16px 16px;
}

.vision-dir-card__head {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 8px;
	margin-top: -34px;
	margin-bottom: 8px;
}

.vision-dir-card__avatar {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	width: 68px;
	height: 68px;
	overflow: hidden;
	background-color: var(--surface-raised);
	box-shadow: 0 0 0 3px var(--rule-strong);
	border: 2px solid var(--vision-card);
	color: var(--ink-muted);
}

.vision-dir-card__avatar--round {
	border-radius: 50%;
}

// Crest: shield-like rounded square for free companies / communities.
.vision-dir-card__avatar--crest {
	border-radius: 12px 12px 34px 34px;
}

.vision-dir-card__avatar-img {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.vision-dir-card__avatar-placeholder {
	font-size: 32px;
}

.vision-dir-card__badges,
.vision-dir-card__tags,
.vision-dir-card__footer {
	position: relative;
	z-index: 2;
}

.vision-dir-card__badges {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 6px;
	padding-bottom: 4px;
}

.vision-dir-card__title {
	margin: 0;
	font-family: var(--font-display);
	font-weight: 500;
	font-size: 18px;
	line-height: 1.3;
	letter-spacing: 0;
	color: var(--ink-primary);
	overflow-wrap: anywhere;
}

.vision-dir-card__link {
	color: inherit;
	text-decoration: none;

	// Stretched link: the whole card is the hit area.
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

.vision-dir-card__subtitle {
	margin: 0;
	font-family: var(--font-lore);
	font-style: italic;
	font-size: 15px;
	line-height: 1.4;
	color: var(--ink-muted);
}

.vision-dir-card__meta {
	margin: 2px 0 0;
	font-family: var(--font-ui);
	font-size: 13px;
	line-height: 18px;
	color: var(--ink-muted);
}

.vision-dir-card__content {
	margin-top: 8px;
	font-family: var(--font-ui);
	font-size: 14px;
	line-height: 1.5;
}

.vision-dir-card__tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-top: 10px;
}

.vision-dir-card__footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 10px 16px;
	border-top: 1px solid var(--rule-soft);
	font-family: var(--font-ui);
	font-size: 13px;
	color: var(--ink-muted);
}
</style>
