import { useStore } from 'src/store';
import { Role, roleImplies } from '@app/shared/enums/role.enum';
import { RouteLocationNormalized, RouteRecordRaw } from 'vue-router';

function hasRequiredRole(requiredRole: Role): boolean {
  const role = useStore().getters.role;
  return !!role && roleImplies(role, requiredRole);
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Index.vue') }],
    meta: {
      title: ''
    }
  },

  // Top navigation links

  {
    path: '/about',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/About.vue') }],
    meta: {
      title: 'Über uns'
    },
  },

  {
    path: '/rules',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Rules.vue') }],
    meta: {
      title: 'Regeln'
    },
  },

  {
    path: '/contact',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Contact.vue') }],
    meta: {
      title: 'Kontakt'
    },
  },

  {
    path: '/test-editor',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/TestEditor.vue') }],
    meta: {
      title: 'Wiki Import Test'
    },
  },

  {
    path: '/test-character-selector',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/TestCharacterSelector.vue') }],
    meta: {
      title: 'Character Selector Test'
    },
  },

  {
    path: '/test-sentry',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/TestSentry.vue') }],
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
    path: '/create-location',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditLocation.vue') }],
    meta: {
      title: 'Ort erstellen'
    },
  },

  {
    path: '/create-weather',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditWeather.vue') }],
    meta: {
      title: 'Wetter erstellen'
    },
  },

  {
    path: '/weather',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('src/pages/Weather.vue') }],
    meta: {
      title: 'Wetter'
    },
  },

  {
    path: '/privacy-statement',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/PrivacyStatement.vue') }],
    meta: {
      title: 'Datenschutzerklärung'
    },
  },

  // User actions

  {
    path: '/terms',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Terms.vue') }],
    meta: {
      title: 'Nutzungsbedingungen'
    },
  },

  {
    path: '/verify',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Verify.vue') }],
    meta: {
      title: 'Account verifizieren'
    },
  },

  // Support
  {
    path: '/support/tickets',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/SupportTickets.vue') }],
    meta: {
      title: 'Support-Tickets'
    },
    beforeEnter: () => hasRequiredRole(Role.USER),
  },
  {
    path: '/support/tickets/new',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/NewSupportTicket.vue') }],
    meta: {
      title: 'Neues Support-Ticket'
    },
    beforeEnter: () => hasRequiredRole(Role.USER),
  },
  {
    path: '/support/tickets/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/SupportTicket.vue') }],
    meta: {
      title: 'Support-Ticket'
    },
    beforeEnter: () => hasRequiredRole(Role.USER),
  },
  {
    path: '/support/queue',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/SupportQueue.vue') }],
    meta: {
      title: 'Support-Queue'
    },
    beforeEnter: () => hasRequiredRole(Role.MODERATOR),
  },
  {
    path: '/support/queue/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/SupportTicketAdmin.vue') }],
    meta: {
      title: 'Support-Ticket'
    },
    beforeEnter: () => hasRequiredRole(Role.MODERATOR),
  },

  // User actions
  {
    path: '/edit-character/:id/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/EditCharacter.vue'),
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
          }],
      }],
    meta: {
      title: 'Profil bearbeiten'
    },
  },

  // Stories
  { 
    path: '/stories',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Stories.vue') }],
    meta: {
      title: 'Geschichten'
    },
  },

  { 
    path: '/story/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Story.vue') }],
  },

  { 
    path: '/create-story',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditStory.vue') }],
    meta: {
      title: 'Geschichte erstellen'
    },
  },

  { 
    path: '/edit-story/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditStory.vue') }],
    meta: {
      title: 'Geschichte bearbeiten'
    },
  },

  // Noticeboard
  { 
    path: '/noticeboard',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Noticeboard.vue') }],
    meta: {
      title: 'Anschlagbrett'
    },
  },

  { 
    path: '/noticeboard/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/NoticeboardItem.vue') }],
  },

  { 
    path: '/create-noticeboard-item',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditNoticeboardItem.vue') }],
    meta: {
      title: 'Aushang erstellen'
    },
  },

  { 
    path: '/edit-noticeboard-item/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditNoticeboardItem.vue') }],
    meta: {
      title: 'Aushang bearbeiten'
    },
  },

  
  // Events
  {
    path: '/event/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Event.vue') }],
  },

  {
    path: '/create-event',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditEvent.vue') }],
    meta: {
      title: 'Event erstellen'
    },
  },

  {
    path: '/edit-event/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditEvent.vue') }],
    meta: {
      title: 'Event bearbeiten'
    },
  },

  {
    path: '/calendar',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EventCalendar.vue') }],
    meta: {
      title: 'Eventkalender'
    },
  },

  {
    path: '/calendar/:year/:month',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EventCalendar.vue') }],
    meta: {
      title: 'Eventkalender'
    },
  },

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

  // Images

  { 
    path: '/image/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Image.vue') }],
  },

  { 
    path: '/gallery/:category',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Gallery.vue') }],
  },

  { 
    path: '/my-content',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/MyContent.vue') }],
    meta: {
      title: 'Meine Inhalte'
    },
  },

  { 
    path: '/edit-image/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditImage.vue') }],
    meta: {
      title: 'Bild bearbeiten'
    },
  },

  // Venues

  { 
    path: '/venues',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Venues.vue') }],
    meta: {
      title: 'Treffpunkte'
    },
  },

  { 
    path: '/my-venues',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/MyVenues.vue') }],
    meta: {
      title: 'Meine Treffpunkte'
    },
  },

  {
    path: '/venue/:server/:name',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Venue.vue') }],
  },

  { 
    path: '/venue/:id([0-9]+)',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Venue.vue') }],
  },

  { 
    path: '/create-venue',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditVenue.vue') }],
    meta: {
      title: 'Treffpunkt erstellen'
    },
  },

  { 
    path: '/edit-venue/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditVenue.vue') }],
    meta: {
      title: 'Treffpunkt bearbeiten'
    },
  },

  // Violations

  {
    path: '/violations',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Violations.vue') }],
    meta: {
      title: 'Verstöße'
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

  // Communities

  { 
    path: '/communities',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Communities.vue') }],
    meta: {
      title: 'Communities'
    },
  },

  { 
    path: '/my-communities',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/MyCommunities.vue') }],
    meta: {
      title: 'Meine Communities'
    },
  },

  {
    path: '/community/:name',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Community.vue') }],
  },

  { 
    path: '/create-community',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditCommunity.vue') }],
    meta: {
      title: 'Community erstellen'
    },
  },

  { 
    path: '/edit-community/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditCommunity.vue') }],
    meta: {
      title: 'Community bearbeiten'
    },
  },

  // Free Companies

  { 
    path: '/my-free-company',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/MyFreeCompany.vue') }],
    meta: {
      title: 'Meine Freie Gesellschaft'
    },
  },

  { 
    path: '/free-companies',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/FreeCompanies.vue') }],
    meta: {
      title: 'Freie Gesellschaften'
    },
  },

  {
    path: '/fc/:server([A-Z][a-z]+)/:fc([^/]+)',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/FreeCompany.vue') }],
    meta: {
      title(route: RouteLocationNormalized): string {
        return (route.params.fc as string).replace(/_/g, ' ');
      }
    },
  },

  { 
    path: '/edit-free-company/:server([A-Z][a-z]+)/:fc([^/]+)',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditFreeCompany.vue') }],
    meta: {
      title: 'Freie Gesellschaft bearbeiten'
    },
  },

  // Wiki

  {
    path: '/wiki/:title',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Wiki.vue') }],
  },

  { 
    path: '/create-wiki-page',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditWikiPage.vue') }],
    meta: {
      title: 'Wikibeitrag erstellen'
    },
  },

  { 
    path: '/edit-wiki-page/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/EditWikiPage.vue') }],
    meta: {
      title: 'Wikibeitrag bearbeiten'
    },
  },

  // Links
  
  {
    path: '/link/:name',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Link.vue') }],
    meta: {
      title: 'Link'
    },
  },

  // Search
  {
    path: '/search',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Search.vue') }],
    meta: {
      title: 'Suche'
    },
  },

  // Characters
  {
    path: '/profiles',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Characters.vue') }],
    meta: {
      title: 'Profile'
    },
  },

  {
    path: '/:server([A-Z][a-z]+)/:character([^/]+)',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Character.vue') }],
    meta: {
      title(route: RouteLocationNormalized): string {
        return (route.params.character as string).replace(/_/g, ' ');
      }
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
