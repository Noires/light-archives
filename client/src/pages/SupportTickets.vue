<template>
  <q-page class="page-support-tickets q-pa-md">
    <div class="layout-container">
      <div class="row items-center justify-between q-mb-md">
        <h2 class="q-my-none">Support-Tickets</h2>
        <q-btn color="primary" icon="add" label="Neues Ticket" to="/support/tickets/new" />
      </div>

      <q-tabs v-model="activeTab" dense align="left" @update:model-value="applyFilter" class="q-mb-sm">
        <q-tab name="open" label="Offen" />
        <q-tab name="closed" label="Geschlossen" />
      </q-tabs>

      <q-table
        flat
        bordered
        :rows="filteredTickets"
        :columns="columns"
        row-key="id"
        :loading="loading"
        @row-click="openTicket"
      >
        <template v-slot:body-cell-ticketNumber="props">
          <q-td :props="props">#{{ props.row.ticketNumber }}</q-td>
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
        <template v-slot:body-cell-updatedAt="props">
          <q-td :props="props">{{ $display.formatDateTimeLocal(props.row.updatedAt) }}</q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script lang="ts">
import { SupportTicketSummaryDto } from '@app/shared/dto/support/support-ticket-summary.dto';
import { SupportTicketStatus } from '@app/shared/enums/support-ticket-status.enum';
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

  openTicket(_evt: unknown, row: SupportTicketSummaryDto): void {
    void this.$router.push(`/support/tickets/${row.id}`);
  }
}
</script>

<style lang="scss">
.page-support-tickets .q-table tbody tr {
  cursor: pointer;
}
</style>

