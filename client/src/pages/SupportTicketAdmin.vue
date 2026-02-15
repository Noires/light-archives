<template>
  <q-page class="page-support-ticket-admin" v-if="ticket">
    <header class="page-support-ticket-admin__hero">
      <div class="page-support-ticket-admin__hero-text">
        <span class="page-support-ticket-admin__eyebrow">Support Queue</span>
        <h2>Ticket #{{ ticket.ticketNumber }} · {{ ticket.subject }}</h2>
        <p class="page-support-ticket-admin__lead">
          User #{{ ticket.ownerUserId }} · {{ $display.supportTicketCategories[ticket.category] }}
        </p>
      </div>
      <div class="page-support-ticket-admin__hero-meta">
        <q-chip dense square :color="statusColor(ticket.status)" text-color="white">
          {{ $display.supportTicketStatuses[ticket.status] }}
        </q-chip>
        <span class="page-support-ticket-admin__meta-line">Assignee: {{ ticket.assigneeUserId ? `Support #${ticket.assigneeUserId}` : 'Unassigned' }}</span>
        <div class="page-support-ticket-admin__hero-actions">
          <q-btn color="primary" label="Ticket aktualisieren" @click="updateTicket" :loading="saving" />
          <q-btn v-if="ticket.status !== SupportTicketStatus.CLOSED" flat color="negative" label="Schließen" @click="closeTicket" />
          <q-btn v-else flat color="primary" label="Wieder öffnen" @click="reopenTicket" />
          <q-btn flat label="Zur Queue" to="/support/queue" />
        </div>
      </div>
    </header>

    <section class="page-support-ticket-admin__content">
      <q-card flat class="page-support-ticket-admin__controls">
        <q-card-section>
          <div class="page-support-ticket-admin__section-title">Ticket-Steuerung</div>
          <div class="page-support-ticket-admin__control-grid">
            <q-select v-model="status" outlined dense emit-value map-options :options="statusOptions" label="Status" />
            <q-select v-model="priority" outlined dense emit-value map-options :options="priorityOptions" label="Priorität" />
            <q-select v-model="category" outlined dense emit-value map-options :options="categoryOptions" label="Kategorie" />
            <q-select v-model="supportLevel" outlined dense emit-value map-options :options="supportLevelOptions" label="Support-Level" />
            <q-input
              v-model.trim="assigneeUserIdInput"
              outlined
              dense
              label="Assignee User ID"
              clearable
              inputmode="numeric"
            >
              <template v-slot:append>
                <q-btn v-if="currentUserId" flat round dense icon="person" @click="assignToMe">
                  <q-tooltip>Mir zuweisen</q-tooltip>
                </q-btn>
              </template>
            </q-input>
          </div>
        </q-card-section>
      </q-card>

      <div class="page-support-ticket-admin__messages-shell">
        <div v-if="ticket.messages.length === 0" class="page-support-ticket-admin__empty">Noch keine Nachrichten.</div>
        <q-chat-message
          v-for="message in ticket.messages"
          :key="message.id"
          :name="message.senderLabel"
          :text="[message.body]"
          :stamp="$display.formatDateTimeLocal(message.createdAt)"
          :sent="message.kind === SupportMessageKind.SUPPORT"
          :bg-color="messageBgColor(message.kind, message.isInternal)"
          :text-color="messageTextColor(message.kind, message.isInternal)"
          class="page-support-ticket-admin__chat-message"
        >
          <template v-if="message.isInternal" v-slot:name>
            {{ message.senderLabel }} (intern)
          </template>
        </q-chat-message>
      </div>

      <q-card v-if="ticket.status !== SupportTicketStatus.CLOSED" flat class="page-support-ticket-admin__reply-card">
        <q-card-section>
          <div class="page-support-ticket-admin__section-title">Öffentliche Antwort</div>
          <q-select
            v-model="quickReply"
            dense
            outlined
            emit-value
            map-options
            :options="quickReplyOptions"
            label="Quick Reply"
            @update:model-value="applyQuickReply"
            class="q-mb-sm"
          />
          <q-input v-model="publicReply" type="textarea" autogrow outlined label="Antwort" />
          <q-btn class="q-mt-sm" color="primary" label="Antwort senden" @click="sendSupportReply" :loading="sendingReply" />
        </q-card-section>
      </q-card>

      <q-banner v-else class="page-support-ticket-admin__closed-banner">
        Dieses Ticket ist geschlossen. Öffne es zuerst wieder, um öffentlich zu antworten.
      </q-banner>

      <q-card flat class="page-support-ticket-admin__note-card">
        <q-card-section>
          <div class="page-support-ticket-admin__section-title">Interne Notiz</div>
          <q-input v-model="internalNote" type="textarea" autogrow outlined label="Notiz" />
          <q-btn class="q-mt-sm" color="secondary" label="Notiz speichern" @click="sendInternalNote" :loading="sendingNote" />
        </q-card-section>
      </q-card>
    </section>
  </q-page>
