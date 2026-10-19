<template>
  <div class="character-inventory">
    <section>
      <template v-if="owner || !isEmpty(character.possession)">
        <h6 aria-level="2">Besitz</h6>
        <p v-if="isEmpty(character.possession)" class="character-inventory__empty">{{ emptyLabel }}</p>
        <html-viewer v-else :content="character.possession" />
      </template>
      <template v-if="owner || !isEmpty(character.specialitems)">
        <h6 aria-level="2">Besondere Gegenstände</h6>
        <p v-if="isEmpty(character.specialitems)" class="character-inventory__empty">{{ emptyLabel }}</p>
        <html-viewer v-else :content="character.specialitems" />
      </template>
      <p v-if="!owner && isEmpty(character.possession) && isEmpty(character.specialitems)" class="character-inventory__empty">
        Noch kein Inventar eingetragen.
      </p>
    </section>
  </div>
</template>

<script lang="ts">
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { Options, prop, Vue } from 'vue-class-component';
import HtmlViewer from '../common/HtmlViewer.vue';
import { EMPTY_FIELD_LABEL, isEmptyFieldValue } from './empty-field';

class Props {
  character = prop<CharacterProfileDto>({
    required: true,
  });

  preview = prop<boolean>({ type: Boolean,
    default: false,
  });
}

@Options({
  components: {
    HtmlViewer,
  },
})
export default class CharacterInventory extends Vue.with(Props) {
  readonly emptyLabel = EMPTY_FIELD_LABEL;

  get owner(): boolean {
    return this.preview || !!this.character.mine;
  }

  isEmpty(value?: string): boolean {
    return isEmptyFieldValue(value);
  }
}
</script>

<style lang="scss">
@import url($extraGoogleFonts);

.character-profile__header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.character-profile__header-title {
  margin: 0;
  line-height: auto;
}

.character-profile__header-names {
  text-align: center;
}

.character-profile__header-subtitle {
  font-family: $header-font;
  font-size: 1.6em;
}

.character-profile__details td {
  padding: 4px 8px;
}

.character-profile__details tr>td:first-child {
  font-weight: bold;
}

.character-profile__appearance-background {
  margin-bottom: 24px;
}

.character-profile__appearance-background_no-header {
  margin-top: 24px;
}

.character-profile__personality-box {
  margin-bottom: 24px;
}

.character-profile__carrd-iframe {
  border: none;
}

.character-inventory__empty {
  color: var(--ink-muted);
  font-style: italic;
}
</style>
