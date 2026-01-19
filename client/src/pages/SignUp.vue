<template>
  <q-page>
    <h2>Anmeldung</h2>
    <q-form class="page-signup__form" @submit.prevent="onDiscordSignup">
      <p>
        Willkommen bei <strong>Elpisgarten</strong>. Erstelle deinen Account per Discord-Login.
      </p>
      <h6>Nutzungsbedingungen</h6>
      <div
        class="page-signup__terms-of-use rounded-borders"
        v-html="rules"
      ></div>
      <q-toggle v-model="accept" label="Ich akzeptiere die Nutzungsbedingungen" />
      <div class="page-signup__button-bar">
        <q-btn
          label="Mit Discord registrieren"
          type="submit"
          color="primary"
          :disable="!accept"
        />
      </div>
      <q-inner-loading :showing="loading" />
    </q-form>
  </q-page>
</template>

<script lang="ts">
import rules from 'src/markdown/rules.md';
import { Vue } from 'vue-class-component';

export default class PageSignUp extends Vue {
  readonly rules = rules;

  accept = false;
  loading = false;

  onDiscordSignup() {
    this.loading = true;
    window.location.href = this.$api.user.getDiscordLoginUrl();
  }
}
</script>

<style lang="scss">
.page-signup__form {
  max-width: 600px;
}

.page-signup__terms-of-use {
  border: 1px solid #aaa;
  background: white;
  padding: 16px;
  height: 400px;
  overflow-y: auto;
}

.page-signup__button-bar {
  margin-top: 8px;
  margin-bottom: 16px;
}
</style>
