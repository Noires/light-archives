<template>
  <div class="story-list striped-list">
    <q-list v-if="stories.length" bordered>
      <q-item
        v-for="story in stories"
        :key="`${story.id}`"
        clickable
        v-ripple
        :to="getLink(story)"
      >
        <q-item-section>
            <q-item-label>{{story.title}}</q-item-label>
            <q-item-label caption>{{story.author}}</q-item-label>
        </q-item-section>
        <q-item-section side>
            <q-item-label>{{$display.relativeTime(story.createdAt)}}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <p v-else>
      Es gibt noch keine Geschichten auf <strong>Elpisgarten</strong>.
    </p>
  </div>
</template>

<script lang="ts">
import { StorySummaryDto } from '@app/shared/dto/stories/story-summary.dto';
import { prop, Options, Vue } from 'vue-class-component';

class Props {
  stories = prop<StorySummaryDto[]>({
    required: true
  });
}

@Options({
  name: 'StoryList',
})
export default class StoryList extends Vue.with(Props) {
  getLink(story: StorySummaryDto) {
    return `/story/${story.id}`
  }
}
</script>

<style lang="scss">

</style>
