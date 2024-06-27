<template>
  

    <q-layout class="rounded-borders no-outline">


      <q-drawer class="border-radius-inherit"
        v-model="drawer"
        show-if-above

        :mini="miniState"
        @mouseover="miniState = false"
        @mouseout="miniState = true"

        :width="200"
        :breakpoint="0"
      >
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
            <q-item clickable v-ripple :to="`/edit-character/${$route.params.id}/appearance`">
              <q-item-section avatar>
                <q-icon name="curtains" />
              </q-item-section>

              <q-item-section>
                Aussehen
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple :to="`/edit-character/${$route.params.id}/personality`">
              <q-item-section avatar>
                <q-icon name="psychology" />
              </q-item-section>

              <q-item-section>
                Persönlichkeit
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple :to="`/edit-character/${$route.params.id}/relationships`">
              <q-item-section avatar>
                <q-icon name="diversity_3" />
              </q-item-section>

              <q-item-section>
                Kontakte
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple :to="`/edit-character/${$route.params.id}/rumors`">
              <q-item-section avatar>
                <q-icon name="sms" />
              </q-item-section>

              <q-item-section>
                Gerüchte
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple :to="`/edit-character/${$route.params.id}/diary`">
              <q-item-section avatar>
                <q-icon name="auto_stories" />
              </q-item-section>

              <q-item-section>
                Tagebuch
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple :to="`/edit-character/${$route.params.id}/gallery`">
              <q-item-section avatar>
                <q-icon name="collections" />
              </q-item-section>

              <q-item-section>
                Galerie
              </q-item-section>
            </q-item>
            </q-list>
          </q-scroll-area>
      </q-drawer>

<q-page class="page-edit-character">
<q-page-container>
    <router-view></router-view>
  </q-page-container>
  </q-page>
</q-layout>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component';
import { ref } from 'vue';

export default class PageEditCharacter extends Vue {
  
  drawer = ref(false);
  miniState = true;
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

.page-edit-character__age, .page-edit-character__pronouns {
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
</style>
