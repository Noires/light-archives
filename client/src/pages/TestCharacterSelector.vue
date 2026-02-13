<template>
  <q-page class="page-test-character-selector">
    <div class="layout-container">
      <h2>Character Selector Test</h2>
      <p>This page is for testing the CharacterSelector component styling.</p>

      <character-selector
        v-model="selectedCharacter"
        label="Test Character Selector"
        hint="Select a character to test the dropdown styling"
      />

      <div v-if="selectedCharacter" class="q-mt-md">
        <strong>Selected Character ID:</strong> {{ selectedCharacter }}
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { SessionCharacterDto } from '@app/shared/dto/user/session-character.dto';
import { NewsRole } from '@app/shared/enums/news-role.enum';
import { Race } from '@app/shared/enums/race.enum';
import { TelemetryConsentStatus } from '@app/shared/enums/telemetry-consent-status.enum';
import CharacterSelector from 'components/common/CharacterSelector.vue';
import { Options, Vue } from 'vue-class-component';

@Options({
  name: 'PageTestCharacterSelector',
  components: {
    CharacterSelector,
  },
})
export default class PageTestCharacterSelector extends Vue {
  selectedCharacter: number | null = null;

  created() {
    // Mock a user session with test characters
    const mockCharacters: SessionCharacterDto[] = [
      {
        id: 1,
        lodestoneId: 12345678,
        name: 'Test Character 1',
        server: 'Odin',
        avatar: 'https://img.finalfantasyxiv.com/lds/pc/global/images/common/common_defaultthumb.png',
        race: Race.MIQOTE,
        newsRole: NewsRole.NONE,
        newsPseudonym: null,
        verified: true,
      },
      {
        id: 2,
        lodestoneId: 23456789,
        name: 'Test Character 2',
        server: 'Phoenix',
        avatar: 'https://img.finalfantasyxiv.com/lds/pc/global/images/common/common_defaultthumb.png',
        race: Race.VIERA,
        newsRole: NewsRole.NONE,
        newsPseudonym: null,
        verified: true,
      },
      {
        id: 3,
        lodestoneId: 34567890,
        name: 'Test Character 3',
        server: 'Lich',
        avatar: 'https://img.finalfantasyxiv.com/lds/pc/global/images/common/common_defaultthumb.png',
        race: Race.AURA,
        newsRole: NewsRole.NONE,
        newsPseudonym: null,
        verified: true,
      },
    ];

    // Temporarily set mock user with characters in store
    this.$store.commit('setUser', {
      id: 999,
      role: 'user',
      characters: mockCharacters,
      termsAcceptedAt: new Date().toISOString(),
      telemetryConsentStatus: TelemetryConsentStatus.GRANTED,
      telemetryConsentVersion: 1,
      telemetryConsentUpdatedAt: new Date().toISOString(),
    });
  }
}
</script>

<style lang="scss" scoped>
.page-test-character-selector {
  padding: 2rem;
}
</style>
