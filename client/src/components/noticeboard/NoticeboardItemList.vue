<template>
  <div class="noticeboard-item-list striped-list">
    <q-list v-if="noticeboardItems.length" bordered>
      <q-item
        v-for="noticeboardItem in noticeboardItems"
        :key="`${noticeboardItem.id}`"
        clickable
        v-ripple
        :to="getLink(noticeboardItem)"
      >
        <q-item-section>
            <q-item-label>{{noticeboardItem.title}}</q-item-label>
            <q-item-label caption>{{$display.noticeboardLocations[noticeboardItem.location]}} — von {{noticeboardItem.author}}</q-item-label>
        </q-item-section>
        <q-item-section side>
            <q-item-label>{{$display.relativeTime(noticeboardItem.createdAt)}}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <p v-else>
      Es gibt noch keine Aushänge auf <strong>Elpisgarten</strong>.
    </p>
  </div>
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
    return `/noticeboard/${noticeboardItem.id}`
  }
}
</script>

<style lang="scss">
</style>
