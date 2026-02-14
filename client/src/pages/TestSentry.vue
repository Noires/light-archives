<template>
  <q-page class="page-test-sentry q-pa-md">
    <div class="layout-container">
      <h2>Sentry Test</h2>
      <p>Use this page to verify frontend Sentry issue reporting.</p>
      <p class="text-caption q-mb-md">
        Telemetry consent must be granted and Sentry must be configured.
      </p>

      <div class="row q-col-gutter-sm">
        <div class="col-auto">
          <q-btn
            color="negative"
            icon="bug_report"
            label="Throw unhandled error"
            @click="throwUnhandledError"
          />
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            icon="send"
            outline
            label="Capture handled error"
            @click="captureHandledError"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import * as Sentry from '@sentry/vue';
import { Options, Vue } from 'vue-class-component';

@Options({
  name: 'PageTestSentry',
})
export default class PageTestSentry extends Vue {
  throwUnhandledError(): void {
    const message = `[Sentry Test] Unhandled frontend error at ${new Date().toISOString()}`;
    setTimeout(() => {
      throw new Error(message);
    }, 0);
  }

  captureHandledError(): void {
    const message = `[Sentry Test] Handled frontend error at ${new Date().toISOString()}`;
    Sentry.captureException(new Error(message));
  }
}
</script>

<style lang="scss" scoped>
.page-test-sentry {
  max-width: 960px;
  margin: 0 auto;
}
</style>
