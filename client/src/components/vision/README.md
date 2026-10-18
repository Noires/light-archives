# components/vision

Shared Elpis Reborn 2 components (UI_UX_VISION_REWORK_PLAN.md §3.2,
tickets ER2-005 to ER2-007). They are not registered globally; import them
in the page that uses them. Prop types live in `types.ts`.

```ts
import StatusBadge from 'components/vision/StatusBadge.vue';
import type { SectionTab } from 'components/vision/types';
```

All components use Aetherium tokens only (`--surface-*`, `--ink-*`,
`--rule-*`, `--vision-*`, `--motion-*`), so they follow Hydaelyn and Zodiark
without extra overrides. Default strings are German. Tokens and contrast
values are documented in `css/aetherium/AETHERIUM.md`.

## Buttons (`css/vision.scss`)

Classes, not a component. Use them on `q-btn` and do not pass `color`
(Quasar's `bg-primary` dark overrides in app.scss would win):

```html
<q-btn class="elpis-btn elpis-btn--primary" unelevated label="Event erstellen" />
<q-btn class="elpis-btn elpis-btn--secondary" flat label="Abbrechen" />
<q-btn class="elpis-btn elpis-btn--ghost" flat label="Alle anzeigen" />
<q-btn class="elpis-btn elpis-btn--danger" unelevated label="Löschen" />
```

Every `q-btn` is sentence case now (`text-transform: none`).

## StatusBadge

Pill for status and meta.

| Prop | Type | Default |
|---|---|---|
| `type` | `'live' \| 'open' \| 'soon' \| 'recurring' \| 'countdown' \| 'server' \| 'cw' \| 'rp-ic' \| 'rp-lfrp' \| 'rp-ooc'` | required |
| `label` | `string` | German default per type (Live, Geöffnet, Bald, Wiederkehrend, Countdown, Server, Inhaltswarnung, Im RP, Sucht RP, OOC) |
| `icon` | Material icon name | `cw` uses `warning`, `recurring` uses `repeat`, `countdown` uses `schedule` |

Tones: live/open/rp-ic use the live green; cw uses the CW colours plus a
warning icon; soon/countdown/rp-lfrp use the tint fill with link ink;
server/recurring/rp-ooc are outlined. live/open/rp-* show a dot.

```html
<status-badge type="live" />
<status-badge type="cw" label="Gewalt" />
<status-badge type="countdown" label="in 3 Tagen" />
<status-badge type="server" label="Alpha" icon="dns" />
```

## AvatarStack

28 px round avatars overlapping by 8 px with a 2 px card-coloured ring,
`+N` overflow and a trailing label.

| Prop | Type | Default |
|---|---|---|
| `avatars` | `AvatarItem[]` (`{ src, alt }`) | `[]` |
| `max` | `number` | `3` |
| `label` | `string` | `''` |

```html
<avatar-stack :avatars="rsvps" :max="3" label="12 Zusagen" />
```

## EmptyState

Centred empty block with a dashed border and exactly one action.

| Prop | Type | Default |
|---|---|---|
| `icon` | Material icon name | `auto_stories` |
| `title` | `string` | `Hier ist noch nichts` |
| `text` | `string` | `''` |
| `actionLabel` | `string` | `''` (no button) |
| `actionTo` | `RouteLocationRaw \| null` | `null` |
| `variant` | `'visitor' \| 'owner'` | `visitor` (primary button; owner uses secondary) |

Emits `action` on button click (also when `actionTo` is set).

```html
<empty-state
  icon="event"
  title="Noch keine Events"
  text="Lege das erste Event deiner Gemeinschaft an."
  action-label="Event erstellen"
  :action-to="{ name: 'create-event' }"
  variant="owner"
/>
```

## SectionTabs

Accessible tablist (`role="tablist"`, `role="tab"`, `aria-selected`, roving
tabindex). Arrow keys, Home and End move focus; button tabs activate on
focus, link tabs on Enter. Scrolls horizontally on small screens.

| Prop | Type | Default |
|---|---|---|
| `tabs` | `SectionTab[]` (`{ key, label, icon?, count?, to?, hidden?, dimmed? }`) | required |
| `modelValue` | `string` | `''` (falls back to first visible tab) |
| `sync` | `'none' \| 'query' \| 'route'` | `none` |
| `queryKey` | `string` | `tab` |
| `glass` | `boolean` | `false` (full-width glass bar with bottom rule) |
| `ariaLabel` | `string` | `Abschnitte` |

Emits `update:modelValue`. With `sync="query"` the active key is read from
and written to `?<queryKey>=` with `router.replace`. Tabs with `to` render as
router-links and the active tab follows the current route (longest matching
path), which is how `sync="route"` works with child routes. `dimmed` marks an
empty section; `hidden` removes the tab.

```html
<section-tabs
  v-model="tab"
  sync="query"
  glass
  :tabs="[
    { key: 'profil', label: 'Profil', icon: 'person' },
    { key: 'geschichten', label: 'Geschichten', icon: 'auto_stories', count: 4 },
    { key: 'galerie', label: 'Galerie', icon: 'photo_library', count: 0, dimmed: true },
  ]"
/>

<section-tabs
  sync="route"
  :tabs="[
    { key: 'overview', label: 'Übersicht', to: { name: 'fc', params: { id } } },
    { key: 'members', label: 'Mitglieder', count: 38, to: { name: 'fc-members', params: { id } } },
  ]"
/>
```

## PageHead

Page head with the page's `h1`.

| Prop | Type | Default |
|---|---|---|
| `eyebrow` | `string` | `''` |
| `title` | `string` | required |
| `lead` | `string` | `''` |

Slots: `actions` (right side, wraps below on narrow screens), `default`
(extras below, e.g. filters or SectionTabs).

```html
<page-head eyebrow="Verzeichnis" title="Charaktere" lead="Alle Charaktere auf Light.">
  <template #actions>
    <q-btn class="elpis-btn elpis-btn--primary" unelevated label="Charakter anlegen" to="/create-character" />
  </template>
</page-head>
```

## Breadcrumbs

`<nav aria-label="Brotkrumen"><ol>` trail with `›` separators; the last item
is the current page.

| Prop | Type | Default |
|---|---|---|
| `items` | `BreadcrumbItem[] \| null` (`{ label, to? }`) | `null` (derive from route) |

Without `items`, every record in `$route.matched` with `meta.breadcrumb`
contributes crumbs. `breadcrumb` is a string, an array of segments, or a
function of the route returning either (`BreadcrumbMeta` in `types.ts`).
A string contributes one crumb that links to its record. In an array, each
segment is a string or a `{ label, to? }` item; string segments render as
plain text except the last one, which links to the record. Named records link
with their own params; unnamed records link by path when the path has no
params. Empty labels are skipped.

```ts
// routes.ts
{ path: '/event/:id', name: 'event', meta: { breadcrumb: (route) => `Event ${route.params.id}` } }
{
  path: ':server/:character',
  meta: { breadcrumb: (route) => [{ label: 'Charaktere', to: '/profiles' }, route.params.character] },
}
```

ER2-204 put `meta.breadcrumb` on the character, venue, event, story,
noticeboard item, wiki, free company, community, gallery and image routes.
Where the route only carries an id (event, story, noticeboard item, image,
venue by id), the last segment is a generic noun ("Event", "Geschichte");
pages that know the title should pass `items` instead.

```html
<breadcrumbs />
<breadcrumbs :items="[{ label: 'Events', to: '/events' }, { label: event.title }]" />
```

## DirectoryCard

Directory tile (characters, free companies, communities, venues): 104 px
banner, 68 px avatar overlapping it with a 3 px ring, lore subtitle, meta.
Lifts 2 px on hover when `to` is set; the title link covers the whole card.

| Prop | Type | Default |
|---|---|---|
| `to` | `RouteLocationRaw \| null` | `null` |
| `bannerSrc` | `string` | `''` (token gradient) |
| `avatarSrc` | `string` | `''` (placeholder icon) |
| `avatarAlt` | `string` | `title` |
| `avatarShape` | `'round' \| 'crest'` | `round` |
| `placeholderIcon` | Material icon name | `person` |
| `title` | `string` | required |
| `subtitle` | `string` (IM Fell italic) | `''` |
| `meta` | `string` | `''` |

Slots: `badges` (top right, next to the avatar), `default` (plain text below
meta; sits under the card link), `tags`, `footer`. `badges`, `tags` and
`footer` stay clickable above the card link.

```html
<directory-card
  :to="`/${character.name}@${character.server}`"
  :banner-src="character.bannerUrl"
  :avatar-src="character.avatar"
  :title="character.name"
  subtitle="Die Hüterin der Silbernen Flamme"
  meta="Miqo'te · Alpha"
>
  <template #badges><status-badge type="rp-ic" /></template>
  <template #tags><status-badge type="server" label="Alpha" /></template>
</directory-card>
```

## EventCard

Event row: time column (day, start time, German relative time) | 64 px image
| title, place, live/recurring badges | AvatarStack + action slot. The image
is hidden below 600 px.

| Prop | Type | Default |
|---|---|---|
| `event` | `EventCardEvent` (`{ id, title, startDateTime, endDateTime?, imageSrc?, locationLabel?, recurringLabel?, live?, attendees?, attendeeLabel? }`) | required |
| `state` | `'default' \| 'live'` | `default` (`live` or `event.live` adds the 4 px live bar and badge) |
| `to` | `RouteLocationRaw \| null` | `/event/:id`; `null` disables the title link |

`startDateTime` / `endDateTime` accept an ISO string, epoch millis or a
`Date`. The relative label reads "in 2 Std." before the start, "seit 1 Std."
while running, and "vor 2 Tagen" afterwards; it refreshes every minute.

Slot: `action` (e.g. an RSVP button; stays clickable above the card link).

```html
<event-card :event="{
  id: 42,
  title: 'Abend in der Goldenen Feder',
  startDateTime: '2026-10-18T20:00:00+02:00',
  locationLabel: 'Lavendelbeete, Bezirk 12',
  recurringLabel: 'Jeden Samstag',
  attendees: rsvpAvatars,
  attendeeLabel: '12 Zusagen',
}">
  <template #action>
    <q-btn class="elpis-btn elpis-btn--secondary" flat label="Zusagen" />
  </template>
</event-card>
```
