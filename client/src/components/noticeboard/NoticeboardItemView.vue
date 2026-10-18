<template>
  <div class="noticeboard-item-view">
    <h2 class="noticeboard-item-view__title regular-header-font">{{ noticeboardItem.title }}</h2>
    <section class="text-caption noticeboard-item-view__subtitle row">
      <div class="noticeboard-item-view__posted-by">
        Verfasst von <router-link :to="authorLink">{{ noticeboardItem.author }}</router-link> am {{ date }}
      </div>
      <div class="noticeboard-item-view__type">
        {{ $display.noticeboardTypes[noticeboardItem.type] || 'Aushang' }} - {{ $display.noticeboardLocations[noticeboardItem.location] }}
        <template v-if="noticeboardItem.venueName && noticeboardItem.venueServer">
          - <router-link :to="venueLink">{{ noticeboardItem.venueName }}</router-link>
        </template>
      </div>
    </section>
    <triskelion-divider class="noticeboard-item-view__divider" />
    <section class="noticeboard-item-view__body mat-parchment">
      <html-viewer
        class="noticeboard-item-view__content"
        :content="noticeboardItem.content"
      />
    </section>
  </div>
</template>

<script lang="ts">
import { NoticeboardItemDto } from '@app/shared/dto/noticeboard/noticeboard-item.dto';
import { Options, prop, Vue } from 'vue-class-component';
import TriskelionDivider from '../aetherium/TriskelionDivider.vue';
import HtmlViewer from '../common/HtmlViewer.vue';

class Props {
  noticeboardItem = prop<NoticeboardItemDto>({
    required: true,
  });

  preview = prop<boolean>({
    default: false,
  });
}

@Options({
  name: 'NoticeboardItemView',
  components: {
    HtmlViewer,
    TriskelionDivider,
  }
})
export default class NoticeboardItemView extends Vue.with(Props) {
  get date(): string {
    return this.$display.formatDate(this.noticeboardItem.createdAt);
  }

  get authorLink(): string {
    const server = this.noticeboardItem.authorServer || '';
    const character = this.noticeboardItem.author?.replace(/ /g, '_') || '';
    return `/${server}/${character}`;
  }

  get venueLink(): string {
    if (!this.noticeboardItem.venueServer || !this.noticeboardItem.venueName) {
      return '/venues';
    }

    return `/venue/${this.noticeboardItem.venueServer}/${this.noticeboardItem.venueName.replace(/ /g, '_')}`;
  }
}
</script>

<style lang="scss">
@import url($extraGoogleFonts);

// ELPIS-511 — Noticeboard item lives on Parchment with a Discord-embed-style
// left rail (4 px gold rail keyed to --rule-gold). Triskelion divider replaces
// the bare hr separator. Subtitle / type chunks rebased onto Aetherium tokens
// so the chrome reads consistently across themes.
.noticeboard-item-view__subtitle {
  color: var(--ink-muted);
  font-family: var(--font-section);
  font-style: italic;
}

.noticeboard-item-view__posted-by {
  flex-grow: 1;
  padding-right: 16px;
}

.noticeboard-item-view__type {
  flex-grow: 0;
  white-space: nowrap;
  font-family: var(--font-ui);
  text-transform: uppercase;
  letter-spacing: var(--ls-eyebrow);
  font-size: var(--type-scale-0);
}

.noticeboard-item-view__divider {
  margin: 24px auto 18px;
}

.noticeboard-item-view__body {
  padding: 28px 32px;
  margin-bottom: 24px;
  border-left: 4px solid var(--rule-gold);
}

.noticeboard-item-view__body .noticeboard-item-view__content {
  font-family: var(--font-body);
  line-height: var(--lh-body);
}

body.body--dark .noticeboard-item-view__subtitle {
  color: rgba(236, 227, 247, 0.74);
}

body.body--dark .noticeboard-item-view__body {
  border-left-color: var(--rule-arcane);
}

@media screen and (max-width: 600px) {
  .noticeboard-item-view__body {
    padding: 20px 18px;
  }
}
</style>
