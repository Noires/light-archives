// Shell navigation model (ER2-201, ER2-205). The top bar, the mobile bottom
// bar and the menu sheet all read from here, so every former header and
// drawer link has exactly one definition. Subpages hang off their area
// (`menu`): a dropdown in the top bar, an expandable row in the sheet. Account actions (profile, create,
// "Meine …", support, moderation, logout) stay in components/sidebar/UserMenu.vue.

export interface ShellNavLink {
  label: string;
  to: string;
  icon: string;
}

export interface ShellNavGroup {
  key: string;
  /** Subhead inside the dropdown; omit for a single unlabelled group. */
  label?: string;
  links: ShellNavLink[];
}

export interface ShellNavArea extends ShellNavLink {
  key: string;
  /** Extra path prefixes that mark the area active (besides `to`). */
  prefixes: string[];
  /** Character profile URLs (`/:Server/:Name`) also count for this area. */
  matchCharacterUrls?: boolean;
  /** Subpages; the area label opens them instead of navigating. */
  menu?: ShellNavGroup[];
}

// `/:server([A-Z][a-z]+)/:character` in router/routes.ts.
const CHARACTER_URL = /^\/[A-Z][a-z]+\/[^/]+\/?$/;

export const PRIMARY_AREAS: ShellNavArea[] = [
  {
    key: 'characters',
    label: 'Charaktere',
    to: '/profiles',
    icon: 'person',
    prefixes: ['/profiles'],
    matchCharacterUrls: true,
  },
  {
    key: 'groups',
    label: 'Gruppen',
    to: '/free-companies',
    icon: 'groups',
    prefixes: ['/free-companies', '/communities', '/fc/', '/community/'],
    menu: [
      {
        key: 'groups',
        links: [
          { label: 'Freie Gesellschaften', to: '/free-companies', icon: 'shield' },
          { label: 'Communities', to: '/communities', icon: 'groups' },
        ],
      },
    ],
  },
  {
    key: 'venues',
    label: 'Treffpunkte',
    to: '/venues',
    icon: 'place',
    prefixes: ['/venues', '/venue/'],
    menu: [
      {
        key: 'venues',
        links: [
          { label: 'Alle Treffpunkte', to: '/venues', icon: 'place' },
          { label: 'Treffpunkt-Karte', to: '/venues/karte', icon: 'map' },
        ],
      },
    ],
  },
  { key: 'events', label: 'Events', to: '/calendar', icon: 'event', prefixes: ['/calendar', '/event/'] },
  { key: 'stories', label: 'Geschichten', to: '/stories', icon: 'auto_stories', prefixes: ['/stories', '/story/'] },
  { key: 'noticeboard', label: 'Anschlagbrett', to: '/noticeboard', icon: 'push_pin', prefixes: ['/noticeboard'] },
  {
    key: 'gallery',
    label: 'Galerie',
    to: '/gallery/screenshot',
    icon: 'photo_library',
    prefixes: ['/gallery/', '/image/'],
    menu: [
      {
        key: 'gallery',
        links: [
          { label: 'Screenshots', to: '/gallery/screenshot', icon: 'photo_library' },
          { label: 'Kunstwerke', to: '/gallery/artwork', icon: 'palette' },
          { label: 'Alben', to: '/gallery/alben', icon: 'collections' },
        ],
      },
    ],
  },
];

export const WIKI_LINKS: ShellNavLink[] = [
  { label: 'Wiki-Übersicht', to: '/wiki', icon: 'menu_book' },
  { label: 'Anfängerguide', to: '/beginner-guide', icon: 'school' },
  { label: 'Regeln', to: '/rules', icon: 'gavel' },
  { label: 'FAQ', to: '/faq', icon: 'help_outline' },
  { label: 'Neueste Änderungen', to: '/changes', icon: 'update' },
  { label: 'Über uns', to: '/about', icon: 'info' },
];

const ABOUT_PATHS = ['/changes', '/about'];

// ER2-609: /wiki is the wiki index (it lists WIKI_LINKS). The Wiki dropdown
// splits the guides from the pages about the site itself.
export const WIKI_AREA: ShellNavArea = {
  key: 'wiki',
  label: 'Wiki',
  to: '/wiki',
  icon: 'menu_book',
  prefixes: ['/wiki', '/beginner-guide', '/rules', '/faq', '/about', '/changes', '/contact'],
  menu: [
    { key: 'knowledge', label: 'Wissen', links: WIKI_LINKS.filter((link) => !ABOUT_PATHS.includes(link.to)) },
    {
      key: 'about',
      label: 'Über Elpisgarten',
      links: [
        ...WIKI_LINKS.filter((link) => ABOUT_PATHS.includes(link.to)),
        { label: 'Kontakt', to: '/contact', icon: 'mail_outline' },
      ],
    },
  ],
};

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
