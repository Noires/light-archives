<template>
  <q-page class="page-terms">
    <h2>Nutzungsbedingungen</h2>
    <q-form class="page-terms__card" @submit.prevent="onAcceptTerms">
      <p>
        Willkommen bei <strong>Elpisgarten</strong>. Um einen Charakter hinzuzufügen, musst du zuerst die Nutzungsbedingungen akzeptieren.
      </p>
      <h6>Nutzungsbedingungen</h6>
      <div
        class="page-terms__terms-of-use rounded-borders"
        v-html="rules"
      ></div>
      <q-toggle v-model="accept" label="Ich akzeptiere die Nutzungsbedingungen" />
      <div class="page-terms__button-bar">
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

export default class PageTerms extends Vue {
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
      window.location.href = this.$api.user.getDiscordLoginUrl();
      return;
    }

    this.accept = !!this.$store.state.user?.termsAcceptedAt;
  }

  async onAcceptTerms() {
    const userId = this.$store.state.user?.id;
    if (!userId) {
      window.location.href = this.$api.user.getDiscordLoginUrl();
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
.page-terms {
  max-width: 960px;
  margin: 0 auto;
}

.page-terms h2 {
  font-family: Michroma, sans-serif;
  letter-spacing: 0.02em;
  margin-bottom: 8px;
}

.page-terms__card > p {
  font-size: 1.05rem;
  color: #333;
}

.page-terms__card {
  margin: 16px 0 20px;
  padding: 20px 24px 24px;
  border-radius: 18px;
  border: 1px solid rgba(221, 180, 118, 0.35);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 246, 242, 0.98));
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.16);
  animation: page-terms-rise 420ms ease-out both;
}

.page-terms__terms-of-use {
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.96);
  padding: 16px;
  height: 400px;
  overflow-y: auto;
  box-shadow: inset 0 0 0 1px rgba(221, 180, 118, 0.2);
}

.page-terms__button-bar {
  margin-top: 12px;
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}

@keyframes page-terms-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 700px) {
  .page-terms__card {
    padding: 16px 16px 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-terms__card {
    animation: none;
  }
}
</style>
