<template>
  <q-page class="page-noticeboard-item">
    <template v-if="noticeboardItem.id">
      <breadcrumbs class="page-noticeboard-item__crumbs" :items="crumbs" />

      <section v-if="noticeboardItem.mine" class="page-noticeboard-item__edit-bar" aria-label="Aushang verwalten">
        <q-btn class="elpis-btn elpis-btn--secondary" flat no-caps icon="edit" label="Aushang bearbeiten" :to="`/edit-noticeboard-item/${noticeboardItem.id}`" />
        <q-btn class="elpis-btn elpis-btn--ghost" flat no-caps icon="delete_outline" label="Aushang löschen" @click="onDeleteClick" />
      </section>

      <noticeboard-item-view :noticeboard-item="noticeboardItem">
        <template #rail>
          <section v-if="related.length" aria-labelledby="nb-related" class="page-noticeboard-item__related">
            <h2 id="nb-related" class="page-noticeboard-item__related-label">Ähnliche Aushänge</h2>
            <ul>
              <li v-for="item in related" :key="item.id">
                <router-link :to="`/noticeboard/${item.id}`" class="page-noticeboard-item__related-link" :style="{ '--nb-type': typeColor(item.type) }">
                  <span class="page-noticeboard-item__related-title">{{ item.title }}</span>
                  <span class="page-noticeboard-item__related-meta">
                    {{ $display.noticeboardLocations[item.location] || item.location }} · {{ $display.relativeTime(item.createdAt) }}
                  </span>
                </router-link>
              </li>
            </ul>
            <router-link :to="{ path: '/noticeboard', query: { type: noticeboardItem.type } }" class="page-noticeboard-item__related-all">
              Alle {{ typePlural }} ansehen
            </router-link>
          </section>
        </template>
      </noticeboard-item-view>

      <report-violation-section :pageType="PageType.NOTICEBOARD_ITEM" :pageId="noticeboardItem.id" />
    </template>
  </q-page>
</template>

<script lang="ts">
import { NoticeboardItemSummaryDto } from '@app/shared/dto/noticeboard/noticeboard-item-summary.dto';
import { NoticeboardItemDto } from '@app/shared/dto/noticeboard/noticeboard-item.dto';
import { PageType } from '@app/shared/enums/page-type.enum';
import errors from '@app/shared/errors';
import NoticeboardItemView from 'components/noticeboard/NoticeboardItemView.vue';
import { noticeboardTypeColor } from 'components/noticeboard/noticeboard-types';
import Breadcrumbs from 'components/vision/Breadcrumbs.vue';
import type { BreadcrumbItem } from 'components/vision/types';
import { useApi } from 'src/boot/axios';
import { notifyError, notifySuccess } from 'src/common/notify';
import ReportViolationSection from 'src/components/common/ReportViolationSection.vue';
import { useRouter } from 'src/router';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';

const $api = useApi();
const $router = useRouter();

// ER2-606 — noticeboard item page: breadcrumbs, owner actions, the parchment
// view with Discord preview, and "Ähnliche Aushänge" (same type, from the
// existing list endpoint) in the rail.

const RELATED_LIMIT = 4;

async function load(params: RouteParams): Promise<NoticeboardItemDto> {
  const id = parseInt(params.id as string, 10);

  if (!id) {
    void $router.replace('/');
    throw new Error();
  }

  try {
    const noticeboardItem = await $api.noticeboard.getNoticeboardItem(id);
    document.title = `${noticeboardItem.title} — Elpisgarten`;
    return noticeboardItem;
  } catch (e) {
    if (errors.getStatusCode(e) === 404) {
      notifyError('Aushang konnte nicht gefunden werden.');
      void $router.replace('/');
    } else {
      notifyError(e);
    }

    throw e;
  }
}

