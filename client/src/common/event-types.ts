import { EventType } from '@app/shared/enums/event-type.enum';

const EventTypeValue = {
  GENERAL: 'GENERAL' as EventType,
  TAVERN: 'TAVERN' as EventType,
  BAR_LOUNGE: 'BAR_LOUNGE' as EventType,
  CLUB: 'CLUB' as EventType,
  RESTAURANT_GASTHAUS: 'RESTAURANT_GASTHAUS' as EventType,
  TEAHOUSE: 'TEAHOUSE' as EventType,
  HEALERHOUSE: 'HEALERHOUSE' as EventType,
  COMBAT_ARENA: 'COMBAT_ARENA' as EventType,
  SALES: 'SALES' as EventType,
  LIBRARY: 'LIBRARY' as EventType,
  GALLERY_MUSEUM: 'GALLERY_MUSEUM' as EventType,
  BATHHOUSE: 'BATHHOUSE' as EventType,
  MARKET: 'MARKET' as EventType,
  ADVENTURERS_GUILD: 'ADVENTURERS_GUILD' as EventType,
  EDUCATION_UNIVERSITY: 'EDUCATION_UNIVERSITY' as EventType,
  RP: 'RP' as EventType,
  ADULT: 'ADULT' as EventType,
  OTHER: 'OTHER' as EventType,
} as const;

export const EventTypeLabels: Record<string, string> = {
  [EventTypeValue.GENERAL]: 'Offenes Rollenspiel',
  [EventTypeValue.TAVERN]: 'Taverne / Kneipe',
  [EventTypeValue.BAR_LOUNGE]: 'Bar / Lounge',
  [EventTypeValue.CLUB]: 'Club / Tanzlokal',
  [EventTypeValue.RESTAURANT_GASTHAUS]: 'Restaurant / Gasthaus',
  [EventTypeValue.TEAHOUSE]: 'Teehaus',
  [EventTypeValue.HEALERHOUSE]: 'Heilerhaus',
  [EventTypeValue.COMBAT_ARENA]: 'Kampfarena',
  [EventTypeValue.SALES]: 'Verkauf',
  [EventTypeValue.LIBRARY]: 'Bibliothek',
  [EventTypeValue.GALLERY_MUSEUM]: 'Galerie / Museum',
  [EventTypeValue.BATHHOUSE]: 'Badehaus',
  [EventTypeValue.MARKET]: 'Markt',
  [EventTypeValue.ADVENTURERS_GUILD]: 'Abenteurergilde',
  [EventTypeValue.EDUCATION_UNIVERSITY]: 'Ausbildung / Universität',
  [EventTypeValue.RP]: 'Offenes Rollenspiel',
  [EventTypeValue.ADULT]: '18+',
  [EventTypeValue.OTHER]: 'Sonstiges',
};

export const EventTypeIcons: Record<string, string> = {
  [EventTypeValue.GENERAL]: 'place',
  [EventTypeValue.TAVERN]: 'sports_bar',
  [EventTypeValue.BAR_LOUNGE]: 'local_bar',
  [EventTypeValue.CLUB]: 'nightlife',
  [EventTypeValue.RESTAURANT_GASTHAUS]: 'restaurant',
  [EventTypeValue.TEAHOUSE]: 'emoji_food_beverage',
  [EventTypeValue.HEALERHOUSE]: 'healing',
  [EventTypeValue.COMBAT_ARENA]: 'sports_kabaddi',
  [EventTypeValue.SALES]: 'sell',
  [EventTypeValue.LIBRARY]: 'menu_book',
  [EventTypeValue.GALLERY_MUSEUM]: 'palette',
  [EventTypeValue.BATHHOUSE]: 'hot_tub',
  [EventTypeValue.MARKET]: 'storefront',
  [EventTypeValue.ADVENTURERS_GUILD]: 'shield',
  [EventTypeValue.EDUCATION_UNIVERSITY]: 'school',
  [EventTypeValue.RP]: 'theater_comedy',
  [EventTypeValue.ADULT]: 'whatshot',
  [EventTypeValue.OTHER]: 'category',
};

export function getEventTypeIcon(type?: EventType | null): string {
  if (!type) {
    return EventTypeIcons[EventTypeValue.RP];
  }

  return EventTypeIcons[type] || EventTypeIcons[EventTypeValue.OTHER];
}

export const EventTypeOptions = [
  { label: EventTypeLabels[EventTypeValue.TAVERN], value: EventTypeValue.TAVERN },
  { label: EventTypeLabels[EventTypeValue.BAR_LOUNGE], value: EventTypeValue.BAR_LOUNGE },
  { label: EventTypeLabels[EventTypeValue.CLUB], value: EventTypeValue.CLUB },
  { label: EventTypeLabels[EventTypeValue.RESTAURANT_GASTHAUS], value: EventTypeValue.RESTAURANT_GASTHAUS },
  { label: EventTypeLabels[EventTypeValue.TEAHOUSE], value: EventTypeValue.TEAHOUSE },
  { label: EventTypeLabels[EventTypeValue.HEALERHOUSE], value: EventTypeValue.HEALERHOUSE },
  { label: EventTypeLabels[EventTypeValue.COMBAT_ARENA], value: EventTypeValue.COMBAT_ARENA },
  { label: EventTypeLabels[EventTypeValue.SALES], value: EventTypeValue.SALES },
  { label: EventTypeLabels[EventTypeValue.LIBRARY], value: EventTypeValue.LIBRARY },
  { label: EventTypeLabels[EventTypeValue.GALLERY_MUSEUM], value: EventTypeValue.GALLERY_MUSEUM },
  { label: EventTypeLabels[EventTypeValue.BATHHOUSE], value: EventTypeValue.BATHHOUSE },
  { label: EventTypeLabels[EventTypeValue.MARKET], value: EventTypeValue.MARKET },
  { label: EventTypeLabels[EventTypeValue.ADVENTURERS_GUILD], value: EventTypeValue.ADVENTURERS_GUILD },
  { label: EventTypeLabels[EventTypeValue.EDUCATION_UNIVERSITY], value: EventTypeValue.EDUCATION_UNIVERSITY },
  { label: EventTypeLabels[EventTypeValue.RP], value: EventTypeValue.RP },
  { label: EventTypeLabels[EventTypeValue.OTHER], value: EventTypeValue.OTHER },
];

export function getEventTypeLabel(type?: EventType | null): string {
  if (!type) {
    return EventTypeLabels[EventTypeValue.RP];
  }

  return EventTypeLabels[type] || EventTypeLabels[EventTypeValue.RP];
}
