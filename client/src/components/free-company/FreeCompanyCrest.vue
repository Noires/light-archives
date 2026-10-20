<template>
	<div class="free-company-crest" :style="sizeStyle" aria-hidden="true">
		<img v-for="image in images" :key="image" :src="image" alt="" />
	</div>
</template>

<script lang="ts">
import { prop, Vue, Options } from 'vue-class-component';

class Props {
	images = prop<string[]>({
		required: true
	});

	/** Edge length in px; the Lodestone layers are stacked at this size. */
	size = prop<number>({
		default: 40
	});
}

@Options({
	name: 'FreeCompanyCrest'
})
export default class FreeCompanyCrest extends Vue.with(Props) {
	get sizeStyle(): Record<string, string> {
		return { width: `${this.size}px`, height: `${this.size}px` };
	}
}
</script>

<style lang="scss">
.free-company-crest {
	position: relative;
	flex: 0 0 auto;
	width: 40px;
	height: 40px;
}

.free-company-crest img {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
}
</style>
