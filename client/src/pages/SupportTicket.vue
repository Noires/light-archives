<template>
  <q-page class="page-support-ticket" v-if="ticket">
    <header class="page-support-ticket__hero">
      <div class="page-support-ticket__hero-text">
        <span class="page-support-ticket__eyebrow">Support Ticket</span>
        <h2>#{{ ticket.ticketNumber }} · {{ ticket.subject }}</h2>
        <p class="page-support-ticket__lead">
          {{ $display.supportTicketCategories[ticket.category] }} · {{ $display.supportTicketPriorities[ticket.priority] }}
        </p>
      </div>
      <div class="page-support-ticket__hero-meta">
        <q-chip square :color="statusColor(ticket.status)" text-color="white">
          {{ $display.supportTicketStatuses[ticket.status] }}
        </q-chip>
        <span class="page-support-ticket__time">Aktualisiert: {{ $display.formatDateTimeLocal(ticket.updatedAt) }}</span>
        <div class="page-support-ticket__hero-actions">
          <q-btn
            v-if="ticket.status !== SupportTicketStatus.CLOSED"
            flat
            color="negative"
            label="Ticket schließen"
            @click="closeTicket"
          />
          <q-btn flat label="Zur Liste" to="/support/tickets" />
        </div>
      </div>
    </header>

    <section class="page-support-ticket__content">
      <div class="page-support-ticket__messages-shell">
        <div v-if="ticket.messages.length === 0" class="page-support-ticket__empty">Noch keine Nachrichten.</div>
        <q-chat-message
          v-for="message in ticket.messages"
          :key="message.id"
          :name="message.senderLabel"
          :text="[message.body]"
          :stamp="$display.formatDateTimeLocal(message.createdAt)"
          :sent="message.kind === SupportMessageKind.USER"
          :bg-color="message.kind === SupportMessageKind.USER ? 'primary' : 'grey-3'"
          :text-color="message.kind === SupportMessageKind.USER ? 'white' : 'dark'"
          class="page-support-ticket__chat-message"
        />
      </div>

      <q-card v-if="ticket.status !== SupportTicketStatus.CLOSED" flat class="page-support-ticket__reply-card">
        <q-card-section>
          <div class="page-support-ticket__reply-title">Antwort senden</div>
          <q-form @submit="sendMessage" class="q-gutter-sm">
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
        </q-card-section>
      </q-card>

      <q-banner v-else class="page-support-ticket__closed-banner">
        Dieses Ticket ist geschlossen. Falls noch etwas offen ist, erstelle bitte ein neues Ticket.
        <div class="q-mt-sm">
          <q-btn color="primary" label="Neues Ticket erstellen" to="/support/tickets/new" />
        </div>
      </q-banner>
    </section>
  </q-page>
</template>

<script lang="ts">
import { SupportTicketDetailDto } from '@app/shared/dto/support/support-ticket-detail.dto';
import { SupportMessageKind } from '@app/shared/enums/support-message-kind.enum';
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
  readonly SupportMessageKind = SupportMessageKind;

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

  statusColor(status: SupportTicketStatus): string {
    if (status === SupportTicketStatus.CLOSED) {
      return 'grey-7';
    }

    if (status === SupportTicketStatus.WAITING_FOR_SUPPORT) {
      return 'orange-8';
    }

    return 'primary';
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
}
</script>

<style lang="scss">
.page-support-ticket {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-support-ticket::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background: radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-support-ticket h2 {
  margin: 0;
  font-family: $header-font;
}

.page-support-ticket__hero {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  padding: 22px;
  margin-bottom: 18px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
}

.page-support-ticket__hero-text {
  display: grid;
  gap: 8px;
}

.page-support-ticket__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-support-ticket__lead {
  margin: 0;
  color: rgba(35, 35, 35, 0.7);
}

.page-support-ticket__hero-meta {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.page-support-ticket__time {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.7);
}

.page-support-ticket__hero-actions {
  display: flex;
  gap: 8px;
}

.page-support-ticket__content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 14px;
}

.page-support-ticket__messages-shell {
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
  padding: 14px;
  min-height: 220px;
}

.page-support-ticket__chat-message {
  margin-bottom: 8px;
}

.page-support-ticket__chat-message:last-child {
  margin-bottom: 0;
}

.page-support-ticket__reply-card {
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-support-ticket__reply-title {
  font-family: $header-font;
  font-size: 1.05rem;
  color: #20323d;
  margin-bottom: 12px;
}

.page-support-ticket__closed-banner {
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-support-ticket__empty {
  color: rgba(35, 35, 35, 0.6);
  text-align: center;
  padding: 22px 8px;
}

@media screen and (max-width: 1100px) {
  .page-support-ticket__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-support-ticket__hero-meta {
    justify-items: start;
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .page-support-ticket {
    padding: 20px 14px 36px;
  }

  .page-support-ticket__hero {
    padding: 16px;
  }
}
</style>
