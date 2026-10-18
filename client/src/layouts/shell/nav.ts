// Shell navigation model (ER2-201, ER2-205). The top bar, the mobile bottom
// bar and the "Mehr" sheet all read from here, so every former header and
// drawer link has exactly one definition. Account actions (profile, create,
// "Meine …", support, moderation, logout) stay in components/sidebar/UserMenu.vue.

export interface ShellNavLink {
  label: string;
  to: string;
  icon: string;
}

export interface ShellNavArea extends ShellNavLink {
  key: string;
  /** Extra path prefixes that mark the area active (besides `to`). */
  prefixes: string[];
  /** Character profile URLs (`/:Server/:Name`) also count for this area. */
  matchCharacterUrls?: boolean;
}

export interface ShellNavGroup {
  key: string;
  label: string;
  links: ShellNavLink[];
}

// `/:server([A-Z][a-z]+)/:character` in router/routes.ts.
const CHARACTER_URL = /^\/[A-Z][a-z]+\/[^/]+\/?$/;

export const PRIMARY_AREAS: ShellNavArea[] = [
  {
    key: 'characters',
    label: 'Charaktere',
    to: '/profiles',
    icon: 'person',
    prefixes: ['/profiles', '/free-companies', '/communities', '/fc/', '/community/'],
    matchCharacterUrls: true,
  },
  { key: 'venues', label: 'Treffpunkte', to: '/venues', icon: 'place', prefixes: ['/venues', '/venue/'] },
  { key: 'events', label: 'Events', to: '/calendar', icon: 'event', prefixes: ['/calendar', '/event/'] },
  { key: 'stories', label: 'Geschichten', to: '/stories', icon: 'auto_stories', prefixes: ['/stories', '/story/'] },
  { key: 'noticeboard', label: 'Anschlagbrett', to: '/noticeboard', icon: 'push_pin', prefixes: ['/noticeboard'] },
  { key: 'gallery', label: 'Galerie', to: '/gallery/screenshot', icon: 'photo_library', prefixes: ['/gallery/', '/image/'] },
];

// There is no wiki index route (only /wiki/:title), so "Wiki" opens a menu:
// a palette search plus the former "Wissenswertes" pages.
export const WIKI_AREA: ShellNavArea = {
  key: 'wiki',
  label: 'Wiki',
  to: '/beginner-guide',
  icon: 'menu_book',
  prefixes: ['/wiki/', '/beginner-guide', '/rules', '/faq', '/about', '/changes'],
};

export const WIKI_LINKS: ShellNavLink[] = [
  { label: 'Anfängerguide', to: '/beginner-guide', icon: 'school' },
  { label: 'Regeln', to: '/rules', icon: 'gavel' },
  { label: 'FAQ', to: '/faq', icon: 'help_outline' },
  { label: 'Neueste Änderungen', to: '/changes', icon: 'update' },
  { label: 'Über uns', to: '/about', icon: 'info' },
];

// Everything from the former navGroups that is not one of the primary areas.
export const MORE_GROUPS: ShellNavGroup[] = [
  {
    key: 'start',
    label: 'Allgemein',
    links: [
      { label: 'Startseite', to: '/', icon: 'home' },
      { label: 'Kontakt', to: '/contact', icon: 'mail_outline' },
    ],
  },
  {
    key: 'communities',
    label: 'Gemeinschaften',
    links: [
      { label: 'Communities', to: '/communities', icon: 'groups' },
      { label: 'Freie Gesellschaften', to: '/free-companies', icon: 'shield' },
    ],
  },
  {
    key: 'media',
    label: 'Galerie',
    links: [
      { label: 'Screenshots', to: '/gallery/screenshot', icon: 'photo_camera' },
      { label: 'Kunstwerke', to: '/gallery/artwork', icon: 'palette' },
    ],
  },
];

function matchesPrefix(path: string, prefix: string): boolean {
  if (prefix.endsWith('/')) {
    return path.startsWith(prefix);
  }
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function isAreaActive(area: ShellNavArea, path: string): boolean {
  if (matchesPrefix(path, area.to) || area.prefixes.some((prefix) => matchesPrefix(path, prefix))) {
    return true;
  }
  return !!area.matchCharacterUrls && CHARACTER_URL.test(path);
}

export function isLinkActive(link: ShellNavLink, path: string): boolean {
  return link.to === '/' ? path === '/' : matchesPrefix(path, link.to);
}
