# UI/UX Vision — Elpisgarten über Elpis Reborn hinaus

**Stand:** 2026-10-18
**Begleitdokumente:** `UI_UX_AUDIT.md` · `UI_UX_REWORK_PLAN.md` · `UI_UX_REWORK_BACKLOG.md` · `client/src/css/aetherium/AETHERIUM.md` · `memory.md`

**Scope.** Dieses Dokument ist ein Konzept, kein Ticket-Backlog. Es darf ausdrücklich das, was Elpis Reborn verbietet: Layout, Informationsarchitektur (IA), Navigation, Seitenstruktur und — in Stufe L — neue API-Fähigkeiten. Elpis Reborn bleibt dabei die Material- und Token-Grundlage (Aetherium); die Vision baut darauf auf, statt es zu ersetzen.

| | Elpis Reborn (laufend) | Diese Vision |
|---|---|---|
| Layouts / Routen | unverändert (Hard Constraint, PLAN §0, `memory.md`) | dürfen sich ändern |
| IA, Navigation, Seiten zusammenlegen | out of scope | Kern des Vorschlags |
| Neue Domänen, API, i18n | out of scope | nur in Roadmap-Stufe L |
| Oberflächen, Typo, Farbe, Motion | Kern | wird übernommen (Aetherium-Tokens) |

**Basis.**
- 31 Live-Screenshots des committeten Stands bei 1440 px Breite, Light- und Dark-Theme (Home, Charakterprofil inkl. aller Tabs, Kalender, Event-Detail, Treffpunkte, Gemeinschaften, FCs, Anschlagbrett, Geschichten, Wiki, Galerie, Dialoge).
- Bestehende Rework-Dokumente (Audit, Plan, Backlog, `memory.md`).
- Referenzrecherche (Partake.gg, FFXIV Venues, Lodestone, Wowhead, GW2-Wiki u. a., siehe §4).

---

## 1. Kernthesen

1. **Orientierung fehlt.** Die Oberleiste zeigt Namensschild, Theme-Schalter und Hamburger — keine sichtbare Primärnavigation, keine Suche, keine Breadcrumbs. Die Charakter-Icon-Leiste besteht aus neun unbeschrifteten Glyphen. Wer nicht schon weiß, wo etwas liegt, findet es nicht.
2. **"Was läuft heute?" ist nicht beantwortbar.** Die wichtigste Frage einer RP-Community — wo kann ich heute Abend spielen — wird durch ein schmales Kalender-Widget auf jeder Seite ("Keine Events gefunden") eher versteckt als beantwortet. Es fehlen Heute/Woche-Sichten, Öffnungsstatus von Treffpunkten und Teilnahme-Signale.
3. **Profile sind Formulare, keine Visitenkarten.** Das Charakterprofil ist eine generische graue Tabelle mit schwebendem Avatar und viel Leerraum. Der eigentliche Reichtum (Kontakte, Gerüchte, Tagebuch, P&P) liegt hinter unbeschrifteten Tabs.
4. **Inhaltsqualität bricht die Illusion.** Rohes Wiki-Markup (`[[Ciell'a Zennah]]`), "(FOLGT)"-Platzhalter, Test-Inhalte ("Test", "I") und Platzhalter-Überschriften ("Erwähnt in (...)") wirken wie eine Baustelle — unabhängig davon, wie schön die Oberflächen sind.
5. **Konsistenz ist die billigste Politur.** Sieben Akzentfarben für Buttons, ALL-CAPS-Material-Buttons neben Cinzel, englische Wochentage, zwei Datumsformate, uneinheitliche Header-Einrückungen. Das meiste davon ist CSS und Copy.

---

## 2. Befunde nach Priorität

Impact/Aufwand: H = hoch, M = mittel, L = niedrig. Screen-Namen entsprechen den Screenshot-Kennungen.

### 2.1 P0 — blockiert Kernaufgaben oder Lesbarkeit

| # | Screen(s) | Problem | Warum relevant | Vorschlag | Impact/Aufwand |
|---|---|---|---|---|---|
| 1 | dark-story-detail | CW-Chips im Dark-Theme braun auf braun auf Navy, Kontrast ca. 1,5:1 | Inhaltswarnungen sind Schutzfunktion; unlesbar = wirkungslos (WCAG 1.4.3) | Eigene CW-Tokens: Amber-Rahmen, Text `#F3D9A4`, Warn-Icon; CW-Zeile **über** dem Titel | H / L |
| 2 | alle Seiten, calendar | Kalender-Widget auf jeder Seite (~25 % Breite) mit "Keine Events gefunden" + 2 Filtern; auf `/calendar` verschwindet es und hinterlässt eine tote 370-px-Spalte | Frisst Lesebreite auf Inhaltsseiten, leerer Zustand signalisiert "hier ist nichts los" | Widget nur auf Home und Event-Seiten; sonst kompakte Pille "Nächstes Event"; Leerzustand als CTA "Trag deins ein"; Fließtext max. 72ch | H / M |
| 3 | global, char-* | Keine sichtbare Navigation: Top-Bar = Namensschild "EINE FREMDE GESTALT" + Theme + Hamburger; keine Suche, keine Breadcrumbs; Charakter-Icon-Leiste mit 9 unbeschrifteten Glyphen | Wayfinding ist die Voraussetzung für jede andere Aufgabe | Primärnav: Charaktere · Treffpunkte · Events · Geschichten · Anschlagbrett · Galerie · Wiki; Suchfeld in der Top-Bar; Breadcrumbs; beschriftete Profil-Tabs | H / M |
| 4 | alle Seiten | Logo-Hero belegt die ersten ~260 px jeder Seite (~30 % des Viewports bei 1440×900); Home wiederholt zusätzlich die Überschrift "Elpisgarten" | Inhalt beginnt "below the fold"; Branding verdrängt Aufgabe | Hero nur auf Home; sonst 40-px-Logo in der Top-Bar | H / L |

