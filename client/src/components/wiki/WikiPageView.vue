<template>
  <div class="wiki-page-view" :class="{ 'wiki-page-view--with-aside': hasAside, 'wiki-page-view--preview': preview }">
    <aside class="wiki-page-view__toc-rail" aria-label="Inhalt und Aktionen">
      <nav v-if="headings.length > 1" class="wiki-page-view__toc" aria-labelledby="wiki-toc-label">
        <h2 id="wiki-toc-label" class="wiki-page-view__rail-label">Inhalt</h2>
        <ol class="wiki-page-view__toc-list">
          <li
            v-for="heading in headings"
            :key="heading.id"
            class="wiki-page-view__toc-item"
            :class="[`wiki-page-view__toc-item--${heading.level}`, { 'wiki-page-view__toc-item--active': heading.id === activeId }]"
          >
            <a
              :href="`#${heading.id}`"
              class="wiki-page-view__toc-link"
              :aria-current="heading.id === activeId ? 'location' : undefined"
              @click.prevent="scrollToHeading(heading.id)"
            >{{ heading.text }}</a>
          </li>
        </ol>
      </nav>

      <div class="wiki-page-view__rail-meta">
        <p class="wiki-page-view__rail-label">{{ editedLabel }}</p>
        <p class="wiki-page-view__rail-date">{{ editedDate }}</p>
        <q-btn
          v-if="canEdit && wikiPage.id && !preview"
          class="elpis-btn elpis-btn--secondary wiki-page-view__rail-action"
          flat
          no-caps
          icon="edit"
          label="Bearbeiten"
          :to="`/edit-wiki-page/${wikiPage.id}`"
        />
      </div>
    </aside>

    <article class="wiki-page-view__article" :aria-labelledby="titleId">
      <p class="wiki-page-view__eyebrow">
        <span>Wiki</span>
        <span v-if="wikiPage.published === false" class="wiki-page-view__draft">Entwurf · nur für dich sichtbar</span>
      </p>
      <component :is="preview ? 'h2' : 'h1'" :id="titleId" class="wiki-page-view__title">{{ wikiPage.title || 'Ohne Titel' }}</component>
      <p v-if="wikiPage.author" class="wiki-page-view__lede">
        Ein Eintrag von <router-link :to="authorLink">{{ wikiPage.author }}</router-link><template v-if="wikiPage.createdAt">, verfasst am {{ date }}</template>
      </p>

      <triskelion-divider class="wiki-page-view__divider" />

      <section ref="body" class="wiki-page-view__body mat-parchment">
        <html-viewer class="wiki-page-view__content" :content="split.body" />
      </section>

      <footer class="wiki-page-view__meta-footer">
        <span class="wiki-page-view__meta-time">
          <q-icon name="schedule" class="wiki-page-view__meta-icon" aria-hidden="true" />
          {{ editedLabel }} {{ editedRelative }}
        </span>
        <span class="wiki-page-view__meta-permission" :class="permissionClass">
          <q-icon :name="permissionIcon" class="wiki-page-view__meta-icon" aria-hidden="true" />
          {{ permissionLabel }}
        </span>
        <span class="wiki-page-view__license">
          Verfügbar unter der
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC-BY-SA 4.0 Lizenz <q-icon class="external-link-icon" name="launch" aria-hidden="true" /></a>
        </span>
      </footer>
    </article>

    <aside v-if="hasAside" class="wiki-page-view__aside" aria-label="Steckbrief und Verweise">
      <section v-if="split.infobox" class="wiki-page-view__infobox" aria-label="Steckbrief">
        <html-viewer class="wiki-page-view__infobox-content" :content="split.infobox" />
      </section>

      <section v-if="mentionGroups.length" class="wiki-page-view__mentions" aria-labelledby="wiki-mentions-label">
        <h2 id="wiki-mentions-label" class="wiki-page-view__rail-label">Erwähnt in</h2>
        <div v-for="group in mentionGroups" :key="group.key" class="wiki-page-view__mention-group">
          <h3 class="wiki-page-view__mention-heading">
            <q-icon :name="group.icon" size="16px" aria-hidden="true" /> {{ group.label }}
          </h3>
          <ul>
            <li v-for="item in group.items" :key="`${group.key}-${item.id}`">
              <router-link :to="item.link" class="wiki-page-view__mention-link">{{ item.title }}</router-link>
            </li>
          </ul>
        </div>
      </section>
    </aside>
  </div>
