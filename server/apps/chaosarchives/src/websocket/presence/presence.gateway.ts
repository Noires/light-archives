import { RpPresenceDto } from '@app/shared/dto/characters/rp-presence.dto';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Namespace } from 'socket.io';

/**
 * ER2-806: broadcasts RP presence changes on the `presence` namespace (separate from `updates`).
 * Opt-in: only clients that connect to this namespace receive events, and only characters whose
 * owners set a status are broadcast. Nothing is stored; expiry is handled by the client using
 * `rpStatusExpiresAt` (expired statuses are not re-broadcast).
 */
@WebSocketGateway({ namespace: 'presence' })
export class PresenceGateway {
  private readonly log = new Logger(PresenceGateway.name);

  @WebSocketServer()
  private readonly namespace: Namespace;

  @OnEvent('presence.changed', { async: true })
  handlePresenceChanged(presence: RpPresenceDto): void {
    if (!this.namespace) {
      return;
    }

    this.namespace.emit('presence.changed', presence);
    this.log.debug(`Presence changed: ${presence.characterId}`);
  }
}
