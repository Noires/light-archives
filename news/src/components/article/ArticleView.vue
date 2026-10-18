<template>
	<section class="article">
		<header class="article__header">
			<h2 class="article__title">
				<router-link v-if="isDraft" :to="link">{{ article.title }}</router-link>
				<template v-else>{{ article.title }}</template>
			</h2>
			<div v-if="article.subtitle" class="article__subtitle">{{ article.subtitle }}</div>
			<div class="article__author">
				von <a :href="authorLink" target="_blank">{{ article.author.pseudonym }}</a>
			</div>
		</header>

		<triskelion-divider class="article__divider" />

		<section
			class="article__body mat-parchment"
			:class="{ 'article__body--drop-cap': hasDropCap }"
		>
			<div class="article__content" v-html="article.content"></div>
		</section>
	</section>
</template>

<script lang="ts">
import { NewsArticleDto } from '@app/shared/dto/news/news-article.dto';
import SharedConstants from '@app/shared/SharedConstants';
import { DateTime } from 'luxon';
import { CHAOS_ARCHIVES_ROOT } from 'src/common/interop';
import { Options, prop, Vue } from 'vue-class-component';
import TriskelionDivider from 'src/components/aetherium/TriskelionDivider.vue';

const DROP_CAP_WORD_THRESHOLD = 200;

class Props {
	article = prop<NewsArticleDto>({
		required: true
	});
}

@Options({
	name: 'ArticleView',
	components: {
		TriskelionDivider,
	},
})
export default class ArticleView extends Vue.with(Props) {
	get isDraft() {
		return !!this.article.publishedAt;
	}

	get link() {
		const dateTime = DateTime.fromMillis(this.article.publishedAt!, {
			zone: SharedConstants.FFXIV_SERVER_TIMEZONE
		});
		const year = dateTime.year;
		const month = this.pad2(dateTime.month);
		const day = this.pad2(dateTime.day);
		return `/${year}/${month}/${day}/${this.article.slug}`;
	}

	private pad2(n: number): string {
		return n >= 10 ? n.toString() : `0${n}`;
	}

	get authorLink() {
		const name = this.article.author.name.replace(/ /g, '_');
		const server = this.article.author.server;
		return `${CHAOS_ARCHIVES_ROOT}/${server}/${name}`;
	}

	get hasDropCap(): boolean {
		const stripped = (this.article.content || '').replace(/<[^>]*>/g, ' ');
		const wordCount = stripped.split(/\s+/).filter(Boolean).length;
		return wordCount >= DROP_CAP_WORD_THRESHOLD;
	}
}
</script>

<style lang="scss">
.article {
	flex-basis: 0;
	flex-grow: 1;
	margin-right: 20px;
}

.article__header {
	text-align: center;
	margin-bottom: 0.6rem;
}

.article__title {
	margin-top: 0;
	margin-bottom: 0.4rem;
	font-family: 'Cinzel', var(--font-display), serif;
	font-weight: 600;
	letter-spacing: var(--ls-display);
	line-height: var(--lh-display);
	color: var(--surface-ink);
}

.article__title a {
	color: inherit;
	border: inherit;
}

.article__title a:hover {
	color: var(--rule-gold);
}

// ELPIS-704 — Subtitle reads in IM Fell English italic via --font-lore.
// IM Fell isn't loaded until ELPIS-001 self-hosts; the chain falls through
// to Spectral italic → serif and picks up IM Fell automatically afterward.
.article__subtitle {
	font-family: var(--font-lore);
	font-style: italic;
	font-size: var(--type-scale-3);
	line-height: var(--lh-body);
	color: var(--ink-muted);
	margin-bottom: 0.4rem;
}

.article__author {
	font-family: var(--font-ui);
	font-size: var(--type-scale-1);
	letter-spacing: var(--ls-eyebrow);
	text-transform: uppercase;
	color: var(--ink-muted);
}

.article__author a {
	color: var(--rule-gold);
	border-bottom: none;
}

.article__divider {
	margin: 18px auto 18px;
	max-width: 320px;
}

// Parchment body — same idiom as Story (501) / Wiki (506). Padding tuned to
// the parchment's 1.6-em ruled-line baseline so paragraph copy aligns with
// the printed-page texture.
.article__body {
	padding: 28px 32px;
	margin-bottom: 4rem;
}

.article__body .article__content {
	font-family: var(--font-body);
	line-height: var(--lh-body);
}

// "Column rules preserved" — the legacy column-rule between split-flow
// columns reads through to the new Parchment surface. The actual `columns`
// setting is owned by parent contexts (EditArticle preview applies
// `columns: 2`); we only tune the visible rule colour to match the gold
// rule family.
.article__body .article__content {
	column-rule: 1px solid var(--rule-gold-soft);
	column-gap: 28px;
}

// ELPIS-704 drop cap on long-form articles (>= 200 words). Mirrors the
// Story view treatment from ELPIS-502 — Cinzel Eorzea ornament, three-line
// drop, mobile shrinks to ~2.4 lines. Replaces the legacy global
// `.article__content p:first-child::first-letter` rule in app.scss.
.article__body--drop-cap .article__content > p:first-of-type::first-letter {
	float: left;
	font-family: var(--font-ornament);
	font-size: 4.4em;
	line-height: 0.9;
	margin: 0.06em 0.12em 0 0;
	padding: 0;
	color: var(--rule-gold);
	text-shadow: 0 1px 0 rgba(255, 255, 255, 0.45);
	letter-spacing: -0.02em;
	font-weight: 500;
}

body.body--dark {
	.article__title {
		color: var(--ink-luminous);
	}

	.article__title a:hover {
		color: var(--glow-aether-d);
	}

	.article__subtitle,
	.article__author {
		color: rgba(236, 227, 247, 0.74);
	}

	.article__author a {
		color: var(--glow-aether-d);
	}

	.article__body .article__content {
		column-rule-color: var(--rule-arcane-soft);
	}

	.article__body--drop-cap .article__content > p:first-of-type::first-letter {
		color: var(--ink-luminous);
		text-shadow: 0 0 18px rgba(184, 165, 255, 0.32);
	}
}

@media screen and (max-width: 600px) {
	.article__body {
		padding: 20px 18px;
	}

	.article__body--drop-cap .article__content > p:first-of-type::first-letter {
		font-size: 3.2em;
		margin-right: 0.10em;
	}
}
</style>