</template>

<script lang="ts">
import { WikiPageDto } from '@app/shared/dto/wiki/wiki-page.dto';
import { EditPermission } from '@app/shared/enums/edit-permission.enum';
import html from '@app/shared/html';
import type { WikiMentionItem, WikiMentions } from '@common/common/api/wiki-api';
import { Options, prop, Vue } from 'vue-class-component';
import TriskelionDivider from '../aetherium/TriskelionDivider.vue';
import HtmlViewer from '../common/HtmlViewer.vue';

// ER2-607 — wiki article in three columns: TOC rail (h2/h3 of the content,
// active section follows the scroll position, last edit, "Bearbeiten"),
// article (eyebrow, ELPIS-507 illuminated title, lede, parchment prose with
// the ELPIS-508 wikilink styling) and an aside with the infobox (a table or
// portable infobox at the very start of the content) and "Erwähnt in"
// (GET /wiki/:title/mentions, ER2-608; hidden when the API lacks it).
// There is no page history yet, so "Versionen" is left out.

interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface MentionGroup {
  key: string;
  label: string;
  icon: string;
  items: WikiMentionItem[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'abschnitt';
}

function isBlank(node: Node): boolean {
  if (node.nodeType === Node.TEXT_NODE) {
    return !(node.textContent || '').trim();
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    return true;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    return element.tagName === 'P' && !element.querySelector('img, table') && !(element.textContent || '').replace(/ /g, '').trim();
  }

  return false;
}

function isInfobox(element: Element): boolean {
  const tag = element.tagName;

  if (tag === 'TABLE') {
    return true;
  }

  if (tag === 'FIGURE' && element.children.length === 1 && element.children[0].tagName === 'TABLE') {
    return true;
  }

  return tag === 'ASIDE' && /infobox/i.test(element.className);
}

/** Splits a leading table / infobox off the content. */
function splitInfobox(content: string): { infobox: string; body: string } {
  if (!content || typeof DOMParser === 'undefined') {
    return { infobox: '', body: content || '' };
  }

  const doc = new DOMParser().parseFromString(`<body>${html.sanitize(content)}</body>`, 'text/html');
  const first = Array.from(doc.body.childNodes).find((node) => !isBlank(node));

  if (!first || first.nodeType !== Node.ELEMENT_NODE || !isInfobox(first as Element)) {
    return { infobox: '', body: content };
  }

  const infobox = (first as Element).outerHTML;
  first.parentNode?.removeChild(first);
  return { infobox, body: doc.body.innerHTML };
}

let wikiViewCounter = 0;

class Props {
  wikiPage = prop<WikiPageDto>({
    required: true,
  });

  preview = prop<boolean>({
    default: false,
  });

  canEdit = prop<boolean>({
    default: false,
  });
}

@Options({
  name: 'WikiPageView',
  components: {
    HtmlViewer,
    TriskelionDivider,
  },
  watch: {
    'wikiPage.content'() {
      void (this as WikiPageView).$nextTick(() => (this as WikiPageView).collectHeadings());
    },
    'wikiPage.title'() {
      void (this as WikiPageView).loadMentions();
    },
  },
})
export default class WikiPageView extends Vue.with(Props) {
  readonly titleId = `wiki-title-${++wikiViewCounter}`;

  headings: TocHeading[] = [];
  activeId = '';
  mentions: WikiMentions | null = null;

  private observer: IntersectionObserver | null = null;
  private mentionsToken = 0;

  get split(): { infobox: string; body: string } {
    return splitInfobox(this.wikiPage.content || '');
  }

  get updatedAt(): number {
    return (this.wikiPage as WikiPageDto & { updatedAt?: number }).updatedAt || this.wikiPage.createdAt;
  }

  get wasEdited(): boolean {
    const updatedAt = (this.wikiPage as WikiPageDto & { updatedAt?: number }).updatedAt;
    return !!updatedAt && !!this.wikiPage.createdAt && updatedAt - this.wikiPage.createdAt > 60 * 1000;
  }

  get editedLabel(): string {
    return this.wasEdited ? 'Zuletzt bearbeitet' : 'Verfasst';
  }

  get editedDate(): string {
    return this.updatedAt ? this.$display.formatDate(this.updatedAt) : '';
  }

  get editedRelative(): string {
    return this.updatedAt ? this.$display.relativeTime(this.updatedAt) : '';
  }

  get mentionGroups(): MentionGroup[] {
    if (!this.mentions) {
      return [];
    }

    return [
      { key: 'stories', label: 'Geschichten', icon: 'auto_stories', items: this.mentions.stories || [] },
      { key: 'noticeboard', label: 'Anschlagbrett', icon: 'push_pin', items: this.mentions.noticeboardItems || [] },
      { key: 'events', label: 'Events', icon: 'event', items: this.mentions.events || [] },
    ].filter((group) => group.items.length > 0);
  }

  get hasAside(): boolean {
    return !!this.split.infobox || this.mentionGroups.length > 0;
  }

  get date(): string {
    return this.$display.formatDate(this.wikiPage.createdAt);
  }

  get authorLink(): string {
    const server = this.wikiPage.authorServer || '';
    const character = this.wikiPage.author?.replace(/ /g, '_') || '';
    return `/${server}/${character}`;
  }

  get permissionLabel(): string {
    return this.wikiPage.editPermission === EditPermission.EVERYONE
      ? 'Bearbeitbar von vertrauenswürdigen Mitgliedern'
      : 'Nur vom Autor bearbeitbar';
  }

  get permissionIcon(): string {
    return this.wikiPage.editPermission === EditPermission.EVERYONE ? 'group' : 'lock';
  }

  get permissionClass(): string {
    return this.wikiPage.editPermission === EditPermission.EVERYONE
      ? 'wiki-page-view__meta-permission--everyone'
      : 'wiki-page-view__meta-permission--me';
  }

  mounted() {
    void this.$nextTick(() => this.collectHeadings());
    void this.loadMentions();
  }

  beforeUnmount() {
    this.observer?.disconnect();
    this.observer = null;
  }

  async loadMentions() {
    const token = ++this.mentionsToken;
    this.mentions = null;

    if (this.preview || !this.wikiPage.title || !this.wikiPage.id) {
      return;
    }

    try {
      const mentions = await this.$api.wiki.getMentions(this.wikiPage.title);

      if (token === this.mentionsToken) {
        this.mentions = mentions;
      }
    } catch {
      // Older API without the endpoint: no "Erwähnt in" card.
    }
  }

  collectHeadings() {
    const body = this.$refs.body as HTMLElement | undefined;
    this.observer?.disconnect();
    this.observer = null;

    if (!body) {
      this.headings = [];
      return;
    }

    const used = new Set<string>();
    const elements = Array.from(body.querySelectorAll<HTMLElement>('h2, h3'));

    this.headings = elements
      .map((element) => {
        const text = (element.textContent || '').trim();

        if (!text) {
          return null;
        }

        let id = element.id || `abschnitt-${slugify(text)}`;
        let suffix = 2;

        while (used.has(id)) {
          id = `abschnitt-${slugify(text)}-${suffix++}`;
        }

        used.add(id);
        element.id = id;
        element.setAttribute('tabindex', '-1');
        return { id, text, level: element.tagName === 'H3' ? 3 : 2 } as TocHeading;
      })
      .filter((heading): heading is TocHeading => !!heading);

    this.activeId = this.headings[0]?.id || '';

    if (this.headings.length < 2 || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const navHeight = parseInt(getComputedStyle(document.body).getPropertyValue('--nav-height'), 10) || 68;
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length) {
          this.activeId = (visible[0].target as HTMLElement).id;
        }
      },
      { rootMargin: `-${navHeight + 8}px 0px -65% 0px` },
    );

    elements.forEach((element) => this.observer?.observe(element));
  }

  scrollToHeading(id: string) {
    const element = document.getElementById(id);

    if (!element) {
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const navHeight = parseInt(getComputedStyle(document.body).getPropertyValue('--nav-height'), 10) || 68;
    const top = element.getBoundingClientRect().top + window.scrollY - navHeight - 16;
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    element.focus({ preventScroll: true });
    this.activeId = id;
  }
}
</script>

