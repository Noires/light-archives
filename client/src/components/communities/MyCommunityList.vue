<template>
  <div class="my-community-list striped-list">
    <q-list v-if="communities.length" bordered>
      <q-item
        v-for="community in communities"
        :key="`${community.id}`"
        clickable
        v-ripple
        :to="getLink(community)"
      >
        <q-item-section>
            <q-item-label>{{community.name}}</q-item-label>
            <q-item-label caption>{{community.goal}}</q-item-label>
        </q-item-section>
        <q-item-section side v-if="community.canEdit">
          <q-btn flat dense icon="edit" :to="`/edit-community/${community.id}`" @click.stop="" />
          <q-btn v-if="community.canDelete" flat dense icon="delete" @click.stop.prevent="onDeleteClick(community)" />
        </q-item-section>
        <q-item-section side v-else-if="community.membershipStatus === MembershipStatus.APPLIED">
          Beworben
        </q-item-section>
      </q-item>
    </q-list>
    <p v-else>
      Du bist noch keiner Community auf <strong>Elpisgarten</strong> beigetreten.
    </p>
  </div>
</template>

<script lang="ts">
import { MyCommunitySummaryDto } from '@app/shared/dto/communities/my-community-summary.dto';
import { MembershipStatus } from '@app/shared/enums/membership-status.enum';
import { notifyError, notifySuccess } from 'src/common/notify';
import { prop, Options, Vue } from 'vue-class-component';

class Props {
  communities = prop<MyCommunitySummaryDto[]>({
    required: true
  });
}

@Options({
  name: 'MyCommunityList',
  emits: [ 'deleted' ]
})
export default class MyCommunityList extends Vue.with(Props) {
  readonly MembershipStatus = MembershipStatus;
  
  getLink(community: MyCommunitySummaryDto) {
    return `/community/${community.name.replace(/ /g, '_')}`;
  }

	onDeleteClick(community: MyCommunitySummaryDto) {
		this.$q.dialog({
        title: 'Löschbestätigung',
        message: `Möchtest du “${community.name}” wirklich löschen?`,
				ok: {
					label: 'Löschen',
					color: 'negative',
					flat: true
				},
        cancel: 'Abbrechen',
      }).onOk(async () => {
        try {
					await this.$api.communities.deleteCommunity(community.id);
          notifySuccess('Community gelöscht.');
          this.$emit('deleted', community);
				} catch (e) {
					notifyError(e);
				}
      });
	}
}
</script>

<style lang="scss">
.my-community-list .q-item__section--side {
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
}
</style>
