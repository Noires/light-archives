<template>
  <aside class="author-rail" aria-label="Über die Autorin oder den Autor">
    <section class="author-rail__card">
      <q-avatar size="72px" class="author-rail__avatar">
        <img v-if="avatar" :src="avatar" alt="" />
        <q-icon v-else name="person" />
      </q-avatar>
      <p class="author-rail__eyebrow">Verfasst von</p>
      <router-link :to="authorLink" class="author-rail__name">{{ author }}</router-link>
      <p v-if="meta" class="author-rail__meta">{{ meta }}</p>
      <status-badge v-if="rpBadge" :type="rpBadge" class="author-rail__status" />
    </section>

    <section v-if="otherStories.length" class="author-rail__block" aria-labelledby="author-rail-more">
      <h2 id="author-rail-more" class="author-rail__label">Auch von {{ firstName }}</h2>
      <ul class="author-rail__list">
        <li v-for="item in otherStories" :key="item.id">
          <router-link :to="`/story/${item.id}`" class="author-rail__story">
            <span class="author-rail__story-type">{{ $display.storyTypes[item.type] || 'Geschichte' }}</span>
            <span class="author-rail__story-title">{{ item.title }}</span>
          </router-link>
        </li>
      </ul>
    </section>

    <section v-if="tags.length" class="author-rail__block" aria-labelledby="author-rail-tags">
      <h2 id="author-rail-tags" class="author-rail__label">Schlagworte</h2>
      <ul class="author-rail__tags">
        <li v-for="tag in tags" :key="tag">
          <router-link :to="{ path: '/stories', query: { tag } }" class="author-rail__tag">{{ tag }}</router-link>
        </li>
      </ul>
    </section>
  </aside>
</template>

<script lang="ts">
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { StorySummaryDto } from '@app/shared/dto/stories/story-summary.dto';
import { RpStatus } from '@app/shared/enums/rp-status.enum';
import { Options, prop, Vue } from 'vue-class-component';
import StatusBadge from '../vision/StatusBadge.vue';
import type { StatusBadgeType } from '../vision/types';

// ER2-601 — right reader rail: author card (avatar ring, name, people and
// world, RP status if the profile carries one), "Auch von …" and tags. No
// "Folgen" button: there is no follow concept yet.

const RP_BADGES: { [status: string]: StatusBadgeType } = {
  [RpStatus.IC]: 'rp-ic',
  [RpStatus.LFRP]: 'rp-lfrp',
  [RpStatus.OOC]: 'rp-ooc',
};

class Props {
  author = prop<string>({ default: '' });
  authorServer = prop<string>({ default: '' });
  profile = prop<CharacterProfileDto | null>({ default: null });
  otherStories = prop<StorySummaryDto[]>({ default: () => [] });
  tags = prop<string[]>({ default: () => [] });
}

@Options({
  name: 'StoryAuthorRail',
  components: {
    StatusBadge,
  },
})
export default class StoryAuthorRail extends Vue.with(Props) {
  get authorLink(): string {
    return `/${this.authorServer}/${this.author.replace(/ /g, '_')}`;
  }

  get avatar(): string {
    return this.profile && this.profile.showAvatar !== false ? this.profile.avatar || '' : '';
  }

  get firstName(): string {
    return this.author.split(' ')[0] || this.author;
  }

  get meta(): string {
    const race = this.profile ? this.$display.races[this.profile.race] : '';
    return [ race, this.authorServer ].filter(Boolean).join(' · ');
  }

  get rpBadge(): StatusBadgeType | null {
    const status = this.profile?.rpStatus;
    const expires = this.profile?.rpStatusExpiresAt;

    if (!status || (expires && expires < Date.now())) {
      return null;
    }

    return RP_BADGES[status] || null;
  }
}
</script>

<style lang="scss" scoped>
.author-rail {
  display: flex;
  flex-direction: column;
  gap: 28px;
  font-family: var(--font-ui);
  color: var(--ink-primary);
}

.author-rail__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 22px 18px 18px;
  border: 1px solid var(--rule-soft);
  border-radius: 14px;
  background: var(--vision-card);
  text-align: center;
}

.author-rail__avatar {
  margin-bottom: 10px;
  background: var(--rule-tint);
  color: var(--ink-muted);
  box-shadow: 0 0 0 3px var(--vision-card), 0 0 0 5px var(--rule-strong);

  img {
    object-fit: cover;
  }
}

.author-rail__eyebrow,
.author-rail__label {
  text-align: left;
  margin: 0;
  font-size: var(--type-scale-0);
  font-weight: 700;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-muted);
  line-height: 1.4;
}

.author-rail__label {
  margin-bottom: 10px;
}

.author-rail__name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--type-scale-3);
  line-height: 1.25;
  color: var(--ink-primary);
  text-decoration: none;
  overflow-wrap: anywhere;

  &:hover,
  &:focus-visible {
    color: var(--ink-link);
    text-decoration: underline;
  }
}

.author-rail__meta {
  margin: 0;
  font-size: var(--type-scale-1);
  color: var(--ink-muted);
}

.author-rail__status {
  margin-top: 8px;
}

.author-rail__list,
.author-rail__tags {
  margin: 0;
  padding: 0;
  list-style: none;
}

.author-rail__story {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 0;
  border-bottom: 1px solid var(--rule-soft);
  color: inherit;
  text-decoration: none;

  &:hover .author-rail__story-title,
  &:focus-visible .author-rail__story-title {
    color: var(--ink-link);
    text-decoration: underline;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--vision-focus-edge);
  }
}

.author-rail__story-type {
  font-size: var(--type-scale-0);
  color: var(--ink-muted);
}

.author-rail__story-title {
  font-family: var(--font-body);
  font-size: var(--type-scale-2);
  line-height: 1.35;
}

.author-rail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.author-rail__tag {
  display: inline-block;
  padding: 3px 10px;
  border: 1px solid var(--rule-soft);
  border-radius: 999px;
  font-size: var(--type-scale-1);
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
</style>
