<template>
  <q-list class="noticeboard-item-list" bordered>
    <q-item
      v-for="noticeboardItem in noticeboardItems"
      :key="`${noticeboardItem.id}`"
      class="noticeboard-item-list__item"
      clickable
      v-ripple
      :to="getLink(noticeboardItem)"
    >
      <q-item-section class="noticeboard-item-list__content">
        <q-item-label class="noticeboard-item-list__title">{{ noticeboardItem.title }}</q-item-label>
        <q-item-label caption class="noticeboard-item-list__meta">
          {{ $display.noticeboardTypes[noticeboardItem.type] || 'Aushang' }} · {{ $display.noticeboardLocations[noticeboardItem.location] }} - von {{ noticeboardItem.author }}
        </q-item-label>
      </q-item-section>
      <q-item-section side class="noticeboard-item-list__time">
        <q-item-label>{{ $display.relativeTime(noticeboardItem.createdAt) }}</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts">
import { NoticeboardItemSummaryDto } from '@app/shared/dto/noticeboard/noticeboard-item-summary.dto';
import { prop, Options, Vue } from 'vue-class-component';

class Props {
  noticeboardItems = prop<NoticeboardItemSummaryDto[]>({
    required: true
  });
}

@Options({
  name: 'NoticeboardItemList',
})
export default class NoticeboardItemList extends Vue.with(Props) {
  getLink(noticeboardItem: NoticeboardItemSummaryDto) {
    return `/noticeboard/${noticeboardItem.id}`;
  }
}
</script>

<style lang="scss">
.noticeboard-item-list {
  display: grid;
  gap: 16px;
  padding: 16px;
  border: none;
  background: transparent;
}

.noticeboard-item-list__item {
  border: 1px solid rgba(221, 180, 118, 0.3);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 16px 32px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border-radius: 2px;
  padding: 16px 20px;
}

.noticeboard-item-list__item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12), 0 20px 40px rgba(0, 0, 0, 0.08);
  border-color: rgba(221, 180, 118, 0.5);
}

.noticeboard-item-list__content {
  gap: 4px;
}

.noticeboard-item-list__title {
  font-weight: 700;
  color: #1f2c38;
  font-size: 1.05rem;
  letter-spacing: 0.01em;
}

.noticeboard-item-list__meta {
  color: rgba(35, 35, 35, 0.7);
  font-size: 0.9rem;
}

.noticeboard-item-list__time {
  color: rgba(35, 35, 35, 0.6);
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .noticeboard-item-list__item {
    transition: none;
  }

  .noticeboard-item-list__item:hover {
    transform: none;
  }
}
</style>
