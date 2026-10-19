<template>
	<div class="character-finder-field">
		<div class="character-finder-field__row">
			<div class="character-finder-field__inputs">
				<q-select
					:model-value="modelValue.name ? modelValue : null"
					:display-value="modelValue.name"
					:options="characterOptions"
					:option-label="(option) => `${option.name} (${option.server})`"
					hide-dropdown-icon
					use-input
					input-debounce="200"
					label="Charaktername"
					:hint="modelValue.server ? '' : 'Gib den Namen deines Charakters ein, damit wir versuchen können ihn zu finden.'"
					@filter="onCharacterFilter"
					@update:model-value="onCharacterSelected"
					:rules="[
						val => !!val && !!val.server || 'Du musst einen Charakter auswählen.',
					]"
				>
					<template v-slot:prepend>
						<q-icon name="face" />
					</template>
					<template v-slot:append>
						<q-btn v-if="modelValue.server" flat dense icon="delete" title="Entfernen" @click="clearCharacter" />
					</template>
				</q-select>
				<q-input :model-value="modelValue.server" label="Server" readonly>
					<template v-slot:prepend>
						<q-icon name="computer" />
					</template>
				</q-input>
			</div>
			<div class="character-finder-field__avatar">
				<q-img width="96px" height="96px" :src="modelValue.avatar" />
			</div>
		</div>
		<div class="character-finder-field__alerts" v-if="registrationStatus">
			<q-banner v-if="registrationStatus === CharacterRegistrationStatus.CLAIMED_BY_ANOTHER_USER" class="character-finder-field__banner character-finder-field__banner--claimed">
				<template v-slot:avatar><q-icon name="block" /></template>
				Dieser Charakter wurde bereits von einem anderen Nutzer beansprucht.
			</q-banner>
			<q-banner v-else-if="registrationStatus === CharacterRegistrationStatus.ALREADY_REGISTERED" class="character-finder-field__banner character-finder-field__banner--already">
				<template v-slot:avatar><q-icon name="info" /></template>
				Du hast diesen Charakter bereits registriert.
			</q-banner>
			<q-banner v-else-if="registrationStatus === CharacterRegistrationStatus.RENAMED" class="character-finder-field__banner character-finder-field__banner--renamed">
				<template v-slot:avatar><q-icon name="auto_awesome" /></template>
				<p>
					Du hast für diesen Charakter eine Charakterumbenennung benutzt und auf <strong>Elpisgarten</strong> ein Charakterprofil unter dem alten Namen. Du <strong>kannst</strong> ein gesondertes Profil unter dem neuen Namen erstellen; allerdings wirst du nicht mehr dazu in der Lage sein den alten Charakter auf <strong>Elpisgarten</strong> mit dem neuen Namen anzupassen.
				</p>
				<p>
					Wenn du lieber ein existierendes Charakterprofil mit dem neuen Namen aktualisieren möchtest, öffne das Profil des betroffenen Charakters und klicke auf "Aktualisiere via Lodestone".
				</p>
			</q-banner>
		</div>
	</div>
</template>

<script lang="ts">
import { CharacterRegistrationStatus } from '@app/shared/enums/character-registration-status.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { Options, prop, Vue } from 'vue-class-component';
import { CharacterSearchModel } from './character-search-model';
import { notifyError } from 'src/common/notify';

function flat<T>(array: T[][]): T[] {
	return array.reduce((acc, val) => acc.concat(val), []);
}

class Props {
	modelValue = prop<CharacterSearchModel>({
		required: true
	});
}

const allAllowedServers: string[] = [];
let allowedServersLoaded = false;

@Options({
	emits: [ 'update:model-value' ]
})
export default class CharacterFinderField extends Vue.with(Props) {
	readonly CharacterRegistrationStatus = CharacterRegistrationStatus;

	characterOptions: CharacterSearchModel[] = [];
  characterOptionsSearchString = '';
	registrationStatus: CharacterRegistrationStatus | null = null;

	async created() {
		if (!allowedServersLoaded) {
			try {
				const datacenters = await this.$api.servers.getDatacenters();
				datacenters.forEach(dc => allAllowedServers.push(...dc.servers));
				allowedServersLoaded = true;
			} catch (e) {
				notifyError(e);
			}
		}
	}

	async onCharacterFilter(value: string, update: () => void, abort: () => void) {
    value = value.trim();

    // require that the name consists of at least two components, each at least two characters long
    if (!(/.. ../.exec(value))) {
      this.characterOptions = [];
      update();
      return;
    }

    try {
      this.characterOptionsSearchString = value;

			// Search in all DCs
			const resultsArray = await Promise.all(SharedConstants.DATACENTERS.map(dc => `_dc_${dc}`)
				.map(dcParam => this.$api.lodestone.searchCharacters(value, dcParam)));
			const results = flat(resultsArray.map(searchEntry => searchEntry.List));

      if (this.characterOptionsSearchString !== value) {
        // Too late
        return;
      }

      this.characterOptions = results.map((result) => ({
        name: result.Name,
        server: result.World.split(/\s/)[0], // remove datacenter suffix
        avatar: result.Avatar,
        lodestoneId: result.ID,
      }));
      
      update();
    } catch (e) {
      abort();
      throw e;
    }
	}

  async onCharacterSelected(character?: CharacterSearchModel) {
    if (character) {
      this.$emit('update:model-value', character);

			this.registrationStatus = (await this.$api.characters.getCharacterRegistrationStatus({
				name: character.name,
				lodestoneId: character.lodestoneId,
			})).status;
    }
  }

  clearCharacter() {
		const character: CharacterSearchModel = {
			name: '',
			server: '',
			avatar: '',
			lodestoneId: -1
		};

		this.registrationStatus = null;
		this.$emit('update:model-value', character);
  }	
}
</script>

<style lang="scss">
.character-finder-field__row {
	display: flex;
}

.character-finder-field__inputs {
	flex-basis: 0;
  flex-grow: 1;
}

.character-finder-field__avatar {
  margin-left: 16px;
}

.character-finder-field__avatar img {
  border-radius: 50%;
}

.character-finder-field__alerts .q-banner {
	margin-top: 16px;
}

.character-finder-field__alerts .q-banner p:last-child {
	margin-bottom: 0;
}

// ELPIS-216 — three semantic banner states. Claimed and already-registered
// surface as semantic-danger; renamed reads as a warning/heads-up using the
// pearl + violet accent pairing called out in the AC.
.character-finder-field__banner {
	border-radius: 4px;
	border: 1px solid transparent;
}

.character-finder-field__banner--claimed,
.character-finder-field__banner--already {
	background: rgba(199, 72, 79, 0.10);
	color: var(--ink-primary);
	border-color: var(--semantic-danger);
}

.character-finder-field__banner--claimed .q-icon,
.character-finder-field__banner--already .q-icon {
	color: var(--semantic-danger);
}

.character-finder-field__banner--renamed {
	background: var(--surface-pearl);
	color: var(--ink-primary);
	border-color: var(--rule-arcane);
	box-shadow: inset 4px 0 0 var(--rule-arcane);
}

.character-finder-field__banner--renamed .q-icon {
	color: var(--rule-arcane);
}

body.body--dark .character-finder-field__banner--claimed,
body.body--dark .character-finder-field__banner--already {
	background: rgba(199, 72, 79, 0.18);
	color: var(--ink-luminous);
	border-color: var(--semantic-danger);
}

body.body--dark .character-finder-field__banner--renamed {
	background: var(--surface-deep);
	color: var(--ink-luminous);
	border-color: var(--rule-arcane);
	box-shadow: inset 4px 0 0 var(--rule-arcane);
}
</style>
