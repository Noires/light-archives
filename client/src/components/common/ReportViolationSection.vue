<template>
	<section class="report-violation-section">
		<q-btn flat color="secondary" label="Link kopieren" @click="copyLink" />
		<template v-if="verified">
			<q-btn v-if="!reported" flat color="secondary" label="Seite melden" @click="reportPage" />
			<q-btn v-else disable flat color="secondary" label="Seite gemeldet" />
		</template>
	</section>
</template>

<script lang="ts">
import { PageType } from '@app/shared/enums/page-type.enum';
import { Options, prop, Vue } from 'vue-class-component';
import { copyToClipboard } from 'quasar';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Role, roleImplies } from '@app/shared/enums/role.enum';

class Props {
	pageType = prop<PageType>({
		required: true,
	});

	pageId = prop<number>({
		required: true,
	});
}

@Options({
	name: 'ReportViolationSection'
})
export default class ReportViolationSection extends Vue.with(Props) {
	reported = false;

	get verified() {
		return this.$store.getters.role && roleImplies(this.$store.getters.role, Role.USER);
	}

	async copyLink() {
		try {
			await copyToClipboard(window.location.href);
			notifySuccess('Seitenlink in Zwischenablage gespeichert.');
		} catch (e) {
			notifyError('Fehler beim Speichern des Seitenlinks in der Zwischenablage.');
		}
	}

	async reportPage() {
		const ReportViolationDialog = (await import('./ReportViolationDialog.vue')).default;

    this.$q.dialog({
			component: ReportViolationDialog,
			componentProps: {
				pageType: this.pageType,
				pageId: this.pageId,
			},
		}).onOk(() => {
			this.reported = true;
		});
	}
}
</script>

<style lang="scss">
.report-violation-section {
	margin-top: 8px;
	display: flex;
	justify-content: space-between;
}
</style>
