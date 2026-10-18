<template>
  <q-page class="page-wiki-index">
    <page-head :eyebrow="eyebrow" title="Das Wissen von Elpisgarten" lead="Orte, Gruppen, Legenden und alles, was Eorzea auf Light ausmacht.">
      <template v-if="canCreate" #actions>
        <q-btn class="elpis-btn elpis-btn--primary" unelevated no-caps icon="add" label="Eintrag anlegen" to="/create-wiki-page" />
      </template>
    </page-head>

    <section class="page-wiki-index__guides" aria-labelledby="wiki-guides">
      <h2 id="wiki-guides" class="page-wiki-index__label">Wissenswertes</h2>
      <ul class="page-wiki-index__guide-list">
        <li v-for="link in guideLinks" :key="link.to">
          <router-link :to="link.to" class="page-wiki-index__guide">
            <q-icon :name="link.icon" size="20px" aria-hidden="true" />
            <span>{{ link.label }}</span>
          </router-link>
        </li>
      </ul>
    </section>

    <template v-if="pages.length">
      <div class="page-wiki-index__toolbar" role="search">
        <q-input
          v-model="searchQuery"
          class="page-wiki-index__search"
          outlined
          dense
          clearable
          debounce="150"
          placeholder="Einträge filtern"
          aria-label="Wiki-Einträge filtern"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>

      <section v-if="!query" class="page-wiki-index__recent" aria-labelledby="wiki-recent">
        <h2 id="wiki-recent" class="page-wiki-index__label">Zuletzt bearbeitet</h2>
        <ul class="page-wiki-index__recent-list">
          <li v-for="page in recentPages" :key="page.title">
            <router-link :to="pageLink(page.title)" class="page-wiki-index__recent-card">
              <span class="page-wiki-index__recent-title">{{ page.title }}</span>
              <span class="page-wiki-index__recent-meta">{{ $display.relativeTime(page.updatedAt) }}</span>
            </router-link>
          </li>
        </ul>
      </section>

      <section class="page-wiki-index__all" aria-labelledby="wiki-all">
        <h2 id="wiki-all" class="page-wiki-index__label">
          {{ query ? `${filteredPages.length} Treffer` : 'Alle Einträge von A bis Z' }}
        </h2>
        <div v-if="letterGroups.length" class="page-wiki-index__letters">
          <section v-for="group in letterGroups" :key="group.letter" class="page-wiki-index__letter" :aria-label="`Buchstabe ${group.letter}`">
            <h3 class="page-wiki-index__letter-head" aria-hidden="true">{{ group.letter }}</h3>
            <ul>
              <li v-for="page in group.pages" :key="page.title">
                <router-link :to="pageLink(page.title)" class="page-wiki-index__entry">{{ page.title }}</router-link>
              </li>
            </ul>
          </section>
        </div>
        <empty-state
          v-else
          icon="search_off"
          title="Kein Eintrag gefunden"
          text="Versuche einen anderen Begriff oder lege den Eintrag an."
          :action-label="canCreate ? 'Eintrag anlegen' : ''"
          :action-to="{ path: '/create-wiki-page' }"
        />
      </section>
    </template>

    <empty-state
      v-else-if="!loading"
      icon="menu_book"
      :title="failed ? 'Das Verzeichnis ist gerade nicht verfügbar' : 'Noch keine Einträge'"
      :text="failed ? 'Einzelne Einträge findest du über die Suche (Strg K) oder über Verweise in Profilen und Geschichten.' : 'Leg den ersten Eintrag im Wiki an.'"
      :action-label="canCreate ? 'Eintrag anlegen' : ''"
      :action-to="{ path: '/create-wiki-page' }"
    />
  </q-page>
</template>

<script lang="ts">
import type { WikiPageListItem } from '@common/common/api/wiki-api';
import { wikify } from '@common/common/wikilinks';
import EmptyState from 'components/vision/EmptyState.vue';
import PageHead from 'components/vision/PageHead.vue';
import { WIKI_LINKS } from 'src/layouts/shell/nav';
import { Options, Vue } from 'vue-class-component';

// ER2-609 — wiki index: "Wissenswertes" guide links, recently edited pages
// and an A–Z list of all published pages (GET /wiki). Wiki pages have no
// categories, so there is no category block. Against an API without the
// list endpoint the page keeps the guide links and points to the search.

const RECENT_LIMIT = 8;

interface LetterGroup {
  letter: string;
  pages: WikiPageListItem[];
}

