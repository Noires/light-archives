<template>
	<template v-if="issues.length">
		<!-- Desktop fixed sidebar (≥ 1024 px). Aetherglass column, icon-only with q-tooltips. -->
		<nav class="user-navigation user-navigation--desktop mat-aetherglass">
			<div class="user-navigation__label">
				<q-icon v-if="!$store.getters.characterId" name="account_circle" size="32px">
					<q-tooltip class="user-navigation__tooltip" anchor="center right" self="center left" :offset="[12, 0]">
						Nicht eingeloggt
					</q-tooltip>
				</q-icon>
				<q-avatar v-else-if="$store.getters.character" round size="32px" class="user-navigation__avatar">
					<img :src="$store.getters.character.avatar" />
					<q-tooltip class="user-navigation__tooltip" anchor="center right" self="center left" :offset="[12, 0]">
						{{ $store.getters.character.name }}
					</q-tooltip>
				</q-avatar>
			</div>
			<q-list flat class="user-navigation__list">
				<template v-if="!$store.getters.characterId">
					<q-item clickable v-ripple to="/login" class="user-navigation__item">
						<q-icon name="login" size="28px" />
						<q-tooltip class="user-navigation__tooltip" anchor="center right" self="center left" :offset="[12, 0]">
							Einloggen
						</q-tooltip>
					</q-item>
				</template>
				<template v-else>
					<q-item clickable v-ripple @click="switchCharacter" class="user-navigation__item">
						<q-icon name="switch_account" size="28px" />
						<q-tooltip class="user-navigation__tooltip" anchor="center right" self="center left" :offset="[12, 0]">
							Charakter wechseln
						</q-tooltip>
					</q-item>
					<template v-if="$store.getters.character?.verified">
						<q-item clickable v-ripple to="/create-article" class="user-navigation__item">
							<q-icon name="add" size="28px" />
							<q-tooltip class="user-navigation__tooltip" anchor="center right" self="center left" :offset="[12, 0]">
								Neuen Artikel einreichen
							</q-tooltip>
						</q-item>
						<q-item clickable v-ripple to="/my-articles" class="user-navigation__item">
							<q-icon name="list_alt" size="28px" />
							<q-tooltip class="user-navigation__tooltip" anchor="center right" self="center left" :offset="[12, 0]">
								Meine Artikel
							</q-tooltip>
						</q-item>
						<q-item v-if="$store.getters.character?.newsRole === NewsRole.EDITOR" clickable v-ripple to="/submitted" class="user-navigation__item">
							<q-icon name="checklist" size="28px" />
							<q-tooltip class="user-navigation__tooltip" anchor="center right" self="center left" :offset="[12, 0]">
								Eingereichte Artikel
							</q-tooltip>
						</q-item>
					</template>
					<q-item clickable v-ripple @click="logOut" class="user-navigation__item">
						<q-icon name="logout" size="28px" />
						<q-tooltip class="user-navigation__tooltip" anchor="center right" self="center left" :offset="[12, 0]">
							Ausloggen
						</q-tooltip>
					</q-item>
				</template>
			</q-list>
		</nav>

		<!-- Mobile fallback (< 1024 px). Single floating dropdown button hosting the same actions. -->
		<div class="user-navigation user-navigation--mobile">
			<q-btn round flat class="user-navigation__mobile-trigger mat-aetherglass" aria-label="Benutzermenü">
				<q-avatar v-if="$store.getters.character" round size="32px">
					<img :src="$store.getters.character.avatar" />
				</q-avatar>
				<q-icon v-else name="account_circle" size="28px" />
				<q-menu fit anchor="bottom right" self="top right" :offset="[0, 8]" class="user-navigation__mobile-menu">
					<q-list class="user-navigation__mobile-list">
						<template v-if="!$store.getters.characterId">
							<q-item clickable v-close-popup to="/login">
								<q-item-section avatar><q-icon name="login" /></q-item-section>
								<q-item-section>Einloggen</q-item-section>
							</q-item>
						</template>
						<template v-else>
							<q-item clickable v-close-popup @click="switchCharacter">
								<q-item-section avatar><q-icon name="switch_account" /></q-item-section>
								<q-item-section>Charakter wechseln</q-item-section>
							</q-item>
							<template v-if="$store.getters.character?.verified">
								<q-item clickable v-close-popup to="/create-article">
									<q-item-section avatar><q-icon name="add" /></q-item-section>
									<q-item-section>Neuen Artikel einreichen</q-item-section>
								</q-item>
								<q-item clickable v-close-popup to="/my-articles">
									<q-item-section avatar><q-icon name="list_alt" /></q-item-section>
									<q-item-section>Meine Artikel</q-item-section>
								</q-item>
								<q-item v-if="$store.getters.character?.newsRole === NewsRole.EDITOR" clickable v-close-popup to="/submitted">
									<q-item-section avatar><q-icon name="checklist" /></q-item-section>
									<q-item-section>Eingereichte Artikel</q-item-section>
								</q-item>
							</template>
							<q-item clickable v-close-popup @click="logOut">
								<q-item-section avatar><q-icon name="logout" /></q-item-section>
								<q-item-section>Ausloggen</q-item-section>
							</q-item>
						</template>
					</q-list>
				</q-menu>
			</q-btn>
		</div>
	</template>
</template>

<script lang="ts">
import { SessionCharacterDto } from '@app/shared/dto/user/session-character.dto';
import { NewsRole } from '@app/shared/enums/news-role.enum';
import { notifySuccess } from 'src/common/notify';
import { Vue } from 'vue-class-component';

