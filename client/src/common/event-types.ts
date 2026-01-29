import { EventType } from '@app/shared/enums/event-type.enum';

export const EventTypeLabels: Record<EventType, string> = {
  [EventType.GENERAL]: 'Allgemein',
  [EventType.TAVERN]: 'Taverne',
  [EventType.BATHHOUSE]: 'Badehaus',
  [EventType.CLUB]: 'Club',
  [EventType.MARKET]: 'Markt',
  [EventType.RP]: 'Rollenspiel',
  [EventType.ADULT]: '18+',
  [EventType.OTHER]: 'Sonstiges',
};

export const EventTypeOptions = [
  { label: EventTypeLabels[EventType.GENERAL], value: EventType.GENERAL },
  { label: EventTypeLabels[EventType.TAVERN], value: EventType.TAVERN },
  { label: EventTypeLabels[EventType.BATHHOUSE], value: EventType.BATHHOUSE },
  { label: EventTypeLabels[EventType.CLUB], value: EventType.CLUB },
  { label: EventTypeLabels[EventType.MARKET], value: EventType.MARKET },
  { label: EventTypeLabels[EventType.RP], value: EventType.RP },
  { label: EventTypeLabels[EventType.ADULT], value: EventType.ADULT },
  { label: EventTypeLabels[EventType.OTHER], value: EventType.OTHER },
];

export function getEventTypeLabel(type?: EventType | null): string {
  if (!type) {
    return EventTypeLabels[EventType.GENERAL];
  }

  return EventTypeLabels[type] || EventTypeLabels[EventType.GENERAL];
}
