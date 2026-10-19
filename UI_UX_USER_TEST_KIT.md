# Nutzertest-Kit — Elpis Reborn 2

**Bezug:** `UI_UX_VISION.md` §7 (Validierung), ELPIS-811 (5-Sekunden-Test)
**Stand:** 2026-10-19
**Ziel:** Die drei Aufgabentests aus §7.1 und den 5-Sekunden-Test mit wenig Aufwand, vergleichbar und datensparsam durchführen: einmal als Baseline, einmal nach Stufe M.

Dieses Kit ist so geschrieben, dass eine Person ohne UX-Vorerfahrung die Sitzungen moderieren kann. Alles, was gesagt wird, steht wörtlich im Moderationsleitfaden (Abschnitt 4).

---

## 1. Überblick

| Baustein | Dauer | Teilnehmende | Form |
|---|---|---|---|
| 5-Sekunden-Test (ELPIS-811) | ca. 3 min | 5 bis 10 | remote, Discord-Screenshare oder asynchron per Formular |
| Aufgabentests 1–3 mit Think-Aloud | ca. 20 min | 5 je Runde | remote, Discord-Screenshare, eine Person moderiert, optional eine protokolliert |
| Screenreader-Durchgang | ca. 30 min | 1 Screenreader-Nutzer:in (wenn möglich) plus internes Team | remote oder intern, Checkliste in Abschnitt 8 |

Mischung der Teilnehmenden je Runde (nach §7.1): Stammnutzer:innen, neue Light-EU-Spieler:innen, wenn möglich eine Person, die einen Screenreader nutzt. Niemand aus dem Entwicklungsteam.

Testumgebung: Produktivseite https://elpisgarten.de (Baseline) bzw. die Vorschau des jeweiligen Stands. Desktop-Browser in normaler Fenstergröße; für eine Sitzung pro Runde ein Smartphone (390 px Breite reicht), damit die mobile Navigation mitgeprüft wird.

---

## 2. Rekrutierungstext für den Community-Discord

> **Hilf uns, Elpisgarten besser zu machen (20 Minuten, Discord)**
>
> Wir überarbeiten gerade das Aussehen und die Bedienung von Elpisgarten. Bevor wir weiterbauen, wollen wir sehen, wo ihr hängenbleibt – nicht ihr werdet getestet, sondern die Seite.
>
> **Was du machst:** In einem Discord-Call teilst du deinen Bildschirm und löst drei kleine Aufgaben auf Elpisgarten (zum Beispiel „Finde ein Event heute Abend“). Dabei sagst du laut, was du denkst. Dauer: etwa 20 Minuten.
>
> **Wen wir suchen:** Alle, die auf Light RP spielen – egal ob du Elpisgarten täglich nutzt oder noch nie dort warst. Besonders freuen wir uns über Leute, die mit Screenreader oder nur mit der Tastatur surfen.
>
> **Was wir aufzeichnen:** Nur deinen geteilten Bildschirm und deine Stimme, und nur, wenn du zustimmst. Nach der Auswertung (spätestens 30 Tage) löschen wir die Aufnahme. Details bekommst du vorab.
>
> **Interesse?** Schreib eine DM an @<Moderator> mit deinem bevorzugten Zeitfenster (Abende, Wochenende).

Für den asynchronen 5-Sekunden-Test reicht ein kürzerer Post:

> **5-Sekunden-Test:** Du siehst fünf Sekunden lang einen Screenshot von Elpisgarten und beantwortest danach drei kurze Fragen. Keine Anmeldung, keine Aufnahme, anonym. Link: <Formular-Link>

---

## 3. Einwilligung und Datenschutz (DSGVO)

Vor jeder Sitzung schriftlich (Discord-DM oder Formular) bestätigen lassen und zu Beginn der Aufnahme mündlich wiederholen.

**Einwilligungstext (zum Kopieren):**

