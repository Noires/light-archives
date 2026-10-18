<template>
  <q-dialog ref="dialog" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="album-edit-dialog mat-aetherglass elevation-3" role="dialog" aria-labelledby="album-edit-dialog-title">
      <header class="album-edit-dialog__header">
        <h2 id="album-edit-dialog-title" class="album-edit-dialog__title">{{ album ? 'Album bearbeiten' : 'Neues Album' }}</h2>
        <q-btn flat round dense icon="close" aria-label="Schließen" @click="hide" />
      </header>

      <q-form class="album-edit-dialog__form" @submit="onSave">
        <q-input
          v-model="title"
          label="Titel *"
          :maxlength="ALBUM_TITLE_MAX_LENGTH"
          counter
          filled
          autofocus
          :rules="[(val) => !!(val && val.trim()) || 'Bitte gib einen Titel ein.']"
        />
        <q-input
          v-model="description"
          label="Beschreibung"
          type="textarea"
          autogrow
          :maxlength="ALBUM_DESCRIPTION_MAX_LENGTH"
          filled
        />

        <section class="album-edit-dialog__images" aria-labelledby="album-edit-dialog-images">
          <div class="album-edit-dialog__images-head">
            <h3 id="album-edit-dialog-images" class="album-edit-dialog__label">Bilder auswählen</h3>
            <span class="album-edit-dialog__count" aria-live="polite">{{ selected.length }} ausgewählt</span>
          </div>
          <p class="album-edit-dialog__hint">Wähle Bilder dieses Charakters aus. Mit dem Stern legst du das Titelbild fest.</p>

          <div v-if="loadingImages" class="album-edit-dialog__loading"><q-spinner size="28px" /></div>
          <p v-else-if="!images.length" class="album-edit-dialog__hint">Dieser Charakter hat noch keine Bilder hochgeladen.</p>
          <ul v-else class="album-edit-dialog__grid">
            <li
              v-for="image in images"
              :key="image.id"
              class="album-edit-dialog__tile"
              :class="{ 'album-edit-dialog__tile--selected': isSelected(image.id) }"
            >
              <button
                type="button"
                role="checkbox"
                class="album-edit-dialog__pick"
                :aria-checked="isSelected(image.id) ? 'true' : 'false'"
                :aria-label="image.title || 'Bild ohne Titel'"
                @click="toggle(image.id)"
              >
                <img :src="image.thumbUrl" alt="" loading="lazy" />
                <span class="album-edit-dialog__check" aria-hidden="true">
                  <q-icon :name="isSelected(image.id) ? 'check_box' : 'check_box_outline_blank'" size="20px" />
                </span>
                <span class="album-edit-dialog__tile-title">{{ image.title || 'Ohne Titel' }}</span>
              </button>
              <button
                v-if="isSelected(image.id)"
                type="button"
                class="album-edit-dialog__cover"
                :class="{ 'album-edit-dialog__cover--active': effectiveCoverId === image.id }"
                :aria-pressed="effectiveCoverId === image.id ? 'true' : 'false'"
                :aria-label="effectiveCoverId === image.id ? 'Titelbild' : 'Als Titelbild verwenden'"
                :title="effectiveCoverId === image.id ? 'Titelbild' : 'Als Titelbild verwenden'"
                @click="coverImageId = image.id"
              >
                <q-icon :name="effectiveCoverId === image.id ? 'star' : 'star_outline'" size="18px" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </section>

        <div class="album-edit-dialog__actions">
          <q-btn class="elpis-btn elpis-btn--secondary" flat no-caps label="Abbrechen" @click="hide" />
          <q-btn class="elpis-btn elpis-btn--primary" unelevated no-caps type="submit" :label="album ? 'Speichern' : 'Album anlegen'" :loading="saving" />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { ALBUM_DESCRIPTION_MAX_LENGTH, ALBUM_TITLE_MAX_LENGTH } from '@app/shared/dto/albums/album-edit.dto';
import type { AlbumDto } from '@app/shared/dto/albums/album.dto';
import type { ImageDto } from '@app/shared/dto/image/image.dto';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';

// ER2 round 2 — create or edit an album: title, description and a checkbox
// grid of the owner's images (GET /characters/:id/my-images) with a cover star.

interface DialogRef {
  show(): void;
  hide(): void;
}

class Props {
  /** Existing album (edit) or null (create). */
  album = prop<AlbumDto | null>({ default: null });
  /** Owner character. */
  characterId = prop<number>({ required: true });
}

