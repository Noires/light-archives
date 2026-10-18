<template>
	<section class="home-module" :aria-labelledby="headingId">
		<div class="home-module__head">
			<h3 :id="headingId" class="home-module__title">{{ title }}</h3>
			<slot name="meta" />
		</div>
		<div class="home-module__body">
			<slot />
		</div>
		<div v-if="linkTo" class="home-module__foot">
			<q-btn
				class="elpis-btn elpis-btn--ghost"
				flat
				dense
				no-caps
				:to="linkTo"
				icon-right="arrow_forward"
				:label="linkLabel"
			/>
		</div>
	</section>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import type { RouteLocationRaw } from 'vue-router';

// ER2-306 — card shell for the home side modules: h3 title, body, ghost
// footer link. Modules in one row stretch to equal height.

let uid = 0;

class Props {
	title = prop<string>({ required: true });
	linkLabel = prop<string>({ default: 'Alle anzeigen' });
	linkTo = prop<RouteLocationRaw | null>({ default: null });
}

@Options({
	name: 'HomeModule',
})
export default class HomeModule extends Vue.with(Props) {
	readonly headingId = `home-module-${++uid}`;
}
</script>

<style lang="scss" scoped>
.home-module {
	display: flex;
	flex-direction: column;
	min-width: 0;
	height: 100%;
	padding: 16px 18px 10px;
	background-color: var(--vision-card);
	border: 1px solid var(--rule-soft);
	border-radius: 16px;
	color: var(--ink-primary);
}

.home-module__head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
	padding-bottom: 10px;
}

.home-module__title {
	margin: 0;
	font-family: var(--font-display);
	font-size: var(--type-scale-3);
	font-weight: 600;
	line-height: var(--lh-heading);
}

.home-module__body {
	flex: 1 1 auto;
	min-width: 0;
}

.home-module__foot {
	display: flex;
	justify-content: flex-end;
	margin-top: 8px;
	padding-top: 6px;
	border-top: 1px solid var(--rule-soft);
}
</style>
