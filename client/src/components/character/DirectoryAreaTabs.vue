<template>
	<section-tabs
		class="directory-area-tabs"
		sync="route"
		aria-label="Verzeichnis"
		:tabs="tabs"
	/>
</template>

<script lang="ts">
// ER2-405 — "Charaktere" area: people, free companies and communities share
// one set of tabs linking the existing directory URLs.
import SectionTabs from 'components/vision/SectionTabs.vue';
import type { SectionTab } from 'components/vision/types';
import { Options, prop, Vue } from 'vue-class-component';

class Props {
	/** Optional counts per key: profiles, free-companies, communities. */
	counts = prop<Partial<Record<'profiles' | 'free-companies' | 'communities', number>>>({ default: () => ({}) });
}

@Options({
	name: 'DirectoryAreaTabs',
	components: {
		SectionTabs,
	},
})
export default class DirectoryAreaTabs extends Vue.with(Props) {
	get tabs(): SectionTab[] {
		return [
			{ key: 'profiles', label: 'Personen', icon: 'person', to: '/profiles', count: this.counts.profiles },
			{ key: 'free-companies', label: 'Freie Gesellschaften', icon: 'shield', to: '/free-companies', count: this.counts['free-companies'] },
			{ key: 'communities', label: 'Communities', icon: 'groups', to: '/communities', count: this.counts.communities },
		];
	}
}
</script>

<style lang="scss" scoped>
.directory-area-tabs {
	border-bottom: 1px solid var(--rule-soft);
}
</style>