### 2.2 P1 — deutliche Qualitäts- oder Vertrauensverluste

| # | Screen(s) | Problem | Warum relevant | Vorschlag | Impact/Aufwand |
|---|---|---|---|---|---|
| 5 | char-contacts, event-detail (OOC) | Rohes Wiki-Markup sichtbar: `[[Ciell'a Zennah]]`, `[[Nymeia's Raben]]`, `[[ Seikbhar Geissgaeg\|Grollender Seebär]]`; Platzhalter-Überschrift "Erwähnt in (...)" | Wirkt kaputt; Beziehungen sind der soziale Kern des RP-Netzwerks | Wikilinks als Avatar-Chips mit Beziehungslabel rendern; fehlende Ziele gedimmt statt als Rohtext | H / M |
| 6 | char-inventory, -personality, -contacts, -rumors, wiki, stories, communities | "(FOLGT)"-Felder, Wiki-Seite "Test" mit leerem Body, Geschichten "Test"/"I", Gemeinschaften mit 1 Eintrag | Leere und Testinhalte senken wahrgenommene Aktivität | Leere Felder für Besucher ausblenden; für Besitzer "Noch leer – jetzt ergänzen"; komplett leere Tabs verbergen; Test-Inhalte filtern | H / L |
| 7 | global | Akzent-Suppe: lila Buttons (VORHERIGER MONAT), goldener Toggle, blassgoldene Links, Discord-Blurple, orange ABLEHNEN, lila LINK KOPIEREN, pinker W100; Dark wechselt auf Stahlblau | Keine erkennbare Aktionshierarchie | Genau ein Primary, ein Secondary (Outline), ein Danger (`#C7484F`); Blurple nur für Discord-Login | M / L |
| 8 | Light: char-contacts, event-detail, Paginierung | Link-Kontrast im Light-Theme ca. 2,2:1 (blassgold "Ciell Zennah", "Treffpunkt anzeigen"); Meta ("vor 7 Monaten") und Paginierungs-Chevrons blass | WCAG AA verfehlt; Links nicht als Links erkennbar | Links Bronze `#8A5A14` (≈ 5,2:1 auf Pearl `#F5EFE2`), Unterstreichung bei Hover/Fokus; Meta mindestens `#6B6B6B` (≈ 4,6:1) | H / L |
| 9 | calendar, settings, search | ALL-CAPS-Material-Buttons (< VORHERIGER MONAT, FEHLERDIAGNOSE ERLAUBEN, Such-Tabs PROFILE/TREFFPUNKTE) kollidieren mit Cinzel; deutsche Komposita in Versalien kaum lesbar | Markenbruch, Lesbarkeit | Satzschreibweise; "Link kopieren" als Share-Icon im Seitenkopf | M / L |
| 10 | dark-char-profile, dark-venue, dark-calendar | Weiße 1-px-Tabellentrenner im Dark-Theme hart; Carrd-Embed 650 px weiße Blendfläche; leere rechte Kalenderspalte | Dark-Theme wirkt unfertig, blendet | Trenner `rgba(255,255,255,.08)`; Carrd in gerahmter, eingeklappter Karte "Externe Seite" | M / L |
| 11 | home | Grid unbalanciert: Aushänge (3 kurz) vs. Geschichten (3 hoch) → ~160 px Leerraum; Gemeinschaften 1 Eintrag vs. 3 Treffpunkte; "Alle Gesellschaften →" bricht um | Startseite wirkt zufällig statt kuratiert | Bento-Layout mit festen Item-Zahlen; "Alle …"-Link in Fußzeile der Kachel | M / M |
| 12 | communities, fcs, noticeboard, screenshots, calendar | Header-Einrückung uneinheitlich (137 / 66 / 105 / 93 px); englische Wochentage ("Monday"); "2 April 2026" vs. "2. April 2026" | Kleine Brüche summieren sich zu "Flickwerk" | Einheitlich linksbündig am Content-Raster; durchgängig `de-DE`-Locale | M / L |

### 2.3 P2 — Politur und Delight

