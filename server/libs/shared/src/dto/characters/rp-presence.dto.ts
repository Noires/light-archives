import { RpStatus } from '../../enums/rp-status.enum';

/** ER2-806: optional presence fields; absent on older API versions, null when no active status. */
export interface RpPresenceFieldsDto {
  rpStatus?: RpStatus | null;
  rpLocation?: string | null;
  /** epoch millis */
  rpStatusExpiresAt?: number | null;
}

/** ER2-806: entry of GET /characters/rp-active and payload of the socket.io `presence.changed` event. */
export interface RpPresenceDto {
  characterId: number;
  name: string;
  server: string;
  avatar: string;
  rpStatus: RpStatus | null;
  rpLocation: string | null;
  rpStatusExpiresAt: number | null;
}
