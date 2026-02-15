<template>
  <q-page class="page-support-queue">
    <header class="page-support-queue__hero">
      <div class="page-support-queue__hero-text">
        <span class="page-support-queue__eyebrow">Support Backoffice</span>
        <h2>Support-Queue</h2>
        <p class="page-support-queue__lead">Priorisieren, filtern und bearbeite eingehende Supportfälle strukturiert.</p>
      </div>
      <div class="page-support-queue__hero-meta">
        <div class="page-support-queue__hero-count">
          <span class="page-support-queue__hero-count-number">{{ totalCount }}</span>
          <span class="page-support-queue__hero-count-label">Treffer</span>
        </div>
        <q-chip square color="orange-8" text-color="white" icon="timer">SLA Fokus</q-chip>
      </div>
    </header>

    <section class="page-support-queue__content">
      <div class="page-support-queue__toolbar">
        <q-input v-model="searchQuery" outlined dense debounce="250" label="Suche" @update:model-value="load" />
        <q-select v-model="status" outlined dense emit-value map-options :options="statusOptions" label="Status" @update:model-value="load" />
        <q-select v-model="priority" outlined dense emit-value map-options :options="priorityOptions" label="Priorität" @update:model-value="load" />
        <q-select v-model="category" outlined dense emit-value map-options :options="categoryOptions" label="Kategorie" @update:model-value="load" />
        <q-select v-model="supportLevel" outlined dense emit-value map-options :options="supportLevelOptions" label="Level" @update:model-value="load" />
        <q-input
          v-model.trim="assignedToUserIdInput"
          outlined
          dense
          debounce="250"
          label="Assignee ID"
          clearable
          inputmode="numeric"
          @update:model-value="load"
        >
          <template v-slot:append>
            <q-btn v-if="currentUserId" flat round dense icon="person" @click="filterMine">
              <q-tooltip>Meine Tickets</q-tooltip>
            </q-btn>
          </template>
        </q-input>
        <q-select v-model="updatedWithinHours" outlined dense emit-value map-options :options="updatedWithinOptions" label="Aktualisiert" @update:model-value="load" />
        <q-checkbox v-model="overdueOnly" label="Nur SLA-überfällig" @update:model-value="load" />
      </div>

      <div class="page-support-queue__table-shell">
        <q-table
          class="page-support-queue__table"
          flat
          :rows="rows"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :rows-per-page-options="[0]"
          hide-bottom
          @row-click="openTicket"
        >
          <template v-slot:body-cell-ticketNumber="props">
            <q-td :props="props"><strong>#{{ props.row.ticketNumber }}</strong></q-td>
          </template>
          <template v-slot:body-cell-ownerUserId="props">
            <q-td :props="props">User #{{ props.row.ownerUserId }}</q-td>
          </template>
          <template v-slot:body-cell-assigneeUserId="props">
            <q-td :props="props">
              <q-chip v-if="props.row.assigneeUserId" dense square color="primary" text-color="white">Support #{{ props.row.assigneeUserId }}</q-chip>
              <span v-else class="text-grey-7">Unassigned</span>
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
          <template v-slot:body-cell-supportLevel="props">
            <q-td :props="props">{{ $display.supportLevels[props.row.supportLevel] }}</q-td>
          </template>
          <template v-slot:body-cell-sla="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                :color="props.row.firstResponseBreached || props.row.resolutionBreached ? 'negative' : 'positive'"
                text-color="white"
              >
                {{ renderSla(props.row) }}
              </q-chip>
            </q-td>
          </template>
          <template v-slot:no-data>
            <div class="page-support-queue__empty">
              <div class="page-support-queue__empty-title">Keine Tickets in der Queue.</div>
              <div class="page-support-queue__empty-subtitle">Passe die Filter an oder entferne Einschränkungen.</div>
            </div>
          </template>
        </q-table>
      </div>
    </section>
  </q-page>
</template>

<script lang="ts">
import { SupportQueueTicketSummaryDto } from '@app/shared/dto/support/support-queue-ticket-summary.dto';
import { SupportLevel } from '@app/shared/enums/support-level.enum';
import { SupportTicketCategory } from '@app/shared/enums/support-ticket-category.enum';
import { SupportTicketPriority } from '@app/shared/enums/support-ticket-priority.enum';
import { SupportTicketStatus } from '@app/shared/enums/support-ticket-status.enum';
import { notifyError } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

@Options({
  name: 'PageSupportQueue',
  beforeRouteEnter(_, __, next) {
    next(async (vm) => {
      await (vm as PageSupportQueue).load();
    });
  },
})
export default class PageSupportQueue extends Vue {
  rows: SupportQueueTicketSummaryDto[] = [];
  totalCount = 0;
  loading = false;

  searchQuery = '';
  status: SupportTicketStatus | null = null;
  category: SupportTicketCategory | null = null;
  priority: SupportTicketPriority | null = null;
  supportLevel: SupportLevel | null = null;
  assignedToUserIdInput = '';
  updatedWithinHours: number | null = null;
  overdueOnly = false;

  get currentUserId(): number | null {
    return this.$store.state.user?.id || null;
  }

  get assignedToUserId(): number | undefined {
    const value = this.assignedToUserIdInput.trim();
    if (!value) {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return undefined;
    }

    return parsed;
  }

