export enum EventRegistrationKind {
  GOING = 'going',
  INTERESTED = 'interested',
}

export const EVENT_REGISTRATION_KINDS: readonly EventRegistrationKind[] = Object.freeze([
  EventRegistrationKind.GOING,
  EventRegistrationKind.INTERESTED,
]);
