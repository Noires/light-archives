export enum NoticeboardType {
	GERUECHT = 'geruecht',
	AUFTRAG = 'auftrag',
	GESUCH = 'gesuch',
	ZEITUNGSARTIKEL = 'zeitungsartikel',
	STELLENANGEBOT = 'stellenangebot',
	STELLENGESUCH = 'stellengesuch',
	AUSHANG = 'aushang',
}

export const noticeboardTypes: { [k: string]: string } = {
	[NoticeboardType.GERUECHT]: 'Gerücht',
	[NoticeboardType.AUFTRAG]: 'Auftrag',
	[NoticeboardType.GESUCH]: 'Gesuch',
	[NoticeboardType.ZEITUNGSARTIKEL]: 'Zeitungsartikel',
	[NoticeboardType.STELLENANGEBOT]: 'Stellenangebot',
	[NoticeboardType.STELLENGESUCH]: 'Stellengesuch',
	[NoticeboardType.AUSHANG]: 'Aushang',
};
