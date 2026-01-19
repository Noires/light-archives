<template>
  <section class="page-login">
    <h2>Log In</h2>
    <q-form class="page-login__form" @submit.prevent="onDiscordLogin">
      <p>
        Click the button below to log in with Discord.
      </p>
      <div class="page-login__button-bar">
        <q-btn
          label="Log in with Discord"
          type="button"
          color="primary"
          @click="onDiscordLogin"
        />
      </div>
      <q-inner-loading :showing="loading" />
    </q-form>
  </section>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component';
import { notifyError, notifySuccess } from 'src/common/notify';

export default class PageLogIn extends Vue {
  loading = false;

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
      notifySuccess('You have successfully logged in.');
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
