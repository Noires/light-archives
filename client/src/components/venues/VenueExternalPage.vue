<template>
  <section class="venue-external" aria-labelledby="venue-external-title">
    <div class="venue-external__head">
      <q-icon class="venue-external__icon" name="language" aria-hidden="true" />
      <div class="venue-external__text">
        <h2 id="venue-external-title" class="venue-external__title">Externe Seite: {{ domain }}</h2>
        <p class="venue-external__lead">Eine Carrd-Seite des Treffpunkts. Sie wird erst geladen, wenn du sie ausklappst.</p>
      </div>
      <div class="venue-external__actions">
        <q-btn
          flat
          class="elpis-btn elpis-btn--secondary"
          :icon="expanded ? 'expand_less' : 'expand_more'"
          :label="expanded ? 'Einklappen' : 'Ausklappen'"
          :aria-expanded="expanded ? 'true' : 'false'"
          aria-controls="venue-external-frame"
          @click="expanded = !expanded"
        />
        <q-btn
          flat
          class="elpis-btn elpis-btn--ghost"
          icon="open_in_new"
          label="Im neuen Tab"
          type="a"
          :href="externalUrl"
          target="_blank"
          rel="noopener"
        />
      </div>
    </div>
    <div v-show="expanded" id="venue-external-frame" class="venue-external__frame">
      <iframe
        v-if="loaded"
        v-iframe-resize
        :src="src"
        width="100%"
        height="500px"
        :title="`Externe Seite ${domain}`"
      ></iframe>
    </div>
  </section>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';

// ER2-510 — the Carrd embed as a collapsed "Externe Seite" card. The iframe
// is only created on the first expand, so Zodiark shows no white block until
// someone asks for the page.

class Props {
  /** Carrd host as stored on the venue, e.g. `name.carrd.co`. */
  profile = prop<string>({ required: true });
}

@Options({
  name: 'VenueExternalPage',
  watch: {
    expanded(value: boolean) {
      if (value) {
        (this as VenueExternalPage).loaded = true;
      }
    },
  },
})
export default class VenueExternalPage extends Vue.with(Props) {
  expanded = false;
  loaded = false;

  get domain(): string {
    return this.profile.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }

  get externalUrl(): string {
    return `https://${this.domain}`;
  }

  get src(): string {
    return `${this.$api.prefix}carrd/character/preview/${this.profile}`;
  }
}
</script>

<style lang="scss" scoped>
.venue-external {
  padding: 18px;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background-color: var(--vision-card);
  color: var(--ink-primary);
}

.venue-external__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
}

.venue-external__icon {
  flex: 0 0 auto;
  font-size: 28px;
  color: var(--ink-muted);
}

.venue-external__text {
  flex: 1 1 240px;
  min-width: 0;
}

.venue-external__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--ink-primary);
  overflow-wrap: anywhere;
}

.venue-external__lead {
  margin: 2px 0 0;
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--ink-muted);
}

.venue-external__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.venue-external__frame {
  margin-top: 16px;
  overflow: hidden;
  border: 1px solid var(--rule-soft);
  border-radius: 10px;

  iframe {
    display: block;
    border: 0;
  }
}
</style>
