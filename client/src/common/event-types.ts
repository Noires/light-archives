import { EventType } from '@app/shared/enums/event-type.enum';

export const EventTypeLabels: Record<EventType, string> = {
  [EventType.GENERAL]: 'Offenes Rollenspiel',
  [EventType.TAVERN]: 'Taverne / Kneipe',
  [EventType.BAR_LOUNGE]: 'Bar / Lounge',
  [EventType.CLUB]: 'Club / Tanzlokal',
  [EventType.RESTAURANT_GASTHAUS]: 'Restaurant / Gasthaus',
  [EventType.TEAHOUSE]: 'Teehaus',
  [EventType.HEALERHOUSE]: 'Heilerhaus',
  [EventType.COMBAT_ARENA]: 'Kampfarena',
  [EventType.SALES]: 'Verkauf',
  [EventType.LIBRARY]: 'Bibliothek',
  [EventType.GALLERY_MUSEUM]: 'Galerie / Museum',
  [EventType.BATHHOUSE]: 'Badehaus',
  [EventType.MARKET]: 'Markt',
  [EventType.ADVENTURERS_GUILD]: 'Abenteurergilde',
  [EventType.EDUCATION_UNIVERSITY]: 'Ausbildung / Universität',
  [EventType.RP]: 'Offenes Rollenspiel',
  [EventType.ADULT]: '18+',
  [EventType.OTHER]: 'Sonstiges',
};

export const EventTypeOptions = [
  { label: EventTypeLabels[EventType.TAVERN], value: EventType.TAVERN },
  { label: EventTypeLabels[EventType.BAR_LOUNGE], value: EventType.BAR_LOUNGE },
  { label: EventTypeLabels[EventType.CLUB], value: EventType.CLUB },
  { label: EventTypeLabels[EventType.RESTAURANT_GASTHAUS], value: EventType.RESTAURANT_GASTHAUS },
  { label: EventTypeLabels[EventType.TEAHOUSE], value: EventType.TEAHOUSE },
  { label: EventTypeLabels[EventType.HEALERHOUSE], value: EventType.HEALERHOUSE },
  { label: EventTypeLabels[EventType.COMBAT_ARENA], value: EventType.COMBAT_ARENA },
  { label: EventTypeLabels[EventType.SALES], value: EventType.SALES },
  { label: EventTypeLabels[EventType.LIBRARY], value: EventType.LIBRARY },
  { label: EventTypeLabels[EventType.GALLERY_MUSEUM], value: EventType.GALLERY_MUSEUM },
  { label: EventTypeLabels[EventType.BATHHOUSE], value: EventType.BATHHOUSE },
  { label: EventTypeLabels[EventType.MARKET], value: EventType.MARKET },
  { label: EventTypeLabels[EventType.ADVENTURERS_GUILD], value: EventType.ADVENTURERS_GUILD },
  { label: EventTypeLabels[EventType.EDUCATION_UNIVERSITY], value: EventType.EDUCATION_UNIVERSITY },
  { label: EventTypeLabels[EventType.RP], value: EventType.RP },
  { label: EventTypeLabels[EventType.OTHER], value: EventType.OTHER },
];

export function getEventTypeLabel(type?: EventType | null): string {
  if (!type) {
    return EventTypeLabels[EventType.RP];
  }

  return EventTypeLabels[type] || EventTypeLabels[EventType.RP];
}
