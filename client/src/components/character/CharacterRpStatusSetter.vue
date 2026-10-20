<template>
	<q-btn
		flat
		no-caps
		class="elpis-btn"
		icon="radio_button_checked"
		:label="buttonLabel"
		:aria-label="`RP-Status ändern, aktuell: ${buttonLabel}`"
	>
		<q-menu
			v-model="open"
			anchor="bottom right"
			self="top right"
			:offset="[0, 8]"
			class="rp-setter__menu mat-aetherglass elevation-2"
		>
			<form class="rp-setter" @submit.prevent="save">
				<fieldset class="rp-setter__fieldset">
					<legend class="rp-setter__legend">RP-Status</legend>
					<q-option-group
						v-model="status"
						:options="statusOptions"
						type="radio"
						dense
					/>
				</fieldset>
				<q-input
					v-model="location"
					label="Ort (optional)"
					:maxlength="locationMaxLength"
					dense
					outlined
				/>
				<q-select
					v-model="duration"
					label="Dauer"
					:options="durationOptions"
					emit-value
					map-options
					dense
					outlined
				/>
				<p class="rp-setter__hint">
					Der Status läuft danach von selbst ab (spätestens nach 6 Stunden). Gespeichert werden nur
					Status, Ort und Ablaufzeit, ohne Verlauf; du kannst ihn jederzeit zurücksetzen.
					<router-link class="rp-setter__privacy" to="/privacy-statement">Datenschutz</router-link>
				</p>
				<div class="rp-setter__actions">
					<q-btn
						v-if="current"
						class="elpis-btn elpis-btn--secondary"
						flat
						no-caps
						label="Zurücksetzen"
						:loading="clearing"
						:disable="saving"
						@click="clear"
					/>
					<q-btn
						class="elpis-btn elpis-btn--primary"
						unelevated
						no-caps
						type="submit"
						label="Status setzen"
						:loading="saving"
						:disable="clearing"
					/>
				</div>
			</form>
		</q-menu>
	</q-btn>
</template>

<script lang="ts">
// ER2-402 (optional) — owner control for the RP presence status (ER2-806).
// The parent only mounts it when the API sends the presence fields; if the
// endpoint still fails with 404/405 the component reports `unavailable` so
// the parent can hide it.
import { RpPresenceDto } from '@app/shared/dto/characters/rp-presence.dto';
import { RpStatus } from '@app/shared/enums/rp-status.enum';
import errors from '@app/shared/errors';
import { RP_LOCATION_MAX_LENGTH, RP_STATUS_DEFAULT_MINUTES } from '@app/shared/presence';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';
import { RP_STATUS_LABELS } from './rp-status';

class Props {
	characterId = prop<number>({ required: true });
	current = prop<RpStatus | null>({ default: null });
	currentLocation = prop<string | null>({ default: null });
}

@Options({
	name: 'CharacterRpStatusSetter',
	emits: [ 'change', 'unavailable' ],
	watch: {
		open(value: boolean) {
			if (value) {
				(this as CharacterRpStatusSetter).reset();
			}
		},
	},
})
export default class CharacterRpStatusSetter extends Vue.with(Props) {
	readonly locationMaxLength = RP_LOCATION_MAX_LENGTH;

	readonly statusOptions = [
		{ label: RP_STATUS_LABELS[RpStatus.IC], value: RpStatus.IC },
		{ label: RP_STATUS_LABELS[RpStatus.LFRP], value: RpStatus.LFRP },
		{ label: RP_STATUS_LABELS[RpStatus.OOC], value: RpStatus.OOC },
	];

	readonly durationOptions = [
		{ label: '30 Minuten', value: 30 },
		{ label: '1 Stunde', value: 60 },
		{ label: '2 Stunden', value: 120 },
		{ label: '3 Stunden', value: RP_STATUS_DEFAULT_MINUTES },
		{ label: '6 Stunden', value: 360 },
	];

	open = false;
	status: RpStatus = RpStatus.IC;
	location = '';
	duration = RP_STATUS_DEFAULT_MINUTES;
	saving = false;
	clearing = false;

	get buttonLabel(): string {
		return this.current ? RP_STATUS_LABELS[this.current] : 'RP-Status';
	}

	reset() {
		this.status = this.current || RpStatus.IC;
		this.location = this.currentLocation || '';
		this.duration = RP_STATUS_DEFAULT_MINUTES;
	}

	async save() {
		this.saving = true;
		try {
			const presence = await this.$api.characters.setRpStatus(this.characterId, {
				rpStatus: this.status,
				rpLocation: this.location.trim() || null,
				durationMinutes: this.duration,
			});
			this.done(presence, 'RP-Status gesetzt.');
		} catch (e) {
			this.fail(e);
		} finally {
			this.saving = false;
		}
	}

	async clear() {
		this.clearing = true;
		try {
			const presence = await this.$api.characters.clearRpStatus(this.characterId);
			this.done(presence, 'RP-Status zurückgesetzt.');
		} catch (e) {
			this.fail(e);
		} finally {
			this.clearing = false;
		}
	}

	private done(presence: RpPresenceDto | null | undefined, message: string) {
		this.$emit('change', {
			rpStatus: presence?.rpStatus ?? null,
			rpLocation: presence?.rpLocation ?? null,
			rpStatusExpiresAt: presence?.rpStatusExpiresAt ?? null,
		});
		this.open = false;
		notifySuccess(message);
	}

	private fail(e: unknown) {
		const status = errors.getStatusCode(e);
		if (status === 404 || status === 405 || status === 501) {
			this.open = false;
			this.$emit('unavailable');
			return;
		}
		notifyError(e);
	}
}
</script>

<style lang="scss" scoped>
.rp-setter {
	display: flex;
	flex-direction: column;
	gap: 12px;
	width: 280px;
	max-width: calc(100vw - 32px);
	padding: 16px;
	color: var(--ink-primary);
	font-family: var(--font-ui);
}

.rp-setter__fieldset {
	margin: 0;
	padding: 0;
	border: 0;
}

.rp-setter__legend {
	margin-bottom: 4px;
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 1.2px;
	text-transform: uppercase;
	color: var(--ink-muted);
}

.rp-setter__hint {
	margin: 0;
	font-size: 13px;
	line-height: 18px;
	color: var(--ink-muted);
}

.rp-setter__actions {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 8px;
}
</style>
