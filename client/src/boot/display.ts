import { Race } from '@app/shared/enums/race.enum';
import { DateTime } from 'luxon';
import { boot } from 'quasar/wrappers';

// This boot file adds a $display property to all Vue components, containing human-readable display names
// for constants used in the code.

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $display: Display;
  }
}

class Display {
	readonly races: { [k: string]: string } = {
		[Race.HYUR]: 'Hyur',
		[Race.ELEZEN]: 'Elezen',
		[Race.LALAFELL]: 'Lalafell',
		[Race.MIQOTE]: "Miqo'te",
		[Race.ROEGADYN]: 'Roegadyn',
		[Race.AURA]: 'Au Ra',
		[Race.HROTHGAR]: 'Hhothgar',
		[Race.VIERA]: 'Viera'
	};

	relativeTime(timestamp: number) {
		return DateTime.fromMillis(timestamp).toRelative({
			locale: 'en',
			unit: [ 'years', 'months', 'days', 'hours', 'minutes' ]
		})
	}
}

export default boot(({ app }) => {
  app.config.globalProperties.$display = new Display();
});