> Ich nehme freiwillig an einem Nutzertest von Elpisgarten teil.
>
> **Verantwortlich:** <Name, Kontakt laut Impressum von elpisgarten.de>
>
> **Zweck:** Verbesserung der Bedienbarkeit von Elpisgarten. Die Daten werden für nichts anderes verwendet und nicht weitergegeben.
>
> **Was aufgezeichnet wird (nur mit meiner Zustimmung):**
> - Bildschirmaufnahme des geteilten Browserfensters während der Aufgaben
> - Tonaufnahme meiner Stimme (Think-Aloud)
> - schriftliche Notizen der Moderation: Zeiten, Klickwege, Zitate, Antworten auf die Fragen
>
> **Was nicht aufgezeichnet wird:** Kamera, Discord-Name in den Auswertungen, Inhalte außerhalb des geteilten Fensters. Ich muss mich auf Elpisgarten nicht anmelden.
>
> **Speicherdauer:** Aufnahmen werden lokal bei der Moderation gespeichert (nicht in Discord, nicht in der Cloud) und spätestens 30 Tage nach der Sitzung gelöscht. Die anonymisierten Notizen (Teilnehmer-Kürzel wie „T3“, keine Namen) bleiben als Teil der Projektdokumentation erhalten.
>
> **Rechtsgrundlage:** Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO. Ich kann die Einwilligung jederzeit ohne Angabe von Gründen widerrufen, auch mitten in der Sitzung. Bereits erstellte Aufnahmen werden dann sofort gelöscht.
>
> **Meine Rechte:** Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Beschwerde bei einer Aufsichtsbehörde. Kontakt: <E-Mail>.
>
> [ ] Ich stimme der Teilnahme und den Notizen zu.
> [ ] Ich stimme zusätzlich der Bildschirm- und Tonaufnahme zu. (optional – der Test geht auch ohne)

Regeln für die Moderation:

- Ohne Haken bei der Aufnahme wird nur mitgeschrieben.
- Teilnehmende vor dem Teilen bitten, private Tabs und Benachrichtigungen zu schließen (Discord „Nicht stören“).
- Dateinamen der Aufnahmen nur mit Kürzel und Datum: `2026-11-02_T3.mkv`. Löschtermin im Kalender eintragen.
- Keine Aufnahmen in Discord-Kanäle hochladen.
- Der 5-Sekunden-Test läuft anonym ohne Aufnahme; das Formular fragt keine personenbezogenen Daten ab.

---

## 4. Moderationsleitfaden

### 4.1 Vorbereitung (vor jeder Sitzung)

- [ ] Einwilligung liegt vor, Kürzel vergeben (T1, T2, …).
- [ ] Beobachtungsbogen (Abschnitt 6) je Aufgabe vorbereitet, Stoppuhr bereit.
- [ ] Prüfen, dass es heute Abend mindestens ein Event im Kalender gibt (Aufgabe 1). Falls nicht: Aufgabe auf „morgen Abend“ ändern und im Bogen vermerken.
- [ ] Zielcharakter für Aufgabe 2 festlegen und prüfen, dass er Kontakte hat (Standard: **Aeris Khatayin**, Server Shiva).
- [ ] Prüfen, dass `/story/14` noch Inhaltswarnungen trägt (Aufgabe 3).
- [ ] Teilnehmende öffnen ein **privates Fenster**, damit keine gespeicherten Einstellungen (bestätigte Inhaltswarnungen, zuletzt geöffnete Suchergebnisse) das Ergebnis verfälschen.

### 4.2 Einstieg (ca. 2 min)

> Hallo und danke, dass du mitmachst! Ich bin <Name>. Wir schauen uns heute Elpisgarten an. Wichtig vorweg: Wir testen die Seite, nicht dich. Wenn etwas nicht klappt, ist das genau die Information, die wir suchen – du kannst nichts falsch machen.
>
> Ich lese dir gleich drei kleine Aufgaben vor. Ich werde dir dabei nicht helfen, auch wenn es sich unhöflich anfühlt – ich will sehen, wie du es ohne mich machen würdest. Wenn du nicht weiterkommst, sag einfach „Ich würde jetzt aufgeben“, das ist völlig in Ordnung.
>
> Du hast der Aufnahme zugestimmt (bzw. nicht zugestimmt, dann schreibe ich nur mit). Du kannst jederzeit abbrechen. Hast du noch Fragen, bevor wir anfangen?

