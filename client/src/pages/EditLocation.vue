<template>
    <q-page class="page-edit-weather">
        <template v-if="loaded">
            <h2>{{ locationId ? 'Ort bearbeiten' : 'Neuen Ort erstellen' }}</h2>
            <div class="location-edit-select-container">
                <label class="label">Vorhandenen Ort bearbeiten</label>
                <select v-model="locationId" @change="onLocationEditSelect()" class="select location-edit-select" :key="selectKey">
                    <option v-for="locationItem in locationArray" :value="locationItem.id" :key="locationItem.id">{{locationItem.name}}</option>
                </select>
                <q-btn v-if="locationId" color="primary" class="reset-button" label="Zurücksetzen"  @click="onCreateNewClick" />
                <q-btn v-if="locationId" color="primary" class="delete-button" label="Ort endgültig löschen"  @click="onDeleteClick" />
            </div>
            <div class="location-weather-configuration">
                <div>Summe aller Wetterwahrscheinlichkeiten: {{ probabilitySum }}</div>
                <div v-if="probabilitySum < 100">Die Summe der Wahrscheinlichkeiten sollte bei 100 liegen.</div>
                <q-btn v-if="probabilitySum < 100" color="primary" label="Neues Wetter für Ort hinzufügen"  @click="onCreateNewLocationWeatherClick" />
                <div v-else-if="probabilitySum > 100">Die Summe der Wahrscheinlichkeiten sollte 100 nicht überschreiten.</div>
                <div class="location-weather-item-container">
                    <div v-for="(locationWeatherItem, index) in locationWeatherArray" :key="index" class="location-weather-item">
                        <div class="item-header">
                            <select class="select" v-model="locationWeatherItem.weather">
                                <option v-for="weather in weatherArray" :value="weather.id" :key="weather.id">{{ weather.name }}</option>
                            </select>
                        </div>
                        <div class="item-info-container">
                            <div class="item-info">
                                <label>Tier</label>
                                <select class="select" v-model.number="locationWeatherItem.tier">
                                    <option value="1" key="1">1</option>
                                    <option value="2" key="2">2</option>
                                </select>
                            </div>
                            <div class="item-info">
                                <q-input
                                    v-model.number="locationWeatherItem.probability"
                                    type="number"
                                    step="1"
                                    min="1"
                                    max="100"
                                    label="Wahrscheinlichkeit in % *"
                                    :rules="[
                                        $rules.required('Dieses Feld ist erforderlich.'),
                                        val => (val >= 1 && val <= 100) || 'Wähle eine Zahl zwischen 1 - 100',
                                        val => (val % 1 == 0) || 'Die Zahl muss eine Ganzzahl sein'
                                    ]"
                                    @keyup="setProbability"
                                    @change="setProbability"
                                />
                            </div>
                            <div class="item-info">
                                <q-btn color="primary" class="delete-button" label="Entfernen"  @click="onDeleteLocationWeatherClick(locationWeatherItem)" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <q-form ref="form" @submit="onSubmit">
                <section class="page-edit-weather__form-controls">
                    <q-input
                        v-model="location.name"
                        label="Name *"
                        :rules="[
                            $rules.required('Dieses Feld ist erforderlich.'),
                        ]"
                    />
                    <q-input
                        v-model="location.slug"
                        label="Slug *"
                        :rules="[
                            $rules.required('Dieses Feld ist erforderlich.'),
                        ]"
                    />
                    <q-input
                        v-model="location.imageFileName"
                        label="Name der Bilddatei"
                    />
                    <!-- <weather-select
                        v-model="weather.followUps"
                        label="Folgewetter"
                        :key="selectKey"
                    /> -->
                </section>
                <q-btn :label="'Ort ' + (locationId != null ? 'aktualisieren' : 'speichern')" type="submit" color="primary" />
                <q-inner-loading :showing="saving" />
            </q-form>
        </template>
    </q-page>
</template>

