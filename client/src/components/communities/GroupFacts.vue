<template>
	<section class="group-facts" aria-labelledby="group-facts-title">
		<h2 id="group-facts-title" class="group-facts__title">{{ title }}</h2>
		<dl class="group-facts__list">
			<div v-for="item in visibleItems" :key="item.label" class="group-facts__row">
				<dt class="group-facts__label">{{ item.label }}</dt>
				<dd class="group-facts__value">
					<a
						v-if="item.href"
						class="group-facts__link"
						:href="item.href"
						target="_blank"
						rel="noopener noreferrer"
					>{{ item.value }}</a>
					<template v-else>{{ item.value }}</template>
				</dd>
			</div>
		</dl>
		<ul v-if="tags.length > 0" class="group-facts__tags" aria-label="Schlagworte">
			<li v-for="tag in tags" :key="tag" class="group-facts__tag">{{ tag }}</li>
		</ul>
		<slot />
	</section>
</template>

<script lang="ts">
// ER2-410 — "Eckdaten" card for free company and community pages.
import { Options, prop, Vue } from 'vue-class-component';
import type { GroupFact } from './group-plate';

class Props {
	title = prop<string>({ default: 'Eckdaten' });
	items = prop<GroupFact[]>({ default: () => [] });
	tags = prop<string[]>({ default: () => [] });
}

@Options({
	name: 'GroupFacts',
})
export default class GroupFacts extends Vue.with(Props) {
	get visibleItems(): GroupFact[] {
		return this.items.filter((item) => !!item.value && !!item.value.trim());
	}
}
</script>

<style lang="scss" scoped>
.group-facts {
	padding: 18px 20px 20px;
	border: 1px solid var(--rule-soft);
	border-radius: 12px;
	background-color: var(--vision-card);
}

.group-facts__title {
	text-align: left;
	margin: 0 0 12px;
	font-family: var(--font-display);
	font-weight: 500;
	font-size: 18px;
	line-height: 1.3;
	letter-spacing: 0;
	color: var(--ink-primary);
}

.group-facts__list {
	display: flex;
	flex-direction: column;
	margin: 0;
}

.group-facts__row {
	display: grid;
	grid-template-columns: minmax(96px, 38%) minmax(0, 1fr);
	gap: 12px;
	padding: 8px 0;
	border-top: 1px solid var(--rule-soft);

	&:first-child {
		border-top: 0;
		padding-top: 0;
	}
}

.group-facts__label {
	font-family: var(--font-ui);
	font-weight: 600;
	font-size: 11px;
	line-height: 20px;
	letter-spacing: 1.4px;
	text-transform: uppercase;
	color: var(--ink-muted);
}

.group-facts__value {
	margin: 0;
	font-family: var(--font-ui);
	font-size: 14px;
	line-height: 20px;
	color: var(--ink-primary);
	overflow-wrap: anywhere;
	white-space: pre-line;
}

.group-facts__link {
	color: var(--ink-link);
	text-decoration: none;

	&:hover,
	&:focus-visible {
		text-decoration: underline;
	}

	&:focus-visible {
		outline: none;
		border-radius: 2px;
		box-shadow:
			0 0 0 2px var(--glow-aether),
			0 0 0 3px var(--vision-focus-edge);
	}
}

.group-facts__tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin: 12px 0 0;
	padding: 0;
	list-style: none;
}

.group-facts__tag {
	display: inline-flex;
	align-items: center;
	height: 24px;
	padding: 0 10px;
	border: 1px solid var(--rule-soft);
	border-radius: 999px;
	background-color: var(--rule-tint);
	font-family: var(--font-ui);
	font-size: 12px;
	font-weight: 600;
	color: var(--ink-primary);
}
</style>
