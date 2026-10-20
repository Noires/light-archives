<template>
  <q-btn
    class="elpis-btn plate-export-btn"
    flat
    no-caps
    icon="download"
    label="Plakette herunterladen"
    :loading="busy"
    :aria-busy="busy ? 'true' : 'false'"
    @click="exportPlate"
  >
    <template #loading>
      <q-spinner size="18px" class="q-mr-sm" />
      <span>Wird erstellt …</span>
    </template>
  </q-btn>
</template>

<script lang="ts">
// ER2 outlook — "Plakette herunterladen": renders the adventurer plate as a
// 1200 × 630 PNG (plate-export.ts) and downloads `<Name>-Plakette.png`.
// Secondary button on media: glass fill, white text, same as the other hero
// actions of CharacterPlate.
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { RpStatus } from '@app/shared/enums/rp-status.enum';
import { isEmptyFieldValue } from 'components/character/empty-field';
import { stripWikilinks } from 'components/character/profile-sections';
import { activeRpStatus, RP_STATUS_LABELS } from 'components/character/rp-status';
import { notifyError } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';
import { downloadPlate, PlateChip, PlateData } from './plate-export';

// Chip dots on the dark plate (fixed on-media colours, like CharacterPlate).
const RP_DOTS: Record<RpStatus, string> = {
  [RpStatus.IC]: '#6EDCA8',
  [RpStatus.LFRP]: '#F3D9A4',
  [RpStatus.OOC]: '#A2ADBA',
};

class Props {
  character = prop<CharacterProfileDto>({ required: true });
}

@Options({
  name: 'PlateExportButton',
})
export default class PlateExportButton extends Vue.with(Props) {
  busy = false;

  private text(value?: string | null): string {
    return value && !isEmptyFieldValue(value) ? stripWikilinks(value).trim() : '';
  }

  get plateData(): PlateData {
    const c = this.character;
    const title = this.text(c.title);
    const nickname = this.text(c.nickname);
    const meta = [
      c.race ? this.$display.races[c.race] : '',
      c.tribe ? this.$display.tribes[c.tribe] : '',
      c.server ? `${c.server} [Light]` : '',
    ].filter((part) => !!part).join(' · ');

    const chips: PlateChip[] = [];
    const rp = activeRpStatus(c);
    if (rp) {
      chips.push({ label: RP_STATUS_LABELS[rp], dot: RP_DOTS[rp] });
    }
    if (c.freeCompany?.name) {
      chips.push({ label: c.freeCompany.name });
    }
    // The profile has no play-style field yet; a third chip is added once it exists.

    return {
      name: c.name,
      title: [ title, nickname ? `«${nickname}»` : '' ].filter((part) => !!part).join(' · '),
      meta,
      chips,
      avatarUrl: c.avatar || '',
      bannerUrl: c.banner?.url || '',
    };
  }

  async exportPlate() {
    if (this.busy) {
      return;
    }
    this.busy = true;
    try {
      const ok = await downloadPlate(this.plateData);
      if (!ok) {
        notifyError('Die Plakette konnte nicht erstellt werden. Dein Browser unterstützt den Bildexport nicht.');
      }
    } catch (e) {
      notifyError('Die Plakette konnte nicht erstellt werden. Bitte versuche es erneut.');
    } finally {
      this.busy = false;
    }
  }
}
</script>

<style lang="scss" scoped>
// Secondary on media: the plate text always sits on a dark scrim.
.q-btn.plate-export-btn {
  border: 1px solid rgba(255, 255, 255, 0.32);
  background-color: rgba(255, 255, 255, 0.14);
  color: #FFFFFF;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  &:not(.disabled):hover {
    background-color: rgba(255, 255, 255, 0.24);
  }

  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    background-color: rgba(13, 17, 24, 0.6);
  }
}
</style>
