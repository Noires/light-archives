import { Console } from "console";

export enum Tribe {
  MIDLANDER = 'midlander',
  HIGHLANDER = 'highlander',
  WILDWOOD = 'wildwood',
  DUSKWIGHT = 'duskwight',
  PLAINSFOLK = 'plainsfolk',
  DUNESFOLK = 'dunesfolk',
  SEEKERSOFTHESUN = 'seekersofthesun',
  KEEPERSOFTHEMOON = 'keepersofthemoon',
  SEAWOLVES = 'seawolves',
  HELLSGUARD = 'hellsguard',
  RAEN = 'raen',
  XAELA = 'xaela',
  RAVA = 'rava',
  VEENA = 'veena',
  HELIONS = 'helions',
  THELOST = 'thelost',
}

export const enTribes: { [k: string]: string } = {
  [Tribe.MIDLANDER]: 'Midlander',
  [Tribe.HIGHLANDER]: 'Highlander',
  [Tribe.WILDWOOD]: 'Wildwood',
  [Tribe.DUSKWIGHT]: "Duskwight",
  [Tribe.PLAINSFOLK]: 'Plainsfolk',
  [Tribe.DUNESFOLK]: 'Dunesfolk',
  [Tribe.SEEKERSOFTHESUN]: 'Seeker of the Sun',
  [Tribe.KEEPERSOFTHEMOON]: 'Keeper of the Moon',
  [Tribe.SEAWOLVES]: 'Sea Wolf',
  [Tribe.HELLSGUARD]: 'Hellsguard',
  [Tribe.RAEN]: 'Raen',
  [Tribe.XAELA]: 'Xaela',
  [Tribe.RAVA]: 'Rava',
  [Tribe.VEENA]: 'Veena',
  [Tribe.HELIONS]: 'Helions',
  [Tribe.THELOST]: 'The Lost',
};
 

export const tribes: { [k: string]: string } = {
  [Tribe.MIDLANDER]: 'Wiesländer',
  [Tribe.HIGHLANDER]: 'Hochländer',
  [Tribe.WILDWOOD]: 'Erlschatten',
  [Tribe.DUSKWIGHT]: "Dunkelalben",
  [Tribe.PLAINSFOLK]: 'Halmlinge',
  [Tribe.DUNESFOLK]: 'Sandlinge',
  [Tribe.SEEKERSOFTHESUN]: 'Sonnentatzen',
  [Tribe.KEEPERSOFTHEMOON]: 'Mondstreuner',
  [Tribe.SEAWOLVES]: 'Seewölfe',
  [Tribe.HELLSGUARD]: 'Lohengarde',
  [Tribe.RAEN]: 'Raen',
  [Tribe.XAELA]: 'Xaela',
  [Tribe.RAVA]: 'Rava',
  [Tribe.VEENA]: 'Veena',
  [Tribe.HELIONS]: 'Helions',
  [Tribe.THELOST]: 'Die Losgesagten',
};

export function getTribeByName(tribeName: string): Tribe|null {
  for (const tribe of Object.values(Tribe)) {
    console.log(tribe);
    if (enTribes[tribe] === tribeName) {
      console.log(tribe);
      return tribe;
    }
  }

  return null;
}