</template>

<script lang="ts">
import { SupportTicketDetailDto } from '@app/shared/dto/support/support-ticket-detail.dto';
import { SupportLevel } from '@app/shared/enums/support-level.enum';
import { SupportMessageKind } from '@app/shared/enums/support-message-kind.enum';
import { SupportTicketCategory } from '@app/shared/enums/support-ticket-category.enum';
import { SupportTicketPriority } from '@app/shared/enums/support-ticket-priority.enum';
import { SupportTicketStatus } from '@app/shared/enums/support-ticket-status.enum';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

type QuickReplyKey = 'ack' | 'clarification' | 'closure';

const quickReplyTemplates: Record<QuickReplyKey, string> = {
  ack: 'Vielen Dank für deine Nachricht. Wir haben dein Anliegen erhalten und prüfen es.',
  clarification: 'Danke für dein Ticket. Kannst du bitte noch weitere Details oder Screenshots teilen?',
  closure: 'Wir haben dein Anliegen abgeschlossen. Wenn noch etwas offen ist, öffne das Ticket bitte erneut.',
};

@Options({
  name: 'PageSupportTicketAdmin',
  beforeRouteEnter(to, __, next) {
    next(async (vm) => {
      await (vm as PageSupportTicketAdmin).load(Number(to.params.id));
    });
  },
  async beforeRouteUpdate(to) {
    await (this as PageSupportTicketAdmin).load(Number(to.params.id));
  },
})
export default class PageSupportTicketAdmin extends Vue {
  readonly SupportTicketStatus = SupportTicketStatus;
  readonly SupportMessageKind = SupportMessageKind;

  ticket: SupportTicketDetailDto | null = null;

  status: SupportTicketStatus | null = null;
  category: SupportTicketCategory | null = null;
  priority: SupportTicketPriority | null = null;
  supportLevel: SupportLevel | null = null;
  assigneeUserIdInput = '';

  publicReply = '';
  internalNote = '';
  quickReply: QuickReplyKey | null = null;

  sendingReply = false;
  sendingNote = false;
  saving = false;

  get currentUserId(): number | null {
    return this.$store.state.user?.id || null;
  }

