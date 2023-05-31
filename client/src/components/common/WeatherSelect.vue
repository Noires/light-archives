<template>
    <q-select
      label="Wetter"
      class="weather-select"
      :model-value="modelValue"
      :options="weatherOptions"
      emit-value
      map-options
      multiple
      v-bind="$attrs"
      @update:model-value="onUpdateModelValue"
    >
        <template v-slot:option="scope">
            <q-item class="weather-select__group" v-bind="scope.itemProps">
                <q-item-section>
                    <q-item-label v-html="scope.opt.label"></q-item-label>
                    <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                </q-item-section>
            </q-item>
        </template>
    </q-select>
</template>
  
<script lang="ts">
    import { notifyError } from 'src/common/notify';
    import { Options, prop, Vue } from 'vue-class-component';

    interface OptionInterface {
        label: string;
        value: number;
    }

    class Props {
        modelValue = prop<number>({
            default: null,
        });
    }

    let weatherOptions: (OptionInterface)[] = [];

    @Options({
        name: 'WeatherSelect',
        emits: ['update:model-value'],
    })
    export default class WeatherSelect extends Vue.with(Props) {
        readonly weatherOptions: (OptionInterface)[] = [];
        
        async created() {
            try {
                const weather= await this.$api.weather.getWeather();
                weatherOptions = [];
                weather.forEach(weather => {
                    weatherOptions.push({
                        label: weather.name,
                        value: weather.id
                    })
                })
            }
            catch (e) {
                notifyError(e);
            }
            this.weatherOptions.push(...weatherOptions);
        }

        onUpdateModelValue(val: number) {
            this.$emit('update:model-value', val);
        }
    }
</script>
  
<style lang="scss">
    .weather-select__group .q-item__label {
        padding-left: 0;
        font-weight: bold;
        color: black;
    }
</style>
  