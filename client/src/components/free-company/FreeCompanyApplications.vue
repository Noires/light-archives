<template>
  <section v-if="available" class="fc-applications" :aria-labelledby="headingId">
    <header class="fc-applications__head">
      <component :is="headingTag" :id="headingId" class="fc-applications__title">Bewerbungen</component>
      <span v-if="pending.length" class="fc-applications__count">{{ pending.length }} offen</span>
    </header>
    <p class="fc-applications__note">
      <q-icon name="info" size="18px" aria-hidden="true" />
      <span>
        „Annehmen“ ist eine Rückmeldung an die Person. Die Mitgliedschaft selbst entsteht im Spiel und erscheint hier,
        sobald der Lodestone-Abgleich sie meldet.
      </span>
    </p>

    <div v-if="loading" class="fc-applications__loading"><q-spinner size="24px" /></div>
    <p v-else-if="!applications.length" class="fc-applications__empty">Noch keine Bewerbungen.</p>
    <ul v-else class="fc-applications__list">
      <li v-for="application in sorted" :key="application.id" class="fc-applications__item">
        <img class="fc-applications__avatar" :src="application.avatar" alt="" loading="lazy" />
        <div class="fc-applications__main">
          <p class="fc-applications__name">
            <router-link :to="characterLink(application)">{{ application.name }}</router-link>
            <span class="fc-applications__meta">{{ application.server }} · {{ $display.relativeTime(application.createdAt) }}</span>
          </p>
          <p v-if="application.message" class="fc-applications__message">{{ application.message }}</p>
          <p v-if="application.status !== 'pending'" class="fc-applications__decided">
            <span class="fc-applications__status" :class="`fc-applications__status--${application.status}`">
              <q-icon :name="application.status === 'accepted' ? 'check_circle' : 'block'" size="14px" aria-hidden="true" />
              {{ application.status === 'accepted' ? 'Angenommen' : 'Abgelehnt' }}
            </span>
            <span v-if="application.decidedBy"> von {{ application.decidedBy }}</span>
          </p>
        </div>
        <div v-if="application.status === 'pending'" class="fc-applications__actions">
          <q-btn
            class="elpis-btn elpis-btn--primary"
            unelevated
            no-caps
            dense
            icon="check"
            label="Annehmen"
            :loading="busyId === application.id"
            @click="decide(application, 'accept')"
          />
          <q-btn
            class="elpis-btn elpis-btn--secondary"
            flat
            no-caps
            dense
            icon="close"
            label="Ablehnen"
            :disable="busyId === application.id"
            @click="decide(application, 'reject')"
          />
        </div>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
import type { FreeCompanyApplicationDto } from '@app/shared/dto/fcs/free-company-application.dto';
import { FreeCompanyApplicationStatus } from '@app/shared/enums/free-company-application-status.enum';
import type FreeCompaniesAPI from '@common/common/api/free-companies-api';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';

// ER2 round 2 — FC applications for managers (leader or members with edit
// permission). Hidden when the endpoint is missing or forbidden.

let counter = 0;

class Props {
  freeCompanyId = prop<number>({ required: true });
  headingTag = prop<string>({ default: 'h2' });
}

@Options({
  name: 'FreeCompanyApplications',
  emits: ['changed'],
  watch: {
    freeCompanyId() {
      void (this as FreeCompanyApplications).load();
    },
  },
})
export default class FreeCompanyApplications extends Vue.with(Props) {
  readonly headingId = `fc-applications-${++counter}`;

  applications: FreeCompanyApplicationDto[] = [];
  available = false;
  loading = true;
  busyId: number | null = null;

  get api(): FreeCompaniesAPI {
    return this.$api.freeCompanies as unknown as FreeCompaniesAPI;
  }

  get pending(): FreeCompanyApplicationDto[] {
    return this.applications.filter((application) => application.status === FreeCompanyApplicationStatus.PENDING);
  }

  /** Pending first, then decided; newest first within each group. */
  get sorted(): FreeCompanyApplicationDto[] {
    const rank = (application: FreeCompanyApplicationDto) => (application.status === FreeCompanyApplicationStatus.PENDING ? 0 : 1);
    return [...this.applications].sort((a, b) => rank(a) - rank(b) || b.createdAt - a.createdAt);
  }

  mounted() {
    void this.load();
  }

  async load() {
    this.loading = true;

    try {
      this.applications = await this.api.getApplications(this.freeCompanyId);
      this.available = true;
    } catch {
      this.available = false;
    } finally {
      this.loading = false;
    }
  }

  characterLink(application: FreeCompanyApplicationDto): string {
    return `/${application.server}/${application.name.replace(/ /g, '_')}`;
  }

  async decide(application: FreeCompanyApplicationDto, decision: 'accept' | 'reject') {
    this.busyId = application.id;

    try {
      if (decision === 'accept') {
        await this.api.acceptApplication(this.freeCompanyId, application.id);
        notifySuccess(`Bewerbung von ${application.name} angenommen. Die Aufnahme erfolgt im Spiel.`);
      } else {
        await this.api.rejectApplication(this.freeCompanyId, application.id);
        notifySuccess(`Bewerbung von ${application.name} abgelehnt.`);
      }

      await this.load();
      this.$emit('changed');
    } catch (e) {
      notifyError(e);
    } finally {
      this.busyId = null;
    }
  }
}
</script>

<style lang="scss" scoped>
.fc-applications {
  color: var(--ink-primary);
}

.fc-applications__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.fc-applications__title {
  text-align: left;
  margin: 0;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 22px;
  line-height: 1.3;
  color: var(--ink-primary);
}

.fc-applications__count {
  padding: 2px 10px;
  border-radius: 999px;
  background-color: var(--vision-primary);
  color: var(--vision-on-primary);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 700;
}

.fc-applications__note {
  display: flex;
  gap: 8px;
  max-width: 72ch;
  margin: 0 0 14px;
  font-family: var(--font-ui);
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-muted);

  .q-icon {
    flex: 0 0 auto;
    margin-top: 2px;
    color: var(--ink-link);
  }
}

.fc-applications__loading {
  padding: 12px 0;
}

.fc-applications__empty {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--ink-muted);
}

.fc-applications__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.fc-applications__item {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background-color: var(--vision-card);
}

.fc-applications__avatar {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  background-color: var(--rule-tint);
}

.fc-applications__main {
  flex: 1 1 240px;
  min-width: 0;
  font-family: var(--font-ui);

  p {
    margin: 0;
  }
}

.fc-applications__name {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
  font-weight: 600;

  a {
    color: var(--ink-link);
  }
}

.fc-applications__meta {
  font-size: 12px;
  font-weight: 400;
  color: var(--ink-muted);
}

.fc-applications__message {
  margin-top: 4px !important;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.fc-applications__decided {
  margin-top: 6px !important;
  font-size: 13px;
  color: var(--ink-muted);
}

.fc-applications__status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border: 1px solid var(--rule-strong);
  border-radius: 999px;
  color: var(--ink-primary);
  font-weight: 600;
}

.fc-applications__status--accepted {
  border-color: var(--vision-live);
  background-color: var(--vision-live-bg);
  color: var(--vision-live-text);
}

.fc-applications__status--rejected .q-icon {
  color: var(--vision-danger);
}

.fc-applications__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}
</style>