<style lang="scss" scoped>
.wiki-page-view {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  grid-template-areas: 'toc article';
  gap: 40px;
  align-items: start;
}

.wiki-page-view--with-aside {
  grid-template-columns: 220px minmax(0, 1fr) 280px;
  grid-template-areas: 'toc article aside';
}

.wiki-page-view__toc-rail {
  grid-area: toc;
  position: sticky;
  top: calc(var(--nav-height, 68px) + 24px);
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: var(--font-ui);
}

.wiki-page-view__article {
  grid-area: article;
  min-width: 0;
}

.wiki-page-view__aside {
  grid-area: aside;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.wiki-page-view__rail-label {
  margin: 0 0 8px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  font-weight: 700;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-muted);
  line-height: 1.4;
}

.wiki-page-view__toc-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-left: 1px solid var(--rule-soft);
}

.wiki-page-view__toc-link {
  position: relative;
  display: block;
  padding: 5px 0 5px 14px;
  font-size: var(--type-scale-1);
  line-height: 1.35;
  color: var(--ink-muted);
  text-decoration: none;

  &:hover {
    color: var(--ink-primary);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--vision-focus-edge);
    border-radius: 4px;
  }
}

.wiki-page-view__toc-item--3 .wiki-page-view__toc-link {
  padding-left: 28px;
  font-size: var(--type-scale-0);
}

