# FitLog

Persönliches Trainingstagebuch als Web-App (PWA): Übungen, Gewichte, Wiederholungen,
Rekorde und Fortschritts-Diagramme. Keine Server, kein Konto – alle Daten liegen nur
lokal im Browser (`localStorage`) auf dem Gerät.

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
- `manifest.webmanifest`, `icons/` – Home-Bildschirm-Icon
