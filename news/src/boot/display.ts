import { ImageCategory } from '@app/shared/enums/image-category.enum';
import { NewsRole } from '@app/shared/enums/news-role.enum';
import { NewsStatus } from '@app/shared/enums/news-status.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { DateTime } from 'luxon';
import { boot } from 'quasar/wrappers';

// This boot file adds a $display property to all Vue components, containing human-readable display names
// for constants used in the code.

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $display: Display;
  }
}

const DATE_FORMAT = 'd MMMM yyyy';

const EORZEAN_MONTH_NAMES: string[] = [];

for (const ordinal of [ 'Ersten', 'Zweiten', 'Dritten', 'Vierten', 'Fünften', 'Sechsten' ]) {
	EORZEAN_MONTH_NAMES.push(`${ordinal} Lichtmondes`);
	EORZEAN_MONTH_NAMES.push(`${ordinal} Schattenmondes`);
}

class Display {
	readonly newsRoles = {
		[NewsRole.NONE]: 'Gast',
		[NewsRole.AUTHOR]: 'Autor',
		[NewsRole.EDITOR]: 'Editor',
	};

	readonly articleStatuses = {
		[NewsStatus.DRAFT]: 'Entwurf',
		[NewsStatus.SUBMITTED]: 'Zur Veröffentlichung eingereicht',
		[NewsStatus.PUBLISHED]: 'Veröffentlicht',
	}

	readonly imageCategories: { [k: string]: string } = {
		[ImageCategory.UNLISTED]: 'Ungelistet',
		[ImageCategory.ARTWORK]: 'Kunstwerk',
		[ImageCategory.SCREENSHOT]: 'Screenshot',
	};

	formatDate(date: number|string) {
		const dateTime = typeof date === 'string' ?  DateTime.fromISO(date) : DateTime.fromMillis(date);
		return dateTime.toFormat(DATE_FORMAT, { locale: 'de-DE' });
	}

	formatDateEorzean(date: number|string) {
		const dateTime = typeof date === 'string' ?  DateTime.fromISO(date, {
			zone: SharedConstants.FFXIV_SERVER_TIMEZONE
		}) : DateTime.fromMillis(date, {
			zone: SharedConstants.FFXIV_SERVER_TIMEZONE
		});
		
		const day = dateTime.day;
		const suffix = (day === 1 || day === 21 || day === 31) ? 'st'
			: (day === 2 || day === 22) ? 'nd'
			: (day === 3 || day === 23) ? 'rd'
			: 'th';
		const month = EORZEAN_MONTH_NAMES[dateTime.month - 1]; // January is 1

		return `${day}${suffix} Sonne des ${month}`;
	}

	formatFileSize(fileSize: number) {
		if (fileSize < 1024) {
			return `${fileSize} bytes`;
		} else if (fileSize < 1024 * 1024) {
			const sizeKiB = Math.round(fileSize / 1024);
			return `${sizeKiB} KiB`;
		} else {
			const sizeMiB = fileSize / (1024 * 1024);
			const sizeMiBDisplay = Math.round(sizeMiB * 100) / 100; // 2 decimal digits
			return `${sizeMiBDisplay} MiB`;
		}
	}
}

export const displayOptions = new Display();

export default boot(({ app }) => {
  app.config.globalProperties.$display = displayOptions;
});
