<template>
    <q-page class="page-edit-weather">
        <template v-if="loaded">
            <h2>{{ weatherId ? 'Wetter bearbeiten' : 'Neues Wetter erstellen' }}</h2>
            <div class="weather-edit-select-container">
                <label class="label">Vorhandenes Wetter bearbeiten</label>
                <select v-model="weatherId" @change="onWeatherEditSelect()" class="select weather-edit-select" :key="selectKey">
                    <option v-for="weatherItem in weatherArray" :value="weatherItem.id" :key="weatherItem.id">{{weatherItem.name}}</option>
                </select>
                <q-btn v-if="weatherId" color="primary" class="reset-button" label="Zurücksetzen" @click="onCreateNewClick" />
                <q-btn v-if="weatherId" color="primary" class="delete-button" label="Wetter endgültig löschen" @click="onDeleteClick" />
            </div>
            <q-form ref="form" @submit="onSubmit">
                <section class="page-edit-weather__form-controls">
                    <q-input
                        v-model="weather.name"
                        label="Name *"
                        :rules="[
                            $rules.required('Dieses Feld ist erforderlich.'),
                        ]"
                    />
                    <q-input
                        v-model="weather.slug"
                        label="Slug *"
                        :rules="[
                            $rules.required('Dieses Feld ist erforderlich.'),
                        ]"
                    />
                    <q-input
                        v-model="weather.imageFileName"
                        label="Name der Bilddatei"
                    />
                    <weather-select
                        v-model="weather.followUps"
                        label="Folgewetter"
                        :key="selectKey"
                    />
                </section>
                <q-btn :label="'Wetter ' + (weatherId != null ? 'aktualisieren' : 'speichern')" type="submit" color="primary" />
                <q-inner-loading :showing="saving" />
            </q-form>
        </template>
    </q-page>
</template>

<script lang="ts">
    import { useApi } from 'src/boot/axios';
    import { WeatherEditDto } from '@app/shared/dto/weather/weather-edit.dto';
    import { WeatherDto } from '@app/shared/dto/weather/weather.dto';
    import { Options, Vue } from 'vue-class-component';
    import { notifyError, notifySuccess } from 'src/common/notify';
    import WeatherSelect from 'src/components/common/WeatherSelect.vue';


    const $api = useApi();

    async function loadWeather(): Promise<{weatherArray: WeatherDto[]}> {
        const weatherArray = await $api.weather.getWeather();
        return{weatherArray};
    }

    @Options({
        components: {
            WeatherSelect
        },
        async beforeRouteEnter(to, __, next) {
            const content = await loadWeather();
            next(vm => (vm as PageEditWeather).setContent(content));
        },
        async beforeRouteUpdate() {
            (this as PageEditWeather).setContent(await loadWeather());
        }
})
export default class PageEditWeather extends Vue {
    weatherId: number|null = null;
    weather = new WeatherEditDto();
    weatherArray: WeatherDto[];
    loaded = false;
    saving = false;
    selectKey = 0;

    setContent(content: { weatherArray: WeatherDto[] }) {
        this.weatherArray = content.weatherArray;
        this.loaded = true;
        this.weather = new WeatherEditDto();
    }
    async onSubmit() {
        this.saving = true;
        try {
            if (!this.weatherId) {
                await this.$api.weather.createWeather(this.weather);
                this.weather = new WeatherEditDto();
            }
            else {
                this.weather = await this.$api.weather.updateWeather(this.weatherId, this.weather);
            }
            let updatedContent = await loadWeather();
            this.weatherArray = updatedContent.weatherArray;
            this.selectKey = this.selectKey +1;
            notifySuccess('Wetter gespeichert.');
        }
        catch (e) {
            notifyError(e);
        }
        finally {
            this.saving = false;
        }
    }

    onWeatherEditSelect() {
        let weatherToEdit = this.weatherArray.find(weather => weather.id == this.weatherId);
        if (weatherToEdit) {
            this.weather.name = weatherToEdit.name;
            this.weather.slug = weatherToEdit.slug;
            this.weather.imageFileName = weatherToEdit.imageFileName;
            this.weather.followUps = weatherToEdit.followUps.map(item => item.id);
        }
    }

    onCreateNewClick() {
        this.weatherId = null;
        this.weather = new WeatherEditDto();
    }

    async onDeleteClick() {
        this.saving = true;
        try {
            if (this.weatherId) {
                await this.$api.weather.deleteWeather(this.weatherId);
                this.weatherId = null;
                this.weather = new WeatherEditDto();
                let updatedContent = await loadWeather();
                this.weatherArray = updatedContent.weatherArray;
                this.selectKey = this.selectKey +1;
            }
            
            notifySuccess('Wetter gelöscht');
        }
        catch (e) {
            notifyError(e);
        }
        finally {
            this.saving = false;
        }
    }
}
</script>
<style lang="scss">
    .weather-edit-select-container {
        margin-bottom: 2rem;
    }
    .q-field {
        padding-bottom: 20px;
    }
    .q-btn[type='submit'] {
        margin-top: 1rem;
    }
    .reset-button {
        margin-left: 1rem;
    }
    .weather-edit-select-container .q-btn + .q-btn {
        margin-left: 1rem;
    }
</style>