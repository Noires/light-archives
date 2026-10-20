<template>
  <div v-if="mode !== 'none'" class="fc-apply-action" :class="{ 'fc-apply-action--media': onMedia }">
    <template v-if="mode === 'pending'">
      <span class="fc-apply-action__chip fc-apply-action__chip--pending">
        <q-icon name="hourglass_top" size="16px" aria-hidden="true" />
        <span>Bewerbung offen</span>
      </span>
      <q-btn
        :class="onMedia ? 'elpis-btn group-plate__btn-media' : 'elpis-btn elpis-btn--secondary'"
        flat
        no-caps
        icon="undo"
        label="Zurückziehen"
        :loading="busy"
        @click="onWithdrawClick"
      />
    </template>

    <span v-else-if="mode === 'rejected'" class="fc-apply-action__chip fc-apply-action__chip--rejected">
      <q-icon name="block" size="16px" aria-hidden="true" />
      <span>Abgelehnt</span>
    </span>

    <span
      v-else-if="mode === 'accepted'"
      class="fc-apply-action__chip fc-apply-action__chip--accepted"
      title="Die Leitung hat deine Bewerbung angenommen. Die Mitgliedschaft erscheint nach dem Lodestone-Abgleich."
    >
      <q-icon name="check_circle" size="16px" aria-hidden="true" />
      <span>Angenommen</span>
    </span>

    <q-btn
      v-else-if="mode === 'apply'"
      class="elpis-btn elpis-btn--primary"
      unelevated
      no-caps
      icon="how_to_reg"
      label="Bewerben"
      @click="onApplyClick"
    />

    <q-btn
      v-else-if="mode === 'link'"
      class="elpis-btn elpis-btn--primary"
      unelevated
      no-caps
      icon="how_to_reg"
      label="Bewerben"
      :href="fallbackUrl"
      target="_blank"
      rel="noopener noreferrer"
    />
  </div>
</template>

<script lang="ts">
import type { FreeCompanyDto } from '@app/shared/dto/fcs/free-company.dto';
import { FreeCompanyApplicationStatus } from '@app/shared/enums/free-company-application-status.enum';
import type FreeCompaniesAPI from '@common/common/api/free-companies-api';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';

// ER2 round 2 — "Bewerben" with status chips. Uses fc.canApply and
// fc.myApplicationStatus (only present when the API supports applications
// and the FC was loaded with ?characterId=). Without them, falls back to the
// website link the page passes in.

type Mode = 'none' | 'apply' | 'link' | 'pending' | 'rejected' | 'accepted';

class Props {
  fc = prop<FreeCompanyDto>({ required: true });
  /** Website link used when the API has no application flow. */
  fallbackUrl = prop<string>({ default: '' });
  /** The current character is already a member. */
  isMember = prop<boolean>({ type: Boolean, default: false });
  /** Sits on the hero scrim (fixed on-media colours). */
  onMedia = prop<boolean>({ type: Boolean, default: false });
  /** Hide the status chips (e.g. a second instance on the same page). */
  applyOnly = prop<boolean>({ type: Boolean, default: false });
}

@Options({
  name: 'FreeCompanyApplyAction',
  emits: ['changed'],
})
export default class FreeCompanyApplyAction extends Vue.with(Props) {
  busy = false;

  get supported(): boolean {
    return typeof this.fc.canApply === 'boolean';
  }

  get mode(): Mode {
    if (this.isMember) {
      return 'none';
    }

    if (this.supported) {
      const status = this.fc.myApplicationStatus;

      if (!this.applyOnly) {
        if (status === FreeCompanyApplicationStatus.PENDING) {
          return 'pending';
        }
        if (status === FreeCompanyApplicationStatus.REJECTED) {
          return 'rejected';
        }
        if (status === FreeCompanyApplicationStatus.ACCEPTED) {
          return 'accepted';
        }
      }

      if (this.fc.canApply) {
        return 'apply';
      }

      // Not claimed yet or not open for applications here: keep the website link.
      return !status && this.fallbackUrl ? 'link' : 'none';
    }

    return this.fallbackUrl ? 'link' : 'none';
  }

  async onApplyClick() {
    const FreeCompanyApplyDialog = (await import('./FreeCompanyApplyDialog.vue')).default;
    this.$q
      .dialog({
        component: FreeCompanyApplyDialog,
        componentProps: { freeCompanyId: this.fc.id, freeCompanyName: this.fc.name },
      })
      .onOk(() => this.$emit('changed'));
  }

  onWithdrawClick() {
    const characterId = this.$store.getters.characterId;

    if (!characterId) {
      return;
    }

    this.$q
      .dialog({
        title: 'Bewerbung zurückziehen',
        message: `Möchtest du deine Bewerbung bei ${this.fc.name} zurückziehen? Du kannst dich danach erneut bewerben.`,
        ok: { label: 'Zurückziehen', flat: true, noCaps: true },
        cancel: { label: 'Abbrechen', flat: true, noCaps: true },
      })
      .onOk(async () => {
        this.busy = true;
        try {
          await (this.$api.freeCompanies as unknown as FreeCompaniesAPI).withdrawApplication(this.fc.id, characterId);
          notifySuccess('Bewerbung zurückgezogen.');
          this.$emit('changed');
        } catch (e) {
          notifyError(e);
        } finally {
          this.busy = false;
        }
      });
  }
}
</script>

<style lang="scss" scoped>
.fc-apply-action {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.fc-apply-action__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 4px 14px;
  border: 1px solid var(--rule-strong);
  border-radius: 999px;
  background-color: var(--rule-tint);
  color: var(--ink-primary);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
}

.fc-apply-action__chip--accepted {
  border-color: var(--vision-live);
  background-color: var(--vision-live-bg);
  color: var(--vision-live-text);
}

.fc-apply-action__chip--rejected {
  border-color: var(--vision-danger);
  color: var(--ink-primary);

  .q-icon {
    color: var(--vision-danger);
  }
}

// On the hero scrim: fixed on-media colours in both themes (see GroupPlate).
.fc-apply-action--media .fc-apply-action__chip {
  border-color: rgba(255, 255, 255, 0.32);
  background-color: rgba(13, 17, 24, 0.55);
  color: #FFFFFF;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.fc-apply-action--media .fc-apply-action__chip--accepted {
  border-color: #6EDCA8;

  .q-icon {
    color: #6EDCA8;
  }
}

.fc-apply-action--media .fc-apply-action__chip--rejected .q-icon {
  color: #FF8FA0;
}

.fc-apply-action--media :deep(.q-btn.group-plate__btn-media) {
  border: 1px solid rgba(255, 255, 255, 0.32);
  background-color: rgba(255, 255, 255, 0.14);
  color: #FFFFFF;
}
</style>
