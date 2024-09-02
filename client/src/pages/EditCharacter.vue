<template>


  <q-layout class="rounded-borders no-outline">
    <q-drawer v-show="displayDrawer()" class="border-radius-inherit edit-drawer" v-model="drawer" show-if-above :mini="miniState"
      @mouseover="miniState = false" @mouseout="miniState = true" :width="200" :breakpoint="0">
      <q-scroll-area class="fit" :horizontal-thumb-style="{ opacity: 0 }">
        <q-list padding>
          <q-item clickable v-ripple :to="`/edit-character/${$route.params.id}/profile`">
            <q-item-section avatar>
              <q-icon name="account_circle" />
            </q-item-section>

            <q-item-section>
              Profil
            </q-item-section>
          </q-item>
          <q-item v-show="character.showAppearance" clickable v-ripple
            :to="`/edit-character/${$route.params.id}/appearance`">
            <q-item-section avatar>
              <q-icon name="curtains" />
            </q-item-section>

            <q-item-section>
              Aussehen
            </q-item-section>
          </q-item>

          <q-item v-show="character.showPersonality" clickable v-ripple
            :to="`/edit-character/${$route.params.id}/personality`">
            <q-item-section avatar>
              <q-icon name="psychology" />
            </q-item-section>

            <q-item-section>
              Persönlichkeit
            </q-item-section>
          </q-item>

          <q-item v-show="character.showContacts" clickable v-ripple
            :to="`/edit-character/${$route.params.id}/contacts`">
            <q-item-section avatar>
              <q-icon name="diversity_3" />
            </q-item-section>

            <q-item-section>
              Kontakte
            </q-item-section>
          </q-item>

          <q-item v-show="character.showRumors" clickable v-ripple :to="`/edit-character/${$route.params.id}/rumors`">
            <q-item-section avatar>
              <q-icon name="sms" />
            </q-item-section>

            <q-item-section>
              Gerüchte
            </q-item-section>
          </q-item>

          <q-item v-show="character.showDiary" clickable v-ripple :to="`/edit-character/${$route.params.id}/diary`">
            <q-item-section avatar>
              <q-icon name="auto_stories" />
            </q-item-section>

            <q-item-section>
              Tagebuch
            </q-item-section>
          </q-item>

          <q-item v-show="character.showGallery" clickable v-ripple :to="`/edit-character/${$route.params.id}/gallery`">
            <q-item-section avatar>
              <q-icon name="collections" />
            </q-item-section>

            <q-item-section>
              Galerie
            </q-item-section>
          </q-item>

          <q-item v-show="character.showContacts" clickable v-ripple
            :to="`/edit-character/${$route.params.id}/inventory`">
            <q-item-section avatar>
              <q-icon name="diamond" />
            </q-item-section>

            <q-item-section>
              Inventar
            </q-item-section>
          </q-item>

        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page class="page-edit-character">
      <q-page-container>
        <router-view @updateCharacter="onUpdateCharacter"></router-view>
      </q-page-container>
    </q-page>
  </q-layout>
</template>

<script lang="ts">
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import { useStore } from 'src/store';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import { ref } from 'vue';

const $api = useApi();

// Refactoring needed for all EditCharacter files

async function load(params: RouteParams): Promise<CharacterProfileDto> {
  const id = parseInt(params.id as string, 10);

  const $store = useStore();
  const character = $store.state.user!.characters.get(id)!;

  try {
    return await $api.characters.getCharacterProfile(character.name, character.server);
  } catch (e) {
    notifyError(e);
    throw e;
  }
}

@Options({
  async beforeRouteEnter(to, _, next) {
    const character = await load(to.params);
    next((vm) => (vm as PageEditCharacter).setContent(character));
  },
})
export default class PageEditCharacter extends Vue {

  character = new CharacterProfileDto();
  characterBackup = new CharacterProfileDto();

  drawer = ref(false);
  miniState = true;

  setContent(character: CharacterProfileDto) {
    this.characterBackup = character;
    this.character = new CharacterProfileDto(this.characterBackup);
  }

  displayDrawer(): boolean {
    return !!this.character.showAppearance || !!this.character.showPersonality || !!this.character.showContacts || !!this.character.showRumors || !!this.character.showDiary || !!this.character.showGallery;
  }

  onUpdateCharacter(character: CharacterProfileDto) {
    this.characterBackup = character;
    this.character = new CharacterProfileDto(this.characterBackup);
  }
}
</script>

<style lang="scss">
.page-edit-character__form-controls {
  max-width: 500px;
  flex-basis: 0;
  flex-grow: 1;
}

.page-edit-character__lodestone-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-edit-character__checkbox .q-field__bottom {
  padding-top: 0;
}

.page-edit-character__preview {
  margin-bottom: 24px;
}

.page-edit-character__age,
.page-edit-character__pronouns {
  width: 200px;
}

.page-edit-character__button-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  margin-bottom: 16px;
}

.page-edit-character__preview h6 {
  font-family: $header-font;
}

.edit-drawer {
	background-color: #9F848D;
}

.edit-drawer .q-item {
  color: #1b1b1b;
}

</style>