### 4.3 Think-Aloud-Anleitung (ca. 1 min)

> Bitte sag beim Bedienen laut, was dir durch den Kopf geht: wonach du suchst, was du erwartest, was dich überrascht oder stört. Zum Beispiel: „Ich suche jetzt einen Kalender … hier steht ‚Events‘, das klicke ich mal … oh, das ist eine Liste, ich hätte einen Kalender erwartet.“
>
> Wenn du still wirst, frage ich vielleicht „Was denkst du gerade?“. Das ist kein Zeichen, dass du etwas falsch machst.

Während der Aufgaben nur neutrale Nachfragen verwenden: „Was denkst du gerade?“, „Was erwartest du hier?“, „Was würdest du jetzt tun?“. Nie: „Hast du das Menü oben gesehen?“ oder Ähnliches.

### 4.4 Aufgaben

Vor jeder Aufgabe die Start-URL im Chat schicken und öffnen lassen. Die Stoppuhr startet, wenn die Aufgabe fertig vorgelesen ist, und stoppt beim Erfolgskriterium oder bei Aufgabe.

#### Aufgabe 1 — „Finde ein Event heute Abend.“

| | |
|---|---|
| **Start-URL** | https://elpisgarten.de/ |
| **Vorlesetext** | „Stell dir vor, du hast heute Abend Zeit und willst irgendwo mitspielen. Finde ein Event, das heute Abend stattfindet, und finde heraus, wo es im Spiel ist. Kopiere den Ort, als würdest du ihn einer Freundin schicken.“ |
| **Erfolgskriterium** | Event-Detailseite eines heutigen Abend-Events geöffnet **und** Ort kopiert (Kopier-Schaltfläche oder Text markiert und kopiert). |
| **Abbruch** | nach 3 Minuten oder auf Wunsch |
| **Beobachten** | Einstieg über Startseite (Timeline/„Heute“) oder Navigation „Events“/Kalender? Wird „heute“ erkannt? Wird die Uhrzeit/Zeitzone verstanden? Wird der Ort gefunden und die Kopierfunktion bemerkt? |
| **Ziel (§7.2)** | Zeit bis Ziel < 30 s, ≤ 2 Fehlklicks |

#### Aufgabe 2 — „Finde einen Charakter und seine Kontakte.“

| | |
|---|---|
| **Start-URL** | https://elpisgarten.de/ |
| **Vorlesetext** | „Jemand hat dir von einem Charakter namens **Aeris Khatayin** erzählt. Finde sein Profil. Schau dann nach, wen dieser Charakter kennt, und öffne das Profil von einem dieser Bekannten.“ |
| **Erfolgskriterium** | Profil von Aeris Khatayin geöffnet **und** über den Bereich „Kontakte“ zu einem weiteren Profil gewechselt. |
| **Abbruch** | nach 3 Minuten oder auf Wunsch |
| **Beobachten** | Suche (Kopfzeile, Strg K) oder Verzeichnis „Charaktere“? Wird der Reiter „Kontakte“ gefunden? Werden Hover-Karten genutzt? Springt die Seite beim Reiterwechsel unerwartet? |
| **Ziel (§7.2)** | ≤ 2 Fehlklicks |

#### Aufgabe 3 — „Lies eine Geschichte mit Inhaltswarnung.“

