<template>
  <section class="venue-member-editor">
    <q-table
      class="striped-list paged-link-table"
      :columns="columns"
      :rows="members"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
      row-key="id"
      wrap-cells
    >
      <template v-slot:no-data>Keine Treffpunkt-Mitglieder.</template>
      <template v-slot:header-cell-avatar="props">
        <q-th :props="props" auto-width />
      </template>
      <template v-slot:header-cell-permissions="props">
        <q-th :props="props" auto-width>Berechtigungen</q-th>
      </template>
      <template v-slot:header-cell-actions="props">
        <q-th :props="props" auto-width>Aktionen</q-th>
      </template>
      <template v-slot:body-cell-avatar="props">
        <q-td :props="props">
          <router-link :to="getLink(props.row)">
            <q-avatar round>
              <img :src="props.row.avatar" />
            </q-avatar>
          </router-link>
        </q-td>
      </template>
      <template v-slot:body-cell-name="props">
        <q-td :props="props">
          <router-link :to="getLink(props.row)">
            <span class="venue-member-editor__column-name">{{ props.row.name }}</span>
          </router-link>
        </q-td>
      </template>
      <template v-slot:body-cell-permissions="props">
        <q-td :props="props" class="venue-member-editor__cell-permissions">
          <q-checkbox
            dense
            label="Kann bearbeiten"
            :model-value="props.row.canEdit"
            :disable="!venue.canEdit || !canEditMember(props.row)"
            @update:model-value="(val) => setCanEdit(props.row, val)"
          /><br />
          <q-checkbox
            dense
            label="Kann Mitglieder verwalten"
            :model-value="props.row.canManageMembers"
            :disable="!canEditMember(props.row)"
            @update:model-value="(val) => setCanManageMembers(props.row, val)"
          />
          <br />
          <q-checkbox
            dense
            label="Im Team anzeigen"
            :model-value="props.row.showInStaff"
            :disable="!canEditMember(props.row)"
            @update:model-value="(val) => setShowInStaff(props.row, val)"
          />
        </q-td>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="venue-member-editor__cell-actions">
          <q-btn
            v-if="canEditMember(props.row)"
            flat
            color="negative"
            label="Entfernen"
            @click="onRemoveClick(props.row)"
          />
        </q-td>
      </template>
    </q-table>
    <q-inner-loading :showing="saving" />
  </section>
</template>

<script lang="ts">
import { VenueMemberFlagsDto } from '@app/shared/dto/venues/venue-member-flags.dto';
import { VenueMemberDto } from '@app/shared/dto/venues/venue-member.dto';
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';

class Props {
  members = prop<VenueMemberDto[]>({
    required: true,
  });

  venue = prop<VenueDto>({
    required: true,
  });
}

@Options({
  name: 'VenueMemberEditor',
  emits: ['updated'],
})
export default class VenueMemberEditor extends Vue.with(Props) {
  members: VenueMemberDto[] = [];
  saving = false;

  get columns() {
    return [
      {
        name: 'avatar',
        field: 'avatar',
        label: '',
        align: 'left',
        sortable: false,
      },
      {
        name: 'name',
        field: 'name',
        label: 'Name',
        align: 'left',
        sortable: false,
      },
      {
        name: 'permissions',
        label: 'Berechtigungen',
        align: 'left',
        sortable: false,
      },
      {
        name: 'actions',
        field: 'status',
        label: 'Aktionen',
        align: 'center',
        sortable: false,
      },
    ];
  }

  getLink(member: VenueMemberDto) {
    return `/${member.server}/${member.name.replace(/ /g, '_')}`;
  }

  onRemoveClick(member: VenueMemberDto) {
    this.$q
      .dialog({
        title: 'Mitglied entfernen',
        message: `Möchtest du ${member.name} wirklich aus diesem Treffpunkt entfernen?`,
        ok: {
          label: 'Entfernen',
          color: 'negative',
          flat: true,
        },
        cancel: 'Abbrechen',
      })
      .onOk(async () => {
        try {
          await this.$api.venues.rejectMember(this.venue.id, member.characterId);
          notifySuccess(`Mitgliedschaft von ${member.name} zurückgezogen.`);
          this.$emit('updated', member);
        } catch (e) {
          notifyError(e);
        }
      });
  }

  canEditMember(member: VenueMemberDto): boolean {
    const isOwner = this.venue.owner === member.name && this.venue.ownerServer === member.server;
    return !isOwner && member.characterId !== this.$store.getters.characterId;
  }

  async setCanEdit(member: VenueMemberDto, canEdit: boolean): Promise<void> {
    if (!this.venue.canEdit || !this.canEditMember(member)) {
      return;
    }

    await this.setFlags(member, { canEdit, canManageMembers: member.canManageMembers, showInStaff: member.showInStaff });
  }

  async setCanManageMembers(member: VenueMemberDto, canManageMembers: boolean): Promise<void> {
    if (!this.canEditMember(member)) {
      return;
    }

    await this.setFlags(member, { canEdit: member.canEdit, canManageMembers, showInStaff: member.showInStaff });
  }

  async setShowInStaff(member: VenueMemberDto, showInStaff: boolean): Promise<void> {
    if (!this.canEditMember(member)) {
      return;
    }

    await this.setFlags(member, { canEdit: member.canEdit, canManageMembers: member.canManageMembers, showInStaff });
  }

  private async setFlags(member: VenueMemberDto, flags: VenueMemberFlagsDto): Promise<void> {
    this.saving = true;

    try {
      await this.$api.venues.setMemberFlags(this.venue.id, member.characterId, flags);
      Object.assign(member, flags);
      notifySuccess(`Berechtigungen von ${member.name} geändert.`);
    } catch (e) {
      notifyError(e);
    } finally {
      this.saving = false;
    }
  }
}
</script>

<style lang="scss">
.venue-member-editor__cell-actions {
  white-space: nowrap;
}

.venue-member-editor__column-name {
  font-size: $body-font-size;
}

.venue-member-editor__cell-permissions {
  white-space: nowrap;
}

.venue-member-editor__cell-permissions .q-checkbox:first-child {
  margin-bottom: 4px;
}
</style>
