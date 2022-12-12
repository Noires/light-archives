export enum NoticeboardLocation {
	MULTIPLE_LOCATIONS = 'multiple_locations',
	LIMSA_LOMINSA = 'limsa_lominsa',
	GRIDANIA = 'gridania',
	ULDAH = 'uldah',
	ISHGARD = 'ishgard',
	KUGANE = 'kugane',
}

export const noticeboardLocations: { [k: string]: string } = {
	[NoticeboardLocation.MULTIPLE_LOCATIONS]: 'Weiverbreitet',
	[NoticeboardLocation.LIMSA_LOMINSA]: 'Limsa Lominsa',
	[NoticeboardLocation.GRIDANIA]: 'Gridania',
	[NoticeboardLocation.ULDAH]: "Ul'dah",
	[NoticeboardLocation.ISHGARD]: 'Ishgard',
	[NoticeboardLocation.KUGANE]: 'Kugane',
};