  get columns() {
    return [
      { name: 'ticketNumber', label: 'Ticket', field: 'ticketNumber', align: 'left' as const, sortable: true },
      { name: 'ownerUserId', label: 'Owner', field: 'ownerUserId', align: 'left' as const, sortable: true },
      { name: 'assigneeUserId', label: 'Assignee', field: 'assigneeUserId', align: 'left' as const, sortable: true },
      { name: 'subject', label: 'Betreff', field: 'subject', align: 'left' as const, sortable: true },
      { name: 'category', label: 'Kategorie', field: 'category', align: 'left' as const, sortable: true },
      { name: 'priority', label: 'Priorität', field: 'priority', align: 'left' as const, sortable: true },
      { name: 'status', label: 'Status', field: 'status', align: 'left' as const, sortable: true },
      { name: 'supportLevel', label: 'Level', field: 'supportLevel', align: 'left' as const, sortable: true },
      { name: 'sla', label: 'SLA', field: 'sla', align: 'left' as const, sortable: false },
    ];
  }

  get statusOptions() {
    return [
      { label: '(Alle)', value: null },
      ...Object.values(SupportTicketStatus).map((value) => ({ label: this.$display.supportTicketStatuses[value], value })),
    ];
  }

  get categoryOptions() {
    return [
      { label: '(Alle)', value: null },
      ...Object.values(SupportTicketCategory).map((value) => ({ label: this.$display.supportTicketCategories[value], value })),
    ];
  }

  get priorityOptions() {
    return [
      { label: '(Alle)', value: null },
      ...Object.values(SupportTicketPriority).map((value) => ({ label: this.$display.supportTicketPriorities[value], value })),
    ];
  }

  get supportLevelOptions() {
    return [
      { label: '(Alle)', value: null },
      ...Object.values(SupportLevel).map((value) => ({ label: this.$display.supportLevels[value], value })),
    ];
  }

  get updatedWithinOptions() {
    return [
      { label: '(Alle)', value: null },
      { label: 'Letzte 24h', value: 24 },
      { label: 'Letzte 48h', value: 48 },
      { label: 'Letzte 7 Tage', value: 24 * 7 },
      { label: 'Letzte 14 Tage', value: 24 * 14 },
    ];
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

  async load(): Promise<void> {
    try {
      this.loading = true;
      const result = await this.$api.support.getQueue({
        searchQuery: this.searchQuery || undefined,
        status: this.status || undefined,
        category: this.category || undefined,
        priority: this.priority || undefined,
        supportLevel: this.supportLevel || undefined,
        assignedToUserId: this.assignedToUserId,
        updatedWithinHours: this.updatedWithinHours || undefined,
        overdueOnly: this.overdueOnly || undefined,
        limit: 200,
        offset: 0,
      });

      this.rows = result.data;
      this.totalCount = result.total;
    } catch (e) {
      notifyError(e);
    } finally {
      this.loading = false;
    }
  }

  renderSla(row: SupportQueueTicketSummaryDto): string {
    if (row.firstResponseBreached || row.resolutionBreached) {
      return 'Überfällig';
    }

    if (row.firstResponseAt === null && row.firstResponseDueAt) {
      return `1st: ${this.$display.formatDateTimeLocal(row.firstResponseDueAt)}`;
    }

    if (row.resolvedAt === null && row.resolutionDueAt) {
      return `Res: ${this.$display.formatDateTimeLocal(row.resolutionDueAt)}`;
    }

    return 'Im Ziel';
  }

  filterMine(): void {
    if (this.currentUserId) {
      this.assignedToUserIdInput = `${this.currentUserId}`;
      void this.load();
    }
  }

  openTicket(_evt: unknown, row: SupportQueueTicketSummaryDto): void {
    void this.$router.push(`/support/queue/${row.id}`);
  }
}
</script>

<style lang="scss">
.page-support-queue {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-support-queue::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background: radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-support-queue h2 {
  margin: 0;
  font-family: $header-font;
}

.page-support-queue__hero {
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

.page-support-queue__hero-text {
  display: grid;
  gap: 8px;
}

.page-support-queue__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-support-queue__lead {
  margin: 0;
  color: rgba(35, 35, 35, 0.7);
  max-width: 560px;
}

.page-support-queue__hero-meta {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.page-support-queue__hero-count {
  display: grid;
  justify-items: end;
  line-height: 1;
}

.page-support-queue__hero-count-number {
  font-family: $header-font;
  font-size: 2rem;
  color: #20323d;
}

.page-support-queue__hero-count-label {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.6);
}

.page-support-queue__content {
  position: relative;
  z-index: 1;
}

.page-support-queue__toolbar {
  display: grid;
  grid-template-columns: minmax(200px, 1.2fr) repeat(6, minmax(140px, 0.6fr));
  gap: 10px;
  align-items: center;
  padding: 12px;
  margin-bottom: 18px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-support-queue__table-shell {
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
  padding: 10px;
}

.page-support-queue__table .q-table tbody tr {
  cursor: pointer;
  transition: background-color 0.16s ease;
}

.page-support-queue__table .q-table tbody tr:hover {
  background: rgba(221, 180, 118, 0.1);
}

.page-support-queue__empty {
  padding: 28px 16px;
  text-align: center;
  color: rgba(35, 35, 35, 0.7);
}

.page-support-queue__empty-title {
  font-weight: 600;
  margin-bottom: 6px;
}

.page-support-queue__empty-subtitle {
  font-size: 0.9rem;
}

@media screen and (max-width: 1200px) {
  .page-support-queue__toolbar {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media screen and (max-width: 1100px) {
  .page-support-queue__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-support-queue__hero-meta {
    width: 100%;
    justify-items: start;
  }

  .page-support-queue__toolbar {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .page-support-queue {
    padding: 20px 14px 36px;
  }

  .page-support-queue__hero {
    padding: 16px;
  }
}
</style>
