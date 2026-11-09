# FitLog

Persönliches Trainingstagebuch als Web-App (PWA): Übungen, Gewichte, Wiederholungen,
Rekorde und Fortschritts-Diagramme. Keine Server, kein Konto – alle Daten liegen nur
lokal im Browser (`localStorage`) auf dem Gerät.

## Funktionen

- **Training:** Gewicht und Wiederholungen (oder Sekunden bei Übungen wie Plank) pro Satz,
  „Letztes Mal“-Hinweis, Rekord-Badge, letztes Training übernehmen.
- **Pausen:** Haken pro Satz startet den Pausen-Timer (−15 / +15 s, Ton am Ende, Display bleibt an).
  Standard-Pause in *Mehr*, eigene Pause pro Übung unter *Übungen*.
- **Übungskatalog:** rund 200 Übungen in 11 Muskelgruppen mit sinnvollen Standard-Pausen,
  Suche, Gruppenfilter, „Zuletzt verwendet“; eigene Übungen jederzeit möglich.
- **Fortschritt:** Diagramme je Übung (Gewicht, 1RM, Volumen, Wiederholungen/Zeit),
  Übersicht aller Übungen, Körpergewicht.

## Pläne für Freunde (ohne Server)

1. *Pläne → Neu*: Tage und Übungen anlegen, je Übung Sätze, Wiederholungen, Ziel-RPE, Gewicht, Pause, Hinweis.
2. *Plan an Freunde schicken* erzeugt eine Nachricht mit Link (WhatsApp/iMessage …).
3. Freunde tippen den Link. Auf dem iPhone öffnet sich der Link immer in Safari, nie in der installierten
   App (iOS kann das nicht): deshalb *Code kopieren*, dann in der App *Pläne → Plan oder Ergebnisse einfügen*.
4. Sie starten einen Tag, tragen Gewicht, Wiederholungen und RPE ein und schicken per
   *Ergebnisse schicken* alles zurück; unter *Pläne → Plan → Ergebnisse* siehst du es im Vergleich zur Vorgabe.

Wochentage: Jeder Plantag kann Wochentage haben (Stift am Tag). Dann zeigt die App „Heute dran“,
einen Wochenstreifen (gemacht / verpasst / geplant) und dem Trainer unter *Woche* je Freund Quote,
Sätze, Ø RPE und die letzten 8 Wochen. Tage nach dem letzten Senden eines Freundes gelten als „offen“,
nicht als „verpasst“ – die App kennt nur, was geschickt wurde.

Alles steckt komprimiert im Link (`#p=…` Plan, `#r=…` Ergebnisse, Format `FL2.` = deflate + base64url).
Es gibt keinen Server: Daten wandern nur, wenn jemand sie verschickt. Importierte Daten werden streng geprüft
(`cleanPlan`, `cleanResults`, `cleanTarget`).

## Auf dem iPhone installieren

1. Die Seite in **Safari** öffnen (GitHub Pages: *Settings → Pages → Deploy from a branch →
   Branch dieses Projekts, Ordner `/docs`*).
2. Teilen-Symbol → **„Zum Home-Bildschirm"** → „Hinzufügen".
3. Ab jetzt über das Icon starten. Die App funktioniert auch offline.

> Die App vom Home-Bildschirm hat auf iOS einen **eigenen Speicher**, getrennt von Safari.
> Daten also erst nach der Installation eintragen – oder per *Daten → Backup sichern / laden*
> übertragen.

## Backup

*Daten → Backup sichern* erzeugt eine JSON-Datei (z. B. in „Dateien"/iCloud ablegen).
*Backup laden* spielt sie wieder ein und ersetzt die aktuellen Daten.

## Entwicklung

Reine statische Dateien ohne Build-Schritt:

```sh
python3 -m http.server 8123 --directory docs   # http://localhost:8123
```

- `index.html`, `style.css`, `app.js` – die App
- `sw.js` – Service Worker (Offline-Cache; bei Änderungen `CACHE` hochzählen)
- Der Übungskatalog steht als `CATALOG` am Anfang von `app.js`; neue Einträge werden mit
  einer höheren `CATALOG_VERSION` automatisch in bestehende Daten übernommen.
- `manifest.webmanifest`, `icons/` – Home-Bildschirm-Icon
