<template>
  <section class="group-member-content" :aria-labelledby="headingId">
    <h2 :id="headingId" class="group-member-content__heading">{{ kind === 'galerie' ? 'Galerie' : 'Geschichten' }}</h2>
    <p class="group-member-content__lead">
      {{ kind === 'galerie' ? 'Bilder' : 'Geschichten' }} der Mitglieder von {{ groupName }}.
      <template v-if="content && content.truncated">Berücksichtigt werden die ersten {{ content.memberCount }} Mitglieder.</template>
    </p>

    <div v-if="loading" class="group-member-content__loading"><q-spinner size="28px" /></div>

    <template v-else-if="kind === 'galerie'">
      <ul v-if="images.length" class="group-member-content__grid">
        <li v-for="(image, index) in images" :key="image.id">
          <a
            class="group-member-content__tile"
            :href="`/image/${image.id}`"
            :aria-label="image.owner ? `${image.title || 'Ohne Titel'} von ${image.owner}` : image.title || 'Ohne Titel'"
            @click.prevent="openLightbox(index)"
          >
            <img :src="image.thumbUrl || image.url" alt="" loading="lazy" decoding="async" />
          </a>
        </li>
      </ul>
      <empty-state v-else icon="photo_library" title="Noch keine Bilder" text="Die Mitglieder haben noch keine Bilder in der Galerie." />
    </template>

    <template v-else>
      <ul v-if="stories.length" class="group-member-content__stories">
        <li v-for="story in stories" :key="story.id" class="group-member-content__story">
          <img v-if="story.imageThumbUrl" class="group-member-content__story-image" :src="story.imageThumbUrl" alt="" loading="lazy" />
          <div class="group-member-content__story-main">
            <p class="group-member-content__eyebrow">
              {{ $display.storyTypes[story.type] }} · {{ $display.relativeTime(story.createdAt) }}
            </p>
            <h3 class="group-member-content__story-title">
              <router-link :to="`/story/${story.id}`">{{ story.title }}</router-link>
            </h3>
            <p class="group-member-content__story-meta">von {{ story.author }}</p>
            <p v-if="story.excerpt" class="group-member-content__excerpt">{{ story.excerpt }}</p>
          </div>
        </li>
      </ul>
      <empty-state v-else icon="auto_stories" title="Noch keine Geschichten" text="Die Mitglieder haben noch keine Geschichten veröffentlicht." />
    </template>
  </section>
</template>

<script lang="ts">
import type { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import type { StorySummaryDto } from '@app/shared/dto/stories/story-summary.dto';
import EmptyState from 'components/vision/EmptyState.vue';
import { Options, prop, Vue } from 'vue-class-component';
import { GroupContent, loadGroupContent } from './member-content';

// ER2 round 2 — "Galerie" / "Geschichten" tab of a free company or community,
// built from the members' content (see member-content.ts).

const MAX_ITEMS = 60;
let counter = 0;

class Props {
  memberIds = prop<number[]>({ required: true });
  kind = prop<'galerie' | 'geschichten'>({ required: true });
  groupName = prop<string>({ default: '' });
}

@Options({
  name: 'GroupMemberContent',
  components: { EmptyState },
  watch: {
    memberIds() {
      void (this as GroupMemberContent).load();
    },
  },
})
export default class GroupMemberContent extends Vue.with(Props) {
  readonly headingId = `group-member-content-${++counter}`;

  content: GroupContent | null = null;
  loading = true;
  private token = 0;

  get images(): ImageSummaryDto[] {
    return this.content ? this.content.images.slice(0, MAX_ITEMS) : [];
  }

  get stories(): StorySummaryDto[] {
    return this.content ? this.content.stories.slice(0, MAX_ITEMS) : [];
  }

  mounted() {
    void this.load();
  }

  async load() {
    const token = ++this.token;
    this.loading = true;
    const content = await loadGroupContent(this.memberIds);

    if (token === this.token) {
      this.content = content;
      this.loading = false;
    }
  }

  async openLightbox(index: number) {
    const Lightbox = (await import('components/vision/Lightbox.vue')).default;
    this.$q.dialog({ component: Lightbox, componentProps: { images: this.images, initialIndex: index } });
  }
}
</script>

<style lang="scss" scoped>
.group-member-content {
  color: var(--ink-primary);
}

.group-member-content__heading {
  text-align: left;
  margin: 0 0 6px;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 22px;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--ink-primary);
}

.group-member-content__lead {
  margin: 0 0 16px;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--ink-muted);
}

.group-member-content__loading {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.group-member-content__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.group-member-content__tile {
  display: block;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background-color: var(--rule-tint);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--motion-base) var(--ease-elpis);
  }

  &:hover img {
    transform: scale(1.03);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--glow-aether), 0 0 0 4px var(--vision-focus-edge);
  }
}

.group-member-content__stories {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.group-member-content__story {
  display: flex;
  gap: 16px;
  padding: 16px 18px;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background-color: var(--vision-card);
}

.group-member-content__story-image {
  flex: 0 0 120px;
  width: 120px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;

  @media (max-width: 599px) {
    display: none;
  }
}

.group-member-content__story-main {
  min-width: 0;

  p {
    margin: 0;
  }
}

.group-member-content__eyebrow {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: var(--ink-link);
}

.group-member-content__story-title {
  text-align: left;
  margin: 2px 0;
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0;

  a {
    color: var(--ink-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.group-member-content__story-meta {
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--ink-muted);
}

.group-member-content__excerpt {
  margin-top: 6px !important;
  font-size: 15px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

@media (prefers-reduced-motion: reduce) {
  .group-member-content__tile img {
    transition: none;
  }

  .group-member-content__tile:hover img {
    transform: none;
  }
}
</style>
