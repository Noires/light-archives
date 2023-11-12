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

// IDs returned by XIVAPI's Lodestone queries.
const tribesById = {
  1: Tribe.MIDLANDER,
  2: Tribe.HIGHLANDER,
  3: Tribe.WILDWOOD,
  4: Tribe.DUSKWIGHT,
  5: Tribe.PLAINSFOLK,
  6: Tribe.DUNESFOLK,
  7: Tribe.SEEKERSOFTHESUN,
  8: Tribe.KEEPERSOFTHEMOON,
  9: Tribe.SEAWOLVES,  
  10: Tribe.HELLSGUARD,  
  11: Tribe.RAEN,  
  12: Tribe.XAELA,  
  13: Tribe.RAVA,
  14: Tribe.VEENA,  
  15: Tribe.HELIONS,    
  16: Tribe.THELOST,    
}

export function getTribeById(id: number): Tribe|null {
  return tribesById[id as keyof typeof tribesById] || null;
}
