<template>
  <q-page class="page-new-support-ticket">
    <header class="page-new-support-ticket__hero">
      <div class="page-new-support-ticket__hero-text">
        <span class="page-new-support-ticket__eyebrow">Support</span>
        <h2>Neues Support-Ticket</h2>
        <p class="page-new-support-ticket__lead">Beschreibe dein Anliegen möglichst konkret, damit der Support schnell helfen kann.</p>
      </div>
      <q-btn flat label="Zurück zur Übersicht" to="/support/tickets" />
    </header>

    <section class="page-new-support-ticket__content">
      <q-card flat class="page-new-support-ticket__form-card">
        <q-card-section>
          <q-form @submit="submit" class="q-gutter-md" greedy>
            <q-input
              v-model="subject"
              label="Betreff"
              outlined
              :rules="[(val) => !!val || 'Betreff ist erforderlich']"
            />

            <q-select
              v-model="category"
              label="Kategorie"
              outlined
              emit-value
              map-options
              :options="categoryOptions"
              :rules="[(val) => !!val || 'Kategorie ist erforderlich']"
            />

            <q-select
              v-model="priority"
              label="Priorität"
              outlined
              emit-value
              map-options
              :options="priorityOptions"
            />

            <q-input
              v-model="message"
              type="textarea"
              autogrow
              outlined
              label="Nachricht"
              :rules="[(val) => !!val || 'Nachricht ist erforderlich']"
            />

            <div class="row q-gutter-sm">
              <q-btn color="primary" type="submit" label="Ticket erstellen" :loading="loading" :disable="!canCreateTicket" />
              <q-btn flat label="Abbrechen" to="/support/tickets" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </section>
  </q-page>
</template>

<script lang="ts">
import { CreateSupportTicketDto } from '@app/shared/dto/support/create-support-ticket.dto';
import { SupportTicketSummaryDto } from '@app/shared/dto/support/support-ticket-summary.dto';
import { SupportTicketCategory } from '@app/shared/enums/support-ticket-category.enum';
import { SupportTicketPriority } from '@app/shared/enums/support-ticket-priority.enum';
import { SupportTicketStatus } from '@app/shared/enums/support-ticket-status.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

@Options({
  name: 'PageNewSupportTicket',
})
export default class PageNewSupportTicket extends Vue {
  readonly maxOpenTickets = SharedConstants.MAX_OPEN_SUPPORT_TICKETS_PER_USER;

  subject = '';
  category: SupportTicketCategory | null = SupportTicketCategory.GENERAL;
  priority: SupportTicketPriority = SupportTicketPriority.MEDIUM;
  message = '';
  loading = false;
  canCreateTicket = true;

  get categoryOptions() {
    return Object.values(SupportTicketCategory).map((category) => ({
      value: category,
      label: this.$display.supportTicketCategories[category],
    }));
  }

  get priorityOptions() {
    return Object.values(SupportTicketPriority).map((priority) => ({
      value: priority,
      label: this.$display.supportTicketPriorities[priority],
    }));
  }

  async mounted(): Promise<void> {
    await this.checkOpenTicketLimit();
  }

  async checkOpenTicketLimit(): Promise<void> {
    try {
      const result = await this.$api.support.getMyTickets({ limit: 200, offset: 0 });
      const openTickets = result.data.filter((ticket: SupportTicketSummaryDto) => ticket.status !== SupportTicketStatus.CLOSED);
      this.canCreateTicket = openTickets.length < this.maxOpenTickets;

      if (!this.canCreateTicket) {
        notifyError(`Du kannst maximal ${this.maxOpenTickets} offene Tickets haben.`);
        void this.$router.replace('/support/tickets');
      }
    } catch (e) {
      notifyError(e);
      this.canCreateTicket = false;
      void this.$router.replace('/support/tickets');
    }
  }

  async submit(): Promise<void> {
    if (!this.category || !this.canCreateTicket) {
      return;
    }

    const request: CreateSupportTicketDto = {
      subject: this.subject.trim(),
      category: this.category,
      priority: this.priority,
      message: this.message.trim(),
    };

    try {
      this.loading = true;
      const created = await this.$api.support.createTicket(request);
      notifySuccess('Ticket wurde erstellt.');
      void this.$router.push(`/support/tickets/${created.id}`);
    } catch (e) {
      notifyError(e);
    } finally {
      this.loading = false;
    }
  }
}
</script>

<style lang="scss">
.page-new-support-ticket {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-new-support-ticket::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background: radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-new-support-ticket h2 {
  margin: 0;
  font-family: $header-font;
}

.page-new-support-ticket__hero {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  padding: 22px;
  margin-bottom: 18px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
}

.page-new-support-ticket__hero-text {
  display: grid;
  gap: 8px;
}

.page-new-support-ticket__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-new-support-ticket__lead {
  margin: 0;
  color: rgba(35, 35, 35, 0.7);
}

.page-new-support-ticket__content {
  position: relative;
  z-index: 1;
}

.page-new-support-ticket__form-card {
  max-width: 920px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

@media screen and (max-width: 1100px) {
  .page-new-support-ticket__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .page-new-support-ticket {
    padding: 20px 14px 36px;
  }

  .page-new-support-ticket__hero {
    padding: 16px;
  }
}
</style>
