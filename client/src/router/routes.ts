import { useStore } from 'src/store';
import { Role, roleImplies } from '@app/shared/enums/role.enum';
import { RouteLocationNormalized, RouteRecordRaw } from 'vue-router';

function hasRequiredRole(requiredRole: Role): boolean {
  const role = useStore().getters.role;
  return !!role && roleImplies(role, requiredRole);
}

// ER2-204 — reads a route param for `meta.breadcrumb` (see
// components/vision/Breadcrumbs.vue): first value, underscores as spaces.
function crumbParam(route: RouteLocationNormalized, key: string): string {
  const value = route.params[key];
  const raw = (Array.isArray(value) ? value[0] : value) || '';
  try {
    return decodeURIComponent(raw).replace(/_/g, ' ');
  } catch (e) {
    return raw.replace(/_/g, ' ');
  }
}

const routes: RouteRecordRaw[] = [
  // Single shell parent: every page renders inside one persistent MainLayout,
  // so the header, drawer and footer stay mounted across navigation.
  // Child paths are relative to '/', so they resolve to the same URLs as before.
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/Index.vue'),
        meta: {
          title: ''
        },
      },

      // Top navigation links

      {
        path: 'about',
        component: () => import('pages/About.vue'),
        meta: {
          title: 'Über uns'
        },
      },

      {
        path: 'rules',
        component: () => import('pages/Rules.vue'),
        meta: {
          title: 'Regeln'
        },
      },

      {
        path: 'contact',
        component: () => import('pages/Contact.vue'),
        meta: {
          title: 'Kontakt'
        },
      },

      {
        path: 'faq',
        component: () => import('pages/Faq.vue'),
        meta: {
          title: 'FAQ'
        },
      },

      {
        path: 'changes',
        component: () => import('pages/Changes.vue'),
        meta: {
          title: 'Neueste Änderungen'
        },
      },

      {
        path: 'beginner-guide',
        component: () => import('pages/BeginnerGuide.vue'),
        meta: {
          title: 'Anfängerguide'
        },
      },

      {
        path: 'test-editor',
        component: () => import('pages/TestEditor.vue'),
        meta: {
          title: 'Wiki Import Test'
        },
        beforeEnter: () => {
          const store = useStore();
          const role = store.getters.role;
          if (role !== 'admin')
          {
            return false;
          }
        }
      },

      {
        path: 'test-character-selector',
        component: () => import('pages/TestCharacterSelector.vue'),
        meta: {
          title: 'Character Selector Test'
        },
        beforeEnter: () => {
          const store = useStore();
          const role = store.getters.role;
          if (role !== 'admin')
          {
            return false;
          }
        }
      },

      {
        path: 'test-sentry',
        component: () => import('pages/TestSentry.vue'),
        meta: {
          title: 'Sentry Test'
        },
        beforeEnter: () => {
          const store = useStore();
          const role = store.getters.role;
          if (role !== 'admin')
          {
            return false;
          }
        }
      },

      {
        path: 'create-location',
        component: () => import('pages/EditLocation.vue'),
        meta: {
          title: 'Ort erstellen'
        },
      },

      {
        path: 'create-weather',
        component: () => import('pages/EditWeather.vue'),
        meta: {
          title: 'Wetter erstellen'
        },
      },

      {
        path: 'weather',
        component: () => import('src/pages/Weather.vue'),
        meta: {
          title: 'Wetter'
        },
      },

      {
        path: 'privacy-statement',
        component: () => import('pages/PrivacyStatement.vue'),
        meta: {
          title: 'Datenschutzerklärung'
        },
      },
      {
        path: 'impressum',
        component: () => import('pages/Impressum.vue'),
        meta: {
          title: 'Impressum'
        },
      },


      // User actions

      {
        path: 'terms',
        component: () => import('pages/Terms.vue'),
        meta: {
          title: 'Nutzungsbedingungen'
        },
      },

      {
        path: 'verify',
        component: () => import('pages/Verify.vue'),
        meta: {
          title: 'Account verifizieren'
        },
      },

      // Support
      {
        path: 'support/tickets',
        component: () => import('pages/SupportTickets.vue'),
        meta: {
          title: 'Support-Tickets'
        },
        beforeEnter: () => hasRequiredRole(Role.USER),
      },
      {
        path: 'support/tickets/new',
        component: () => import('pages/NewSupportTicket.vue'),
        meta: {
          title: 'Neues Support-Ticket'
        },
        beforeEnter: () => hasRequiredRole(Role.USER),
      },
      {
        path: 'support/tickets/:id',
        component: () => import('pages/SupportTicket.vue'),
        meta: {
          title: 'Support-Ticket'
        },
        beforeEnter: () => hasRequiredRole(Role.USER),
      },
      {
        path: 'support/queue',
        component: () => import('pages/SupportQueue.vue'),
        meta: {
          title: 'Support-Queue'
        },
        beforeEnter: () => hasRequiredRole(Role.MODERATOR),
      },
      {
        path: 'support/queue/:id',
        component: () => import('pages/SupportTicketAdmin.vue'),
        meta: {
          title: 'Support-Ticket'
        },
        beforeEnter: () => hasRequiredRole(Role.MODERATOR),
      },

      // User actions
      {
        path: 'edit-character/:id/',
        component: () => import('pages/EditCharacter.vue'),
        children: [
          { path: 'profile', component: () => import('pages/EditCharacterProfile.vue'),
          },
          { path: 'appearance', component: () => import('pages/EditCharacterAppearance.vue'),
          },
          { path: 'personality', component: () => import('pages/EditCharacterPersonality.vue'),
          },
          { path: 'contacts', component: () => import('pages/EditCharacterContacts.vue'),
          },
          { path: 'rumors', component: () => import('pages/EditCharacterRumors.vue'),
          },
          { path: 'diary', component: () => import('pages/EditCharacterDiary.vue'),
          },
          { path: 'gallery', component: () => import('pages/EditCharacterGallery.vue'),
          },
          { path: 'inventory', component: () => import('pages/EditCharacterInventory.vue'),
          },
          { path: 'pen-and-paper', component: () => import('pages/EditCharacterPenAndPaper.vue'),
          }],
        meta: {
          title: 'Profil bearbeiten'
        },
      },

      // Stories
      {
        path: 'stories',
        component: () => import('pages/Stories.vue'),
        meta: {
          title: 'Geschichten'
        },
      },

      {
        path: 'story/:id',
        component: () => import('pages/Story.vue'),
        meta: {
          breadcrumb: [{ label: 'Geschichten', to: '/stories' }, 'Geschichte'],
        },
      },

      {
        path: 'create-story',
        component: () => import('pages/EditStory.vue'),
        meta: {
          title: 'Geschichte erstellen'
        },
      },

      {
        path: 'edit-story/:id',
        component: () => import('pages/EditStory.vue'),
        meta: {
          title: 'Geschichte bearbeiten'
        },
      },

      // Noticeboard
      {
        path: 'noticeboard',
        component: () => import('pages/Noticeboard.vue'),
        meta: {
          title: 'Anschlagbrett'
        },
      },

      {
        path: 'noticeboard/:id',
        component: () => import('pages/NoticeboardItem.vue'),
        meta: {
          breadcrumb: [{ label: 'Anschlagbrett', to: '/noticeboard' }, 'Aushang'],
        },
      },

      {
        path: 'create-noticeboard-item',
        component: () => import('pages/EditNoticeboardItem.vue'),
        meta: {
          title: 'Aushang erstellen'
        },
      },

      {
        path: 'edit-noticeboard-item/:id',
        component: () => import('pages/EditNoticeboardItem.vue'),
        meta: {
          title: 'Aushang bearbeiten'
        },
      },


      // Events
      {
        path: 'event/:id',
        component: () => import('pages/Event.vue'),
        meta: {
          breadcrumb: [{ label: 'Events', to: '/calendar' }, 'Event'],
        },
      },

      {
        path: 'create-event',
        component: () => import('pages/EditEvent.vue'),
        meta: {
          title: 'Event erstellen'
        },
      },

      {
        path: 'edit-event/:id',
        component: () => import('pages/EditEvent.vue'),
        meta: {
          title: 'Event bearbeiten'
        },
      },

      {
        path: 'calendar',
        component: () => import('pages/EventCalendar.vue'),
        meta: {
          title: 'Eventkalender'
        },
      },

      {
        path: 'calendar/:year/:month',
        component: () => import('pages/EventCalendar.vue'),
        meta: {
          title: 'Eventkalender'
        },
      },

      // Legacy /event-calendar redirects live outside the shell parent (see below).

      // Images

      {
        path: 'image/:id',
        component: () => import('pages/Image.vue'),
        meta: {
          breadcrumb: [{ label: 'Galerie', to: '/gallery/screenshot' }, 'Bild'],
        },
      },

      // ER2 round 2: albums tab of the gallery (same page) and album detail
      {
        path: 'gallery/alben',
        component: () => import('pages/Gallery.vue'),
        meta: {
          title: 'Alben',
          galleryView: 'alben',
          breadcrumb: [{ label: 'Galerie', to: '/gallery/screenshot' }, 'Alben'],
        },
      },

      {
        path: 'album/:id(\\d+)',
        component: () => import('pages/Album.vue'),
        meta: {
          breadcrumb: [{ label: 'Galerie', to: '/gallery/screenshot' }, { label: 'Alben', to: '/gallery/alben' }, 'Album'],
        },
      },

      {
        path: 'gallery/:category',
        component: () => import('pages/Gallery.vue'),
        meta: {
          breadcrumb: (route: RouteLocationNormalized) => {
            const category = crumbParam(route, 'category');
            const labels: Record<string, string> = { screenshot: 'Screenshots', artwork: 'Kunstwerke' };
            return ['Galerie', labels[category] || category];
          },
        },
      },

      {
        path: 'my-content',
        component: () => import('pages/MyContent.vue'),
        meta: {
          title: 'Meine Inhalte'
        },
      },

      // ER2 social: notifications and bookmarks (login prompt inside the pages)
      {
        path: 'benachrichtigungen',
        component: () => import('pages/Notifications.vue'),
        meta: {
          title: 'Benachrichtigungen',
          breadcrumb: 'Benachrichtigungen',
        },
      },
      {
        path: 'gemerkt',
        component: () => import('pages/Bookmarks.vue'),
        meta: {
          title: 'Gemerkt',
          breadcrumb: 'Gemerkt',
        },
      },

      {
        path: 'edit-image/:id',
        component: () => import('pages/EditImage.vue'),
        meta: {
          title: 'Bild bearbeiten'
        },
      },

      // Venues

      {
        path: 'venues',
        component: () => import('pages/Venues.vue'),
        meta: {
          title: 'Treffpunkte'
        },
      },

      // ER2 outlook: map — same page with the map view preselected
      {
        path: 'venues/karte',
        component: () => import('pages/Venues.vue'),
        meta: {
          title: 'Treffpunkte auf der Karte',
          venueView: 'karte',
          breadcrumb: [{ label: 'Treffpunkte', to: '/venues' }, 'Karte'],
        },
      },

      {
        path: 'my-venues',
        component: () => import('pages/MyVenues.vue'),
        meta: {
          title: 'Meine Treffpunkte'
        },
      },

      {
        path: 'venue/:server/:name/:section',
        component: () => import('pages/Venue.vue'),
        meta: {
          breadcrumb: (route: RouteLocationNormalized) => [{ label: 'Treffpunkte', to: '/venues' }, crumbParam(route, 'name')],
        },
      },

      {
        path: 'venue/:server/:name',
        component: () => import('pages/Venue.vue'),
        meta: {
          breadcrumb: (route: RouteLocationNormalized) => [{ label: 'Treffpunkte', to: '/venues' }, crumbParam(route, 'name')],
        },
      },

      {
        path: 'venue/:id([0-9]+)/:section',
        component: () => import('pages/Venue.vue'),
        meta: {
          breadcrumb: [{ label: 'Treffpunkte', to: '/venues' }, 'Treffpunkt'],
        },
      },

      {
        path: 'venue/:id([0-9]+)',
        component: () => import('pages/Venue.vue'),
        meta: {
          breadcrumb: [{ label: 'Treffpunkte', to: '/venues' }, 'Treffpunkt'],
        },
      },

      {
        path: 'create-venue',
        component: () => import('pages/EditVenue.vue'),
        meta: {
          title: 'Treffpunkt erstellen'
        },
      },

      {
        path: 'edit-venue/:id',
        component: () => import('pages/EditVenue.vue'),
        meta: {
          title: 'Treffpunkt bearbeiten'
        },
      },

      // Violations

      {
        path: 'violations',
        component: () => import('pages/Violations.vue'),
        meta: {
          title: 'Verstöße'
        },
        beforeEnter: () => hasRequiredRole(Role.MODERATOR),
      },

      // Communities

      {
        path: 'communities',
        component: () => import('pages/Communities.vue'),
        meta: {
          title: 'Communities'
        },
      },

      {
        path: 'my-communities',
        component: () => import('pages/MyCommunities.vue'),
        meta: {
          title: 'Meine Communities'
        },
      },

      {
        path: 'community/:name',
        component: () => import('pages/Community.vue'),
        meta: {
          breadcrumb: (route: RouteLocationNormalized) => [{ label: 'Communities', to: '/communities' }, crumbParam(route, 'name')],
        },
      },

      {
        path: 'create-community',
        component: () => import('pages/EditCommunity.vue'),
        meta: {
          title: 'Community erstellen'
        },
      },

      {
        path: 'edit-community/:id',
        component: () => import('pages/EditCommunity.vue'),
        meta: {
          title: 'Community bearbeiten'
        },
      },

      // Free Companies

      {
        path: 'my-free-company',
        component: () => import('pages/MyFreeCompany.vue'),
        meta: {
          title: 'Meine Freie Gesellschaft'
        },
      },

      {
        path: 'free-companies',
        component: () => import('pages/FreeCompanies.vue'),
        meta: {
          title: 'Freie Gesellschaften'
        },
      },

      {
        path: 'fc/:server([A-Z][a-z]+)/:fc([^/]+)',
        component: () => import('pages/FreeCompany.vue'),
        meta: {
          title(route: RouteLocationNormalized): string {
            return (route.params.fc as string).replace(/_/g, ' ');
          },
          breadcrumb: (route: RouteLocationNormalized) => [
            { label: 'Freie Gesellschaften', to: '/free-companies' },
            crumbParam(route, 'fc'),
          ],
        },
      },

      {
        path: 'edit-free-company/:server([A-Z][a-z]+)/:fc([^/]+)',
        component: () => import('pages/EditFreeCompany.vue'),
        meta: {
          title: 'Freie Gesellschaft bearbeiten'
        },
      },

      // Wiki

      // ER2-609: wiki index
      {
        path: 'wiki',
        component: () => import('pages/WikiIndex.vue'),
        meta: {
          title: 'Wiki',
          breadcrumb: 'Wiki',
        },
      },

      {
        path: 'wiki/:title',
        component: () => import('pages/Wiki.vue'),
        meta: {
          breadcrumb: (route: RouteLocationNormalized) => ['Wiki', crumbParam(route, 'title')],
        },
      },

      // ER2 round 2: wiki revision history and diff
      {
        path: 'wiki/:title/versionen',
        component: () => import('pages/WikiVersions.vue'),
        meta: {
          title: 'Versionen',
          breadcrumb: (route: RouteLocationNormalized) => [
            { label: 'Wiki', to: '/wiki' },
            { label: crumbParam(route, 'title'), to: `/wiki/${route.params.title as string}` },
            'Versionen',
          ],
        },
      },

      {
        path: 'create-wiki-page',
        component: () => import('pages/EditWikiPage.vue'),
        meta: {
          title: 'Wikibeitrag erstellen'
        },
      },

      {
        path: 'edit-wiki-page/:id',
        component: () => import('pages/EditWikiPage.vue'),
        meta: {
          title: 'Wikibeitrag bearbeiten'
        },
      },

      // Links

      {
        path: 'link/:name',
        component: () => import('pages/Link.vue'),
        meta: {
          title: 'Link'
        },
      },

      // Search
      {
        path: 'search',
        component: () => import('pages/Search.vue'),
        meta: {
          title: 'Suche'
        },
      },

      // Characters
      {
        path: 'profiles',
        component: () => import('pages/Characters.vue'),
        meta: {
          title: 'Profile'
        },
      },

      {
        // ER2-401 — optional section tab; without it the profile opens.
        path: ':server([A-Z][a-z]+)/:character([^/]+)/:tab(profil|aussehen|persoenlichkeit|kontakte|geruechte|tagebuch|galerie|inventar|pen-and-paper)?',
        component: () => import('pages/Character.vue'),
        meta: {
          title(route: RouteLocationNormalized): string {
            return (route.params.character as string).replace(/_/g, ' ');
          },
          breadcrumb: (route: RouteLocationNormalized) => [
            { label: 'Charaktere', to: '/profiles' },
            crumbParam(route, 'character'),
          ],
        },
      },
    ],
  },

  // Legacy redirects (no layout needed)
  {
    path: '/event-calendar',
    redirect: '/calendar',
  },

  {
    path: '/event-calendar/:year/:month',
    redirect: (to) => {
      const yearParam = Array.isArray(to.params.year) ? to.params.year[0] : to.params.year;
      const monthParam = Array.isArray(to.params.month) ? to.params.month[0] : to.params.month;
      return `/calendar/${yearParam}/${monthParam}`;
    },
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
    meta: {
      title: 'Error'
    },
  },
];

export default routes;