export default class UserNavigation extends Vue {
	readonly NewsRole = NewsRole;

	issues: number[] = [];

	async created() {
		this.issues = await this.$api.news.getIssues();
	}

  async switchCharacter() {
    const SwitchCharacterDialog = (await import('./SwitchCharacterDialog.vue')).default;

    this.$q.dialog({
      component: SwitchCharacterDialog
    }).onOk((character: SessionCharacterDto) => {
      if (character.verified) {
        void this.$router.push('/');
      } else {
        void this.$router.push('/verify');
      }
    });
  }

	logOut() {
    this.$store.commit('setUser', null);
    this.$api.setAccessToken(null);
    notifySuccess('You have been logged out.');
    void this.$router.push('/');
  }
}
</script>

<style lang="scss">
// Desktop column — fixed against the left margin, only at ≥ 1024 px.
.user-navigation--desktop {
	display: none;
}

@media screen and (min-width: 1024px) {
	.user-navigation--desktop {
		display: flex;
		flex-direction: column;
		position: fixed;
		left: 20px;
		top: 24px;
		padding: 12px 8px;
		gap: 6px;
		z-index: 10;
	}
}

.user-navigation__label {
	display: flex;
	justify-content: center;
	margin-bottom: 6px;
	color: var(--surface-ink);
}

.user-navigation__avatar {
	box-shadow:
		inset 0 0 0 1px var(--rule-gold),
		0 0 0 2px var(--rule-gold-soft),
		0 4px 10px rgba(43, 36, 24, 0.18);
}

.user-navigation__list {
	background: transparent;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.user-navigation__item.q-item {
	min-height: 0;
	padding: 8px;
	border-radius: 6px;
	color: var(--surface-ink);
	transition:
		background-color var(--motion-fast) var(--ease-elpis),
		color var(--motion-fast) var(--ease-elpis);
}

.user-navigation__item.q-item:hover,
.user-navigation__item.q-item:focus-visible {
	background-color: rgba(186, 155, 91, 0.14);
	color: var(--rule-gold);
}

.user-navigation__item.q-router-link--active,
.user-navigation__item.q-router-link-exact-active {
	background-color: rgba(186, 155, 91, 0.22);
	color: var(--rule-gold);
	box-shadow: inset 0 0 0 1px var(--rule-gold-soft);
}

.user-navigation__tooltip {
	font-family: var(--font-ui);
	font-size: var(--type-scale-0);
	letter-spacing: var(--ls-eyebrow);
	text-transform: uppercase;
	background-color: var(--surface-ink);
	color: var(--surface-pearl);
	padding: 6px 10px;
	border-radius: 4px;
	box-shadow: 0 4px 12px rgba(43, 36, 24, 0.24);
}

// Mobile floating trigger — appears below 1024 px, hides at desktop sizes.
.user-navigation--mobile {
	display: flex;
	position: fixed;
	top: 12px;
	right: 12px;
	z-index: 1000;
}

@media screen and (min-width: 1024px) {
	.user-navigation--mobile {
		display: none;
	}
}

.user-navigation__mobile-trigger.q-btn {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	color: var(--surface-ink);
	box-shadow:
		inset 0 0 0 1px var(--rule-gold-soft),
		inset 0 1px 0 rgba(255, 255, 255, 0.55),
		0 6px 16px rgba(43, 36, 24, 0.16);
}

.user-navigation__mobile-menu {
	font-family: var(--font-ui);
	font-size: var(--type-scale-1);
}

.user-navigation__mobile-list .q-item {
	color: var(--surface-ink);
	min-width: 220px;
}

.user-navigation__mobile-list .q-item:hover {
	background-color: rgba(186, 155, 91, 0.12);
}

// Zodiark variants — both desktop column and mobile dropdown.
body.body--dark {
	.user-navigation__label {
		color: var(--ink-luminous);
	}

	.user-navigation__avatar {
		box-shadow:
			inset 0 0 0 1px var(--rule-arcane),
			0 0 0 2px var(--rule-arcane-soft),
			0 4px 10px rgba(0, 0, 0, 0.55);
	}

	.user-navigation__item.q-item {
		color: var(--ink-luminous);
	}

	.user-navigation__item.q-item:hover,
	.user-navigation__item.q-item:focus-visible {
		background-color: rgba(193, 155, 255, 0.16);
		color: var(--glow-aether-d);
	}

	.user-navigation__item.q-router-link--active,
	.user-navigation__item.q-router-link-exact-active {
		background-color: rgba(193, 155, 255, 0.22);
		color: var(--glow-aether-d);
		box-shadow: inset 0 0 0 1px var(--rule-arcane-soft);
	}

	.user-navigation__tooltip {
		background-color: var(--surface-deep);
		color: var(--ink-luminous);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
	}

	.user-navigation__mobile-trigger.q-btn {
		color: var(--ink-luminous);
		box-shadow:
			inset 0 0 0 1px var(--rule-arcane-soft),
			inset 0 1px 0 rgba(184, 165, 255, 0.18),
			0 6px 16px rgba(0, 0, 0, 0.55);
	}

	.user-navigation__mobile-list .q-item {
		color: var(--ink-luminous);
	}

	.user-navigation__mobile-list .q-item:hover {
		background-color: rgba(193, 155, 255, 0.16);
	}
}
</style>
