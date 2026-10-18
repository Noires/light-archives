<template>
	<section class="vision-empty" :class="`vision-empty--${variant}`">
		<span class="vision-empty__disc" aria-hidden="true">
			<q-icon :name="icon" />
		</span>
		<h3 class="vision-empty__title">{{ title }}</h3>
		<p v-if="text" class="vision-empty__text">{{ text }}</p>
		<q-btn
			v-if="actionLabel"
			class="vision-empty__action elpis-btn"
			:class="variant === 'owner' ? 'elpis-btn--secondary' : 'elpis-btn--primary'"
			:label="actionLabel"
			:to="actionTo || undefined"
			no-caps
			unelevated
			@click="onAction"
		/>
	</section>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import type { RouteLocationRaw } from 'vue-router';

// ER2-005 — empty list / empty section. Exactly one action: a route
// (`actionTo`) or an `action` event. Visitor copy invites; owner copy
// prompts the owner to fill the section, with a quieter secondary button.

class Props {
	icon = prop<string>({ default: 'auto_stories' });
	title = prop<string>({ default: 'Hier ist noch nichts' });
	text = prop<string>({ default: '' });
	actionLabel = prop<string>({ default: '' });
	actionTo = prop<RouteLocationRaw | null>({ default: null });
	variant = prop<'visitor' | 'owner'>({ default: 'visitor' });
}

@Options({
	name: 'EmptyState',
	emits: [ 'action' ],
})
export default class EmptyState extends Vue.with(Props) {
	onAction(event: Event) {
		this.$emit('action', event);
	}
}
</script>

<style lang="scss" scoped>
.vision-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 32px 24px;
	border: 1px dashed var(--rule-soft);
	border-radius: 12px;
	text-align: center;
	color: var(--ink-primary);
}

.vision-empty__disc {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 52px;
	height: 52px;
	margin-bottom: 4px;
	border-radius: 50%;
	background-color: var(--rule-tint);
	color: var(--ink-link);
	font-size: 26px;
}

.vision-empty__title {
	margin: 0;
	font-family: var(--font-display);
	font-size: 20px;
	font-weight: 500;
	line-height: 1.3;
	letter-spacing: 0;
	color: var(--ink-primary);
}

.vision-empty__text {
	max-width: 420px;
	margin: 0;
	font-family: var(--font-ui);
	font-size: 14px;
	line-height: 1.5;
	color: var(--ink-muted);
}

.vision-empty__action {
	margin-top: 8px;
}
</style>
