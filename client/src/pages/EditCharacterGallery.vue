<template>
  <h2>Gallerie</h2>
  <template v-if="content.images && content.images.length > 0">
    <thumb-gallery :images="content.images" />
  </template>
  <section>
    <q-btn @click="uploadImage" outline color="secondary" style="max-width: 140px"><i
        class="material-icons q-icon">file_upload</i>Bild
      hochladen</q-btn>
  </section>
</template>

<script lang="ts">
import { CharacterContentDto } from '@app/shared/dto/characters/character-content.dto';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import ThumbGallery from 'src/components/images/ThumbGallery.vue';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import errors from '@app/shared/errors';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';

const $api = useApi();


async function load(params: RouteParams): Promise<CharacterContentDto> {
  const id = parseInt(params.id as string, 10);

  try {
    const content = await $api.characters.getCharacterContent(id);

    return content;
  } catch (e) {
    if (errors.getStatusCode(e) === 404) {
      return { stories: [], images: [] };
    } else {
      notifyError(e);
      throw e;
    }
  }
}

@Options({
  components: {
    ThumbGallery
  },
  async beforeRouteEnter(to, _, next) {
    const content = await load(to.params);
    next(vm => (vm as EditCharacterGallery).setContent(content));
  },
  async beforeRouteUpdate(to) {
    const content = await load(to.params);
    (this as EditCharacterGallery).setContent(content);
  },
  emits: ['updateCharacter']
})
export default class EditCharacterGallery extends Vue {
  content: CharacterContentDto = { stories: [], images: [] };

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

  setContent(content: CharacterContentDto) {
    this.content = content;
  }
}
</script>