| # | Screen(s) | Problem | Warum relevant | Vorschlag | Impact/Aufwand |
|---|---|---|---|---|---|
| 13 | venues, noticeboard, fcs | Verzeichniszeilen ohne Bildsprache; "SHIVA" in jeder Zeile | Scannen nach Atmosphäre unmöglich; redundante Info | Banner-Karten mit Öffnungsstatus und nächstem Event; Server-Tag ausblenden, wenn bereits gefiltert | M / M |
| 14 | image-slides | Banner in 1300×900 grauer Box, 60 % leer; 20 pinke Punkte; kein Schließen-Button | Galerie ist ein Showcase-Moment | Full-Bleed-Lightbox, Thumbnail-Leiste, X, Esc/Pfeiltasten, Zähler "3 / 20" | M / L |
| 15 | consent-dialog | "spaeter / Abstuerze / Geraetekontext / uebertragen" ohne Umlaute; schwacher Scrim; "Ablehnen" als Warnung gestylt (Nudging) | Vertrauen; DSGVO verlangt gleichwertige Wahl | Umlaute; Scrim .6; beide Optionen gleich gewichtet | M / L |
| 16 | char-gallery | Letzte Reihe zentriert; Menü-Pixel-Icons zwischen Screenshots | Unruhiges Raster | Linksbündig; Alben/Tags | L / L |
| 17 | char-pnp | "Jägerin / Diplomatin / Hä ndlerin" — Umbruch mitten im Wort; "Nicht ausgefüllt" gleich gewichtet wie Werte; W100 pink und wirkt deaktiviert | Lesbarkeit des Bogens | `hyphens: auto` + `lang="de"`; leere Werte dimmen; W100 im Primary | L / L |
| 18 | char-profile | Avatar schwebt links vom zentrierten Namen; generische graue Tabelle; ~500 px Leerraum darunter | Profil ist die meistbesuchte Seite einer RP-Plattform | Abenteurerplakette (siehe §4.3): Chips, 3-spaltige Fakten, Vorschauen der anderen Tabs | H / M |

### 2.4 Live-Bugs

Konkrete Fehler, unabhängig von der Vision behebbar:

| Bug | Ort | Art |
|---|---|---|
| Story-CW-Chips und Byline im Dark-Theme ungethemt (`#616161` für Text und Hintergrund) | Story-Detail | Theming |
| Dialog-Hinweistext `#555` ungethemt | Dialoge (Dark) | Theming |
| Tab-Panel `#1D1D1D` hart codiert | Dark-Theme | Theming |
| Tippfehler "Gallerie" | Navigation/Überschrift | Copy |
| Englische Labels "Edit" / "Preview" / "Description" | Editoren | Copy/i18n |
| `color="danger"` nicht definiert, Dialogtitel "Confirm Delete" | MyContent | Code + Copy |
| Charakter-Drawer ohne aktiven Zustand | Character.vue | Komponente |
| Englische Wochentage in der Monatsansicht | Kalender | Locale |

---

## 3. Abgleich mit Elpis Reborn

Grundlage: `UI_UX_REWORK_BACKLOG.md` (Stand der Done-Markierungen). "Gelöst" wird nur behauptet, wenn das Akzeptanzkriterium des Tickets den Befund tatsächlich adressiert.

| # | Befund | Durch WIP gelöst (Ticket) | Nur visuell berührt | Braucht IA-Änderung (außerhalb Elpis Reborn) |
|---|---|---|---|---|
| 1 | CW-Chips Dark | teilweise — ELPIS-501 macht den Story-Body zu Parchment, regelt aber keine CW-Chip-Tokens; Live-Bug besteht | ja | CW-Zeile über Titel = kleine Strukturänderung |
| 2 | Kalender-Widget überall | nein — ELPIS-307/308 stylen nur Karte und Collapse | ja (307, 308) | ja: Widget nur auf Home/Events |
| 3 | Keine Navigation | nein — ELPIS-101/102/104 stylen Header und Drawer, Menüverhalten bleibt | ja (101, 102, 104) | ja: Primärnav, Suche, Breadcrumbs |
| 4 | Hero auf jeder Seite | nein — ELPIS-108/109 ergänzen den Hero eher | ja | ja: Hero nur auf Home |
| 5 | Rohe Wikilinks | teilweise — ELPIS-209 verbessert nur den Eingabehinweis, ELPIS-506/508 gerenderte Wiki-Links; Kontakte/Event-OOC zeigen weiterhin Rohtext | ja | Chip-Rendering = Komponentenlogik |
| 6 | Platzhalter / Testdaten | nein (offen; `/test-*`-Routen sind laut Audit §27.12 separat zurückgestellt) | nein | ja: leere Tabs verbergen |
| 7 | Akzent-Suppe | teilweise — Aetherium-Tokens (ELPIS-003) existieren, aber keine verbindliche Button-Hierarchie | ja | nein |
| 8 | Link-Kontrast Light | teilweise — ELPIS-405 restylt Paginierungs-Chevrons; Link-Farbe offen | ja | nein |
| 9 | ALL-CAPS-Buttons | nein (offen) | nein | nein (CSS + Copy) |
| 10 | Dark-Trenner / Carrd | teilweise — ELPIS-205 Hover auf Detail-Zeilen; Trennerfarbe und Carrd offen | ja | Carrd einklappen = kleine Strukturänderung |
| 11 | Home-Grid | nein — ELPIS-110/111 stylen Karten und Reveal, Layout bleibt per Constraint | ja | ja: Bento-Layout |
| 12 | Einrückung / Locale | nein (offen; i18n explizit out of scope) | nein | nein |
| 13 | Verzeichnisse ohne Bilder | nein — ELPIS-401–403 Vellum-Karten, ELPIS-510 Chip-Farben; keine Bilder/Status | ja | ja: Banner-Karten + Öffnungsstatus |
| 14 | Image-Slides | teilweise — ELPIS-610 Nav-Buttons + Cross-Fade; Box, Punkte, fehlendes X offen | ja | Lightbox-Layout |
| 15 | Consent-Dialog | nein (offen) | nein | nein |
| 16 | Galerie-Raster | teilweise — ELPIS-612 Hover/Caption; Ausrichtung offen | ja | Alben/Tags |
| 17 | P&P-Umbruch | nein — ELPIS-211/212 nur Reveal und Würfel-Styling | ja | nein |
| 18 | Profil-Header | nein — ELPIS-202/203/204 Avatar-Rahmen, Parchment, Typo; Struktur bleibt | ja | ja: Abenteurerplakette |
| Bug | Drawer ohne aktiven Zustand | nur für Venue (ELPIS-406); Charakter-Drawer offen | — | — |
| Bug | Löschdialog `danger` | teilweise — ELPIS-611 betrifft `ConfirmImageDeleteDialog`, nicht MyContent | — | — |