| | |
|---|---|
| **Start-URL** | https://elpisgarten.de/stories |
| **Vorlesetext** | „Hier findest du Geschichten aus der Community. Öffne die Geschichte **„<Titel von /story/14>“** und lies den ersten Absatz. Sag mir danach, ob dir vorher etwas Besonderes aufgefallen ist.“ |
| **Erfolgskriterium** | Teilnehmende nennen die Inhaltswarnung **vor** dem Lesen (spontan oder auf die Abschlussfrage hin, Letzteres im Bogen markieren) **und** erreichen den Text („Trotzdem lesen“). |
| **Abbruch** | nach 3 Minuten oder auf Wunsch |
| **Beobachten** | Wird die Warnkarte gelesen oder weggeklickt? Werden die Warnungen benannt? Wird „Für diese Warnungen nicht mehr fragen“ bemerkt? Findet man nach dem Bestätigen den Textanfang? |
| **Ziel (§7.2)** | CW-Wahrnehmung 5/5 |

Den Titel von `/story/14` vor der Sitzung nachsehen und im Vorlesetext eintragen. Die Warnungen selbst **nicht** vorlesen.

#### Nach jeder Aufgabe: SEQ

Direkt nach jeder Aufgabe, bevor über die Aufgabe gesprochen wird:

> **Wie leicht oder schwer war diese Aufgabe insgesamt?**
> 1 = sehr schwer … 7 = sehr leicht

| 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|
| sehr schwer | | | | | | sehr leicht |

Bei Antworten ≤ 4 kurz nachfragen: „Was hat es schwer gemacht?“

### 4.5 Abschlussfragen (ca. 4 min)

1. „Was ist dir insgesamt am meisten aufgefallen – positiv oder negativ?“
2. „Gab es eine Stelle, an der du nicht wusstest, wo du klicken sollst?“
3. „Bei der Geschichte: Ist dir vor dem Lesen etwas angezeigt worden? Was stand da?“ (nur fragen, wenn nicht schon spontan genannt)
4. „Wenn du eine Sache an Elpisgarten ändern könntest, welche wäre das?“
5. „Wie oft nutzt du Elpisgarten?“ (nie / selten / monatlich / wöchentlich / täglich) und „Wie lange spielst du schon auf Light?“
6. Nur bei Screenreader- oder Tastaturnutzung: „Welchen Screenreader und Browser nutzt du? Gab es Stellen, die nicht oder falsch angesagt wurden?“

### 4.6 Abschluss (ca. 1 min)

> Vielen Dank, das hat uns sehr geholfen! Die Aufnahme wird spätestens in 30 Tagen gelöscht, und in unseren Notizen tauchst du nur als Kürzel auf. Wenn du die Einwilligung zurückziehen willst, schreib mir einfach. Willst du erfahren, was wir aus den Tests ändern? Dann sag ich dir Bescheid, wenn es online ist.

Aufnahme stoppen, Bogen vervollständigen (innerhalb von 30 Minuten, solange die Erinnerung frisch ist).

---

## 5. 5-Sekunden-Test (ELPIS-811)

**Material:** Screenshot der Startseite `https://elpisgarten.de/` bei 1440 px Breite, oberer Bereich (erste Bildschirmhöhe), einmal hell, einmal dunkel. Teilnehmende sehen zufällig eine der beiden Varianten. Für die Wiederholung nach Stufe M denselben Ausschnitt verwenden.

**Ablauf:**

1. „Du siehst gleich fünf Sekunden lang ein Bild einer Webseite. Schau es dir einfach an.“
2. Bild genau 5 Sekunden zeigen, dann ausblenden.
3. Fragen (offene Antworten, in dieser Reihenfolge):
   1. „Worum geht es auf dieser Seite?“
   2. „Was kann man hier tun?“ (Erweiterung nach §7.1)
   3. „Wo würdest du ein Event finden?“ (Erweiterung nach §7.1; Antwort darf eine Beschreibung sein, z. B. „oben im Menü“)
   4. „Welches Wort oder Element ist dir am stärksten in Erinnerung geblieben?“

**Auswertung:** Antworten in Kategorien einordnen (z. B. „Rollenspiel/FFXIV erkannt“, „Events genannt“, „Charaktere/Profile genannt“, „Ort für Events korrekt“). Anteil je Kategorie in die Metrik-Tabelle übernehmen.

---

## 6. Beobachtungsbogen (Vorlage)

