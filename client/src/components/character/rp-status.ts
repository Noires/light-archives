// ER2-402 / ER2-806 — RP presence helpers for the client. The fields are
// optional: the production API does not send them yet, so every reader treats
// a missing field like "no status".
import { RpPresenceFieldsDto } from '@app/shared/dto/characters/rp-presence.dto';
import { RpStatus } from '@app/shared/enums/rp-status.enum';
import type { StatusBadgeType } from 'components/vision/types';

export const RP_STATUS_LABELS: Record<RpStatus, string> = {
	[RpStatus.IC]: 'Im RP',
	[RpStatus.LFRP]: 'Sucht RP',
	[RpStatus.OOC]: 'OOC',
};

export const RP_STATUS_BADGES: Record<RpStatus, StatusBadgeType> = {
	[RpStatus.IC]: 'rp-ic',
	[RpStatus.LFRP]: 'rp-lfrp',
	[RpStatus.OOC]: 'rp-ooc',
};

/** The status if set and not yet expired, else null. */
export function activeRpStatus(dto: RpPresenceFieldsDto | null | undefined, now = Date.now()): RpStatus | null {
	if (!dto || !dto.rpStatus || !(dto.rpStatus in RP_STATUS_LABELS)) {
		return null;
	}
	if (dto.rpStatusExpiresAt && dto.rpStatusExpiresAt <= now) {
		return null;
	}
	return dto.rpStatus;
}

/** True when the API knows the presence fields (absent on older API versions). */
export function supportsRpStatus(dto: object | null | undefined): boolean {
	return !!dto && 'rpStatus' in dto;
}

export function formatRpUntil(expiresAt: number | null | undefined): string {
	if (!expiresAt) {
		return '';
	}
	const date = new Date(expiresAt);
	const hh = String(date.getHours()).padStart(2, '0');
	const mm = String(date.getMinutes()).padStart(2, '0');
	return `bis ${hh}:${mm} Uhr`;
}