  get assigneeUserId(): number | null {
    const value = this.assigneeUserIdInput.trim();
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  get statusOptions() {
    return Object.values(SupportTicketStatus).map((value) => ({ label: this.$display.supportTicketStatuses[value], value }));
  }

  get categoryOptions() {
    return Object.values(SupportTicketCategory).map((value) => ({ label: this.$display.supportTicketCategories[value], value }));
  }

  get priorityOptions() {
    return Object.values(SupportTicketPriority).map((value) => ({ label: this.$display.supportTicketPriorities[value], value }));
  }

  get supportLevelOptions() {
    return Object.values(SupportLevel).map((value) => ({ label: this.$display.supportLevels[value], value }));
  }

  get quickReplyOptions() {
    return [
      { label: '(Kein Template)', value: null },
      { label: 'Empfang bestätigt', value: 'ack' },
      { label: 'Rückfrage', value: 'clarification' },
      { label: 'Abschluss', value: 'closure' },
    ];
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

  messageBgColor(kind: SupportMessageKind, isInternal: boolean): string {
    if (isInternal) {
      return 'teal-1';
    }

    if (kind === SupportMessageKind.SUPPORT) {
      return 'primary';
    }

    if (kind === SupportMessageKind.SYSTEM) {
      return 'grey-5';
    }

    return 'grey-3';
  }

  messageTextColor(kind: SupportMessageKind, isInternal: boolean): string {
    if (isInternal) {
      return 'dark';
    }

    if (kind === SupportMessageKind.SUPPORT || kind === SupportMessageKind.SYSTEM) {
      return 'white';
    }

    return 'dark';
  }

  async load(id: number): Promise<void> {
    if (!id) {
      void this.$router.replace('/support/queue');
      return;
    }

    try {
      this.ticket = await this.$api.support.getQueueTicket(id);
      this.status = this.ticket.status;
      this.category = this.ticket.category;
      this.priority = this.ticket.priority;
      this.supportLevel = this.ticket.supportLevel;
      this.assigneeUserIdInput = this.ticket.assigneeUserId ? `${this.ticket.assigneeUserId}` : '';
    } catch (e) {
      notifyError(e);
      void this.$router.replace('/support/queue');
    }
  }

  assignToMe(): void {
    if (this.currentUserId) {
      this.assigneeUserIdInput = `${this.currentUserId}`;
    }
  }

  applyQuickReply(): void {
    if (this.quickReply) {
      this.publicReply = quickReplyTemplates[this.quickReply];
    }
  }

  async updateTicket(): Promise<void> {
    if (!this.ticket || !this.status || !this.category || !this.priority || !this.supportLevel) {
      return;
    }

    if (this.assigneeUserIdInput.trim() && this.assigneeUserId === null) {
      notifyError('Assignee User ID muss eine positive Zahl sein.');
      return;
    }

    try {
      this.saving = true;
      await this.$api.support.updateTicket(this.ticket.id, {
        status: this.status,
        category: this.category,
        priority: this.priority,
        supportLevel: this.supportLevel,
        assigneeUserId: this.assigneeUserId,
      });
      notifySuccess('Ticket aktualisiert.');
      await this.load(this.ticket.id);
    } catch (e) {
      notifyError(e);
    } finally {
      this.saving = false;
    }
  }

  async sendSupportReply(): Promise<void> {
    if (!this.ticket || !this.publicReply.trim()) {
      return;
    }

    const selectedQuickReply = this.quickReply;

    try {
      this.sendingReply = true;
      await this.$api.support.addSupportMessage(this.ticket.id, { message: this.publicReply.trim() });

      if (selectedQuickReply === 'ack') {
        await this.$api.support.updateTicket(this.ticket.id, {
          status: SupportTicketStatus.WAITING_FOR_SUPPORT,
        });
      }

      this.publicReply = '';
      this.quickReply = null;
      await this.load(this.ticket.id);
    } catch (e) {
      notifyError(e);
    } finally {
      this.sendingReply = false;
    }
  }

  async sendInternalNote(): Promise<void> {
    if (!this.ticket || !this.internalNote.trim()) {
      return;
    }

    try {
      this.sendingNote = true;
      await this.$api.support.addSupportNote(this.ticket.id, { message: this.internalNote.trim() });
      this.internalNote = '';
      await this.load(this.ticket.id);
    } catch (e) {
      notifyError(e);
    } finally {
      this.sendingNote = false;
    }
  }

  async closeTicket(): Promise<void> {
    if (!this.ticket) {
      return;
    }

    try {
      await this.$api.support.closeTicket(this.ticket.id);
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
      await this.$api.support.reopenTicket(this.ticket.id);
      notifySuccess('Ticket wurde wieder geöffnet.');
      await this.load(this.ticket.id);
    } catch (e) {
      notifyError(e);
    }
  }
}
</script>

<style lang="scss">
.page-support-ticket-admin {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-support-ticket-admin::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background: radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-support-ticket-admin h2 {
  margin: 0;
  font-family: $header-font;
}

.page-support-ticket-admin__hero {
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

.page-support-ticket-admin__hero-text {
  display: grid;
  gap: 8px;
}

.page-support-ticket-admin__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-support-ticket-admin__lead {
  margin: 0;
  color: rgba(35, 35, 35, 0.7);
}

.page-support-ticket-admin__hero-meta {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.page-support-ticket-admin__meta-line {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.7);
}

.page-support-ticket-admin__hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.page-support-ticket-admin__content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 14px;
}

.page-support-ticket-admin__controls,
.page-support-ticket-admin__messages-shell,
.page-support-ticket-admin__reply-card,
.page-support-ticket-admin__note-card,
.page-support-ticket-admin__closed-banner {
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-support-ticket-admin__section-title {
  font-family: $header-font;
  font-size: 1.05rem;
  color: #20323d;
  margin-bottom: 12px;
}

.page-support-ticket-admin__control-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(160px, 1fr));
  gap: 10px;
}

.page-support-ticket-admin__messages-shell {
  padding: 14px;
  min-height: 220px;
}

.page-support-ticket-admin__chat-message {
  margin-bottom: 8px;
}

.page-support-ticket-admin__chat-message:last-child {
  margin-bottom: 0;
}

.page-support-ticket-admin__empty {
  color: rgba(35, 35, 35, 0.6);
  text-align: center;
  padding: 22px 8px;
}

@media screen and (max-width: 1200px) {
  .page-support-ticket-admin__control-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media screen and (max-width: 1100px) {
  .page-support-ticket-admin__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-support-ticket-admin__hero-meta {
    width: 100%;
    justify-items: start;
  }

  .page-support-ticket-admin__hero-actions {
    justify-content: flex-start;
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .page-support-ticket-admin {
    padding: 20px 14px 36px;
  }

  .page-support-ticket-admin__hero {
    padding: 16px;
  }

  .page-support-ticket-admin__control-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
