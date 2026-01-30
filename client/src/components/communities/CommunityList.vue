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
  gap: 16px;
  padding: 16px;
  border: none;
  background: transparent;
}

.community-list__item {
  border: 1px solid rgba(221, 180, 118, 0.3);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 16px 32px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border-radius: 2px;
  padding: 16px 20px;
}

.community-list__item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12), 0 20px 40px rgba(0, 0, 0, 0.08);
  border-color: rgba(221, 180, 118, 0.5);
}

.community-list__content {
  gap: 4px;
}

.community-list__name {
  font-weight: 700;
  color: #1f2c38;
  font-size: 1.05rem;
  letter-spacing: 0.01em;
}

.community-list__goal {
  color: rgba(35, 35, 35, 0.7);
  font-size: 0.9rem;
  line-height: 1.5;
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
