<template>
  <section class="image-tag-editor" aria-labelledby="image-tag-editor-title">
    <h3 id="image-tag-editor-title" class="image-tag-editor__label">Charaktere markieren</h3>
    <p class="image-tag-editor__hint">
      Markierte Charaktere erscheinen erst öffentlich, wenn ihre Besitzer zustimmen. Eigene Charaktere sind sofort bestätigt.
    </p>

    <q-select
      ref="select"
      class="image-tag-editor__search"
      :model-value="null"
      :options="options"
      :option-label="(option) => `${option.name} (${option.server})`"
      label="Charakter suchen"
      hint="Mindestens 3 Zeichen des Namens eingeben."
      use-input
      hide-dropdown-icon
      input-debounce="250"
      filled
      :loading="searching || tagging"
      @filter="onFilter"
      @update:model-value="onPick"
    >
      <template #prepend><q-icon name="person_search" /></template>
      <template #option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section avatar>
            <q-avatar size="32px"><img :src="scope.opt.avatar" alt="" /></q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
            <q-item-label caption>{{ scope.opt.server }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
      <template #no-option>
        <q-item><q-item-section class="image-tag-editor__muted">Keine Charaktere gefunden</q-item-section></q-item>
      </template>
    </q-select>

    <ul v-if="tags.length" class="image-tag-editor__list" aria-label="Markierte Charaktere">
      <li v-for="tag in tags" :key="tag.characterId" class="image-tag-editor__item">
        <img class="image-tag-editor__avatar" :src="tag.avatar" alt="" />
        <span class="image-tag-editor__name">{{ tag.name }} <span class="image-tag-editor__muted">({{ tag.server }})</span></span>
        <span class="image-tag-editor__status" :class="`image-tag-editor__status--${tag.status}`">
          <q-icon :name="statusIcon(tag.status)" size="14px" aria-hidden="true" />
          {{ statusLabel(tag.status) }}
        </span>
        <q-btn
          flat
          round
          dense
          icon="close"
          :aria-label="`Markierung von ${tag.name} entfernen`"
          :loading="removingId === tag.characterId"
          @click="remove(tag)"
        />
      </li>
    </ul>
    <p v-else class="image-tag-editor__muted image-tag-editor__empty">Noch niemand markiert.</p>
  </section>
</template>

<script lang="ts">
import type { ImageTagDto } from '@app/shared/dto/image/image-tag.dto';
import { ImageTagStatus } from '@app/shared/enums/image-tag-status.enum';
import { QSelect } from 'quasar';
import { notifyError } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';

// ER2 round 2 — character tags with consent for the image owner. Searches
// portal characters (GET /characters?searchQuery=), creates tags and shows
// their consent state (Ausstehend / Bestätigt / Abgelehnt).

interface CharacterOption {
  id: number;
  name: string;
  server: string;
  avatar: string;
}

class Props {
  imageId = prop<number>({ required: true });
  initialTags = prop<ImageTagDto[]>({ default: () => [] });
}

@Options({
  name: 'ImageTagEditor',
  emits: ['update:tags'],
})
export default class ImageTagEditor extends Vue.with(Props) {
  tags: ImageTagDto[] = [];
  options: CharacterOption[] = [];
  searching = false;
  tagging = false;
  removingId: number | null = null;
  private searchToken = 0;

  created() {
    this.tags = [...this.initialTags];
  }

  statusLabel(status: ImageTagStatus): string {
    switch (status) {
      case ImageTagStatus.APPROVED:
        return 'Bestätigt';
      case ImageTagStatus.DECLINED:
        return 'Abgelehnt';
      default:
        return 'Ausstehend';
    }
  }

  statusIcon(status: ImageTagStatus): string {
    switch (status) {
      case ImageTagStatus.APPROVED:
        return 'check_circle';
      case ImageTagStatus.DECLINED:
        return 'block';
      default:
        return 'hourglass_top';
    }
  }

  async onFilter(value: string, update: (fn: () => void) => void, abort: () => void) {
    const query = value.trim();

    if (query.length < 3) {
      abort();
      return;
    }

    const token = ++this.searchToken;
    this.searching = true;

    try {
      const result = await this.$api.characters.getCharacterProfiles({ searchQuery: query, offset: 0, limit: 10 });

      if (token !== this.searchToken) {
        return;
      }

      const tagged = new Set(this.tags.map((tag) => tag.characterId));
      const options = result.data
        .filter((character) => typeof character.id === 'number' && !tagged.has(character.id))
        .map((character) => ({ id: character.id as number, name: character.name, server: character.server, avatar: character.avatar }));

      update(() => {
        this.options = options;
      });
    } catch (e) {
      abort();
      notifyError(e);
    } finally {
      if (token === this.searchToken) {
        this.searching = false;
      }
    }
  }

  async onPick(option: CharacterOption | null) {
    if (!option) {
      return;
    }

    (this.$refs.select as QSelect | undefined)?.updateInputValue('', true);
    this.tagging = true;

    try {
      const tag = await this.$api.images.tagCharacter(this.imageId, option.id);
      this.tags = [...this.tags.filter((other) => other.characterId !== tag.characterId), tag];
      this.$emit('update:tags', this.tags);
    } catch (e) {
      notifyError(e);
    } finally {
      this.tagging = false;
    }
  }

  async remove(tag: ImageTagDto) {
    this.removingId = tag.characterId;

    try {
      await this.$api.images.removeTag(this.imageId, tag.characterId);
      this.tags = this.tags.filter((other) => other.characterId !== tag.characterId);
      this.$emit('update:tags', this.tags);
    } catch (e) {
      notifyError(e);
    } finally {
      this.removingId = null;
    }
  }
}
</script>

<style lang="scss" scoped>
.image-tag-editor {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--rule-soft);
  color: var(--ink-primary);
}

.image-tag-editor__label {
  margin: 0 0 4px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  font-weight: 700;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-muted);
  line-height: 1.4;
}

.image-tag-editor__hint {
  margin: 0 0 8px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
  line-height: 1.5;
  color: var(--ink-muted);
}

.image-tag-editor__muted {
  color: var(--ink-muted);
}

.image-tag-editor__empty {
  margin: 8px 0 0;
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
}

.image-tag-editor__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.image-tag-editor__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 6px 6px 8px;
  border: 1px solid var(--rule-soft);
  border-radius: 10px;
  background-color: var(--vision-card);
  font-family: var(--font-ui);
  font-size: 14px;
}

.image-tag-editor__avatar {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.image-tag-editor__name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-tag-editor__status {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border: 1px solid var(--rule-strong);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-primary);
}

.image-tag-editor__status--approved {
  border-color: var(--vision-live);
  background-color: var(--vision-live-bg);
  color: var(--vision-live-text);
}

.image-tag-editor__status--declined .q-icon {
  color: var(--vision-danger);
}

.image-tag-editor__status--pending {
  background-color: var(--rule-tint);
}
</style>