**Fazit:** Elpis Reborn löst die Material- und Stimmungsfrage gut, adressiert aber keinen der vier P0-Befunde vollständig. Drei davon (2, 3, 4) sind per Constraint nicht lösbar, ohne die IA anzufassen — genau hier setzt diese Vision an.

---

## 4. Vision-Features

Jedes Feature referenziert ein Board auf der Penpot-Seite **„Vision (Konzept)“** im File „Elpisgarten - Elpis Reborn“. Alle Screens liegen als Hydaelyn-Board (y = 0) und als Zodiark-Board (y = 3200) vor; rechts neben jedem Screen steht eine gelbe Konzept-Notiz („Was ändert sich / warum“). Die Bestands-Screens auf den anderen Seiten bleiben unverändert.

| Board | Position (x) | Inhalt |
|---|---|---|
| E · Komponenten | 0 | Icons, Button-Hierarchie, Status/CW-Badges, Avatar-Stapel, Nav & Tabs, Hover-Karten, Strg+K-Palette, Leerzustände, Event-Karte, Shell (Top-Bar, Footer) |
| A · Shell & Home-Hub | 2000 | Kompakte Top-Nav, Home-Hero, „Heute in Eorzea“ mit Zeitstrahl, „Jetzt geöffnet“, Aktivitäts-Feed, Galerie-Band |
| B · Charakterprofil | 4000 | Abenteurerplakette, beschriftete Tabs, Übersicht mit Vorschauen; darunter Besitzer-Ansicht (Ausschnitt) |
| C · Events | 6000 | Liste nach Tagen, Heute/Woche/Monat, Filter-Chips, Mini-Kalender, wiederkehrende Abende |
| C · Event-Detail | 8000 | Hero mit Datumsblock, Aktionsleiste (Zusage, .ics), Ablauf, strukturierter Ort, Wikilink-Chips |
| C · Treffpunkte | 10000 | Bildkarten mit Öffnungsstatus, Filter, nächstes Event, Stammgäste |
| D · Leseansicht | 12000 | Lesespalte, Kapitelnavigation, CW-Zeile, Reaktionen; daneben CW-Schleier (Zustand vor dem Aufdecken) |

Zweite Reihe (Hydaelyn y = 7000, Zodiark y = 10200) – je eine vollständige Beispielseite pro Navigationsbereich:

| Board | Position (x) | Inhalt |
|---|---|---|
| F · Charaktere | 0 | Verzeichnis mit Bereichs-Tabs (Personen · Freie Gesellschaften · Communities), „Gerade im RP“-Leiste, Charakter-Karten mit Status |
| G · Treffpunkt-Detail | 2000 | Hero mit Live-Status, Bereichs-Tabs statt Drawer, Wochen-Öffnungszeiten, Angebot, nächste Abende, eingeklappte Carrd-Seite, Team |
| H · Geschichten | 4000 | Tabs nach Textart, Empfehlung der Woche, „Weiterlesen“ mit Fortschritt, Karten mit Lesezeit, Serie und Inhaltswarnung |
| I · Anschlagbrett | 6000 | Angeheftete Aushänge, [Typ]-Präfixe in Typfarbe, Mauerwerk-Raster, Hinweis „auf Discord“ |
| I · Aushang | 8000 | Pergament-Aushang mit Bild und Initiale, Discord-Embed-Vorschau, Kontakt-Box, ähnliche Aushänge |
| J · Galerie | 10000 | Tabs Screenshots/Kunstwerke/Alben, Bildraster mit Hover; darunter die Lightbox (eine Fassung, in beiden Themes dunkel) |
| K · Wiki | 12000 | Inhaltsverzeichnis, Artikel mit gerenderten Wikilinks und Hover-Karte, Infobox, „Erwähnt in“ |
| L · Gemeinschaften | 14000 | FC-Karten mit Wappen, Schwerpunkt, „Nimmt Mitglieder auf“, Mitgliedern und nächstem Termin |
| L · Freie Gesellschaft | 16000 | Hero mit Wappen, „Bewerben“, Was wir spielen, Mitglieder mit Rang und RP-Status, Eckdaten |

