<template>
  <div class="noticeboard-item-view">
    <h2 class="noticeboard-item-view__title">{{ noticeboardItem.title }}</h2>
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
    <hr />
    <html-viewer
      class="noticeboard-item-view__content"
      :content="noticeboardItem.content"
    />
  </div>
</template>

<script lang="ts">
import { NoticeboardItemDto } from '@app/shared/dto/noticeboard/noticeboard-item.dto';
import { Options, prop, Vue } from 'vue-class-component';
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

.noticeboard-item-view__subtitle {
  color: $grey-8;
}

.noticeboard-item-view__posted-by {
  flex-grow: 1;
  padding-right: 16px;
}

.noticeboard-item-view__type {
  flex-grow: 0;
  white-space: nowrap;
}
</style>
