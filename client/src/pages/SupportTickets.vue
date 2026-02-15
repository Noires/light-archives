<template>
  <q-page class="page-support-tickets">
    <header class="page-support-tickets__hero">
      <div class="page-support-tickets__hero-text">
        <span class="page-support-tickets__eyebrow">Support</span>
        <h2>Support-Tickets</h2>
        <p class="page-support-tickets__lead">
          Verfolge deine offenen Anliegen und den gesamten Verlauf an einem Ort.
        </p>
      </div>
      <div class="page-support-tickets__hero-meta">
        <div class="page-support-tickets__hero-count">
          <span class="page-support-tickets__hero-count-number">{{ openTicketCount }}</span>
          <span class="page-support-tickets__hero-count-label">Offen</span>
        </div>
        <div class="page-support-tickets__hero-stats">
          <span>Geschlossen: {{ closedTicketCount }}</span>
          <q-btn
            color="primary"
            icon="add"
            label="Neues Ticket"
            to="/support/tickets/new"
            :disable="!canCreateTicket"
          />
        </div>
      </div>
    </header>

    <section class="page-support-tickets__content">
      <q-banner v-if="!canCreateTicket" class="page-support-tickets__limit-banner q-mb-md">
        Du hast bereits {{ openTicketCount }} offene Tickets. Maximal {{ maxOpenTickets }} offene Tickets sind erlaubt.
      </q-banner>

      <div class="page-support-tickets__toolbar">
        <q-tabs v-model="activeTab" dense align="left" @update:model-value="applyFilter" class="page-support-tickets__tabs">
          <q-tab name="open" label="Offene Tickets" />
          <q-tab name="closed" label="Geschlossene Tickets" />
        </q-tabs>
        <div class="page-support-tickets__toolbar-meta">
          {{ filteredTickets.length }} Einträge
        </div>
      </div>

      <div class="page-support-tickets__table-shell">
        <q-table
          class="page-support-tickets__table"
          flat
          :rows="filteredTickets"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :rows-per-page-options="[0]"
          hide-bottom
          @row-click="openTicket"
        >
          <template v-slot:body-cell-ticketNumber="props">
            <q-td :props="props">
              <span class="page-support-tickets__ticket-number">#{{ props.row.ticketNumber }}</span>
            </q-td>
          </template>
          <template v-slot:body-cell-category="props">
            <q-td :props="props">{{ $display.supportTicketCategories[props.row.category] }}</q-td>
          </template>
          <template v-slot:body-cell-priority="props">
            <q-td :props="props">
              <q-badge :color="priorityColor(props.row.priority)" outline>
                {{ $display.supportTicketPriorities[props.row.priority] }}
              </q-badge>
            </q-td>
          </template>
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip dense square :color="statusColor(props.row.status)" text-color="white">
                {{ $display.supportTicketStatuses[props.row.status] }}
              </q-chip>
            </q-td>
          </template>
          <template v-slot:body-cell-updatedAt="props">
            <q-td :props="props">{{ $display.formatDateTimeLocal(props.row.updatedAt) }}</q-td>
          </template>
          <template v-slot:no-data>
            <div class="page-support-tickets__empty">
              <div class="page-support-tickets__empty-title">Keine Tickets gefunden.</div>
              <div class="page-support-tickets__empty-subtitle">Erstelle ein neues Ticket, wenn du Unterstützung brauchst.</div>
            </div>
          </template>
        </q-table>
      </div>
    </section>
  </q-page>
</template>

<script lang="ts">
import { SupportTicketSummaryDto } from '@app/shared/dto/support/support-ticket-summary.dto';
import { SupportTicketPriority } from '@app/shared/enums/support-ticket-priority.enum';
import { SupportTicketStatus } from '@app/shared/enums/support-ticket-status.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { notifyError } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

@Options({
  name: 'PageSupportTickets',
  beforeRouteEnter(_, __, next) {
    next(async (vm) => {
      await (vm as PageSupportTickets).load();
    });
  },
})
export default class PageSupportTickets extends Vue {
  readonly SupportTicketStatus = SupportTicketStatus;
  readonly maxOpenTickets = SharedConstants.MAX_OPEN_SUPPORT_TICKETS_PER_USER;

  tickets: SupportTicketSummaryDto[] = [];
  loading = false;
  activeTab: 'open' | 'closed' = 'open';