@Options({
  name: 'AlbumEditDialog',
  emits: ['ok', 'hide'],
})
export default class AlbumEditDialog extends Vue.with(Props) {
  readonly ALBUM_TITLE_MAX_LENGTH = ALBUM_TITLE_MAX_LENGTH;
  readonly ALBUM_DESCRIPTION_MAX_LENGTH = ALBUM_DESCRIPTION_MAX_LENGTH;

  title = '';
  description = '';
  selected: number[] = [];
  coverImageId: number | null = null;
  images: ImageDto[] = [];
  loadingImages = true;
  saving = false;

  created() {
    if (this.album) {
      this.title = this.album.title;
      this.description = this.album.description || '';
      this.selected = this.album.images.map((image) => image.id);
      this.coverImageId = this.album.coverImageId;
    }
  }

  async mounted() {
    try {
      this.images = await this.$api.characters.getMyImages(this.characterId);
    } catch (e) {
      notifyError(e);
    } finally {
      this.loadingImages = false;
    }
  }

  get effectiveCoverId(): number | null {
    if (this.coverImageId && this.selected.includes(this.coverImageId)) {
      return this.coverImageId;
    }

    return this.selected[0] || null;
  }

  isSelected(id: number): boolean {
    return this.selected.includes(id);
  }

  toggle(id: number) {
    this.selected = this.isSelected(id) ? this.selected.filter((other) => other !== id) : [...this.selected, id];
  }

  show() {
    (this.$refs.dialog as DialogRef).show();
  }

  hide() {
    (this.$refs.dialog as DialogRef).hide();
  }

  onDialogHide() {
    this.$emit('hide');
  }

  async onSave() {
    const title = this.title.trim();

    if (!title) {
      return;
    }

    this.saving = true;

    try {
      const description = this.description.trim() || null;
      let id: number;

      if (this.album) {
        id = this.album.id;
        await this.$api.albums.editAlbum(id, { title, description, coverImageId: this.effectiveCoverId });
        await this.$api.albums.setAlbumImages(id, this.selected);
      } else {
        id = (
          await this.$api.albums.createAlbum({
            characterId: this.characterId,
            title,
            description,
            coverImageId: this.effectiveCoverId,
            imageIds: this.selected,
          })
        ).id;
      }

      notifySuccess(this.album ? 'Album gespeichert.' : 'Album angelegt.');
      this.$emit('ok', id);
      this.hide();
    } catch (e) {
      notifyError(e);
    } finally {
      this.saving = false;
    }
  }
}
</script>

<style lang="scss" scoped>
.album-edit-dialog {
  width: min(760px, 96vw);
  max-width: 96vw;
  padding: 18px 24px 16px;
  border-radius: 12px;
  color: var(--ink-primary);
}

.album-edit-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.album-edit-dialog__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--type-scale-3);
  line-height: 1.3;
  color: var(--ink-primary);
}

.album-edit-dialog__form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.album-edit-dialog__images {
  margin-top: 8px;
}

.album-edit-dialog__images-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.album-edit-dialog__label {
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  font-weight: 700;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-muted);
  line-height: 1.4;
}

.album-edit-dialog__count {
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  color: var(--ink-muted);
}

.album-edit-dialog__hint {
  margin: 4px 0 10px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
  color: var(--ink-muted);
}

.album-edit-dialog__loading {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.album-edit-dialog__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  max-height: 46vh;
  margin: 0;
  padding: 2px;
  overflow-y: auto;
  list-style: none;
}

.album-edit-dialog__tile {
  position: relative;
  border: 2px solid var(--rule-soft);
  border-radius: 10px;
  background: var(--vision-card);
  overflow: hidden;
}

.album-edit-dialog__tile--selected {
  border-color: var(--rule-strong);
  box-shadow: 0 0 0 1px var(--rule-strong);
}

.album-edit-dialog__pick {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 3px var(--glow-aether);
  }

  img {
    display: block;
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
  }
}

.album-edit-dialog__check {
  position: absolute;
  top: 4px;
  left: 4px;
  display: inline-flex;
  padding: 3px;
  border-radius: 6px;
  background: var(--surface-glass);
  color: var(--ink-link);
}

.album-edit-dialog__tile-title {
  display: block;
  padding: 4px 8px 6px;
  overflow: hidden;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-edit-dialog__cover {
  position: absolute;
  top: 4px;
  right: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--rule-soft);
  border-radius: 999px;
  background: var(--surface-glass);
  color: var(--ink-muted);
  cursor: pointer;

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.album-edit-dialog__cover--active {
  border-color: var(--rule-strong);
  color: var(--ink-link);
}

.album-edit-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
</style>
