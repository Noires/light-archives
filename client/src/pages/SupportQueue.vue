<template>
  <q-page class="page-support-queue q-pa-md">
    <div class="layout-container">
      <h2>Support-Queue</h2>

      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-12 col-md-4">
          <q-input v-model="searchQuery" outlined dense label="Suche" @update:model-value="load" />
        </div>
        <div class="col-6 col-md-2">
          <q-select v-model="status" outlined dense emit-value map-options :options="statusOptions" label="Status" @update:model-value="load" />
        </div>
        <div class="col-6 col-md-2">
          <q-select v-model="priority" outlined dense emit-value map-options :options="priorityOptions" label="Priorität" @update:model-value="load" />
        </div>
        <div class="col-6 col-md-2">
          <q-select v-model="category" outlined dense emit-value map-options :options="categoryOptions" label="Kategorie" @update:model-value="load" />
        </div>
        <div class="col-6 col-md-2">
          <q-select v-model="supportLevel" outlined dense emit-value map-options :options="supportLevelOptions" label="Level" @update:model-value="load" />
        </div>
        <div class="col-6 col-md-2">
          <q-input
            v-model.trim="assignedToUserIdInput"
            outlined
            dense
            label="Assignee ID"
            clearable
            inputmode="numeric"
            @update:model-value="load"
          >
            <template v-slot:append>
              <q-btn
                v-if="currentUserId"
                flat
                round
                dense
                icon="person"
                @click="filterMine"
              >
                <q-tooltip>Meine Tickets</q-tooltip>
              </q-btn>
            </template>
          </q-input>
        </div>
        <div class="col-6 col-md-2">
          <q-select v-model="updatedWithinHours" outlined dense emit-value map-options :options="updatedWithinOptions" label="Aktualisiert" @update:model-value="load" />
        </div>
      </div>

      <q-checkbox v-model="overdueOnly" label="Nur SLA-überfällig" @update:model-value="load" class="q-mb-sm" />

      <q-table
        flat
        bordered
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        @row-click="openTicket"
      >
        <template v-slot:body-cell-ticketNumber="props">
          <q-td :props="props">#{{ props.row.ticketNumber }}</q-td>
        </template>
        <template v-slot:body-cell-ownerUserId="props">
          <q-td :props="props">User #{{ props.row.ownerUserId }}</q-td>
        </template>
        <template v-slot:body-cell-assigneeUserId="props">
          <q-td :props="props">{{ props.row.assigneeUserId ? `Support #${props.row.assigneeUserId}` : '-' }}</q-td>
        </template>
        <template v-slot:body-cell-category="props">
          <q-td :props="props">{{ $display.supportTicketCategories[props.row.category] }}</q-td>
        </template>
        <template v-slot:body-cell-priority="props">
          <q-td :props="props">{{ $display.supportTicketPriorities[props.row.priority] }}</q-td>
        </template>
        <template v-slot:body-cell-status="props">
          <q-td :props="props">{{ $display.supportTicketStatuses[props.row.status] }}</q-td>
        </template>
        <template v-slot:body-cell-supportLevel="props">
          <q-td :props="props">{{ $display.supportLevels[props.row.supportLevel] }}</q-td>
        </template>
        <template v-slot:body-cell-sla="props">
          <q-td :props="props">
            <span :class="{ 'text-negative': props.row.firstResponseBreached || props.row.resolutionBreached }">
              {{ renderSla(props.row) }}
            </span>
          </q-td>
        </template>
      </q-table>
    </div>
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

    return 'OK';
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
.page-support-queue .q-table tbody tr {
  cursor: pointer;
}
</style>