  get columns() {
    return [
      { name: 'ticketNumber', label: 'Ticket', field: 'ticketNumber', align: 'left' as const, sortable: true },
      { name: 'subject', label: 'Betreff', field: 'subject', align: 'left' as const, sortable: true },
      { name: 'category', label: 'Kategorie', field: 'category', align: 'left' as const, sortable: true },
      { name: 'priority', label: 'Priorität', field: 'priority', align: 'left' as const, sortable: true },
      { name: 'status', label: 'Status', field: 'status', align: 'left' as const, sortable: true },
      { name: 'updatedAt', label: 'Aktualisiert', field: 'updatedAt', align: 'left' as const, sortable: true },
    ];
  }

  get filteredTickets(): SupportTicketSummaryDto[] {
    if (this.activeTab === 'closed') {
      return this.tickets.filter((ticket) => ticket.status === SupportTicketStatus.CLOSED);
    }

    return this.tickets.filter((ticket) => ticket.status !== SupportTicketStatus.CLOSED);
  }

  get openTicketCount(): number {
    return this.tickets.filter((ticket) => ticket.status !== SupportTicketStatus.CLOSED).length;
  }

  get closedTicketCount(): number {
    return this.tickets.filter((ticket) => ticket.status === SupportTicketStatus.CLOSED).length;
  }

  get canCreateTicket(): boolean {
    return this.openTicketCount < this.maxOpenTickets;
  }

  async load(): Promise<void> {
    try {
      this.loading = true;
      const result = await this.$api.support.getMyTickets({ limit: 200, offset: 0 });
      this.tickets = result.data;
    } catch (e) {
      notifyError(e);
    } finally {
      this.loading = false;
    }
  }

  applyFilter(): void {
    // Tab-only filtering in-memory
  }

  priorityColor(priority: SupportTicketPriority): string {
    if (priority === SupportTicketPriority.HIGH) {
      return 'negative';
    }

    if (priority === SupportTicketPriority.MEDIUM) {
      return 'warning';
    }

    return 'positive';
  }

  statusColor(status: SupportTicketStatus): string {
    if (status === SupportTicketStatus.CLOSED) {
      return 'grey-7';
    }

    if (status === SupportTicketStatus.WAITING_FOR_SUPPORT) {
      return 'orange-8';
    }

    return 'primary';
  }

  openTicket(_evt: unknown, row: SupportTicketSummaryDto): void {
    void this.$router.push(`/support/tickets/${row.id}`);
  }
}
</script>

<style lang="scss">
.page-support-tickets {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-support-tickets::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background: radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-support-tickets h2 {
  margin: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-support-tickets__hero {
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

.page-support-tickets__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-support-tickets__hero-text {
  display: grid;
  gap: 8px;
}

.page-support-tickets__lead {
  margin: 0;
  color: rgba(35, 35, 35, 0.7);
  max-width: 520px;
}

.page-support-tickets__hero-meta {
  display: grid;
  gap: 8px;
  justify-items: end;
}

.page-support-tickets__hero-count {
  display: grid;
  justify-items: end;
  line-height: 1;
}

.page-support-tickets__hero-count-number {
  font-family: $header-font;
  font-size: 2rem;
  color: #20323d;
}

.page-support-tickets__hero-count-label {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.6);
}

.page-support-tickets__hero-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  color: rgba(35, 35, 35, 0.7);
}

.page-support-tickets__content {
  position: relative;
  z-index: 1;
}

.page-support-tickets__limit-banner {
  border: 1px solid rgba(184, 110, 13, 0.2);
  background: rgba(255, 216, 166, 0.62);
  color: #7f4a00;
}

.page-support-tickets__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 18px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-support-tickets__tabs {
  min-height: auto;
}

.page-support-tickets__toolbar-meta {
  font-family: $header-font;
  color: #20323d;
}

.page-support-tickets__table-shell {
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
  padding: 10px;
}

.page-support-tickets__table .q-table tbody tr {
  cursor: pointer;
  transition: background-color 0.16s ease;
}

.page-support-tickets__table .q-table tbody tr:hover {
  background: rgba(221, 180, 118, 0.1);
}

.page-support-tickets__ticket-number {
  font-weight: 700;
  color: #20323d;
}

.page-support-tickets__empty {
  padding: 28px 16px;
  text-align: center;
  color: rgba(35, 35, 35, 0.7);
}

.page-support-tickets__empty-title {
  font-weight: 600;
  margin-bottom: 6px;
}

.page-support-tickets__empty-subtitle {
  font-size: 0.9rem;
}

@media screen and (max-width: 1100px) {
  .page-support-tickets__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-support-tickets__hero-meta {
    width: 100%;
    justify-items: start;
  }

  .page-support-tickets__hero-stats {
    flex-wrap: wrap;
  }

  .page-support-tickets__toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .page-support-tickets {
    padding: 20px 14px 36px;
  }

  .page-support-tickets__hero {
    padding: 16px;
  }
}
</style>
