<template>
	<div class="my-images">
		<template v-if="images.length > 0">
			<transition
				v-for="image in images" :key="image.id"
				leave-active-class="animated fadeOut"
			>
				<my-image v-show="!deleted[image.id]" :image="image" @deleted="onImageDeleted" />
			</transition>
		</template>
		<p v-else>
			Du hast keine Bilder.
		</p>
	</div>
</template>

<script lang="ts">
import { ImageDto } from '@app/shared/dto/image/image.dto';
import MyImage from 'components/images/MyImage.vue';
import { Options, prop, Vue } from 'vue-class-component';

class Props {
	images = prop<ImageDto[]>({
		required: true,
	});
}

@Options({
	name: 'MyImages',
	components: {
		MyImage,
	},
})
export default class MyImages extends Vue.with(Props) {
  deleted: { [k: number]: boolean } = {};

  onImageDeleted(image: ImageDto) {
    this.deleted[image.id] = true;
  }
}
</script>

<style lang="scss">

</style>
