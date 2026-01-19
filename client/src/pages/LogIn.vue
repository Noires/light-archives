<template>
  <q-page>
    <h2>Einloggen</h2>
    <q-form class="page-login__form" @submit.prevent="onDiscordLogin">
      <p>
        Bitte klicke auf den Button, um dich mit Discord einzuloggen.
      </p>
      <div class="page-login__button-bar">
        <q-btn
          label="Mit Discord einloggen"
          type="button"
          color="primary"
          @click="onDiscordLogin"
        />
      </div>
      <q-inner-loading :showing="loading" />
    </q-form>
  </q-page>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component';
import { notifyError, notifySuccess } from 'src/common/notify';

export default class PageLogIn extends Vue {
  private loading = false;

  async mounted() {
    const token = this.$route.query.token;

    if (typeof token !== 'string' || token.length === 0) {
      return;
    }

    this.loading = true;

    try {
      this.$api.setAccessToken(token);
      const session = await this.$api.user.getSession();
      this.$store.commit('setUser', session);
      notifySuccess('Du wurdest erfolgreich eingeloggt.');
      void this.$router.replace('/');
    } catch (e) {
      this.$api.setAccessToken(null);
      notifyError(e);
    } finally {
      this.loading = false;
    }
  }

  onDiscordLogin() {
    window.location.href = this.$api.user.getDiscordLoginUrl();
  }
}
</script>

<style lang="scss">
.page-login__form {
  max-width: 500px;
  margin: auto;
}

.page-login__button-bar {
  margin-top: 8px;
  margin-bottom: 16px;
  text-align: right;
}
</style>
