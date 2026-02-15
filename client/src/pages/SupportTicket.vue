<template>
  <q-page class="page-support-ticket q-pa-md">
    <div class="layout-container" v-if="ticket">
      <div class="row items-start justify-between q-mb-md q-gutter-sm">
        <div>
          <h2 class="q-my-none">Ticket #{{ ticket.ticketNumber }}</h2>
          <div class="text-caption">
            {{ $display.supportTicketStatuses[ticket.status] }} · {{ $display.supportTicketCategories[ticket.category] }} · {{ $display.supportTicketPriorities[ticket.priority] }}
          </div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn
            v-if="ticket.status !== SupportTicketStatus.CLOSED"
            flat
            color="negative"
            label="Ticket schließen"
            @click="closeTicket"
          />
          <q-btn
            v-else
            flat
            color="primary"
            label="Wieder öffnen"
            @click="reopenTicket"
          />
          <q-btn flat label="Zur Liste" to="/support/tickets" />
        </div>
      </div>

      <q-list bordered separator class="q-mb-md">
        <q-item v-for="message in ticket.messages" :key="message.id">
          <q-item-section>
            <q-item-label>
              <strong>{{ message.senderLabel }}</strong>
              <span class="text-caption q-ml-sm">{{ $display.formatDateTimeLocal(message.createdAt) }}</span>
            </q-item-label>
            <q-item-label caption class="text-body2" style="white-space: pre-wrap;">{{ message.body }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <q-form v-if="ticket.status !== SupportTicketStatus.CLOSED" @submit="sendMessage" class="q-gutter-sm">
        <q-input
          v-model="replyMessage"
          type="textarea"
          autogrow
          outlined
          label="Nachricht an den Support"
          :rules="[(val) => !!val || 'Nachricht ist erforderlich']"
        />
        <q-btn color="primary" type="submit" label="Senden" :loading="sending" />
      </q-form>

      <q-banner v-else class="bg-grey-2 text-dark">
        Dieses Ticket ist geschlossen. Du kannst es wieder öffnen, falls noch Klärungsbedarf besteht.
      </q-banner>
    </div>
  </q-page>
</template>

<script lang="ts">
import { SupportTicketDetailDto } from '@app/shared/dto/support/support-ticket-detail.dto';
import { SupportTicketStatus } from '@app/shared/enums/support-ticket-status.enum';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

@Options({
  name: 'PageSupportTicket',
  beforeRouteEnter(to, __, next) {
    next(async (vm) => {
      await (vm as PageSupportTicket).load(Number(to.params.id));
    });
  },
  async beforeRouteUpdate(to) {
    await (this as PageSupportTicket).load(Number(to.params.id));
  },
})
export default class PageSupportTicket extends Vue {
  readonly SupportTicketStatus = SupportTicketStatus;

  ticket: SupportTicketDetailDto | null = null;
  replyMessage = '';
  sending = false;

  async load(id: number): Promise<void> {
    if (!id) {
      void this.$router.replace('/support/tickets');
      return;
    }

    try {
      this.ticket = await this.$api.support.getMyTicket(id);
    } catch (e) {
      notifyError(e);
      void this.$router.replace('/support/tickets');
    }
  }

  async sendMessage(): Promise<void> {
    if (!this.ticket || !this.replyMessage.trim()) {
      return;
    }

    try {
      this.sending = true;
      await this.$api.support.addMyMessage(this.ticket.id, { message: this.replyMessage.trim() });
      this.replyMessage = '';
      await this.load(this.ticket.id);
    } catch (e) {
      notifyError(e);
    } finally {
      this.sending = false;
    }
  }

  async closeTicket(): Promise<void> {
    if (!this.ticket) {
      return;
    }

    try {
      await this.$api.support.closeMyTicket(this.ticket.id);
      notifySuccess('Ticket wurde geschlossen.');
      await this.load(this.ticket.id);
    } catch (e) {
      notifyError(e);
    }
  }

  async reopenTicket(): Promise<void> {
    if (!this.ticket) {
      return;
    }

    try {
      await this.$api.support.reopenMyTicket(this.ticket.id);
      notifySuccess('Ticket wurde wieder geöffnet.');
      await this.load(this.ticket.id);
    } catch (e) {
      notifyError(e);
    }
  }
}
</script>

