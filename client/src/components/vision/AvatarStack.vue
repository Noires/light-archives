<template>
	<span class="vision-avatar-stack">
		<span v-if="shown.length" class="vision-avatar-stack__images">
			<img
				v-for="(avatar, index) in shown"
				:key="`${index}-${avatar.src}`"
				class="vision-avatar-stack__img"
				:src="avatar.src"
				:alt="avatar.alt"
				loading="lazy"
			/>
			<span v-if="overflow > 0" class="vision-avatar-stack__more">
				<span aria-hidden="true">+{{ overflow }}</span>
				<span class="vision-avatar-stack__sr">und {{ overflow }} weitere</span>
			</span>
		</span>
		<span v-if="label" class="vision-avatar-stack__label">{{ label }}</span>
	</span>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import type { AvatarItem } from './types';

// ER2-005 — overlapping avatar row (RSVPs, members) with a trailing label.

class Props {
	avatars = prop<AvatarItem[]>({ default: () => [] });
	max = prop<number>({ default: 3 });
	label = prop<string>({ default: '' });
}

@Options({
	name: 'AvatarStack',
})
export default class AvatarStack extends Vue.with(Props) {
	get shown(): AvatarItem[] {
		return this.avatars.slice(0, Math.max(0, this.max));
	}

	get overflow(): number {
		return Math.max(0, this.avatars.length - this.shown.length);
	}
}
</script>

<style lang="scss" scoped>
.vision-avatar-stack {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.vision-avatar-stack__images {
	display: inline-flex;
	align-items: center;
	flex: 0 0 auto;
}

.vision-avatar-stack__img,
.vision-avatar-stack__more {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	box-shadow: 0 0 0 2px var(--vision-card);
	background-color: var(--rule-tint);
}

.vision-avatar-stack__img {
	display: block;
	object-fit: cover;
}

.vision-avatar-stack__img + .vision-avatar-stack__img,
.vision-avatar-stack__img + .vision-avatar-stack__more {
	margin-left: -8px;
}

.vision-avatar-stack__more {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background-color: var(--vision-card);
	border: 1px solid var(--rule-soft);
	color: var(--ink-muted);
	font-family: var(--font-ui);
	font-weight: 600;
	font-size: 11px;
}

.vision-avatar-stack__sr {
	position: absolute;
	width: 1px;
	height: 1px;
	margin: -1px;
	overflow: hidden;
	clip: rect(0 0 0 0);
	white-space: nowrap;
}

.vision-avatar-stack__label {
	font-family: var(--font-ui);
	font-size: 13px;
	line-height: 18px;
	color: var(--ink-muted);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>
