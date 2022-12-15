<template>
  <section class="community-member-editor">
    <q-table
      class="striped-list paged-link-table"
      :columns="columns"
      :rows="members"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
      row-key="id"
      wrap-cells
    >
      <template v-slot:no-data>Keine Community-Mitglieder.</template>
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
            <span class="community-member-editor__column-name">{{ props.row.name }}</span>
          </router-link>
        </q-td>
      </template>
      <template v-slot:body-cell-permissions="props">
        <q-td :props="props" class="community-member-editor__cell-permissions">
          <q-checkbox
            dense
            label="Kann bearbeiten"
            :model-value="props.row.canEdit"
            :disable="!community.canEdit || !canEditMember(props.row)"
            @update:model-value="(val) => setCanEdit(props.row, val)"
          /><br />
          <q-checkbox
            dense
            label="Kann Mitglieder verwalten"
            :model-value="props.row.canManageMembers"
            :disable="!canEditMember(props.row)"
            @update:model-value="(val) => setCanManageMembers(props.row, val)"
          />
        </q-td>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="community-member-editor__cell-actions">
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
import { CommunityMemberDto } from '@app/shared/dto/communities/community-member.dto';
import { CommunityDto } from '@app/shared/dto/communities/community.dto';
import { MemberFlagsDto } from '@app/shared/dto/communities/member-flags.dto';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';

class Props {
  members = prop<CommunityMemberDto[]>({
    required: true,
  });

  community = prop<CommunityDto>({
    required: true,
  });
}

@Options({
  name: 'CommunityMemberEditor',
  components: {},
  emits: ['updated'],
})
export default class CommunityMemberEditor extends Vue.with(Props) {
  members: CommunityMemberDto[] = [];
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

  getLink(member: CommunityMemberDto) {
    return `/${member.server}/${member.name.replace(/ /g, '_')}`;
  }

  async onApproveClick(member: CommunityMemberDto) {
    try {
      await this.$api.communities.approveMember(this.community.id, member.characterId);
      notifySuccess(`Membership request for ${member.name} approved.`);
      this.$emit('updated');
    } catch (e) {
      notifyError(e);
    }
  }

  onRemoveClick(member: CommunityMemberDto) {
    this.$q
      .dialog({
        title: 'Mitglied entfernen',
        message: `Möchtest du ${member.name} wirklich aus deiner Community entfernen?`,
        ok: {
          label: 'Entfernen',
          color: 'negative',
          flat: true,
        },
        cancel: 'Abbrechen',
      })
      .onOk(async () => {
        try {
          await this.$api.communities.rejectMember(this.community.id, member.characterId);
          notifySuccess(`Mitgliedschaft von ${member.name} zurückgezogen.`);
          this.$emit('updated', member);
        } catch (e) {
          notifyError(e);
        }
      });
  }

  canEditMember(member: CommunityMemberDto): boolean {
    const isOwner = this.community.owner === member.name && this.community.ownerServer === member.server;
    return !isOwner && member.characterId !== this.$store.getters.characterId;
  }

  async setCanEdit(member: CommunityMemberDto, canEdit: boolean): Promise<void> {
    if (!this.community.canEdit || !this.canEditMember(member)) {
      return;
    }

    await this.setFlags(member, { canEdit, canManageMembers: member.canManageMembers });
  }

  async setCanManageMembers(member: CommunityMemberDto, canManageMembers: boolean): Promise<void> {
    if (!this.canEditMember(member)) {
      return;
    }

    await this.setFlags(member, { canEdit: member.canEdit, canManageMembers });
  }

  private async setFlags(member: CommunityMemberDto, flags: MemberFlagsDto): Promise<void> {
    this.saving = true;

    try {
      await this.$api.communities.setMemberFlags(this.community.id, member.characterId, flags);
      Object.assign(member, flags);
      notifySuccess(`${member.name}'s permissions changed.`);
    } catch (e) {
      notifyError(e);
    } finally {
      this.saving = false;
    }
  }
}
</script>

<style lang="scss">
.community-member-editor__cell-actions {
  white-space: nowrap;
}

.community-member-editor__column-name {
  font-size: $body-font-size;
}

.community-member-editor__cell-permissions {
  white-space: nowrap;
}

.community-member-editor__cell-permissions .q-checkbox:first-child {
  margin-bottom: 4px;
}
</style>
