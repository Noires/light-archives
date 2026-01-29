<template>
  <q-list class="community-list" bordered>
    <q-item
      v-for="community in communities"
      :key="`${community.id}`"
      class="community-list__item"
      clickable
      v-ripple
      :to="getLink(community)"
    >
      <q-item-section class="community-list__content">
        <q-item-label class="community-list__name">{{ community.name }}</q-item-label>
        <q-item-label caption class="community-list__goal">{{ community.goal || 'Kein Ziel angegeben' }}</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts">
import { CommunitySummaryDto } from '@app/shared/dto/communities/community-summary.dto';
import { prop, Options, Vue } from 'vue-class-component';

class Props {
  communities = prop<CommunitySummaryDto[]>({
    required: true
  });
}

@Options({
  name: 'CommunityList',
})
export default class CommunityList extends Vue.with(Props) {
  getLink(community: CommunitySummaryDto) {
    return `/community/${community.name.replace(/ /g, '_')}`;
  }
}
</script>

<style lang="scss">
.community-list {
  display: grid;
  gap: 12px;
  padding: 12px;
  border: none;
  background: transparent;
}

.community-list__item {
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.community-list__item:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.16);
  border-color: rgba(221, 180, 118, 0.4);
}

.community-list__content {
  gap: 2px;
}

.community-list__name {
  font-weight: 700;
  color: #1f2c38;
}

.community-list__goal {
  color: rgba(35, 35, 35, 0.7);
}

@media (prefers-reduced-motion: reduce) {
  .community-list__item {
    transition: none;
  }

  .community-list__item:hover {
    transform: none;
  }
}
</style>
