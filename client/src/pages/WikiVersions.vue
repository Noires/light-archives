<template>
  <q-page class="page-wiki-versions">
    <breadcrumbs :items="crumbs" />

    <page-head
      eyebrow="Wiki · Versionen"
      :title="wikiPage ? wikiPage.title : 'Versionen'"
      lead="Alle gespeicherten Fassungen dieses Eintrags. Wähle zwei Versionen aus, um sie zu vergleichen."
    >
      <template #actions>
        <q-btn class="elpis-btn elpis-btn--ghost" flat no-caps icon="arrow_back" label="Zum Eintrag" :to="pageLink" />
      </template>
    </page-head>

    <div v-if="loading" class="page-wiki-versions__loading"><q-spinner size="32px" /></div>

    <empty-state
      v-else-if="unavailable"
      icon="history"
      title="Kein Versionsverlauf verfügbar"
      text="Für diesen Eintrag sind noch keine Versionen gespeichert, oder der Server unterstützt den Verlauf noch nicht."
      action-label="Zum Eintrag"
      :action-to="pageLink"
    />

    <template v-else>
      <section class="page-wiki-versions__list-section" aria-labelledby="wiki-versions-list">
        <h2 id="wiki-versions-list" class="page-wiki-versions__label">
          {{ revisions.length === 1 ? '1 Version' : `${revisions.length} Versionen` }}
        </h2>
        <p class="page-wiki-versions__hint" aria-live="polite">{{ selectionHint }}</p>
        <ol class="page-wiki-versions__list">
          <li
            v-for="(revision, index) in revisions"
            :key="revision.id"
            class="page-wiki-versions__row"
            :class="{ 'page-wiki-versions__row--selected': isSelected(revision.id) }"
          >
            <q-checkbox
              class="page-wiki-versions__check"
              :model-value="isSelected(revision.id)"
              :aria-label="`Version vom ${formatDate(revision.createdAt)} zum Vergleich auswählen`"
              @update:model-value="toggle(revision.id)"
            />
            <div class="page-wiki-versions__row-main">
              <p class="page-wiki-versions__row-head">
                <span class="page-wiki-versions__date">{{ formatDate(revision.createdAt) }}</span>
                <span v-if="index === 0" class="page-wiki-versions__current">Aktuell</span>
              </p>
              <p class="page-wiki-versions__row-meta">
                <router-link v-if="revision.editor" :to="editorLink(revision)" class="page-wiki-versions__editor">{{ revision.editor }}</router-link>
                <span v-else>Unbekannt</span>
                <span aria-hidden="true">·</span>
                <span>{{ formatSize(revision.size) }}</span>
              </p>
              <p v-if="revision.changeNote" class="page-wiki-versions__note">{{ revision.changeNote }}</p>
              <p v-else class="page-wiki-versions__note page-wiki-versions__note--empty">Keine Änderungsnotiz</p>
            </div>
            <q-btn
              v-if="canEdit && index > 0"
              class="elpis-btn elpis-btn--secondary page-wiki-versions__restore"
              flat
              no-caps
              icon="restore"
              label="Diese Version wiederherstellen"
              :loading="restoringId === revision.id"
              @click="confirmRestore(revision)"
            />
          </li>
        </ol>
      </section>

      <section v-if="compare" class="page-wiki-versions__diff-section" aria-labelledby="wiki-versions-diff">
        <h2 id="wiki-versions-diff" class="page-wiki-versions__label">Vergleich</h2>
        <p class="page-wiki-versions__diff-head">
          <span>Von <strong>{{ formatDate(compare.older.createdAt) }}</strong> zu <strong>{{ formatDate(compare.newer.createdAt) }}</strong></span>
          <span v-if="hunks" class="page-wiki-versions__counts">
            <span class="page-wiki-versions__count page-wiki-versions__count--removed">−{{ removedCount }} Zeilen</span>
            <span class="page-wiki-versions__count page-wiki-versions__count--added">+{{ addedCount }} Zeilen</span>
          </span>
        </p>

        <div v-if="diffLoading" class="page-wiki-versions__loading"><q-spinner size="28px" /></div>
        <p v-else-if="diffError" class="page-wiki-versions__hint">Die Versionen konnten nicht geladen werden.</p>
        <p v-else-if="hunks && !hunks.length" class="page-wiki-versions__hint">Der Text beider Versionen ist gleich.</p>
        <div v-else-if="hunks" class="page-wiki-versions__diff" role="table" aria-label="Zeilenweiser Vergleich">
          <template v-for="hunk in hunks" :key="hunk.key">
            <div v-if="hunk.skipped" class="page-wiki-versions__skip" role="row">
              <span role="cell">{{ hunk.skipped === 1 ? '1 unveränderte Zeile' : `${hunk.skipped} unveränderte Zeilen` }}</span>
            </div>
            <div
              v-for="line in hunk.lines"
              :key="line.key"
              class="page-wiki-versions__line"
              :class="`page-wiki-versions__line--${line.type}`"
              role="row"
            >
              <span class="page-wiki-versions__marker" role="cell" :aria-label="markerLabel(line.type)">{{ marker(line.type) }}</span>
              <span class="page-wiki-versions__text" role="cell">{{ line.text }}</span>
            </div>
          </template>
        </div>
      </section>
    </template>
  </q-page>
