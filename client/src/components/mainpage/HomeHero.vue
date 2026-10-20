<template>
	<section class="home-hero" aria-label="Willkommen im Elpisgarten">
		<p class="home-hero__tagline">
			Deutschsprachiges Rollenspiel auf dem Datacenter Light – Charaktere, Treffpunkte und Geschichten an einem Ort.
		</p>

		<ul v-if="items.length" class="home-hero__today" aria-label="Heute auf Light">
			<li
				v-for="item in items"
				:key="item.key"
				class="home-hero__stat"
				:class="{ 'home-hero__stat--live': item.live, 'home-hero__stat--quiet': item.quiet }"
			>
				<span v-if="item.live" class="home-hero__dot" aria-hidden="true" />
				<strong class="home-hero__stat-value">{{ item.value }}</strong>
				<span class="home-hero__stat-label">{{ item.label }}</span>
			</li>
		</ul>

		<div class="home-hero__ctas">
			<q-btn
				class="elpis-btn elpis-btn--primary"
				unelevated
				no-caps
				icon="add"
				label="Event eintragen"
				to="/create-event"
			/>
		</div>

		<div v-if="!loggedIn" class="home-hero__intro">
			<p class="home-hero__intro-text">
				Stelle deine Charaktere vor, bewirb Events und Geschichten oder schau nach, wo gerade RP stattfindet.
				<span class="home-hero__intro-notice">
					Hinweis: Die Seite kann Spoiler zur Geschichte von Final Fantasy XIV enthalten.
				</span>
			</p>
			<button class="home-hero__discord" type="button" @click="$emit('login')">
				<svg
					class="home-hero__discord-logo"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 -28.5 256 256"
					preserveAspectRatio="xMidYMid"
					aria-hidden="true"
					focusable="false"
				>
					<path
						d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
						fill="#FFFFFF"
						fill-rule="nonzero"
					/>
				</svg>
				<span>Login mit Discord</span>
			</button>
		</div>

		<div v-else class="home-hero__welcome">
			<q-avatar round size="32px" class="home-hero__welcome-avatar">
				<img v-if="avatar" :src="avatar" alt="" />
				<span v-else aria-hidden="true">{{ welcomeInitial }}</span>
			</q-avatar>
			<span>Willkommen zurück, <strong>{{ welcomeName }}</strong></span>
		</div>
	</section>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import type { HomeTodayStats } from './home-data';

// ER2-301 — home hero: tagline, "Heute-Leiste" (live, tonight, venues open,
// characters in RP; a stat is hidden while its data is unavailable), CTAs and
// the compact intro + Discord login for visitors. The big logo stays in
// layouts/shell/ShellHero.vue above this block.

interface StatItem {
	key: string;
	value: string;
	label: string;
	live: boolean;
	quiet: boolean;
}

class Props {
	stats = prop<HomeTodayStats>({ required: true });
	loggedIn = prop<boolean>({ type: Boolean, default: false });
	welcomeName = prop<string>({ default: 'Abenteurer' });
	avatar = prop<string>({ default: '' });
}

@Options({
	name: 'HomeHero',
	emits: [ 'login' ],
})
export default class HomeHero extends Vue.with(Props) {
	get welcomeInitial(): string {
		return (this.welcomeName || 'A').charAt(0).toUpperCase();
	}

	get items(): StatItem[] {
		const { live, tonight, venuesOpen, inRp, inRpCapped } = this.stats;
		const items: StatItem[] = [];
		if (live !== null) {
			items.push({ key: 'live', value: String(live), label: 'live', live: live > 0, quiet: live === 0 });
		}
		if (tonight !== null) {
			items.push({ key: 'tonight', value: String(tonight), label: 'heute Abend', live: false, quiet: tonight === 0 });
		}
		if (venuesOpen !== null) {
			items.push({
				key: 'venues',
				value: String(venuesOpen),
				label: venuesOpen === 1 ? 'Treffpunkt geöffnet' : 'Treffpunkte geöffnet',
				live: false,
				quiet: venuesOpen === 0,
			});
		}
		if (inRp !== null) {
			items.push({
				key: 'rp',
				value: inRpCapped ? `${inRp}+` : String(inRp),
				label: inRp === 1 ? 'Charakter im RP' : 'Charaktere im RP',
				live: false,
				quiet: inRp === 0,
			});
		}
		return items;
	}
}
</script>

