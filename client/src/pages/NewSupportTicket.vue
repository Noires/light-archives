<template>
  <q-page class="page-new-support-ticket q-pa-md">
    <div class="layout-container">
      <h2>Neues Support-Ticket</h2>

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
          <q-btn color="primary" type="submit" label="Ticket erstellen" :loading="loading" />
          <q-btn flat label="Abbrechen" to="/support/tickets" />
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script lang="ts">
import { CreateSupportTicketDto } from '@app/shared/dto/support/create-support-ticket.dto';
import { SupportTicketCategory } from '@app/shared/enums/support-ticket-category.enum';
import { SupportTicketPriority } from '@app/shared/enums/support-ticket-priority.enum';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

@Options({
  name: 'PageNewSupportTicket',
})
export default class PageNewSupportTicket extends Vue {
  subject = '';
  category: SupportTicketCategory | null = SupportTicketCategory.GENERAL;
  priority: SupportTicketPriority = SupportTicketPriority.MEDIUM;
  message = '';
  loading = false;

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

  async submit(): Promise<void> {
    if (!this.category) {
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
.page-new-support-ticket .q-form {
  max-width: 900px;
}
</style>