Gemeinschaften (FCs, Communities) liegen in der neuen IA unter „Charaktere“ als zweiter und dritter Bereichs-Tab. Ein Index-Board über Reihe 1 (y = −760) listet alle Screens.

Neue Tokens (beide Sets): `vision.primary`, `vision.on-primary`, `vision.primary-hover`, `vision.danger`, `vision.on-danger`, `vision.live`, `vision.live-bg`, `vision.cw-bg`, `vision.cw-text`, `vision.cw-border`, `vision.now`, `vision.scrim`, `vision.card`, `vision.card-hover`, `vision.note-bg`, `vision.note-text`. Die Konzepte nutzen sonst die Aetherium-Tokens (`surface.*`, `ink.*`, `rule.*`) – im Zodiark-Theme also die violette Elpis-Reborn-Palette, nicht das heutige Navy.

### 4.1 "Heute in Eorzea" — Live-Hub auf Home

- **Referenz:** Partake.gg "Happening Now / Today" — https://www.partake.gg/ ; Lodestone Community Wall — https://eu.finalfantasyxiv.com/lodestone/
- **Idee:** Home ersetzt das gleichförmige Kachel-Grid durch einen Hub mit drei Bändern: **Jetzt** (laufende Events + geöffnete Treffpunkte), **Heute Abend** (Timeline bis Mitternacht), **Neu in der Community** (Geschichten, Aushänge, neue Charaktere als Feed). Leerzustände werden zu Einladungen ("Heute noch nichts geplant — trag dein Event ein").
- **Nutzen für RP-Community:** Beantwortet die häufigste Frage in Sekunden; erzeugt Sichtbarkeit für kleine Veranstalter; der Feed macht Aktivität spürbar und motiviert eigenes Schreiben.
- **Konzept-Board:** `Penpot: Vision (Konzept) › A · Shell & Home-Hub`

### 4.2 Navigation und Shell

- **Referenz:** Lodestone-Kopfleiste — https://eu.finalfantasyxiv.com/lodestone/ ; Ctrl+K-Paletten (kbar, GitHub, Linear) — https://kbar.vercel.app/
- **Idee:** Kompakte Top-Bar (Logo 40 px, Primärnav mit sieben Bereichen, Suchfeld, Benutzer-Menü, Theme). Hero ausschließlich auf Home. Breadcrumbs auf allen Detailseiten (`Charaktere › Aeris Khatayin`). Das Kalender-Widget entfällt im Konzept ganz: „Was läuft?“ beantworten Home-Hub und `/events`, Erinnerungen kommen über die Glocke. Unter 1024 px eine Bottom-Bar mit 5 Zielen statt Hamburger-only (nicht als Board ausgearbeitet).
- **Nutzen für RP-Community:** Neue Spieler finden sich zurecht; Stammgäste sparen Klicks; Inhaltsseiten gewinnen ~25 % Breite und ~260 px Höhe zurück.
- **Konzept-Board:** `Penpot: Vision (Konzept) › A · Shell & Home-Hub`

### 4.3 Abenteurerplakette — das Charakterprofil

- **Referenz:** Lodestone-Charakterkopf (Titel über Name, World [DC], FC-Wappen, Ausrüstung um das Portrait) — https://na.finalfantasyxiv.com/lodestone/character/4397814/ ; D&D Beyond Sticky-Stat-Header; Profil-Akzentfarbe wie Carrd/Toyhouse
- **Idee:** Kopf als "Plakette": Banner, Portrait im Job-Rahmen (`AetheryteBadge`), Titel über Name, Welt/DC, FC-Wappen, Chips (Volk, Alter, Rolle, RP-Stil). Darunter 3-spaltige Kurzfakten statt grauer Tabelle, dann Vorschauen der anderen Bereiche (letzter Tagebucheintrag, 3 Kontakte als Avatar-Chips, ein Gerücht). Tabs beschriftet, Leer-Tabs für Besucher unsichtbar. Optionale Profil-Akzentfarbe innerhalb der Aetherium-Grenzen.
- **Nutzen für RP-Community:** Der erste Eindruck eines Charakters entsteht in 5 Sekunden statt nach drei Tab-Klicks; Kontakte werden zu Einstiegspunkten ins Netzwerk.
- **Konzept-Board:** `Penpot: Vision (Konzept) › B · Charakterprofil`

### 4.4 Event-Entdeckung

