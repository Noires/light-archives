<template>
  <q-select
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :options="characterOptions"
    :label="label"
    emit-value
    map-options
    :rules="rules"
    :hint="hint"
    popup-content-class="character-selector__dropdown"
  >
    <template v-slot:prepend>
      <q-icon name="person" />
    </template>
    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <q-avatar size="32px">
            <img :src="getAvatarUrl(scope.opt.character)" :alt="scope.opt.character.name" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ scope.opt.character.name }}</q-item-label>
          <q-item-label caption>{{ scope.opt.character.server }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template v-slot:selected-item="scope">
      <div v-if="scope.opt && scope.opt.character" class="row items-center q-gutter-sm">
        <q-avatar size="24px">
          <img :src="getAvatarUrl(scope.opt.character)" :alt="scope.opt.character.name" />
        </q-avatar>
        <span>{{ scope.opt.character.name }} ({{ scope.opt.character.server }})</span>
      </div>
      <span v-else>{{ scope.opt ? scope.opt.label : '' }}</span>
    </template>
  </q-select>
</template>

<script lang="ts">
import { SessionCharacterDto } from '@app/shared/dto/user/session-character.dto';
import { Options, prop, Vue } from 'vue-class-component';

interface CharacterOption {
  label: string;
  value: number;
  character: SessionCharacterDto;
}

class Props {
  modelValue = prop<number | null>({
    required: true
  });

  label = prop<string>({
    default: 'Charakter *'
  });

  rules = prop<((val: number | null) => boolean | string)[]>({
    default: () => []
  });

  hint = prop<string>({
    default: 'Wähle den Charakter aus, der diesen Inhalt erstellt'
  });
}

@Options({
  emits: ['update:modelValue'],
})
export default class CharacterSelector extends Vue.with(Props) {

  get characters(): SessionCharacterDto[] {
    return this.$store.getters.characters;
  }

  get characterOptions(): CharacterOption[] {
    return this.characters
      .filter(char => char.verified)
      .map(char => ({
        label: `${char.name} (${char.server})`,
        value: char.id,
        character: char,
      }));
  }

  getAvatarUrl(character: SessionCharacterDto): string {
    // Use Lodestone avatar URL if available, otherwise use a default avatar
    return character.avatar || `https://img.finalfantasyxiv.com/lds/pc/global/images/common/common_defaultthumb.png`;
  }
}
</script>

<style lang="scss">
.character-selector__dropdown {
  background: white !important;

  .q-item {
    color: rgba(0, 0, 0, 0.87) !important;
    background: white !important;

    &:hover,
    &.q-manual-focusable--focused {
      background: rgba(0, 0, 0, 0.04) !important;
    }
  }

  .q-item__label--caption {
    color: rgba(0, 0, 0, 0.6) !important;
  }
}
</style>
