# Datenschutz- und Impressum-Checkliste (Deutschland)

Stand: 17.02.2026  
Hinweis: keine Rechtsberatung. Die Liste dient als technische Arbeitsgrundlage fuer das Projekt.

## A) Anbieterkennzeichnung / Impressum

- [x] Eigene Impressum-Seite vorhanden (`/impressum`)
- [x] Von allen Seiten unmittelbar erreichbar (Footer-Link)
- [ ] Vollstaendiger Name der verantwortlichen Person eingetragen
- [ ] Ladungsfaehige Anschrift (Strasse, Hausnummer, PLZ, Ort, Land) eingetragen
- [x] Kontakt-E-Mail eingetragen
- [ ] Optional pruefen: zusaetzliche Pflichtangaben je Rechtsform/Taetigkeit erforderlich?

## B) Datenschutzerklaerung (Art. 13 DSGVO)

- [x] Eigene Datenschutzerklaerung-Seite vorhanden (`/privacy-statement`)
- [x] Verantwortlicher und Kontakt genannt
- [ ] Verantwortlicher mit vollstaendiger ladungsfaehiger Anschrift genannt
- [x] Zwecke der Verarbeitung beschrieben
- [x] Rechtsgrundlagen je Zweck benannt
- [x] Empfaenger/Kategorien von Empfaengern beschrieben
- [x] Drittlandtransfer beschrieben (Sentry, falls aktiviert)
- [x] Speicherdauern beschrieben
- [x] Betroffenenrechte beschrieben
- [x] Beschwerderecht bei Aufsichtsbehoerde beschrieben
- [x] Widerruf der Einwilligung beschrieben
- [x] Hinweis auf verpflichtende/freiwillige Bereitstellung beschrieben
- [x] Hinweis auf keine automatisierte Entscheidungsfindung enthalten

## C) Consent und Tracking/Diagnose

- [x] Fehlerdiagnose (Sentry) standardmaessig deaktiviert
- [x] Aktivierung nur per ausdruecklicher Einwilligung
- [x] Widerruf technisch moeglich
- [x] Consent-Status und Zeitstempel werden gespeichert
- [x] Sensible Header/Felder werden vor Versand bereinigt
- [ ] Pruefen: Datenverarbeitungsvertrag (AVV) mit Sentry vertraglich abgeschlossen
- [ ] Pruefen: Transfer Impact Assessment fuer Drittlandtransfer dokumentiert (falls noetig)

## D) Technische Konsistenz (Projekt-spezifisch)

- [x] Datenschutzerklaerung erwaehnt technische Sitzungsspeicherung
- [x] Datenschutzerklaerung erwaehnt freiwillige Sentry-Diagnose
- [x] Datenschutzerklaerung erwaehnt Logverarbeitung
- [ ] Final gegen Live-Konfiguration pruefen (Sentry-DSN, Replay-Raten, Log-Retention)

## E) Offene To-dos vor finaler Freigabe

1. Vollstaendige Anbieterangaben (Name + ladungsfaehige Anschrift) in Impressum und Datenschutzerklaerung eintragen.
2. Rechtlich pruefen lassen (Anwalt/Datenschutzberatung), bevor die Texte als final gelten.
3. Dokumentieren, welcher Hosting-/Infrastrukturanbieter konkret als Auftragsverarbeiter genutzt wird.