- **Referenz:** Partake.gg Today/Week/Month — https://www.partake.gg/ ; GW2 Event-Timer mit Jetzt-Linie — https://wiki.guildwars2.com/wiki/Event_timers ; RSVP-Zähler + Avatar-Stack + .ics (Meetup/Discord-Events)
- **Idee:** Liste zuerst, gruppiert nach Tag; Zeiträume als Tabs (Heute · Diese Woche · Monat), das Monatsraster wird zur kleinen Sprungnavigation. Die horizontale Timeline mit Jetzt-Marker (Events als Balken nach Dauer) sitzt im Home-Hub (Board A). Wiederkehrende Events mit Regel-Chip "Jeden Freitag, 21:00" und den nächsten 3 Terminen. Pro Event: "Interessiert"-Button, Zähler + Avatar-Stack der eigenen Charaktere, `.ics`-Export. Filter nach Typ und Server als Chips statt Dropdowns.
- **Nutzen für RP-Community:** Spontanes Mitspielen wird leicht; Veranstalter sehen Resonanz vorab; Kalenderexport holt Events in den Alltag der Spieler.
- **Konzept-Board:** `Penpot: Vision (Konzept) › C · Events`

### 4.5 Event-Detail mit strukturiertem Ort

- **Referenz:** FFXIV Venues (kopierbare Adresse) — https://ffxivvenues.com ; GitHub nightblossom-ffxiv/umbra-nightlife — https://github.com/nightblossom-ffxiv/umbra-nightlife
- **Idee:** Ort als Pfad `Welt › Bezirk › Ward › Plot` mit Kopier-Button (Chatbefehl-taugliche Zeichenkette), Link zum Treffpunkt-Profil. IC- und OOC-Infos klar getrennt; Wikilinks im OOC-Teil als Chips. Countdown bis Beginn, Veranstalter als Hover-Karte.
- **Nutzen für RP-Community:** Kein Abtippen von Adressen, weniger "Wo genau ist das?"-Nachfragen im Discord.
- **Konzept-Board:** `Penpot: Vision (Konzept) › C · Event-Detail`

### 4.6 Treffpunkte mit "Geöffnet"-Badges

- **Referenz:** FFXIV Venues "open now / opening soon" — https://ffxivvenues.com
- **Idee:** Verzeichnis als Banner-Karten mit Status-Badge (Geöffnet · Öffnet in 2 h · Geschlossen), nächstem Event, Atmosphäre-Tags. Filter „Heute geöffnet“, Sortierung „offen zuerst“; geschlossene Orte gedimmt statt versteckt. Carrd-Einbettungen als eingeklappte Karte "Externe Seite".
- **Nutzen für RP-Community:** Treffpunkte werden nach realer Verfügbarkeit gefunden, nicht nach Alphabet; kleine Venues profitieren von Status-Sichtbarkeit.
- **Konzept-Board:** `Penpot: Vision (Konzept) › C · Treffpunkte`

### 4.7 Leseansicht für Geschichten

- **Referenz:** Medium/AO3-Leseansicht; World Anvil Kapitel-Navigation — https://www.worldanvil.com/
- **Idee:** Spalte 68ch, Kapitelnavigation, Lesezeit, Fortschritt (baut auf ELPIS-503 auf). Inhaltswarnungen als **CW-Schleier**: Text bleibt verschleiert, bis die Warnung bestätigt wird; Bestätigung pro Sitzung merkbar. Reaktionen statt Likes: "Gänsehaut", "Mehr davon!".
- **Nutzen für RP-Community:** Schutz vor ungewollten Inhalten ohne Zensur; Autoren erhalten spezifisches, freundliches Feedback.
- **Konzept-Board:** `Penpot: Vision (Konzept) › D · Leseansicht`

### 4.8 Komponenten-Bausteine

- **Referenz:** Wowhead-Tooltips — https://www.wowhead.com/tooltips ; kbar — https://kbar.vercel.app/
- **Idee:**
  - **Hover-Karten** für Charaktere, Treffpunkte, FCs: Portrait, Kurzfakten, Präsenzstatus.
  - **Strg+K-Palette**: Springen zu Charakter/Treffpunkt/Event, Aktionen ("Neues Event", "Charakter wechseln").
  - **Button-Hierarchie**: Primary (Gold), Secondary (Outline), Ghost, Danger — Satzschreibweise.
  - **Leerzustände**: Icon + Überschrift + ein Satz + genau eine Aktion; unterschiedliche Texte für Besitzer und Besucher (später mit Elpis-Blüte aus dem Rework-Plan).
  - **CW-Chip**: Amber-Rahmen, Warn-Icon, AA-Kontrast in beiden Themes.
- **Nutzen für RP-Community:** Ein konsistenter Werkzeugkasten macht neue Features billiger und das Netzwerk "durchklickbar".
- **Konzept-Board:** `Penpot: Vision (Konzept) › E · Komponenten`

### 4.9 RP-Präsenzstatus

- **Referenz:** Discord/Steam-Presence; Lodestone Online-Status
- **Idee:** Selbst gesetzter Status pro Charakter: **IC** (in Charakter, ansprechbar), **OOC**, **LFRP** (sucht Spiel), optional mit Ort und Ablaufzeit. Als Punkt am Avatar, Chip in der Plakette, Filter im Verzeichnis ("Sucht gerade RP").
- **Nutzen für RP-Community:** Verbindet Portal und Spiel; senkt die Schwelle, Fremde anzusprechen.
- **Konzept-Board:** `Penpot: Vision (Konzept) › B · Charakterprofil` und `Penpot: Vision (Konzept) › E · Komponenten`

### 4.10 Ausblick (ohne Board)

