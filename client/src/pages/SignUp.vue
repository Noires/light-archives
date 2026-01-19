<template>
  <q-page>
    <h2>Nutzungsbedingungen</h2>
    <q-form class="page-signup__form" @submit.prevent="onAcceptTerms">
      <p>
        Willkommen bei <strong>Elpisgarten</strong>. Um einen Charakter hinzuzufuegen, musst du zuerst die Nutzungsbedingungen akzeptieren.
      </p>
      <h6>Nutzungsbedingungen</h6>
      <div
        class="page-signup__terms-of-use rounded-borders"
        v-html="rules"
      ></div>
      <q-toggle v-model="accept" label="Ich akzeptiere die Nutzungsbedingungen" />
      <div class="page-signup__button-bar">
        <q-btn
          label="Akzeptieren und fortfahren"
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
import { notifyError } from 'src/common/notify';
import { Vue } from 'vue-class-component';

export default class PageSignUp extends Vue {
  readonly rules = rules;

  accept = false;
  loading = false;

  async created() {
    if (!this.$store.state.user && this.$api.hasAccessToken()) {
      try {
        const session = await this.$api.user.getSession();
        this.$store.commit('setUser', session);
      } catch (e) {
        this.$api.setAccessToken(null);
      }
    }

    const userId = this.$store.state.user?.id;
    if (!userId) {
      void this.$router.replace('/login');
      return;
    }

    this.accept = !!this.$store.state.user?.termsAcceptedAt;
  }

  async onAcceptTerms() {
    const userId = this.$store.state.user?.id;
    if (!userId) {
      void this.$router.replace('/login');
      return;
    }

    this.loading = true;
    try {
      await this.$api.user.acceptTerms();
      const session = await this.$api.user.getSession();
      this.$store.commit('setUser', session);
      void this.$router.replace('/verify');
    } catch (e) {
      notifyError(e);
    } finally {
      this.loading = false;
    }
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
