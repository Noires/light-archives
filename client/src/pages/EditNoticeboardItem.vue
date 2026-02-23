<template>
  <q-page class="page-edit-noticeboard-item">
    <template v-if="loaded">
      <h2>{{ noticeboardItem.id ? 'Aushang bearbeiten' : 'Neuen Aushang erstellen' }}</h2>
      <q-form @submit="onSubmit">
        <template v-if="!preview">
          <character-selector
            v-if="!noticeboardItem.id"
            v-model="selectedCharacterId"
            :rules="[
              $rules.required('Bitte wähle einen Charakter aus.'),
            ]"
          />
          <q-input
            v-model="noticeboardItem.title"
            label="Titel *"
            :rules="[
              $rules.required('Dieses Feld ist erforderlich.'),
            ]"
          />
          <div class="page-edit-noticeboard-item__option-label"><label>Gebiet:</label></div>
          <q-option-group
            v-model="noticeboardItem.location"
            :options="locationOptions"
          />
          <div class="page-edit-noticeboard-item__option-label"><label>Typ:</label></div>
          <q-option-group
            v-model="noticeboardItem.type"
            :options="typeOptions"
            @update:model-value="onTypeChanged"
          />
          <q-select
            v-if="canLinkVenueType"
            v-model="noticeboardItem.venueId"
            :options="venueOptions"
            emit-value
            map-options
            clearable
            label="Treffpunkt (optional)"
            :loading="loadingVenues"
            hint="Stellenangebote/Stellengesuche koennen direkt mit einem Treffpunkt verknuepft werden."
          />
          <h6>Content *</h6>
          <html-editor v-model="noticeboardItem.content" />
          <template v-if="!noticeboardItem.id">
            <q-checkbox v-model="postOnDiscord" label="Auf Discord posten" />
            <div class="text-caption">Nur eingeschränkte Formatierung — fett, kursiv und Blockzitate — werden von Discord übernommen. Es ist nicht möglich den Discordpost nach der Erstellung des Aushangs zu bearbeiten.</div>
          </template>
        </template>
        <section v-else class="page-edit-noticeboard-item__preview">
          <noticeboard-item-view :noticeboard-item="noticeboardItem" :preview="true" />
        </section>
        <div class="page-edit-noticeboard-item__button-bar">
          <q-btn-toggle
            v-model="preview"
            :options="previewOptions"
            toggle-color="secondary"
          />
          <div class="page-edit-noticeboard-item__revert-submit">
            <q-btn label="Zurücksetzen" color="secondary" @click="revert" />&nbsp;
            <q-btn label="Änderungen speichern" type="submit" color="primary" />
          </div>
        </div>
        <q-inner-loading :showing="saving" />
      </q-form>
    </template>
    <q-spinner v-else />

    <q-dialog v-model="confirmRevert" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <span class="q-ml-sm"
            >Möchtest du die ungespeicherten Änderungen auf die letzte gespeicherte Version zurücksetzen?</span
          >
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Bearbeitung fortsetzen" color="secondary" v-close-popup />
          <q-btn
            flat
            label="Zurücksetzen"
            color="negative"
            v-close-popup
            @click="onConfirmRevert"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { NoticeboardItemDto } from '@app/shared/dto/noticeboard/noticeboard-item.dto';
import { VenueSummaryDto } from '@app/shared/dto/venues/venue-summary.dto';
import { NoticeboardLocation } from '@app/shared/enums/noticeboard-location.enum';
import { NoticeboardType } from '@app/shared/enums/noticeboard-type.enum';
import CharacterSelector from 'components/common/CharacterSelector.vue';
import HtmlEditor from 'components/common/HtmlEditor.vue';
import NoticeboardItemView from 'components/noticeboard/NoticeboardItemView.vue';
import { displayOptions } from 'src/boot/display';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';
import { RouteLocationNormalized, RouteParams } from 'vue-router';

@Options({
  name: 'PageEditNoticeboardItem',
  components: {
    CharacterSelector,
    HtmlEditor,
    NoticeboardItemView,
  },
  beforeRouteEnter(to, _, next) {
    next((vm) => (vm as PageEditNoticeboardItem).load(to.params, to.query));
  },
  async beforeRouteUpdate(to) {
    await (this as PageEditNoticeboardItem).load(to.params, to.query);
  },
})
export default class PageEditNoticeboardItem extends Vue {
  readonly previewOptions = [
    { label: 'Bearbeitung', value: false },
    { label: 'Vorschau', value: true },
  ];

  readonly locationOptions = Object.values(NoticeboardLocation).map((location) => ({
    label: displayOptions.noticeboardLocations[location],
    value: location,
  }));
  readonly typeOptions = Object.values(NoticeboardType).map((type) => ({
    label: displayOptions.noticeboardTypes[type],
    value: type,
  }));

