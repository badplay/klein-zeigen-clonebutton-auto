# Kleinanzeigen Auto Clone Bot

Ein UserScript für Tampermonkey, das automatisches Neu-Einstellen, Duplizieren und Smart-Rotation der ältesten Anzeigen auf kleinanzeigen.de ermöglicht — inklusive konfigurierbarem Autostart.

## Features

- **Duplizieren:** Erstellt eine Kopie der Anzeige, Original bleibt erhalten
- **Smart neu einstellen:** Löscht das Original und erstellt eine neue Anzeige
- **Auto-Run:** Automatisches Neu-Einstellen mehrerer Anzeigen nach Zeitplan (Warte-Tage konfigurierbar)
- **Autostart-Countdown:** Beim Öffnen von kleinanzeigen.de wird ein 10-Sekunden-Countdown angezeigt — abbrechbar
- **Batch-Pause:** Nach konfigurierbarer Anzahl Anzeigen automatische Pause (Anti-Ban)
- **Alle erneuern:** Checkbox um alle Anzeigen auf einmal neu einzustellen
- **Minimier-Button:** Panel lässt sich minimieren — zeigt nächsten Run-Termin an
- **Inline-Buttons:** „Smart neu einstellen"-Button direkt in der Meine-Anzeigen-Übersicht
- **Edit-Page-Toolbar:** „Duplizieren" und „Smart"-Buttons auf der Bearbeitungsseite
- **Robuste Erkennung:** Multi-Strategie Seitendetection, resilient gegen Website-Änderungen

## Installation

### Voraussetzungen

- Browser: Chrome, Brave, Firefox, Edge
- [Tampermonkey](https://www.tampermonkey.net/) Browser-Extension

### Script installieren

1. Tampermonkey öffnen → **Neues Script erstellen**
2. Inhalt von `kleinanzeigen-backup.user.js` einfügen
3. Speichern (`Strg+S`)

> Auto-Updates funktionieren, sobald das Script auf GitHub gehostet und `@updateURL` / `@downloadURL` gesetzt sind.

## Verwendung

### Auto-Run (Zeitgesteuert)

1. Im Panel **„Warte (Tage)"** einstellen — z. B. `7` für wöchentlichen Lauf
2. **„Auto-Start"** Checkbox aktivieren
3. **„Anzahl Anzeigen"** eintragen oder **„Alle"** aktivieren
4. Auf **„Speichern"** klicken
5. Beim nächsten Öffnen von kleinanzeigen.de startet der Countdown automatisch

### Manueller Start

1. kleinanzeigen.de → Meine Anzeigen öffnen
2. Im Panel auf **„▶ Starten"** klicken

### Direkt auf der Bearbeitungsseite

- Navigiere zu einer Anzeige → „Bearbeiten"
- Unten rechts erscheint eine Toolbar mit:
  - **Duplizieren:** Kopie erstellen, Original bleibt
  - **Smart:** Original löschen, neue Anzeige erstellen

### Über Meine-Anzeigen (Inline)

- Neben jedem „Bearbeiten"-Link erscheint **„Smart neu einstellen"**
- Klick öffnet Bearbeitungsseite und führt Aktion automatisch aus

## Einstellungen (Panel)

| Einstellung | Beschreibung |
|---|---|
| Warte (Tage) | Tage bis zum nächsten Auto-Run |
| Anzahl Anzeigen | Wie viele Anzeigen erneuert werden |
| Alle erneuern | Alle Anzeigen auf einmal erneuern |
| Auto-Start | Automatischen Start aktivieren/deaktivieren |
| Warte vor Start (s) | Sekunden bis zum Auto-Start (Countdown) |
| Batch-Größe | Anzeigen pro Batch vor Pause |
| Batch-Pause (min) | Pausenzeit zwischen Batches in Minuten |
| Nächster Run | Berechnetes Datum des nächsten Runs |

## Technische Details

### Berechtigungen

Das Script verwendet `@grant none` — keine erweiterten Tampermonkey-Berechtigungen nötig.

### Unterstützte URLs

- `https://www.kleinanzeigen.de/m-meine-anzeigen.html*`
- `https://www.kleinanzeigen.de/p-anzeige-bearbeiten.html*`
- `https://www.kleinanzeigen.de/p-anzeige-aufgeben-bestaetigung.html*`
- `https://www.kleinanzeigen.de/*` (für Autostart-Erkennung)

### Ablauf Auto-Run

```
Browser öffnen
    → kleinanzeigen.de aufrufen
    → Script prüft: Ist Zieldatum erreicht?
    → Ja: 10s Countdown-Banner erscheint
    → Nicht abgebrochen: Navigiert zu Meine Anzeigen
    → Anzeigen werden nacheinander neu eingestellt
    → Nach Abschluss: Zurück zur Übersicht
```

## Fehlerbehebung

**Panel erscheint nicht**
- Prüfe ob Tampermonkey aktiviert ist
- Seite neu laden (`F5`)

**Script startet nicht automatisch**
- „Auto-Start" Checkbox im Panel aktivieren
- „Speichern" klicken
- Prüfe ob „Nächster Run" ein Datum anzeigt

**Anzeigen werden nicht gefunden**
- Stelle sicher, dass du auf `m-meine-anzeigen.html` bist
- Seite vollständig laden lassen, dann „▶ Starten" klicken

**Fehler 500 von Kleinanzeigen**
- Batch-Größe reduzieren (z. B. auf `3`)
- Batch-Pause erhöhen (z. B. auf `8` Minuten)

**Löschung schlägt fehl**
- Session abgelaufen — neu anmelden
- Rate-Limiting — kurz warten und erneut versuchen

## Changelog

Siehe [CHANGELOG.md](CHANGELOG.md)

## Credits

- **Original-Script:** J05HI — [Original Gist](https://gist.github.com/J05HI/9f3fc7a496e8baeff5a56e0c1a710bb5)
- **Helper-Idee:** panzli — [GitHub](https://github.com/panzli)
- **Erweiterte Version:** OldRon1977 — [GitHub](https://github.com/OldRon1977)

> Dieses Projekt wurde als persönliches Test- und Lernprojekt erstellt und erweitert.  
> Teile des Codes basieren auf Code-Snippets aus den Credits sowie Vibe-Coding-Sessions.

## Lizenz

MIT License — Siehe LICENSE