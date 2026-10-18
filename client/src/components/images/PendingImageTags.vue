<template>
  <section v-if="pending.length" id="markierungen" class="pending-image-tags" aria-labelledby="pending-image-tags-title">
    <header class="pending-image-tags__head">
      <h3 id="pending-image-tags-title" class="pending-image-tags__title">Markierungen</h3>
      <span class="pending-image-tags__count">{{ pending.length }} offen</span>
    </header>
    <p class="pending-image-tags__lead">
      Du entscheidest, ob dein Charakter auf diesem Bild genannt wird. Erst nach deiner Bestätigung erscheint die
      Markierung öffentlich; eine Ablehnung bleibt für andere unsichtbar.
    </p>
    <ul class="pending-image-tags__list">
      <li v-for="tag in pending" :key="tag.id" class="pending-image-tags__item">
        <router-link class="pending-image-tags__thumb" :to="`/image/${tag.image.id}`" :aria-label="`Bild ${tag.image.title || 'ohne Titel'} ansehen`">
          <img :src="tag.image.thumbUrl" alt="" loading="lazy" />
        </router-link>
        <div class="pending-image-tags__main">
          <p class="pending-image-tags__text">
            <router-link :to="characterLink(tag.taggedBy)">{{ tag.taggedBy.name }}</router-link>
            hat <strong>{{ tag.character.name }}</strong> auf
            <router-link :to="`/image/${tag.image.id}`">{{ tag.image.title || 'einem Bild' }}</router-link>
            markiert.
          </p>
          <p class="pending-image-tags__meta">{{ $display.relativeTime(tag.createdAt) }}</p>
        </div>
        <div class="pending-image-tags__actions">
          <q-btn
            class="elpis-btn elpis-btn--primary"
            unelevated
            no-caps
            dense
            icon="check"
            label="Bestätigen"
            :loading="busyId === tag.id && busyDecision === 'approved'"
            :disable="busyId === tag.id"
            @click="decide(tag, ImageTagStatus.APPROVED)"
          />
          <q-btn
            class="elpis-btn elpis-btn--secondary"
            flat
            no-caps
            dense
            icon="close"
            label="Ablehnen"
            :loading="busyId === tag.id && busyDecision === 'declined'"
            :disable="busyId === tag.id"
            @click="decide(tag, ImageTagStatus.DECLINED)"
          />
        </div>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
import type { PendingImageTagDto } from '@app/shared/dto/image/image-tag.dto';
import { ImageTagStatus } from '@app/shared/enums/image-tag-status.enum';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

// ER2 round 2 — tags on my characters awaiting consent (GET /images/tags/pending).
// Hidden when there are none or the API lacks the endpoint.

@Options({ name: 'PendingImageTags' })
export default class PendingImageTags extends Vue {
  readonly ImageTagStatus = ImageTagStatus;

  pending: PendingImageTagDto[] = [];
  busyId: number | null = null;
  busyDecision: ImageTagStatus | null = null;

  async mounted() {
    try {
      this.pending = await this.$api.images.getPendingTags();
    } catch {
      this.pending = [];
    }

    if (this.pending.length && this.$route.hash === '#markierungen') {
      void this.$nextTick(() => (this.$el as HTMLElement | undefined)?.scrollIntoView?.({ block: 'start' }));
    }
  }

  characterLink(character: { name: string; server: string }): string {
    return `/${character.server}/${character.name.replace(/ /g, '_')}`;
  }

  async decide(tag: PendingImageTagDto, status: ImageTagStatus.APPROVED | ImageTagStatus.DECLINED) {
    this.busyId = tag.id;
    this.busyDecision = status;

    try {
      await this.$api.images.decideTag(tag.id, status);
      this.pending = this.pending.filter((other) => other.id !== tag.id);
      notifySuccess(status === ImageTagStatus.APPROVED ? 'Markierung bestätigt.' : 'Markierung abgelehnt.');
    } catch (e) {
      notifyError(e);
    } finally {
      this.busyId = null;
      this.busyDecision = null;
    }
  }
}
</script>

<style lang="scss" scoped>
.pending-image-tags {
  margin: 0 0 24px;
  padding: 16px 18px;
  border: 1px solid var(--rule-strong);
  border-radius: 12px;
  background-color: var(--vision-card);
  color: var(--ink-primary);
}

.pending-image-tags__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.pending-image-tags__title {
  text-align: left;
  margin: 0;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 20px;
  line-height: 1.3;
  color: var(--ink-primary);
}

.pending-image-tags__count {
  padding: 2px 10px;
  border-radius: 999px;
  background-color: var(--vision-primary);
  color: var(--vision-on-primary);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 700;
}

.pending-image-tags__lead {
  max-width: 72ch;
  margin: 6px 0 14px;
  font-family: var(--font-ui);
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-muted);
}

.pending-image-tags__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pending-image-tags__item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--rule-soft);
}

.pending-image-tags__thumb {
  flex: 0 0 auto;
  width: 64px;
  height: 64px;
  overflow: hidden;
  border-radius: 8px;
  background-color: var(--rule-tint);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.pending-image-tags__main {
  flex: 1 1 220px;
  min-width: 0;
  font-family: var(--font-ui);

  p {
    margin: 0;
  }

  a {
    color: var(--ink-link);
  }
}

.pending-image-tags__text {
  font-size: 14px;
  line-height: 1.5;
}

.pending-image-tags__meta {
  font-size: 12px;
  color: var(--ink-muted);
}

.pending-image-tags__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}
</style>
