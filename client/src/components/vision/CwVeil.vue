<template>
	<div class="cw-veil" :class="{ 'cw-veil--veiled': veiled }">
		<!-- The card comes first in the DOM, so screen readers hear the
		     warnings before anything of the veiled content. -->
		<section
			v-if="veiled"
			class="cw-veil__card"
			role="region"
			:aria-labelledby="`${uid}-title`"
			:aria-describedby="`${uid}-list`"
		>
			<span class="cw-veil__disc" aria-hidden="true">
				<q-icon name="warning" />
			</span>
			<h2 :id="`${uid}-title`" class="cw-veil__title">{{ title }}</h2>
			<ul :id="`${uid}-list`" class="cw-veil__chips" aria-label="Inhaltswarnungen">
				<li v-for="warning in warnings" :key="warning">
					<status-badge type="cw" :label="warning" />
				</li>
			</ul>
			<div class="cw-veil__actions">
				<q-btn
					ref="confirmButton"
					class="elpis-btn elpis-btn--primary"
					unelevated
					no-caps
					:label="confirmLabel"
					@click="onConfirm"
				/>
				<q-btn
					v-if="backTo"
					class="elpis-btn elpis-btn--ghost"
					flat
					no-caps
					:label="backLabel"
					:to="backTo"
				/>
			</div>
			<q-checkbox
				v-model="remember"
				class="cw-veil__remember"
				dense
				label="Für diese Warnungen nicht mehr fragen"
			/>
		</section>

		<div
			ref="content"
			class="cw-veil__content"
			:aria-hidden="veiled ? 'true' : undefined"
			:inert="veiled || undefined"
			tabindex="-1"
		>
			<slot />
		</div>
	</div>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import type { RouteLocationRaw } from 'vue-router';
import StatusBadge from './StatusBadge.vue';

// ER2-602 — content-warning veil. The slotted content is blurred, clipped
// and inert until the reader confirms. "Für diese Warnungen nicht mehr
// fragen" remembers the confirmed warning labels for this browser session
// (sessionStorage), so content whose warnings are all confirmed opens
// directly. Without warnings the veil renders the slot as is.

const STORAGE_KEY = 'elpis.cw.confirmed';

function readConfirmed(): string[] {
	try {
		const raw = window.sessionStorage.getItem(STORAGE_KEY);
		const parsed: unknown = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
	} catch {
		return [];
	}
}

function writeConfirmed(warnings: string[]) {
	try {
		const merged = Array.from(new Set([ ...readConfirmed(), ...warnings ]));
		window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
	} catch {
		// Storage blocked (private mode): the veil just asks again next time.
	}
}

let veilCounter = 0;

class Props {
	warnings = prop<string[]>({ default: () => [] });
	title = prop<string>({ default: 'Diese Geschichte enthält Inhaltswarnungen' });
	confirmLabel = prop<string>({ default: 'Trotzdem lesen' });
	backLabel = prop<string>({ default: 'Zurück zur Übersicht' });
	backTo = prop<RouteLocationRaw | null>({ default: null });
	/** Skip the veil entirely (e.g. editor preview). */
	disabled = prop<boolean>({ default: false });
}

@Options({
	name: 'CwVeil',
	components: {
		StatusBadge,
	},
	emits: [ 'confirm' ],
	watch: {
		warnings() {
			(this as CwVeil).syncFromStorage();
		},
	},
})
export default class CwVeil extends Vue.with(Props) {
	readonly uid = `cw-veil-${++veilCounter}`;

	confirmed = false;
	remember = false;

	get veiled(): boolean {
		return !this.disabled && this.warnings.length > 0 && !this.confirmed;
	}

	created() {
		this.syncFromStorage();
	}

	syncFromStorage() {
		const stored = readConfirmed();
		this.confirmed = this.warnings.length > 0 && this.warnings.every((warning) => stored.includes(warning));

		if (this.confirmed) {
			this.$emit('confirm', { remembered: true });
		}
	}

	onConfirm() {
		if (this.remember) {
			writeConfirmed(this.warnings);
		}

		this.confirmed = true;
		this.$emit('confirm', { remembered: false });

		// Move focus to the revealed content so keyboard and screen-reader users
		// continue reading where the card was.
		void this.$nextTick(() => {
			(this.$refs.content as HTMLElement | undefined)?.focus({ preventScroll: true });
		});
	}
}
</script>

<style lang="scss" scoped>
.cw-veil {
	position: relative;
}

// Card and content share one grid cell, so the cell grows with whichever is
// taller (many warnings on a phone) and the card never spills out.
.cw-veil--veiled {
	display: grid;
}

.cw-veil--veiled > .cw-veil__card,
.cw-veil--veiled > .cw-veil__content {
	grid-area: 1 / 1;
}

.cw-veil__content:focus {
	outline: none;
}

.cw-veil--veiled .cw-veil__content {
	max-height: 420px;
	overflow: hidden;
	filter: blur(9px);
	user-select: none;
	pointer-events: none;
	-webkit-mask-image: linear-gradient(to bottom, #000 40%, transparent 100%);
	mask-image: linear-gradient(to bottom, #000 40%, transparent 100%);
}

.cw-veil__card {
	position: relative;
	z-index: 2;
	align-self: start;
	justify-self: center;
	margin: 24px 12px;
	width: min(520px, calc(100% - 24px));
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14px;
	padding: 28px 28px 22px;
	border: 1px solid var(--vision-cw-border);
	border-radius: 14px;
	background: var(--vision-card);
	color: var(--ink-primary);
	box-shadow: 0 18px 48px rgba(43, 36, 24, 0.18);
	text-align: center;
	font-family: var(--font-ui);
}

body.body--dark .cw-veil__card {
	box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
}

.cw-veil__disc {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 52px;
	height: 52px;
	border-radius: 50%;
	background: var(--vision-cw-bg);
	border: 1px solid var(--vision-cw-border);
	color: var(--vision-cw-text);
	font-size: 26px;
}

.cw-veil__title {
	margin: 0;
	font-family: var(--font-display);
	font-size: var(--type-scale-3);
	line-height: 1.3;
	font-weight: 600;
	letter-spacing: var(--ls-display);
	color: var(--ink-primary);
}

.cw-veil__chips {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 8px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.cw-veil__actions {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 10px;
	margin-top: 4px;
}

.cw-veil__remember {
	color: var(--ink-muted);
	font-size: var(--type-scale-1);
}

@media screen and (max-width: 599px) {
	.cw-veil__card {
		margin-top: 12px;
		padding: 22px 18px 18px;
	}

	.cw-veil--veiled .cw-veil__content {
		max-height: 480px;
	}
}
</style>