  noticeboardItem = new NoticeboardItemDto();
  noticeboardItemBackup = new NoticeboardItemDto();
  editableVenues: VenueSummaryDto[] = [];
  loadingVenues = false;
  postOnDiscord = true;
  preview = false;
  loaded = false;
  saving = false;

  confirmRevert = false;

  selectedCharacterId: number | null = null;

  private async load(params: RouteParams, query: RouteLocationNormalized['query']) {
    const id = parseInt(params.id as string, 10);
    const queryVenueId = parseInt((query.venueId as string) || '', 10);
    const queryType = (query.type as NoticeboardType) || null;
    const character = this.$store.getters.character;

    if (!character) {
      void this.$router.push('/');
      return;
    }

    await this.loadEditableVenues();

    if (id) {
      this.loaded = false;
      this.noticeboardItemBackup = await this.$api.noticeboard.getNoticeboardItem(id);
      if (!this.noticeboardItemBackup.type) {
        this.noticeboardItemBackup.type = NoticeboardType.AUSHANG;
      }
      this.loaded = true;
    } else {
      this.noticeboardItemBackup = new NoticeboardItemDto({
        mine: true,
        createdAt: Date.now(),
        location: NoticeboardLocation.MULTIPLE_LOCATIONS,
        type: queryType || NoticeboardType.AUSHANG,
        title: '',
        content: '',
        venueId:
          !Number.isNaN(queryVenueId) && this.isVenueType(queryType || NoticeboardType.AUSHANG)
            ? queryVenueId
            : undefined,
      });
      this.loaded = true;
    }

    // Initialize selected character (default to current active character)
    this.selectedCharacterId = this.$store.getters.characterId || null;

    this.noticeboardItem = new NoticeboardItemDto(this.noticeboardItemBackup);
    this.onTypeChanged();
  }

  get canLinkVenueType(): boolean {
    return this.isVenueType(this.noticeboardItem.type || NoticeboardType.AUSHANG);
  }

  get venueOptions() {
    const options = this.editableVenues.map((venue) => ({
      label: `${venue.name} (${venue.server})`,
      value: venue.id,
    }));

    if (
      this.noticeboardItem.venueId
      && this.noticeboardItem.venueName
      && this.noticeboardItem.venueServer
      && !options.some((option) => option.value === this.noticeboardItem.venueId)
    ) {
      options.unshift({
        label: `${this.noticeboardItem.venueName} (${this.noticeboardItem.venueServer})`,
        value: this.noticeboardItem.venueId,
      });
    }

    return options;
  }

  private async loadEditableVenues() {
    this.loadingVenues = true;
    try {
      this.editableVenues = await this.$api.venues.getEditableVenues();
    } finally {
      this.loadingVenues = false;
    }
  }

  onTypeChanged() {
    if (!this.canLinkVenueType) {
      this.noticeboardItem.venueId = undefined;
    }
  }

  private isVenueType(type: NoticeboardType): boolean {
    return type === NoticeboardType.STELLENANGEBOT || type === NoticeboardType.STELLENGESUCH;
  }

  revert() {
    this.confirmRevert = true;
  }

  onConfirmRevert() {
    this.noticeboardItem = new NoticeboardItemDto(this.noticeboardItemBackup);
  }

  async onSubmit() {
    this.saving = true;

    try {
      if (!this.noticeboardItem.id) {
        if (!this.selectedCharacterId) {
          throw new Error('No character selected');
        }
        this.noticeboardItem.characterId = this.selectedCharacterId;
        const { id } = await this.$api.noticeboard.createNoticeboardItem(this.noticeboardItem, this.postOnDiscord);
        this.noticeboardItem.id = id;
        void this.$router.replace(`/edit-noticeboard-item/${id}`);
      } else {
        await this.$api.noticeboard.editNoticeboardItem(this.noticeboardItem);
      }

      this.noticeboardItemBackup = new NoticeboardItemDto(this.noticeboardItem);

      notifySuccess('Aushang gespeichert.', {
        label: 'Anschauen',
        color: 'white',
        handler: () => this.viewNoticeboardItem(),
      });
    } catch (e) {
      notifyError(e);
    } finally {
      this.saving = false;
    }
  }

  viewNoticeboardItem() {
    if (this.noticeboardItem.id) {
      void this.$router.push(`/noticeboard/${this.noticeboardItem.id}`);
    }
  }
}
</script>

<style lang="scss">
.page-edit-noticeboard-item__form-controls {
  max-width: 500px;
  flex-basis: 0;
  flex-grow: 1;
}

.page-edit-noticeboard-item__preview {
  margin-bottom: 24px;
}

.page-edit-noticeboard-item__button-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  margin-bottom: 16px;
}

.page-edit-noticeboard-item__preview h6 {
  font-family: $header-font;
}

.page-edit-noticeboard-item__option-label {
  margin-top: 12px;
}
</style>