Ein Bogen je Teilnehmer:in, als Tabelle in eine Datei `usertest/<Datum>_T<n>.md` kopieren (Ordner nicht ins Repository einchecken, solange Zitate nicht geprüft sind).

```
Teilnehmer:in: T__        Datum: ____-__-__        Runde: Baseline / nach Stufe M
Gerät/Browser: __________ Breite: ____ px          Screenreader: nein / NVDA / VoiceOver / ____
Nutzung Elpisgarten: nie / selten / monatlich / wöchentlich / täglich
Aufnahme: ja / nein                                Löschtermin: ____-__-__
```

| Feld | Aufgabe 1: Event heute | Aufgabe 2: Charakter + Kontakte | Aufgabe 3: Geschichte mit CW |
|---|---|---|---|
| Startzeit (mm:ss) | | | |
| Endzeit (mm:ss) | | | |
| Zeit bis Ziel (s) | | | |
| Erfolg | ohne Hilfe / mit Hinweis / abgebrochen | ohne Hilfe / mit Hinweis / abgebrochen | ohne Hilfe / mit Hinweis / abgebrochen |
| Fehlklicks (Anzahl) | | | |
| Fehlklicks (wohin) | | | |
| Weg (Stichworte: Einstieg, Klickfolge) | | | |
| CW vor dem Lesen genannt | – | – | spontan / auf Nachfrage / nein |
| SEQ (1–7) | | | |
| Zitate (wörtlich, mit Zeitstempel) | | | |
| Auffälligkeiten (Zögern, Suchen, Überraschung) | | | |

**Definitionen:**

- **Fehlklick:** Klick oder Tippen auf ein Ziel, das nicht zum Erfolgskriterium führt und das die Person danach wieder verlässt (Zurück, anderes Menü). Scrollen und Hover zählen nicht.
- **Mit Hinweis:** Die Moderation hat irgendeinen inhaltlichen Tipp gegeben. Zählt für die Metrik „Aufgabenerfolg“ als nicht gelöst.
- **Zitate:** wörtlich, kurz, mit Zeitstempel aus der Aufnahme. Keine Namen oder Charakternamen der Teilnehmenden.

---

## 7. Metriken und Ziele (aus `UI_UX_VISION.md` §7.2)

| Metrik | Messung | Ziel nach Stufe M | Baseline | Nach Stufe M |
|---|---|---|---|---|
| Aufgabenerfolg | Anteil „ohne Hilfe“ gelöst, je Aufgabe | ≥ 80 % je Aufgabe | A1 __ / A2 __ / A3 __ | A1 __ / A2 __ / A3 __ |
| Zeit bis Ziel | Stoppuhr ab Ende des Vorlesens (Median) | „Event heute“ < 30 s | __ s | __ s |
| Fehlklicks | Klicks auf falsche Ziele (Median je Aufgabe) | ≤ 2 pro Aufgabe | A1 __ / A2 __ / A3 __ | A1 __ / A2 __ / A3 __ |
| CW-Wahrnehmung | Teilnehmende nennen Warnung vor dem Text | 5/5 | __ / 5 | __ / 5 |
| SEQ (1–7) | nach jeder Aufgabe (Mittelwert) | ≥ 5,5 | A1 __ / A2 __ / A3 __ | A1 __ / A2 __ / A3 __ |
| Analytics (falls vorhanden, datensparsam) | Anteil Sitzungen mit Event-Detail-Aufruf; Suchnutzung; Absprungrate Home | Trend steigend bzw. sinkend gegenüber Baseline | | |
| Inhaltsqualität | sichtbare „(FOLGT)“/Roh-Wikilinks auf Stichprobe von 20 Profilen | 0 | | |
| 5-Sekunden-Test | Anteil, der Zweck erkennt / Event-Ort richtig nennt | (kein Ziel in §7.2; Trend steigend) | __ % / __ % | __ % / __ % |

Bei fünf Teilnehmenden sind Prozentwerte grob; immer auch die absoluten Zahlen notieren (z. B. „4/5“).