<script lang="ts">
    import { useApi } from 'src/boot/axios';
    import { LocationEditDto } from '@app/shared/dto/locations/location-edit.dto';
    import { LocationDto } from '@app/shared/dto/locations/location.dto';
    import { LocationWeatherEditDto } from '@app/shared/dto/locations/location_weather-edit.dto';
    import { LocationWeatherDto } from '@app/shared/dto/locations/location_weather.dto';
    import { WeatherDto } from '@app/shared/dto/weather/weather.dto';
    import { Options, Vue } from 'vue-class-component';
    import { notifyError, notifySuccess } from 'src/common/notify';
    import WeatherSelect from 'src/components/common/WeatherSelect.vue';


    const $api = useApi();

    async function load(): Promise<{weatherArray: WeatherDto[], locationArray: LocationDto[]}> {
        const weatherArray = await $api.weather.getWeather();
        const locationArray = await loadLocations();
        return{weatherArray: weatherArray, locationArray: locationArray};
    }

    async function loadLocations(): Promise<LocationDto[]> {
        return await $api.locations.getLocations();
    }

    @Options({
        components: {
            WeatherSelect
        },
        async beforeRouteEnter(to, __, next) {
            const content = await load();
            next(vm => (vm as PageEditLocation).setContent(content));
        },
        async beforeRouteUpdate() {
            (this as PageEditLocation).setContent(await load());
        }
})
export default class PageEditLocation extends Vue {
    locationId: number|null = null;
    location = new LocationEditDto();
    weatherArray: WeatherDto[];
    locationArray: LocationDto[];
    locationWeatherArray: LocationWeatherEditDto[] = [];
    probabilitySum = 0;
    loaded = false;
    saving = false;
    selectKey = 0;

    setContent(content: { weatherArray: WeatherDto[], locationArray: LocationDto[] }) {
        this.weatherArray = content.weatherArray;
        this.locationArray = content.locationArray
        this.loaded = true;
        this.location = new LocationEditDto();
    }
    async onSubmit() {
        this.saving = true;
        try {
            this.location.locationWeather = this.locationWeatherArray;
            
            if (!this.locationId) {
                await this.$api.locations.createLocation(this.location);
                this.locationWeatherArray = [];
                this.location = new LocationEditDto();
            }
            else {
                this.location = await this.$api.locations.updateLocation(this.locationId, this.location);
                this.locationWeatherArray = this.location.locationWeather || [];
            }
            this.locationArray = await loadLocations();
            this.selectKey = this.selectKey +1;
            this.setProbability();
            notifySuccess('Ort gespeichert.');
        }
        catch (e) {
            notifyError(e);
        }
        finally {
            this.saving = false;
        }
    }

    onLocationEditSelect() {
        let locationToEdit = this.locationArray.find(weather => weather.id == this.locationId);
        if (locationToEdit) {
            this.location.name = locationToEdit.name;
            this.location.slug = locationToEdit.slug;
            this.location.imageFileName = locationToEdit.imageFileName;
            this.location.locationWeather = this.convertToLocationWeatherEditDto(locationToEdit.locationWeather);
            this.locationWeatherArray = this.convertToLocationWeatherEditDto(locationToEdit.locationWeather);
            this.setProbability();
        }
    }

    onCreateNewClick() {
        this.locationId = null;
        this.location = new LocationEditDto();
        this.locationWeatherArray = [];
        this.setProbability();
    }

    async onDeleteClick() {
        this.saving = true;
        try {
            if (this.locationId) {
                await this.$api.locations.deleteLocation(this.locationId);
                this.locationId = null;
                this.location = new LocationEditDto();
                this.locationArray = await loadLocations();
                this.selectKey = this.selectKey +1;
                this.locationWeatherArray = [];
                this.setProbability();
            }
            
            notifySuccess('Ort gelöscht');
        }
        catch (e) {
            notifyError(e);
        }
        finally {
            this.saving = false;
        }
    }

    onCreateNewLocationWeatherClick() {
        let locationWeather = new LocationWeatherEditDto();
        locationWeather.weather = this.weatherArray[0].id;
        locationWeather.tier = 1;
        locationWeather.probability = 1;
        this.locationWeatherArray.push(locationWeather);
        this.setProbability();
    }

    onDeleteLocationWeatherClick(locationWeatherItem: LocationWeatherEditDto) {
        let selectedIndex = this.locationWeatherArray.indexOf(locationWeatherItem);
        this.locationWeatherArray = this.locationWeatherArray.filter((item, index) => index != selectedIndex);
        this.setProbability();
    }

    convertToLocationWeatherEditDto(locationWeatherDto: LocationWeatherDto[]) {
        let result: LocationWeatherEditDto[] = [];
        let locationId = this.locationArray.find(item => item.slug == this.location.slug)?.id;

        locationWeatherDto.forEach(item => {
            if (locationId == undefined) {
                return;
            }
            result.push({
                id : item.id,
                tier : item.tier,
                weather : item.weather.id,
                location : locationId,
                probability : item.probability
            });
        });

        return result;
    }

    setProbability() {
        let sum = 0;
        this.locationWeatherArray.forEach(item => sum = Number(sum) + Number(item.probability));
        this.probabilitySum = sum;
    }
}
</script>
<style lang="scss">
    .location-edit-select-container {
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
    .location-edit-select-container .q-btn + .q-btn {
        margin-left: 1rem;
    }
</style>