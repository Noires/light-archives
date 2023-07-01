<template>
    <div class="violations-list striped-list">
        <q-list v-if="violations.length" bordered>
        <q-item
            v-for="violation in violations"
            :key="`${violation.id}`"
            clickable
            v-ripple
            :to="getLink(violation)"
        >
            <q-item-section>
                <q-item-label>{{violation.id}}</q-item-label><q-item>{{violation.reason}}</q-item>
            </q-item-section>
        </q-item>
        </q-list>
        <p v-else>
        Es gibt noch keine Verstöße auf <strong>Elpisgarten</strong>.
        </p>
    </div>
</template>
  
<script lang="ts">
import { ViolationSummaryDto } from '@app/shared/dto/violations/violation-summary.dto';
import { prop, Options, Vue } from 'vue-class-component';

class Props {
    violations = prop<ViolationSummaryDto[]>({
        required: true
    });
}

@Options({
    name: 'ViolationsList',
})
export default class ViolationsList extends Vue.with(Props) {
    getLink(violation: ViolationSummaryDto) {
        return violation.id;
    }
}
</script>

<style lang="scss">

</style>
  