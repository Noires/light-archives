<template>
  <q-page class="page-gallery">
    <h2>Gallerie</h2>

    <template v-if="content.images && content.images.length > 0">
      <thumb-gallery :images="content.images" />
    </template>
    <section>
      <q-btn outline color="secondary" style="max-width: 140px"><i class="material-icons q-icon">file_upload</i>Bild
        hochladen</q-btn>
    </section>
  </q-page>
</template>

<script lang="ts">
import { CharacterContentDto } from '@app/shared/dto/characters/character-content.dto';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import ThumbGallery from 'src/components/images/ThumbGallery.vue';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import errors from '@app/shared/errors';

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
  }
})
export default class EditCharacterGallery extends Vue {
  content: CharacterContentDto = { stories: [], images: [] };

  setContent(content: CharacterContentDto) {
    Object.assign(this, content);
  }
}
</script>
