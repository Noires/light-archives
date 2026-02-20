<template>
  <section class="free-company-member-permission-editor">
    <q-table
      class="striped-list paged-link-table"
      :columns="columns"
      :rows="members"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
      row-key="characterId"
      wrap-cells
    >
      <template v-slot:no-data>Keine Mitglieder gefunden.</template>
      <template v-slot:header-cell-avatar="props">
        <q-th :props="props" auto-width />
      </template>
      <template v-slot:header-cell-canEdit="props">
        <q-th :props="props" auto-width>Bearbeitungsrechte</q-th>
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
            <span class="free-company-member-permission-editor__column-name">{{ props.row.name }}</span>
          </router-link>
        </q-td>
      </template>
      <template v-slot:body-cell-canEdit="props">
        <q-td :props="props" class="free-company-member-permission-editor__cell-permissions">
          <q-checkbox
            dense
            label="Kann bearbeiten"
            :model-value="props.row.canEdit"
            :disable="props.row.isLeader"
            @update:model-value="(val) => onCanEditChange(props.row, val)"
          />
          <span v-if="props.row.isLeader" class="free-company-member-permission-editor__leader-hint">
            Anfuehrer
          </span>
        </q-td>
      </template>
    </q-table>
    <q-inner-loading :showing="saving" />
  </section>
</template>

<script lang="ts">
import { FreeCompanyMemberPermissionDto } from '@app/shared/dto/fcs/free-company-member-permission.dto';
import type FreeCompaniesAPI from '@common/common/api/free-companies-api';
import { useApi } from 'src/boot/axios';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';

const $api = useApi();
const freeCompaniesApi = $api.freeCompanies as unknown as FreeCompaniesAPI;

class Props {
  members = prop<FreeCompanyMemberPermissionDto[]>({
    required: true,
  });

  freeCompanyId = prop<number>({
    required: true,
  });
}

@Options({
  name: 'FreeCompanyMemberPermissionEditor',
})
export default class FreeCompanyMemberPermissionEditor extends Vue.with(Props) {
  members: FreeCompanyMemberPermissionDto[] = [];
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
        name: 'canEdit',
        field: 'canEdit',
        label: 'Bearbeitungsrechte',
        align: 'left',
        sortable: false,
      },
    ];
  }

  getLink(member: FreeCompanyMemberPermissionDto) {
    return `/${member.server}/${member.name.replace(/ /g, '_')}`;
  }

  async onCanEditChange(member: FreeCompanyMemberPermissionDto, canEdit: boolean) {
    if (member.isLeader) {
      return;
    }

    this.saving = true;

    try {
      await freeCompaniesApi.setMemberEditPermission(this.freeCompanyId, member.characterId, { canEdit });
      member.canEdit = canEdit;
      notifySuccess(`Bearbeitungsrechte fuer ${member.name} aktualisiert.`);
    } catch (e) {
      notifyError(e);
    } finally {
      this.saving = false;
    }
  }
}
</script>

<style lang="scss">
.free-company-member-permission-editor__cell-permissions {
  white-space: nowrap;
}

.free-company-member-permission-editor__column-name {
  font-size: $body-font-size;
}

.free-company-member-permission-editor__leader-hint {
  margin-left: 8px;
  color: rgba(35, 35, 35, 0.6);
  font-size: 0.8rem;
}
</style>
