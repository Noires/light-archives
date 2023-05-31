<template>
    <q-page>
        <div class="weather-title-container">
          <div class="location-image">
            <img :src="titleImageUrl" />
          </div>
          <h2 class="title">Wettervorhersage</h2>
        </div>
        
        <select v-model="selectedLocationId" @change="onLocationSelect()" class="weather-location-select">
          <option disabled value="">Ort / Region auswählen</option>
          <option v-for="location in locations" :value="location.id" :key="location.id">{{location.name}}</option>
        </select>
        <div v-if="selectedLocationId">
          <div class="weather-container">
            <div class="weather-header">
              <div class="weather-header-image"></div>
            </div>
            <div class="weather-list">
              <div v-for="(n, index) in currentMonthFirstDay" :key="index" class="weather weather-empty"></div>
              <div v-for="(weather, index,) in currentMonthWeather" :key="index" :class="(index +1 == currentDate.getDate())?'weather is-current':'weather'">
                <div class="weather-date">{{ index + 1 }}</div>
                <div class="weather-info">
                  <div class="weather-image">
                    <img :src="`../assets/weather/${weather.imageFileName}`" />
                  </div>
                  <div class="weather-name">{{ weather.name }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="weather-container">
            <div class="weather-header">
              <div class="weather-header-image"></div>
            </div>
            <div class="weather-list">
              <div v-for="(n, index) in nextMonthFirstDay" :key="index" class="weather weather-empty"></div>
              <div v-for="(weather, index,) in nextMonthWeather" :key="index" class="weather">
                <div class="weather-date">{{ index + 1 }}</div>
                <div class="weather-info">
                  <div class="weather-image">
                    <img :src="`../assets/weather/${weather.imageFileName}`" />
                  </div>
                  <div class="weather-name">{{ weather.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </q-page>	
</template>
  
<script lang="ts">
  import { LocationDto } from '@app/shared/dto/locations/location.dto';
  import { WeatherDto } from '@app/shared/dto/weather/weather.dto';
  import { LocationWeatherDto } from '@app/shared/dto/locations/location_weather.dto';
  import { useApi } from 'src/boot/axios';
  import { cyrb128, sfc32 } from 'src/common/seeded-randomizer';
  import { Options, Vue } from 'vue-class-component';

  const $api = useApi();

  async function loadLocations(): Promise<LocationDto[]> {
    const locations = await $api.locations.getLocations();
    return locations;
  }

  async function loadWeather(): Promise<WeatherDto[]> {
    const weather = await $api.weather.getWeather();
    return weather;
  }

  function getDayAmount(date:Date) {
    return new Date(date.getFullYear(), date.getMonth() +1, 0).getDate();
  }

  function makeWeatherArray(weather:WeatherDto[]) {
    let result:number[] = [];
    
    weather.forEach(weather => {
      for (let i = 0; i < weather.probability; i++) {
        result.push(weather.id)
      };
    });

    return result;
  }

  function weatherIsDirectFollowUp(weather: WeatherDto, nextWeather: WeatherDto) {
    let isLowTier = (weather.tier == 1 || weather.tier == 2) && (nextWeather.tier == 1 || nextWeather.tier == 2);

    return weather.followUps.some(followUp => followUp.id == nextWeather.id) || weather.id == nextWeather.id || isLowTier;
  }

  function buildWeatherSequence(regionWeather: WeatherDto[], currentWeather: WeatherDto, nextWeather: WeatherDto) {
    let result: number[] = [];
    let currentFollowUps = currentWeather.followUps.map(followUp => followUp);
    let nextFollowUps = nextWeather.followUps.map(followUp => followUp);
    let tierTwoRegionWeather = regionWeather.filter(weather => weather.tier == 2);

    // If weather is tier 2, add all tier 2 weather from entire region to followUps
    if (currentWeather.tier == 2) {
      currentFollowUps = currentFollowUps.concat(tierTwoRegionWeather);
    }
    else if (nextWeather.tier == 2) {
      nextFollowUps = nextFollowUps.concat(tierTwoRegionWeather);
    }
    
    let intermediateFollowUp = currentFollowUps
      .find(curFollowUp => nextFollowUps.some(selFollowUp => selFollowUp.id == curFollowUp.id)
    );
    
    if (intermediateFollowUp) {
      result.push(intermediateFollowUp.id);
      result.push(nextWeather.id);
    }
    else {
      // If more than one intermediate FollowUp is required, logic goes here
      // This can currently only happen, if two tier 3 weathers are not followUps from each other, or have no intermediate tier 2
      let currentTierTwoFollowUp = currentFollowUps.find(followUp => followUp.tier == 2) || {id:111};
      let nextTierTwoFollowUp = nextFollowUps.find(followUp => followUp.tier == 2) || {id:111};
      result.push(currentTierTwoFollowUp.id);
      result.push(nextTierTwoFollowUp.id);
      result.push(nextWeather.id);
    }
    
    return result;
  }

  function calculateWeather(weatherArray:WeatherDto[], availableWeather:LocationWeatherDto[], random:() => number, dayAmount = 30) {
    const regionWeather = availableWeather.map(locationWeather => {
      let weather = weatherArray.find(weather => locationWeather.weather.id == weather.id);
      if (weather) {
        weather.tier = locationWeather.tier;
        weather.probability = locationWeather.probability;
        weather.followUps.forEach(followUp => 
          followUp.tier = availableWeather.find(locationWeather => locationWeather.weather.id == followUp.id)?.tier || 500
        )
      }
      return weather;
    });
    const regionFillerWeather = regionWeather.filter(weather => weather?.tier == 1 || weather?.tier == 2);
    let result : number[] = [];
    let currentWeather = null;
    let nextWeather = null;
    let selectedPercentage = 0;
    let weatherIndex = 0;
    let weatherId = 1;
    let weatherProbabilityArray = makeWeatherArray(regionWeather as WeatherDto[]);
    let testArray = [];
    
    for (let i = 0; i < dayAmount; i++) {
      selectedPercentage = parseInt((random() * 100).toFixed(0));
      selectedPercentage = selectedPercentage < 1 ? 1 : selectedPercentage;
      testArray.push(selectedPercentage);
      // first day
      if (i == 0) {
        weatherIndex = Math.ceil(selectedPercentage * regionFillerWeather.length / 100) -1;
        weatherId = regionFillerWeather[weatherIndex]?.id || 100;
        currentWeather = regionFillerWeather.find(weather => weather?.id == weatherId);
        result.push(weatherId);
      }
      // last day
      else if (i == dayAmount -1) { // THIS IS STILL WRONG. There is a chance, this does not connect to last day's weather.
        weatherIndex = Math.ceil(selectedPercentage * regionFillerWeather.length / 100) -1;
        weatherId = regionFillerWeather[weatherIndex]?.id || 1;
        currentWeather = regionFillerWeather.find(weather => weather?.id == weatherId);
        result.push(weatherId);
      }
      // days in between
      else {
        weatherIndex = Math.ceil(selectedPercentage * weatherProbabilityArray.length / 100) -1;
        weatherId = weatherProbabilityArray[weatherIndex];
        nextWeather = regionWeather.find(weather => weather?.id == weatherId);

        // If weather is the same, a followUp or both are inside tier 1 or 2
        if (currentWeather && nextWeather && weatherIsDirectFollowUp(currentWeather, nextWeather)) {
          result.push(weatherId);
        }
        else {
          let weatherSequence = buildWeatherSequence(regionWeather as WeatherDto[], currentWeather as WeatherDto, nextWeather as WeatherDto);
          weatherSequence.forEach(id => {
            result.push(id);
            i++;
          })
          i--; // because index increases by one on its own
        }
        
        currentWeather = nextWeather;
      }
    }

    return result;
  }

  @Options({
    async beforeRouteEnter(to, __, next) {
      const locations = await loadLocations();
      const weather = await loadWeather();
		  next(vm => (vm as PageLocations).setContent(locations, weather));
    },
  })
  export default class PageLocations extends Vue {
    selectedLocationId = '';
    locations: LocationDto[] = [];
    weather: WeatherDto[] = [];
    currentMonthWeather: WeatherDto[] = [];
    nextMonthWeather: WeatherDto[] = [];
    calculatedWeather: WeatherDto[] = [];
    currentDate = new Date();
    currentMonthFirstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth()).getDay();
    nextMonthFirstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() +1).getDay();
    seed = cyrb128(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth()).getTime().toString());
    rand = sfc32(this.seed[0], this.seed[1], this.seed[2], this.seed[3]);
    availableWeather: LocationWeatherDto[] = [];
    titleImageUrl = '../assets/locations/default.jpg';
    
    onLocationSelect() {
      let location = this.locations.find(location => location.id == parseInt(this.selectedLocationId));
      let locationSlug = location ? location.slug : '';
      let currentMonthWeatherIds = [];
      let nextMonthWeatherIds = [];
      let date = null;
      let dayAmount = 0;
      let titleImageFile = this.getSelectedLocation()?.imageFileName || 'default.jpg';

      this.titleImageUrl = `../assets/locations/${titleImageFile}`;
      this.availableWeather = (location && location.locationWeather) ? location.locationWeather : [];
      
      // This Month
      date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth());
      dayAmount = getDayAmount(date);
      this.seed = cyrb128(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth()).getTime().toString() + locationSlug);
      this.rand = sfc32(this.seed[0], this.seed[1], this.seed[2], this.seed[3]);
      currentMonthWeatherIds = calculateWeather(this.weather, this.availableWeather, this.rand, dayAmount);
      this.currentMonthWeather = currentMonthWeatherIds.map(
        weatherId => this.weather.find(weather => weather.id == weatherId) || this.weather[0]
      );

      // Next Month
      date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() +1);
      dayAmount = getDayAmount(date);
      this.seed = cyrb128(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1).getTime().toString() + locationSlug);
      this.rand = sfc32(this.seed[0], this.seed[1], this.seed[2], this.seed[3]);
      nextMonthWeatherIds = calculateWeather(this.weather, this.availableWeather, this.rand, dayAmount);
      this.nextMonthWeather = nextMonthWeatherIds.map(
        weatherId => this.weather.find(weather => weather.id == weatherId) || this.weather[0]
      );
    }

    setContent(locations: LocationDto[], weather: WeatherDto[]) {
      this.locations = locations;
      this.weather = weather;
    }

    getSelectedLocation() {
      return this.locations.find(location => location.id == parseInt(this.selectedLocationId));
    }
  }
</script>