---

## 8. Screenreader-Checkliste

Für den internen Durchgang und als Leitfaden, wenn eine Screenreader-Nutzerin teilnimmt. Je Hauptseite mit beiden Kombinationen prüfen:

- **NVDA** (aktuelle Version) mit **Firefox** und mit **Chrome** unter Windows
- **VoiceOver** mit **Safari** unter macOS (und, wenn möglich, iOS bei 390 px)

Kurzbefehle zum Prüfen:

| Was | NVDA | VoiceOver (macOS) |
|---|---|---|
| Landmarken | D / Umschalt+D, Elementliste NVDA+F7 | Rotor VO+U → Landmarken |
| Überschriften | H / 1–6, Elementliste NVDA+F7 | Rotor VO+U → Überschriften |
| Tab-Reihenfolge | Tab / Umschalt+Tab | Tab (Safari: „Mit Tab zu allen Steuerelementen“ aktivieren) |
| Live-Ansagen | automatisch | automatisch |

### 8.1 Seitenübergreifend (einmal pro Kombination)

- [ ] Erster Tab landet auf „Zum Inhalt springen“; Enter springt in den Inhalt, die nächste Ansage ist der Seiteninhalt, nicht die Navigation.
- [ ] Landmarken: genau ein Banner (Kopfzeile), eine Hauptnavigation „Hauptnavigation“, genau ein Hauptbereich (`main`), ein Contentinfo (Fußzeile). Unter 1024 px zusätzlich „Hauptnavigation (mobil)“.
- [ ] Jede Seite hat genau eine Überschrift erster Ebene, die den Seitentitel nennt; keine übersprungenen Ebenen.
- [ ] Seitenwechsel: Der Dokumenttitel ändert sich und wird angesagt bzw. ist über NVDA+T / VO+F2 abrufbar.
- [ ] Fokus ist auf jedem Element sichtbar (hell und dunkel).
- [ ] **Befehlspalette (Strg K / Cmd K):** öffnet als Dialog „Suche und Befehle“, Fokus im Eingabefeld (Kombinationsfeld). Nach Eingabe von „Nebel“ wird die Statuszeile angesagt („Suche läuft …“ bzw. Treffer). Pfeil runter sagt die hervorgehobene Option an (aria-activedescendant). Esc schließt, Fokus zurück auf das vorher fokussierte Element.
- [ ] **Benachrichtigungen:** Die Glocke in der Kopfzeile sagt die Anzahl ungelesener Benachrichtigungen an; auf `/benachrichtigungen` sind Einträge als Liste mit Überschrift erreichbar, „Als gelesen markieren“ hat einen eindeutigen Namen.
- [ ] Mobil: „Mehr“ öffnet einen Dialog „Mehr“, Esc oder „Schließen“ schließt ihn, Fokus zurück auf „Mehr“.
- [ ] Darstellungsumschalter sagt den nächsten Modus an („Darstellung wechseln. Als Nächstes: …“).

### 8.2 Je Hauptseite