@Options({
  name: 'PageNoticeboardItem',
  components: {
    Breadcrumbs,
    NoticeboardItemView,
    ReportViolationSection,
  },
  async beforeRouteEnter(to, _, next) {
    const noticeboardItem = await load(to.params);
    next((vm) => (vm as PageNoticeboardItem).setContent(noticeboardItem));
  },
  async beforeRouteUpdate(to) {
    const noticeboardItem = await load(to.params);
    (this as PageNoticeboardItem).setContent(noticeboardItem);
  },
})
export default class PageNoticeboardItem extends Vue {
  readonly PageType = PageType;

  noticeboardItem: NoticeboardItemDto = new NoticeboardItemDto();
  related: NoticeboardItemSummaryDto[] = [];

  private loadToken = 0;

  get crumbs(): BreadcrumbItem[] {
    return [ { label: 'Anschlagbrett', to: '/noticeboard' }, { label: this.noticeboardItem.title || 'Aushang' } ];
  }

  get typePlural(): string {
    const label = this.$display.noticeboardTypes[this.noticeboardItem.type] || 'Aushang';
    const plurals: { [label: string]: string } = {
      Gerücht: 'Gerüchte',
      Auftrag: 'Aufträge',
      Gesuch: 'Gesuche',
      Zeitungsartikel: 'Zeitungsartikel',
      Stellenangebot: 'Stellenangebote',
      Stellengesuch: 'Stellengesuche',
      Aushang: 'Aushänge',
    };
    return plurals[label] || label;
  }

  typeColor(type: string): string {
    return noticeboardTypeColor(type);
  }

  setContent(noticeboardItem: NoticeboardItemDto) {
    this.noticeboardItem = noticeboardItem;
    this.related = [];
    void this.loadRelated(noticeboardItem);
  }

  async loadRelated(noticeboardItem: NoticeboardItemDto) {
    const token = ++this.loadToken;

    try {
      const items = await this.$api.noticeboard.getNoticeboardItems({});

      if (token === this.loadToken) {
        this.related = items
          .filter((item) => item.id !== noticeboardItem.id && item.type === noticeboardItem.type)
          .slice(0, RELATED_LIMIT);
      }
    } catch {
      // related notices are optional
    }
  }

  onDeleteClick() {
    this.$q.dialog({
      title: 'Löschbestätigung',
      message: `Möchtest du “${this.noticeboardItem.title}” wirklich löschen?`,
      ok: {
        label: 'Löschen',
        color: 'negative',
        flat: true,
      },
      cancel: 'Abbrechen',
    }).onOk(async () => {
      try {
        await this.$api.noticeboard.deleteNoticeboardItem(this.noticeboardItem.id!);

        notifySuccess('Aushang gelöscht.');
        void this.$router.replace('/');
      } catch (e) {
        notifyError(e);
      }
    });
  }
}
</script>

<style lang="scss" scoped>
.page-noticeboard-item__crumbs {
  margin-bottom: 16px;
}

.page-noticeboard-item__edit-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 16px;
}

.page-noticeboard-item__related {
  font-family: var(--font-ui);

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.page-noticeboard-item__related-label {
  text-align: left;
  margin: 0 0 10px;
  font-size: var(--type-scale-0);
  font-weight: 700;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-muted);
  line-height: 1.4;
}

.page-noticeboard-item__related-link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--rule-soft);
  border-left: 4px solid var(--nb-type);
  border-radius: 8px;
  background: var(--vision-card);
  color: var(--ink-primary);
  text-decoration: none;

  &:hover {
    background: var(--rule-tint);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.page-noticeboard-item__related-title {
  font-family: var(--font-display);
  font-weight: 600;
  line-height: 1.3;
}

.page-noticeboard-item__related-meta {
  font-size: var(--type-scale-0);
  color: var(--ink-muted);
}

.page-noticeboard-item__related-all {
  display: inline-block;
  margin-top: 10px;
  font-size: var(--type-scale-1);
  font-weight: 600;
  color: var(--ink-link);
}
</style>