<style lang="scss" scoped>
.home-hero {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20px;
	padding: 8px 0 40px;
	text-align: center;
	color: var(--ink-primary);
}

.home-hero__tagline {
	max-width: 640px;
	margin: 0;
	font-family: var(--font-section);
	font-size: 20px;
	line-height: 1.5;
	color: var(--ink-primary);
}

// Glass pill. The blur only matters over the hero art; --surface-glass alone
// keeps AA where backdrop-filter is unsupported.
.home-hero__today {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	margin: 0;
	padding: 6px;
	list-style: none;
	background-color: var(--surface-glass);
	border: 1px solid var(--rule-soft);
	border-radius: 999px;
	box-shadow: 0 6px 20px var(--rule-tint);
	-webkit-backdrop-filter: blur(12px) saturate(1.05);
	backdrop-filter: blur(12px) saturate(1.05);
}

.home-hero__stat {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 14px;
	font-family: var(--font-ui);
	font-size: 14px;
	line-height: 20px;
	color: var(--ink-muted);

	& + & {
		border-left: 1px solid var(--rule-soft);
	}
}

.home-hero__stat-value {
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	color: var(--ink-primary);
}

.home-hero__stat--live .home-hero__stat-value,
.home-hero__stat--live .home-hero__stat-label {
	color: var(--vision-live-text);
	font-weight: 700;
}

.home-hero__stat--quiet .home-hero__stat-value {
	color: var(--ink-muted);
}

.home-hero__dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background-color: var(--vision-live);
	box-shadow: 0 0 0 3px var(--vision-live-bg);
}

.home-hero__ctas {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 12px;

	.q-btn {
		min-height: 44px;
		padding: 0 18px;
	}
}

.home-hero__intro {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 12px 20px;
	max-width: 760px;
	padding: 12px 16px;
	background-color: var(--vision-card);
	border: 1px solid var(--rule-soft);
	border-radius: 14px;
	text-align: left;
}

.home-hero__intro-text {
	flex: 1 1 320px;
	margin: 0;
	font-family: var(--font-ui);
	font-size: 14px;
	line-height: 20px;
	color: var(--ink-primary);
}

.home-hero__intro-notice {
	display: block;
	margin-top: 4px;
	font-size: 13px;
	color: var(--ink-muted);
}

// Discord's own button, unchanged from the previous home intro.
.home-hero__discord {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	padding: 10px 18px;
	min-height: 44px;
	border-radius: 8px;
	border: none;
	background: #5865f2;
	color: #ffffff;
	font-family: var(--font-ui);
	font-weight: 600;
	font-size: 0.95rem;
	letter-spacing: 0.01em;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	cursor: pointer;
	transition:
		background var(--motion-fast) var(--ease-elpis),
		box-shadow var(--motion-fast) var(--ease-elpis);

	&:hover {
		background: #4752c4;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.24);
	}

	&:active {
		background: #3c45a5;
	}

	&:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 2px var(--glow-aether),
			0 0 0 3px var(--vision-focus-edge);
	}
}

.home-hero__discord-logo {
	display: block;
	width: 22px;
	height: 22px;
}

.home-hero__welcome {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	font-family: var(--font-ui);
	font-size: 14px;
	color: var(--ink-muted);

	strong {
		color: var(--ink-primary);
	}
}

.home-hero__welcome-avatar {
	background-color: var(--rule-tint);
	color: var(--ink-primary);
	font-weight: 700;
}

@media (max-width: 599px) {
	.home-hero {
		padding-bottom: 28px;
	}

	.home-hero__tagline {
		font-size: 18px;
	}

	.home-hero__today {
		border-radius: 16px;
	}

	.home-hero__stat {
		padding: 4px 10px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.home-hero__discord {
		transition: none;
	}
}
</style>
