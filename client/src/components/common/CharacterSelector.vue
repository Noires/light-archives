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
  >
    <template v-slot:prepend>
      <q-icon name="person" />
    </template>
  </q-select>
</template>

<script lang="ts">
import { SessionCharacterDto } from '@app/shared/dto/user/session-character.dto';
import { Options, prop, Vue } from 'vue-class-component';

interface CharacterOption {
  label: string;
  value: number;
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = (this.$store.getters as any).user as { characters?: SessionCharacterDto[] } | undefined;
    return user?.characters || [];
  }

  get characterOptions(): CharacterOption[] {
    return this.characters
      .filter(char => char.verified)
      .map(char => ({
        label: `${char.name} (${char.server})`,
        value: char.id,
      }));
  }
}
</script>

<style lang="scss">
</style>
