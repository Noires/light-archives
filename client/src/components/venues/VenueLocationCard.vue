<template>
  <section class="venue-location" aria-labelledby="venue-location-title">
    <h2 id="venue-location-title" class="venue-location__title">So findest du uns</h2>
    <dl v-if="rows.length" class="venue-location__rows">
      <template v-for="row in rows" :key="row.label">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </template>
    </dl>
    <p v-else class="venue-location__empty">Keine Adresse eingetragen.</p>
    <div v-if="command" class="venue-location__command">
      <code class="venue-location__code">{{ command }}</code>
      <q-btn
        flat
        dense
        class="elpis-btn elpis-btn--secondary"
        icon="content_copy"
        label="Kopieren"
        :aria-label="`Teleport-Befehl ${command} kopieren`"
        @click="copyCommand"
      />
    </div>
    <p v-if="command" class="venue-location__hint">Für das Lifestream-Plugin: im Chat einfügen und abschicken.</p>
  </section>
</template>

<script lang="ts">
import { copyToClipboard } from 'quasar';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';
import { LocationRow, VenueLocationSource, locationRows, teleportCommand } from './venue-location';

// ER2-509 — structured venue location with the copyable teleport command.

class Props {
  venue = prop<VenueLocationSource>({ required: true });
}

@Options({
  name: 'VenueLocationCard',
})
export default class VenueLocationCard extends Vue.with(Props) {
  get rows(): LocationRow[] {
    return locationRows(this.venue);
  }

  get command(): string {
    return teleportCommand(this.venue);
  }

  async copyCommand() {
    try {
      await copyToClipboard(this.command);
      notifySuccess('Teleport-Befehl kopiert.');
    } catch (e) {
      notifyError('Kopieren hat nicht geklappt.');
    }
  }
}
</script>

<style lang="scss" scoped>
.venue-location__title {
  text-align: left;
  margin: 0 0 10px;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--ink-primary);
}

.venue-location__rows {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 6px 14px;
  margin: 0;
  font-family: var(--font-ui);
  font-size: 14px;

  dt {
    color: var(--ink-muted);
  }

  dd {
    margin: 0;
    font-weight: 600;
    color: var(--ink-primary);
    overflow-wrap: anywhere;
  }
}

.venue-location__empty,
.venue-location__hint {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--ink-muted);
}

.venue-location__command {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 12px 0 6px;
}

.venue-location__code {
  flex: 1 1 160px;
  min-width: 0;
  padding: 6px 10px;
  border: 1px solid var(--rule-soft);
  border-radius: 8px;
  background-color: var(--rule-tint);
  color: var(--ink-primary);
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
  font-size: 13px;
  overflow-wrap: anywhere;
}
</style>
