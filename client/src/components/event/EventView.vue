<template>
	<div class="event-view">
		<banner-view :banner="event.banner" />
		<h2 class="regular-header-font">{{event.title}}</h2>
		<template v-if="event.title && event.startDateTime">
			<p>
				<strong>Beginn:</strong> {{$display.formatDateTimeServer(event.startDateTime)}}
				<span class="event-view__local-time">({{$display.formatDateTimeLocal(event.startDateTime)}})</span>
				<template v-if="event.endDateTime">
					<br />
					<strong>Ende:</strong> {{$display.formatDateTimeServer(event.endDateTime)}}
				<span class="event-view__local-time">({{$display.formatDateTimeLocal(event.endDateTime)}})</span>
				</template>
			</p>
			<p v-for="(location, index) in event.locations" :key="index">
				<strong>Standort: </strong>
				<template v-if="location.link">
					<a :href="location.link" target="_blank">{{location.name}}</a>
				</template>
				<template v-else>{{location.name}}</template>
				<template v-if="location.address">
					<br />
					<strong>Adresse:</strong> <template v-if="location.server">{{location.server}}, </template> {{location.address}}
				</template>
				<template v-else-if="location.server">
					<br />
					<strong>Welt:</strong> {{location.server}}
				</template>
				<template v-if="location.tags">
					<br />
					<strong>Schlagworte:</strong> {{location.tags}}
				</template>
			</p>
			<html-viewer v-if="event.details" :content="event.details" />
			<template v-if="event.oocDetails">
				<h3>OOC Details</h3>
				<html-viewer :content="event.oocDetails" />
			</template>
			<hr />
			<p v-if="event.link"><strong>Link: </strong> <a :href="event.link">{{ event.link }}</a></p>
			<p v-if="event.contact"><strong>Kontakt: </strong> {{event.contact}}</p>
		</template>
	</div>
</template>

<script lang="ts">
import { EventDto } from '@app/shared/dto/events/event.dto';
import { Options, prop, Vue } from 'vue-class-component';
import BannerView from '../common/BannerView.vue';
import HtmlViewer from '../common/HtmlViewer.vue';

class Props {
	event = prop<EventDto>({
		required: true
	});

	preview = prop<boolean>({
		default: false
	});
}

@Options({
	components: {
		BannerView,
		HtmlViewer,
	},
})
export default class EventView extends Vue.with(Props) {
	get startDateTime(): string {
    return this.$display.formatDateTimeServer(this.event.startDateTime);
  }

	get endDateTime(): string {
    return this.event.endDateTime ? this.$display.formatDateTimeServer(this.event.startDateTime) : '';
  }

	/*
  get authorLink(): string {
    const server = this.image.authorServer;
    const character = this.image.author.replace(/ /g, '_');
    return `/${server}/${character}`;
  }
	*/
}
</script>

<style lang="scss">
.event-view__local-time {
	color: #888;
}
</style>
