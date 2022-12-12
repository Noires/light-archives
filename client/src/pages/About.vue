<template>
  <q-page class="page-about">
		<h2>Über PROJEKTNAME</h2>
		<p>
			Chaos Archives is a roleplay portal for the Chaos (EU) roleplaying community in Final Fantasy XIV, heavily inspired by <a href="https://www.argentarchives.org">Argent Archives <q-icon class="external-link-icon" name="launch" /></a>, but built from scratch to cater to the needs of FFXIV roleplayers.
		</p>
    <h3>Team</h3>
    <p>
			Fancy Platzhalter für Queen, Veemi und wer noch dazugehören wird
		</p>
		<h3>Credits</h3>
		<dl>
			<dt><router-link to="/Shiva/J'yeth_Rihll">J'yeth Rihll</router-link> (Noires)</dt>
			<dd>Unser Dev-Superstar.</dd>
		</dl>
		<p>
			And thanks to everyone who has been testing and suggesting improvements to the Archives since their inception!
		</p>
		<section v-html="faq"></section>
		<h3>Nützliche Links</h3>
		<dl>
			<dt><a href="INVITE HIER" target="_blank">FFXIV Chaos Roleplaying Community <q-icon name="discord" /></a></dt>
			<dd>Unser Discordserver.</dd>
		</dl>
		<template v-if="statistics">
			<h3>Statistiken</h3>
			<h4>Charaktere nach Volk</h4>
			<q-markup-table class="striped-list">
				<thead>
					<th class="text-left">Volk</th>
					<th class="text-right">Anzahl</th>
				</thead>
				<tbody>
					<tr v-for="row in statistics.races" :key="row.race">
						<td>{{ $display.races[row.race] }}</td>
						<td class="text-right">{{ row.count }}</td>
					</tr>
				</tbody>
			</q-markup-table>
      <h4>Charaktere nach Welt</h4>
			<q-markup-table class="striped-list">
				<thead>
					<th class="text-left">Welt</th>
					<th class="text-right">Anzahl</th>
				</thead>
				<tbody>
					<tr v-for="row in statistics.servers" :key="row.name">
						<td>{{ row.name }}</td>
						<td class="text-right">{{ row.count }}</td>
					</tr>
				</tbody>
			</q-markup-table>
			<h4>Miqo'te Goldtatzen nach Stamm</h4>
			<q-markup-table class="striped-list">
				<thead>
					<th class="text-left">Stamm</th>
					<th class="text-right">Anzahl</th>
				</thead>
				<tbody>
					<tr v-for="row in statistics.seekerTribes" :key="row.name">
						<td>{{ row.name }}</td>
						<td class="text-right">{{ row.count }}</td>
					</tr>
				</tbody>
			</q-markup-table>
			<h4>Au Ra Xaela nach Stamm (DO IT)</h4>
			<q-markup-table class="striped-list">
				<thead>
					<th class="text-left">Stamm</th>
					<th class="text-right">Anzahl</th>
				</thead>
				<tbody>
					<tr v-for="row in statistics.servers" :key="row.name">
						<td>{{ row.name }}</td>
						<td class="text-right">{{ row.count }}</td>
					</tr>
				</tbody>
			</q-markup-table>
		</template>
	</q-page>
</template>

<script lang="ts">
import { StatisticsDto } from '@app/shared/dto/statistics/statistics.dto'
import { useApi } from 'src/boot/axios';
import { Options, Vue } from 'vue-class-component'
import faq from 'src/markdown/faq.md'

const $api = useApi();

async function load(): Promise<StatisticsDto> {
	return $api.statistics.getStatistics();
}

@Options({
	name: 'PageAbout',
	async beforeRouteEnter(_, __, next) {
		const statistics = await load();
		next(vm => (vm as PageAbout).setContent(statistics));
	},
})
export default class PageAbout extends Vue {
	readonly faq = faq;

	statistics: StatisticsDto | null = null;

	setContent(statistics: StatisticsDto) {
		this.statistics = statistics;
	}
}
</script>

<style lang="scss">
.page-about dd {
	margin-bottom: 0.8em;
}

.page-about th {
	background: #f0f0f0;
	font-family: $form-header-font;
}
</style>