| Idee | Referenz | Kurzbeschreibung |
|---|---|---|
| Beziehungs-Sternbild | World Anvil Beziehungsdiagramme — https://www.worldanvil.com/ | Kontakte eines Charakters als Konstellation; Kanten nach Beziehungsart |
| Eorzea-Ortskarte | Hoyolab Interactive Map — https://act.hoyolab.com/ys/app/interactive-map/ | Treffpunkte und Events auf einer stilisierten Karte nach Bezirk |
| Plakette als PNG-Export | Lodestone-/Chronicle-Karten | Abenteurerplakette als teilbares Bild für Discord/Social |
| Aktivitäts-Feed-Filter | Lodestone Community Wall — https://eu.finalfantasyxiv.com/lodestone/ | Feed filtern nach "Meine Kontakte", "Meine FC", Typ |

---

## 5. Barrierefreiheit

Laut Audit (§ A11y) bisher unbearbeitet. Die Vision macht diese Punkte zur Voraussetzung, nicht zur Nacharbeit.

| Thema | Ist-Zustand | Ziel |
|---|---|---|
| Skip-Link | fehlt | "Zum Inhalt springen" als erstes fokussierbares Element, sichtbar bei Fokus |
| Fokus-Fallen | Dialoge nicht auditiert | Fokus wandert in Dialog, bleibt dort, kehrt beim Schließen zum Auslöser zurück; Esc schließt |
| Screenreader | kein Durchgang erfolgt | NVDA + VoiceOver auf Home, Profil, Kalender, Story; Landmarks (`header`, `nav`, `main`), sinnvolle Überschriftenhierarchie |
| Icon-only-Navigation | Charakter-Leiste (9 Glyphen), News-Sidebar | Sichtbare Labels; wo Platz fehlt mindestens `aria-label` + Tooltip |
| Kontrast Text | Links Light ~2,2:1; CW-Chips Dark ~1,5:1 | Links `#8A5A14` (≈ 5,2:1 auf `#F5EFE2`); CW-Text `#F3D9A4` auf Navy (> 10:1); Meta ≥ `#6B6B6B` (≈ 4,6:1) |
| Kontrast UI | blasse Chevrons, weiße Trenner im Dark | Bedienelemente ≥ 3:1 (WCAG 1.4.11); Trenner dekorativ dezent |
| Zielgrößen | Chevrons, Chip-X, Würfel-Icons klein | min. 24×24 px (WCAG 2.2, 2.5.8), Ziel 44×44 px für Primäraktionen |
| Sprache | gemischtes DE/EN | `lang="de"` am Dokument, englische Passagen auszeichnen; `hyphens: auto` |
| Motion | Reduced-Motion-Audit erledigt (ELPIS-807) | neue Vision-Komponenten (Timeline, Schleier, Palette) im selben Raster prüfen |

---

## 6. Roadmap

Aufwand grob in Personentagen (PT) für eine Person mit Codebase-Kenntnis.

| Stufe | Item | Befund/Feature | Aufwand | Abhängigkeit |
|---|---|---|---|---|
| **S — Quick Wins** (CSS/Copy, keine API) | CW-Chip-Tokens beide Themes | #1, Bug | 0,5 PT | Aetherium-Tokens (vorhanden) |
| | Link- und Meta-Farben Light | #8 | 0,5 PT | — |
| | Button-Hierarchie + Satzschreibweise | #7, #9 | 1–2 PT | Abstimmung Primary/Secondary |
| | Dark-Trenner, hart codierte Farben (`#616161`, `#555`, `#1D1D1D`) | #10, Bugs | 0,5 PT | — |
| | `de-DE`-Locale für Datum/Wochentage | #12, Bug | 0,5 PT | — |
| | Copy: Umlaute Consent, "Galerie", Edit/Preview/Description, "Confirm Delete" | #15, Bugs | 0,5 PT | — |
| | `hyphens: auto` + `lang="de"`, P&P-Dimmung | #17 | 0,5 PT | — |
| | Header-Einrückung vereinheitlichen | #12 | 0,5 PT | — |
| | Skip-Link | §5 | 0,5 PT | — |
| **M — Struktur/IA** (nur Frontend) | Top-Bar mit Primärnav + Suche, Hero nur Home | #3, #4, §4.2 | 4–6 PT | Freigabe IA-Änderung (bricht Elpis-Reborn-Constraint) |
| | Kalender-Widget nur Home/Events, Pille sonst | #2 | 1–2 PT | Top-Bar |
| | Breadcrumbs | #3 | 1–2 PT | Routen-Metadaten |
| | Beschriftete Profil-Tabs, leere Tabs/Felder verbergen | #3, #6 | 2 PT | — |
| | Wikilinks als Chips rendern | #5 | 2–3 PT | Charakter-Lookup (bestehende API) |
| | Abenteurerplakette (ohne Präsenz) | #18, §4.3 | 4–5 PT | Wikilink-Chips |
| | Home-Bento / "Heute in Eorzea" (mit vorhandenen Daten) | #11, §4.1 | 4–6 PT | Top-Bar |
| | Event-Sichten Heute/Woche/Monat + Timeline | §4.4 | 4–5 PT | vorhandene Event-API |
| | Lightbox-Neubau | #14 | 1–2 PT | — |
| | Hover-Karten, Strg+K-Palette, Leerzustände | §4.8 | 5–7 PT | Such-API (vorhanden) |
| | Leseansicht + CW-Schleier (ohne Reaktionen) | §4.7 | 3 PT | CW-Chip |
| | Strukturierter Ort mit Kopier-Button (Anzeige) | §4.5 | 1–2 PT | Treffpunkte haben bereits `housingArea`, `ward`, `plot`, `room`, `subdivision` (`venue.entity.ts`); Event-Orte (`EventLocation`) nur Freitext `address` + optionaler Venue-Link → strukturiert nur, wenn das Event an einem Treffpunkt hängt |
| | Fokus-Fallen + SR-Durchgang | §5 | 3 PT | Komponenten stabil |
| **L — Backend/API** | RSVP "Interessiert" + Avatar-Stack + `.ics` | §4.4 | 5–8 PT | neue Entity + Endpunkte; Event-Sichten (M) |
| | Wiederkehrende Events (Regeln, nächste Termine) | §4.4 | 5–8 PT | Event-Schema-Erweiterung |
| | RP-Präsenzstatus | §4.9 | 5–7 PT | Entity + WebSocket (Socket.io vorhanden) |
| | Öffnungszeiten-Logik "Geöffnet / Öffnet in" | §4.6, #13 | 3–6 PT | Treffpunkte haben eine Wochen-Vorlage (`eventStartWeekday`, `eventStartTime`, `eventEndTime` in `venue.entity.ts`) – reicht für einen ersten „Geöffnet“-Status; echte Öffnungszeiten (mehrere Tage, Ausnahmen) brauchen ein neues Feld; Zeitzone Serverzeit |
| | Reaktionen auf Geschichten | §4.7 | 3–5 PT | Entity + Moderation |
| | Testinhalte serverseitig filtern / `/test-*` entfernen | #6 | 1–2 PT | Audit §27.12 |