| Seite | Landmarken | Überschriften | Tab-Reihenfolge | Besonderheiten |
|---|---|---|---|---|
| `/` Startseite | [ ] | [ ] h1 vorhanden, Bänder als h2 | [ ] Hero → Timeline → Bänder | [ ] Timeline-Einträge mit Datum und Titel angesagt |
| `/calendar` | [ ] | [ ] | [ ] Monatsnavigation vor Kalender | [ ] Tage mit Events: Anzahl/Titel angesagt |
| `/event/44` | [ ] | [ ] | [ ] | [ ] Inhaltswarnung (falls vorhanden) vor der Beschreibung; Ort kopieren meldet Erfolg (Live-Region) |
| `/profiles` | [ ] | [ ] | [ ] Filter vor Ergebnisliste | [ ] Trefferzahl wird nach Filtern angesagt |
| `/Shiva/Aeris_Khatayin` | [ ] | [ ] Name als h1 | [ ] Reiter als ein Tab-Stopp, Pfeiltasten wechseln | [ ] Reiter als „Registerkarte, ausgewählt, 1 von n“; Wechsel ändert URL ohne Sprung nach oben; Hover-Karte auf Charakterlinks wird über „beschrieben durch“ erreichbar, Esc schließt |
| `/Shiva/Aeris_Khatayin/kontakte` | [ ] | [ ] | [ ] | [ ] Kontakte als Liste mit Namen und Beziehung |
| `/story/14` | [ ] | [ ] | [ ] | [ ] **CwVeil:** Warnkarte wird vor dem Text angesagt (Region mit Titel, Liste „Inhaltswarnungen“); der verdeckte Text ist nicht erreichbar (weder per Pfeil noch Tab); „Trotzdem lesen“ setzt den Fokus an den Textanfang, der Text wird danach vorgelesen |
| `/gallery/screenshot` | [ ] | [ ] | [ ] Kacheln in Lesereihenfolge | [ ] **Lightbox:** Kachel sagt Titel und Autor an; Öffnen ergibt Dialog „Bildbetrachter“, Fokus auf „Schließen“; Pfeil rechts/links wechselt, Zähler „Bild 2 / 20“ wird angesagt; Esc schließt, Fokus zurück auf die Kachel |
| `/noticeboard` | [ ] | [ ] | [ ] | [ ] Moderation: Anheften/Lösen ist ein Umschalter (gedrückt/nicht gedrückt); nach dem Umschalten bleibt der Fokus auf derselben Schaltfläche am neuen Platz |
| `/venues`, `/venues/karte` | [ ] | [ ] | [ ] | [ ] Karte: Liste als Alternative erreichbar |
| `/wiki/Test` | [ ] | [ ] | [ ] | [ ] Wikilinks und Charakterlinks im Fließtext haben sprechende Namen |
| `/search?q=Nebel` | [ ] | [ ] | [ ] | [ ] Ergebnisgruppen als Überschriften; Trefferzahl angesagt |
| `/benachrichtigungen` | [ ] | [ ] | [ ] | [ ] siehe 8.1 |

Fundstellen mit Seite, Kombination (z. B. „NVDA + Firefox“), erwarteter und tatsächlicher Ansage notieren.

---

## 9. Ergebnisse in `memory.md` festhalten

Nach jeder Runde (Baseline bzw. nach Stufe M) einen Abschnitt unter „Elpis Reborn 2 (vision rework)“ ergänzen. Keine Namen, keine Discord-Handles, keine Rohzitate mit persönlichen Details.

```markdown
### Nutzertest <Baseline | nach Stufe M> (<Datum>) — UI_UX_USER_TEST_KIT.md

- Teilnehmende: 5 (2 Stamm, 2 neu, 1 Screenreader: NVDA + Firefox); 5-Sekunden-Test: 8
- Aufgabenerfolg: A1 4/5, A2 5/5, A3 5/5 (Ziel ≥ 80 %)
- Zeit bis Ziel A1 (Median): 41 s (Ziel < 30 s)
- Fehlklicks (Median): A1 2, A2 1, A3 0 (Ziel ≤ 2)
- CW-Wahrnehmung: 4/5 (Ziel 5/5)
- SEQ (Mittel): A1 5,2, A2 6,0, A3 6,4 (Ziel ≥ 5,5)
- 5-Sekunden-Test: Zweck erkannt 7/8, Event-Ort richtig 5/8
- Top-3-Befunde: <kurz, mit Bezug auf Befund-Nr. aus UI_UX_VISION.md>
- Screenreader: <Liste offener Punkte aus Abschnitt 8>
- Folgetickets: <ER2-xxx>
- Aufnahmen gelöscht am: <Datum> (spätestens 30 Tage nach der letzten Sitzung)
```

Die Zahlen oben sind ein Beispiel für das Format. Danach §7.3 Schritt 4 folgen: Stufe-L-Features nach gemessenem Bedarf priorisieren (z. B. RSVP nur, wenn „Event heute“ weiterhin zögerlich gelöst wird).