.wiki-page-view__toc-item--active .wiki-page-view__toc-link {
  color: var(--ink-primary);
  font-weight: 600;

  &::before {
    content: '';
    position: absolute;
    left: -2px;
    top: 4px;
    bottom: 4px;
    width: 3px;
    border-radius: 2px;
    background: var(--vision-primary);
  }
}

.wiki-page-view__rail-meta {
  padding-top: 16px;
  border-top: 1px solid var(--rule-soft);
}

.wiki-page-view__rail-date {
  margin: 0 0 12px;
  font-size: var(--type-scale-1);
  color: var(--ink-primary);
}

.wiki-page-view__rail-action {
  width: 100%;
}

.wiki-page-view__eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  margin: 0 0 8px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  font-weight: 700;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-link);
}

.wiki-page-view__draft {
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px dashed var(--rule-strong);
  color: var(--ink-muted);
  letter-spacing: 0.04em;
  text-transform: none;
}

.wiki-page-view__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: var(--ls-display);
  color: var(--ink-primary);
  overflow-wrap: anywhere;
}

// ELPIS-507 — illuminated initial on the title.
.wiki-page-view__title::first-letter {
  font-family: var(--font-ornament);
  font-size: 1.5em;
  color: var(--rule-gold);
  letter-spacing: 0.01em;
  font-weight: 500;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
}

body.body--dark .wiki-page-view__title::first-letter {
  color: var(--glow-aether-d);
  text-shadow: 0 0 14px rgba(184, 165, 255, 0.32);
}

.wiki-page-view__lede {
  margin: 12px 0 0;
  font-family: var(--font-lore);
  font-style: italic;
  font-size: 1.2rem;
  color: var(--ink-muted);

  a {
    color: var(--ink-link);
  }
}

.wiki-page-view__divider {
  margin: 22px auto 18px;
}

.wiki-page-view__body.mat-parchment {
  padding: 32px 40px;
  margin-bottom: 16px;
}

.wiki-page-view__content {
  font-family: var(--font-body);
  font-size: 1.125rem;
  line-height: 1.75;

  :deep(h2),
  :deep(h3) {
    font-family: var(--font-display);
    line-height: 1.3;
    scroll-margin-top: calc(var(--nav-height, 68px) + 16px);
  }

  :deep(h2:focus),
  :deep(h3:focus) {
    outline: none;
  }
}

// ELPIS-508 — wikilinks: dashed gold underline, solid and glowing on hover.
.wiki-page-view__content :deep(a[href^="/link/"]) {
  color: var(--rule-gold);
  text-decoration: underline;
  text-decoration-style: dashed;
  text-decoration-color: var(--rule-gold-soft);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  border-radius: 2px;
  transition:
    text-decoration-color var(--motion-fast) var(--ease-elpis),
    text-decoration-thickness var(--motion-fast) var(--ease-elpis),
    color var(--motion-fast) var(--ease-elpis),
    box-shadow var(--motion-fast) var(--ease-elpis);
}