**Reihenfolge-Empfehlung:** S komplett vor dem Elpis-Reborn-Abschluss (keine Constraint-Verletzung); danach Entscheidung, ob Stufe M als "Elpis Reborn 2" mit gelockerter Layout-Regel läuft.

---

## 7. Validierung

Bisher gibt es weder Personas noch Nutzerforschung; geplant ist nur der 5-Sekunden-Test (ELPIS-811). Vorschlag: leichtgewichtig, aber vor und nach Stufe M.

### 7.1 Methode

- **5-Sekunden-Test (ELPIS-811)** beibehalten, um zwei Fragen erweitern: "Was kann man hier tun?" und "Wo würdest du ein Event finden?".
- **3 aufgabenbasierte Tests**, je 5 Teilnehmende (Mischung: Stammnutzer, neue Light-EU-Spieler, ein Screenreader-Nutzer, wenn möglich), Think-Aloud, remote via Discord-Screenshare, ~20 min.

| Aufgabe | Erfolgskriterium | Prüft Befunde |
|---|---|---|
| "Finde ein Event heute Abend." | Event-Detail mit Ort geöffnet, Ort kopiert | #2, #3, #4, §4.1, §4.4, §4.5 |
| "Finde einen Charakter und seine Kontakte." | Profil eines vorgegebenen Charakters geöffnet, einem Kontakt weitergefolgt | #3, #5, #18, §4.3, §4.8 |
| "Lies eine Geschichte mit Inhaltswarnung." | CW vor dem Lesen wahrgenommen und benannt; Text erreicht | #1, §4.7, §5 |

### 7.2 Metriken

| Metrik | Messung | Ziel nach Stufe M |
|---|---|---|
| Aufgabenerfolg | Anteil ohne Hilfe gelöst | ≥ 80 % je Aufgabe |
| Zeit bis Ziel | Stoppuhr ab Start | "Event heute" < 30 s |
| Fehlklicks | Klicks auf falsche Ziele | ≤ 2 pro Aufgabe |
| CW-Wahrnehmung | Teilnehmende nennen Warnung vor dem Text | 5/5 |
| SEQ (Single Ease Question, 1–7) | nach jeder Aufgabe | ≥ 5,5 |
| Analytics (falls vorhanden, datensparsam) | Anteil Sitzungen mit Event-Detail-Aufruf; Suchnutzung; Absprungrate Home | Trend steigend bzw. sinkend gegenüber Baseline |
| Inhaltsqualität | Anzahl sichtbarer "(FOLGT)"/Roh-Wikilinks auf Stichprobe von 20 Profilen | 0 |

### 7.3 Ablauf

1. Baseline-Runde auf dem aktuellen Stand (nach Stufe S).
2. Penpot-Boards A–E (Seite „Vision (Konzept)“) als klickbarer Prototyp für dieselben Aufgaben – dafür fehlen noch die Prototyp-Verknüpfungen.
3. Umsetzung Stufe M, Wiederholung der Tests, Vergleich mit Baseline.
4. Ergebnisse in `memory.md` festhalten; Stufe-L-Features nach gemessenem Bedarf priorisieren (z. B. RSVP nur, wenn "Event heute" weiterhin zögerlich gelöst wird).