</template>

<script lang="ts">
import type { WikiPageRevisionDto, WikiPageRevisionSummaryDto } from '@app/shared/dto/wiki/wiki-page-revision.dto';
import { WikiPageDto } from '@app/shared/dto/wiki/wiki-page.dto';
import { EditPermission } from '@app/shared/enums/edit-permission.enum';
import errors from '@app/shared/errors';
import { unwikify, wikify } from '@common/common/wikilinks';
import Breadcrumbs from 'components/vision/Breadcrumbs.vue';
import EmptyState from 'components/vision/EmptyState.vue';
import PageHead from 'components/vision/PageHead.vue';
import type { BreadcrumbItem } from 'components/vision/types';
import { DiffHunk, DiffLineType, diffLines, htmlToLines, toHunks } from 'components/wiki/line-diff';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

// ER2 round 2 — /wiki/:title/versionen: revision list, line diff of two
// selected revisions and "Diese Version wiederherstellen" for editors.
// The production API may lack the endpoint; then an empty state shows.

@Options({
  name: 'PageWikiVersions',
  components: { Breadcrumbs, EmptyState, PageHead },
  watch: {
    '$route.params.title'() {
      if ((this as PageWikiVersions).$route.path.endsWith('/versionen')) {
        void (this as PageWikiVersions).load();
      }
    },
  },
})
export default class PageWikiVersions extends Vue {
  wikiPage: WikiPageDto | null = null;
  revisions: WikiPageRevisionSummaryDto[] = [];
  loading = true;
  unavailable = false;
  selected: number[] = [];
  restoringId: number | null = null;

  diffLoading = false;
  diffError = false;
  hunks: DiffHunk[] | null = null;
  addedCount = 0;
  removedCount = 0;

  private cache = new Map<number, WikiPageRevisionDto>();
  private diffToken = 0;

  get title(): string {
    const raw = this.$route.params.title;
    return unwikify((Array.isArray(raw) ? raw[0] : raw) || '');
  }

  get pageLink(): string {
    return `/wiki/${encodeURIComponent(wikify(this.wikiPage?.title || this.title))}`;
  }

  get crumbs(): BreadcrumbItem[] {
    return [
      { label: 'Wiki', to: '/wiki' },
      { label: this.wikiPage?.title || this.title, to: this.pageLink },
      { label: 'Versionen' },
    ];
  }

  get canEdit(): boolean {
    const page = this.wikiPage;
    return !!page && (page.mine || (page.editPermission === EditPermission.EVERYONE && this.$store.getters.isTrusted));
  }

  get compare(): { older: WikiPageRevisionSummaryDto; newer: WikiPageRevisionSummaryDto } | null {
    if (this.selected.length !== 2) {
      return null;
    }

    const picked = this.revisions.filter((revision) => this.selected.includes(revision.id));

    if (picked.length !== 2) {
      return null;
    }

    // Revisions arrive newest first.
    return { newer: picked[0], older: picked[1] };
  }