@Options({
  name: 'PageWikiIndex',
  components: {
    EmptyState,
    PageHead,
  },
})
export default class PageWikiIndex extends Vue {
  pages: WikiPageListItem[] = [];
  loading = true;
  failed = false;
  searchQuery = '';

  readonly guideLinks = WIKI_LINKS.filter((link) => link.to !== '/wiki');

  get canCreate(): boolean {
    return this.$store.getters.isTrusted;
  }

  get eyebrow(): string {
    const count = this.pages.length;
    return count ? `Wiki · ${count.toLocaleString('de-DE')} ${count === 1 ? 'Eintrag' : 'Einträge'}` : 'Wiki';
  }

  get query(): string {
    return (this.searchQuery || '').trim().toLowerCase();
  }

  get recentPages(): WikiPageListItem[] {
    return [ ...this.pages ].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, RECENT_LIMIT);
  }

  get filteredPages(): WikiPageListItem[] {
    const sorted = [ ...this.pages ].sort((a, b) => a.title.localeCompare(b.title, 'de'));
    return this.query ? sorted.filter((page) => page.title.toLowerCase().includes(this.query)) : sorted;
  }

  get letterGroups(): LetterGroup[] {
    const groups: LetterGroup[] = [];

    this.filteredPages.forEach((page) => {
      const first = page.title.trim().charAt(0).toLocaleUpperCase('de-DE');
      const letter = /[A-ZÄÖÜ]/.test(first) ? first.replace('Ä', 'A').replace('Ö', 'O').replace('Ü', 'U') : '#';
      let group = groups.find((item) => item.letter === letter);

      if (!group) {
        group = { letter, pages: [] };
        groups.push(group);
      }

      group.pages.push(page);
    });

    return groups.sort((a, b) => (a.letter === '#' ? 1 : b.letter === '#' ? -1 : a.letter.localeCompare(b.letter)));
  }

  async created() {
    document.title = 'Wiki — Elpisgarten';

    try {
      this.pages = await this.$api.wiki.getWikiPages(500);
    } catch {
      this.failed = true;
    } finally {
      this.loading = false;
    }
  }

  pageLink(title: string): string {
    return `/wiki/${encodeURIComponent(wikify(title))}`;
  }
}
</script>

<style lang="scss" scoped>
.page-wiki-index {
  color: var(--ink-primary);
}

.page-wiki-index__label {
  text-align: left;
  margin: 0 0 12px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  font-weight: 700;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-muted);
  line-height: 1.4;
}

.page-wiki-index__guides {
  margin: 8px 0 28px;
}

.page-wiki-index__guide-list,
.page-wiki-index__recent-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.page-wiki-index__guide-list {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

.page-wiki-index__recent-list {
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.page-wiki-index__guide,
.page-wiki-index__recent-card {
  display: flex;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background: var(--vision-card);
  color: var(--ink-primary);
  text-decoration: none;
  font-family: var(--font-ui);
  transition: border-color var(--motion-fast) var(--ease-elpis);

  &:hover {
    border-color: var(--rule-strong);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.page-wiki-index__guide {
  align-items: center;
  font-weight: 600;

  .q-icon {
    color: var(--ink-link);
  }
}

.page-wiki-index__recent-card {
  flex-direction: column;
  gap: 4px;
  height: 100%;
}

.page-wiki-index__recent-title {
  font-family: var(--font-display);
  font-size: var(--type-scale-2);
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.page-wiki-index__recent-meta {
  font-size: var(--type-scale-0);
  color: var(--ink-muted);
}

.page-wiki-index__toolbar {
  margin-bottom: 24px;
}

.page-wiki-index__search {
  max-width: 480px;
}

.page-wiki-index__recent {
  margin-bottom: 32px;
}

.page-wiki-index__letters {
  column-width: 240px;
  column-gap: 32px;
}

.page-wiki-index__letter {
  break-inside: avoid;
  margin-bottom: 20px;

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
}

.page-wiki-index__letter-head {
  margin: 0 0 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--rule-soft);
  font-family: var(--font-ornament);
  font-size: var(--type-scale-4);
  font-weight: 500;
  color: var(--ink-link);
}

.page-wiki-index__entry {
  display: inline-block;
  padding: 3px 0;
  font-family: var(--font-body);
  font-size: 1.05rem;
  color: var(--ink-link);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--vision-focus-edge);
    border-radius: 3px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-wiki-index__guide,
  .page-wiki-index__recent-card {
    transition: none;
  }
}
</style>
