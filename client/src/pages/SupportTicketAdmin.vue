<template>
  <q-page class="page-support-ticket-admin q-pa-md">
    <div class="layout-container" v-if="ticket">
      <div class="row items-start justify-between q-mb-md q-gutter-sm">
        <div>
          <h2 class="q-my-none">Support Ticket #{{ ticket.ticketNumber }}</h2>
          <div class="text-caption">User #{{ ticket.ownerUserId }}</div>
          <div v-if="ticket.assigneeUserId" class="text-caption">Zugewiesen an Support #{{ ticket.assigneeUserId }}</div>
        </div>
        <q-btn flat label="Zur Queue" to="/support/queue" />
      </div>

      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-12 col-md-3">
          <q-select v-model="status" outlined dense emit-value map-options :options="statusOptions" label="Status" />
        </div>
        <div class="col-12 col-md-3">
          <q-select v-model="priority" outlined dense emit-value map-options :options="priorityOptions" label="Priorität" />
        </div>
        <div class="col-12 col-md-3">
          <q-select v-model="category" outlined dense emit-value map-options :options="categoryOptions" label="Kategorie" />
        </div>
        <div class="col-12 col-md-3">
          <q-select v-model="supportLevel" outlined dense emit-value map-options :options="supportLevelOptions" label="Support-Level" />
        </div>
        <div class="col-12 col-md-3">
          <q-input
            v-model.trim="assigneeUserIdInput"
            outlined
            dense
            label="Assignee User ID"
            clearable
            inputmode="numeric"
          >
            <template v-slot:append>
              <q-btn
                v-if="currentUserId"
                flat
                round
                dense
                icon="person"
                @click="assignToMe"
              >
                <q-tooltip>Mir zuweisen</q-tooltip>
              </q-btn>
            </template>
          </q-input>
        </div>
      </div>

      <div class="row q-gutter-sm q-mb-md">
        <q-btn color="primary" label="Ticket aktualisieren" @click="updateTicket" :loading="saving" />
        <q-btn v-if="ticket.status !== SupportTicketStatus.CLOSED" flat color="negative" label="Schließen" @click="closeTicket" />
        <q-btn v-else flat color="primary" label="Wieder öffnen" @click="reopenTicket" />
      </div>

      <q-list bordered separator class="q-mb-md">
        <q-item
          v-for="message in ticket.messages"
          :key="message.id"
          :class="{ 'bg-blue-1': message.isInternal }"
        >
          <q-item-section>
            <q-item-label>
              <strong>{{ message.senderLabel }}</strong>
              <span v-if="message.isInternal" class="text-caption q-ml-xs">(intern)</span>
              <span class="text-caption q-ml-sm">{{ $display.formatDateTimeLocal(message.createdAt) }}</span>
            </q-item-label>
            <q-item-label caption class="text-body2" style="white-space: pre-wrap;">{{ message.body }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <q-card v-if="ticket.status !== SupportTicketStatus.CLOSED" flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">Öffentliche Antwort</div>
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

      <q-banner v-else class="bg-grey-2 text-dark q-mb-md">
        Dieses Ticket ist geschlossen. Öffne es zuerst wieder, um öffentlich zu antworten.
      </q-banner>

      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">Interne Notiz</div>
          <q-input v-model="internalNote" type="textarea" autogrow outlined label="Notiz" />
          <q-btn class="q-mt-sm" color="secondary" label="Notiz speichern" @click="sendInternalNote" :loading="sendingNote" />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script lang="ts">
import { SupportTicketDetailDto } from '@app/shared/dto/support/support-ticket-detail.dto';
import { SupportLevel } from '@app/shared/enums/support-level.enum';
import { SupportTicketCategory } from '@app/shared/enums/support-ticket-category.enum';
import { SupportTicketPriority } from '@app/shared/enums/support-ticket-priority.enum';
import { SupportTicketStatus } from '@app/shared/enums/support-ticket-status.enum';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

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

  ticket: SupportTicketDetailDto | null = null;

  status: SupportTicketStatus | null = null;
  category: SupportTicketCategory | null = null;
  priority: SupportTicketPriority | null = null;
  supportLevel: SupportLevel | null = null;
  assigneeUserIdInput = '';

  publicReply = '';
  internalNote = '';
  quickReply: string | null = null;

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
      { label: 'Empfang bestätigt', value: 'Vielen Dank für deine Nachricht. Wir haben dein Anliegen erhalten und prüfen es.' },
      { label: 'Rückfrage', value: 'Danke für dein Ticket. Kannst du bitte noch weitere Details oder Screenshots teilen?' },
      { label: 'Abschluss', value: 'Wir haben dein Anliegen abgeschlossen. Wenn noch etwas offen ist, öffne das Ticket bitte erneut.' },
    ];
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
      this.publicReply = this.quickReply;
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

    try {
      this.sendingReply = true;
      await this.$api.support.addSupportMessage(this.ticket.id, { message: this.publicReply.trim() });
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

