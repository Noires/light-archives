<template>
  <q-page>
		<h2>Impressum</h2>
		<div v-html="impressum"></div>
	</q-page>	
</template>

<script lang="ts">
import { Vue } from 'vue-class-component'
import impressum from 'src/markdown/impressum.md';

export default class PageImpressum extends Vue {
	readonly impressum = impressum;
}
</script>