.wiki-page-view__content :deep(a[href^="/link/"]:hover) {
  text-decoration-style: solid;
  text-decoration-color: var(--rule-gold);
  text-decoration-thickness: 2px;
  box-shadow: 0 0 0 4px rgba(186, 155, 91, 0.18);
}

body.body--dark .wiki-page-view__content :deep(a[href^="/link/"]) {
  color: var(--glow-aether-d);
  text-decoration-color: var(--rule-arcane-soft);
}

body.body--dark .wiki-page-view__content :deep(a[href^="/link/"]:hover) {
  text-decoration-color: var(--rule-arcane);
  box-shadow: 0 0 0 4px rgba(184, 165, 255, 0.22);
}

// ELPIS-509 — metadata footer with relative time and edit-permission pill.
.wiki-page-view__meta-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding: 6px 4px 0;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  color: var(--ink-muted);
}

.wiki-page-view__meta-time,
.wiki-page-view__meta-permission {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.wiki-page-view__meta-permission {
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid var(--rule-soft);
  background: var(--rule-tint);
  text-transform: uppercase;
  letter-spacing: var(--ls-eyebrow);
}

.wiki-page-view__meta-permission--everyone {
  border-color: var(--rule-strong);
  color: var(--ink-primary);
}

.wiki-page-view__license {
  margin-left: auto;

  a {
    color: var(--ink-link);
  }
}

.wiki-page-view__meta-icon {
  font-size: 14px;
}

.wiki-page-view__infobox {
  overflow: hidden;
  border: 1px solid var(--rule-strong);
  border-radius: 12px;
  background: var(--vision-card);
}

.wiki-page-view__infobox-content {
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
  color: var(--ink-primary);

  :deep(table),
  :deep(aside) {
    width: 100% !important;
    margin: 0;
    border-collapse: collapse;
    border: 0;
    float: none;
  }

  :deep(figure) {
    margin: 0;
  }

  :deep(caption),
  :deep(tr:first-child > th:only-child),
  :deep(.pi-title) {
    padding: 12px 14px;
    background: var(--rule-tint);
    font-family: var(--font-display);
    font-size: var(--type-scale-3);
    font-weight: 600;
    text-align: center;
    color: var(--ink-primary);
  }

  :deep(th),
  :deep(td) {
    padding: 7px 12px;
    border: 0;
    border-top: 1px solid var(--rule-soft);
    vertical-align: top;
    text-align: left;
  }

  :deep(th) {
    width: 38%;
    color: var(--ink-muted);
    font-weight: 600;
  }

  :deep(img) {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 0 auto;
  }

  :deep(a) {
    color: var(--ink-link);
  }
}

.wiki-page-view__mentions {
  padding: 16px 18px;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background: var(--vision-card);
  font-family: var(--font-ui);

  ul {
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
  }
}

.wiki-page-view__mention-group:last-child ul {
  margin-bottom: 0;
}

.wiki-page-view__mention-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 4px;
  font-size: var(--type-scale-1);
  font-weight: 600;
  color: var(--ink-primary);
}

.wiki-page-view__mention-link {
  display: block;
  padding: 4px 0 4px 22px;
  font-size: var(--type-scale-1);
  line-height: 1.35;
  color: var(--ink-link);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--vision-focus-edge);
    border-radius: 4px;
  }
}

@media screen and (max-width: 1279px) {
  .wiki-page-view--with-aside {
    grid-template-columns: 200px minmax(0, 1fr);
    grid-template-areas:
      'toc article'
      'toc aside';
  }
}

@media screen and (max-width: 1023px) {
  .wiki-page-view,
  .wiki-page-view--with-aside {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'article'
      'aside'
      'toc';
  }

  .wiki-page-view__toc-rail {
    position: static;
  }
}

@media screen and (max-width: 600px) {
  .wiki-page-view__body.mat-parchment {
    padding: 20px 18px;
  }

  .wiki-page-view__license {
    margin-left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wiki-page-view__content :deep(a[href^="/link/"]) {
    transition: none;
  }
}
</style>