  get selectionHint(): string {
    if (this.revisions.length < 2) {
      return 'Zum Vergleichen braucht es mindestens zwei Versionen.';
    }

    return this.selected.length === 2
      ? 'Zwei Versionen ausgewählt. Der Vergleich steht unter der Liste.'
      : 'Wähle zwei Versionen aus, um sie zu vergleichen.';
  }

  mounted() {
    void this.load();
  }

  async load() {
    this.loading = true;
    this.unavailable = false;
    this.cache.clear();
    this.hunks = null;

    try {
      this.wikiPage = await this.$api.wiki.getWikiPageByTitle(this.title);
      document.title = `Versionen: ${this.wikiPage.title} — Elpisgarten`;
    } catch (e) {
      if (errors.getStatusCode(e) === 404) {
        notifyError('Wikibeitrag konnte nicht gefunden werden.');
        void this.$router.replace('/wiki');
      } else {
        notifyError(e);
      }
      this.loading = false;
      return;
    }

    try {
      this.revisions = await this.$api.wiki.getRevisions(this.wikiPage.title);
      this.unavailable = this.revisions.length === 0;
    } catch {
      this.revisions = [];
      this.unavailable = true;
    }

    this.selected = this.revisions.slice(0, 2).map((revision) => revision.id);
    this.loading = false;
    void this.loadDiff();
  }

  isSelected(id: number): boolean {
    return this.selected.includes(id);
  }

  toggle(id: number) {
    if (this.isSelected(id)) {
      this.selected = this.selected.filter((other) => other !== id);
    } else {
      // Keep the most recent pick plus the new one.
      this.selected = [...this.selected.slice(-1), id];
    }

    void this.loadDiff();
  }

  async loadDiff() {
    const compare = this.compare;
    const token = ++this.diffToken;
    this.diffError = false;

    if (!compare || !this.wikiPage) {
      this.hunks = null;
      return;
    }

    this.diffLoading = true;

    try {
      const [older, newer] = await Promise.all([this.fetchRevision(compare.older.id), this.fetchRevision(compare.newer.id)]);

      if (token !== this.diffToken) {
        return;
      }

      const oldLines = htmlToLines(older.content);
      const newLines = htmlToLines(newer.content);

      if (older.title !== newer.title) {
        oldLines.unshift(`Titel: ${older.title}`);
        newLines.unshift(`Titel: ${newer.title}`);
      }

      const lines = diffLines(oldLines, newLines);
      this.addedCount = lines.filter((line) => line.type === 'added').length;
      this.removedCount = lines.filter((line) => line.type === 'removed').length;
      this.hunks = toHunks(lines, 2);
    } catch {
      if (token === this.diffToken) {
        this.diffError = true;
        this.hunks = null;
      }
    } finally {
      if (token === this.diffToken) {
        this.diffLoading = false;
      }
    }
  }

  private async fetchRevision(id: number): Promise<WikiPageRevisionDto> {
    const cached = this.cache.get(id);

    if (cached) {
      return cached;
    }

    const revision = await this.$api.wiki.getRevision(this.wikiPage!.title, id);
    this.cache.set(id, revision);
    return revision;
  }

  confirmRestore(revision: WikiPageRevisionSummaryDto) {
    this.$q
      .dialog({
        title: 'Version wiederherstellen',
        message: `Der Eintrag wird auf die Fassung vom ${this.formatDate(revision.createdAt)} zurückgesetzt. Die aktuelle Fassung bleibt im Verlauf erhalten.`,
        prompt: {
          model: '',
          type: 'text',
          label: 'Änderungsnotiz (optional)',
          maxlength: 200,
        },
        ok: { label: 'Wiederherstellen', flat: true, noCaps: true },
        cancel: { label: 'Abbrechen', flat: true, noCaps: true },
      })
      .onOk(async (note: string) => {
        if (!this.wikiPage) {
          return;
        }

        this.restoringId = revision.id;

        try {
          await this.$api.wiki.restoreRevision(this.wikiPage.title, revision.id, {
            changeNote: (note || '').trim() || undefined,
            characterId: this.$store.getters.characterId || undefined,
          });
          notifySuccess('Version wiederhergestellt.');
          await this.load();
        } catch (e) {
          notifyError(e);
        } finally {
          this.restoringId = null;
        }
      });
  }

