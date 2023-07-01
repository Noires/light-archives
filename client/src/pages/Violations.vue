<template>
    <q-page class="page-violations">
          <h2>Verstöße</h2>
          <violations-list :violations="violations" />
      </q-page>	
</template>

<script lang="ts">
import { ViolationSummaryDto } from '@app/shared/dto/violations/violation-summary.dto';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import ViolationsList from 'src/components/violations/ViolationsList.vue';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

@Options({
	name: 'PageVenues',
	components: {
		ViolationsList
	},
  async beforeRouteEnter(_, __, next) {
    try {
      const violations = await $api.violations.getViolations();
      next(vm => (vm as PageViolations).setContent(violations));
    } catch (e) {
      console.log(e);
      notifyError(e);
    }
  }
})
export default class PageViolations extends Vue {
	violations: ViolationSummaryDto[] = [];

	setContent(violations: ViolationSummaryDto[]) {
		this.violations = violations;
	}
}
</script>

<style lang="scss">

</style>