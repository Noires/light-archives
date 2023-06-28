<template>
  <q-list class="user-menu" dense dark>
      <q-item
        v-if="$store.getters.role === Role.UNVERIFIED"
        clickable
        v-ripple
        to="/verify"
      >
        <q-item-section>
          <q-item-label>{{ $store.getters.realRole === Role.UNVERIFIED ? 'Accountverzifizierung' : 'Charakterverifizierung'}}</q-item-label>
        </q-item-section>
      </q-item>
      <template v-else>
        <q-item
          clickable
          v-ripple
          :to="myProfileLink"
        >
          <q-item-section>
            <q-item-label>Profil ansehen</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          :to="`/edit-character/${$store.getters.characterId}`"
        >
          <q-item-section>
            <q-item-label>Profil bearbeiten</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/my-free-company"
        >
          <q-item-section>
            <q-item-label>Meine Freie Gesellschaft</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator dark />
        <q-item
          clickable
          v-ripple
          to="/create-community"
        >
          <q-item-section>
            <q-item-label>Community erstellen</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/my-communities"
        >
          <q-item-section>
            <q-item-label>Meine Communities</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator dark />
        <q-item
          clickable
          v-ripple
          to="/create-venue"
        >
          <q-item-section>
            <q-item-label>Treffpunkt erstellen</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/my-venues"
        >
          <q-item-section>
            <q-item-label>Meine Treffpunkte</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator dark />
        <q-item
          clickable
          v-ripple
          to="/create-story"
        >
          <q-item-section>
            <q-item-label>Neue Geschichte</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/create-event"
        >
          <q-item-section>
            <q-item-label>Neues Event</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/create-noticeboard-item"
        >
          <q-item-section>
            <q-item-label>Neuer Aushang</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-if="$store.getters.isTrusted"
          clickable
          v-ripple
          to="/create-wiki-page"
        >
          <q-item-section>
            <q-item-label>Neuer Wikibeitrag</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          @click="uploadImage"
        >
          <q-item-section>
            <q-item-label>Bild hochladen</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/my-content"
        >
          <q-item-section>
            <q-item-label>Meine Inhalte</q-item-label>
          </q-item-section>
        </q-item>
      </template>
      <q-separator dark />
      <q-item clickable v-ripple to="/my-account">
        <q-item-section>
          <q-item-label>Mein Account</q-item-label>
        </q-item-section>
      </q-item>
      <q-item clickable v-ripple @click="logOut">
        <q-item-section>
          <q-item-label>Ausloggen</q-item-label>
        </q-item-section>
      </q-item>
  </q-list>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { Role } from '@app/shared/enums/role.enum';
import { notifySuccess } from 'src/common/notify';

@Options({

})
export default class UserMenu extends Vue {
  readonly Role = Role;

  get myProfileLink() {
		const server = this.$store.getters.character?.server || '';
		const character = this.$store.getters.character?.name.replace(/ /g, '_') || '';
		return `/${server}/${character}`;
	}

  async uploadImage() {
    const UploadDialog = (await import('components/upload/UploadDialog.vue')).default;

    this.$q.dialog({
      component: UploadDialog
    }).onOk(async (image: ImageSummaryDto) => {
      const PostUploadDialog = (await import('components/upload/PostUploadDialog.vue')).default;

      this.$q.dialog({
        component: PostUploadDialog,
        componentProps: {
          image
        }
      });
    });
  }

  logOut() {
    this.$store.commit('setUser', null);
    this.$api.setAccessToken(null);
    notifySuccess('Du hast dich ausgeloggt.');
    void this.$router.push('/');
  }
}
</script>

<style lang="scss">

.user-menu__button-bar {
  margin-bottom: 8px;
}

</style>