  formatDate(timestamp: number): string {
    return this.$display.formatDateTimeLocal(timestamp);
  }

  formatSize(size: number): string {
    if (size < 1024) {
      return `${size} Byte`;
    }

    return `${(size / 1024).toLocaleString('de-DE', { maximumFractionDigits: 1 })} kB`;
  }

  editorLink(revision: WikiPageRevisionSummaryDto): string {
    return `/${revision.editorServer}/${revision.editor.replace(/ /g, '_')}`;
  }

  marker(type: DiffLineType): string {
    return type === 'added' ? '+' : type === 'removed' ? '−' : '';
  }

  markerLabel(type: DiffLineType): string {
    return type === 'added' ? 'Hinzugefügt' : type === 'removed' ? 'Entfernt' : 'Unverändert';
  }
}
</script>

<style lang="scss" scoped>
.page-wiki-versions {
  color: var(--ink-primary);
}

.page-wiki-versions__loading {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}

.page-wiki-versions__label {
  text-align: left;
  margin: 0 0 8px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  font-weight: 700;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-muted);
  line-height: 1.4;
}

.page-wiki-versions__hint {
  margin: 0 0 12px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
  color: var(--ink-muted);
}

.page-wiki-versions__list {
  margin: 0 0 32px;
  padding: 0;
  list-style: none;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background: var(--vision-card);
  overflow: hidden;
}

.page-wiki-versions__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  font-family: var(--font-ui);

  & + & {
    border-top: 1px solid var(--rule-soft);
  }
}

.page-wiki-versions__row--selected {
  background: var(--rule-tint);
}

.page-wiki-versions__row-main {
  flex: 1 1 auto;
  min-width: 0;

  p {
    margin: 0;
  }
}

.page-wiki-versions__row-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.page-wiki-versions__date {
  font-weight: 600;
}

.page-wiki-versions__current {
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--vision-live-bg);
  color: var(--vision-live-text);
  font-size: var(--type-scale-0);
  font-weight: 700;
}

.page-wiki-versions__row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: var(--type-scale-0);
  color: var(--ink-muted);
}

.page-wiki-versions__editor {
  color: var(--ink-link);
}

.page-wiki-versions__note {
  margin-top: 4px !important;
  font-size: var(--type-scale-1);
  overflow-wrap: anywhere;
}

.page-wiki-versions__note--empty {
  color: var(--ink-muted);
  font-style: italic;
}

.page-wiki-versions__restore {
  flex: 0 0 auto;
}

.page-wiki-versions__diff-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 12px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
}

.page-wiki-versions__counts {
  display: inline-flex;
  gap: 12px;
  font-weight: 600;
}

.page-wiki-versions__count--added {
  color: var(--vision-live-text);
}

.page-wiki-versions__count--removed {
  color: var(--ink-primary);
}

.page-wiki-versions__diff {
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background: var(--vision-card);
  overflow: hidden;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: var(--type-scale-1);
  line-height: 1.5;
}

.page-wiki-versions__line {
  display: flex;
  gap: 8px;
  padding: 2px 12px 2px 0;
  border-left: 4px solid transparent;
}

.page-wiki-versions__line--added {
  background: var(--vision-live-bg);
  border-left-color: var(--vision-live);
}

.page-wiki-versions__line--removed {
  background: color-mix(in srgb, var(--vision-now) 12%, transparent);
  border-left-color: var(--vision-now);
}

.page-wiki-versions__marker {
  flex: 0 0 24px;
  text-align: center;
  font-weight: 700;
  user-select: none;
}

.page-wiki-versions__text {
  flex: 1 1 auto;
  min-width: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.page-wiki-versions__skip {
  padding: 4px 12px 4px 36px;
  border-top: 1px dashed var(--rule-soft);
  border-bottom: 1px dashed var(--rule-soft);
  color: var(--ink-muted);
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  font-style: italic;
}

@media (max-width: 600px) {
  .page-wiki-versions__row {
    flex-wrap: wrap;
  }

  .page-wiki-versions__restore {
    width: 100%;
  }
}
</style>
