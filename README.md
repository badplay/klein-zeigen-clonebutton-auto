# Kleinanzeigen Auto Clone Bot

Ein UserScript für Tampermonkey, das automatisches Neu-Einstellen, Duplizieren und Smart-Rotation der ältesten Anzeigen auf kleinanzeigen.de ermöglicht — inklusive konfigurierbarem Autostart.

## Features

- **Duplizieren:** Erstellt eine Kopie der Anzeige, Original bleibt erhalten
- **Smart neu einstellen:** Löscht das Original und erstellt eine neue Anzeige
- **Auto-Run:** Automatisches Neu-Einstellen mehrerer Anzeigen nach Zeitplan (Warte-Tage konfigurierbar)
- **Interaktiver Start-Countdown:** Sowohl beim Auto-Start als auch beim manuellen Start erscheint ein 10-Sekunden-Countdown-Banner mit **Abbrechen**-Option.
- **Batch-Pause:** Nach konfigurierbarer Anzahl Anzeigen automatische Pause (Anti-Ban)
- **Alle erneuern:** Checkbox um alle Anzeigen auf einmal neu einzustellen
- **Minimier-Button:** Das Control Panel lässt sich minimieren — zeigt im minimierten Zustand den nächsten Run-Termin an
- **Inline-Buttons:** „Smart neu einstellen“-Button direkt in der Meine-Anzeigen-Übersicht
- **Edit-Page-Toolbar:** „Duplizieren“ und „Smart neu einstellen“-Buttons auf der Bearbeitungsseite (kein überlappendes Panel)
- **Robuste Erkennung:** Multi-Strategie Seitendetection, resilient gegen Website-Änderungen
- **Professionelles UI:** Klares, dunkles Design für das Control Panel und die Toolbar.

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

1. Im Panel **„Warte (Tage)“** einstellen — z. B. `7` für wöchentlichen Lauf
2. **„Auto-Start“** Checkbox aktivieren
3. **„Anzahl Anzeigen“** eintragen oder **„Alle“** aktivieren
4. Auf **„Einstellungen speichern“** klicken
5. Beim nächsten Öffnen von kleinanzeigen.de (nach Erreichen des Zieldatums) startet der Countdown automatisch.

### Manueller Start

1. kleinanzeigen.de → Meine Anzeigen öffnen
2. Im Panel auf **„▶ Starten“** klicken
3. Ein 10-Sekunden-Countdown erscheint, den Sie bei Bedarf abbrechen können.

### Direkt auf der Bearbeitungsseite

- Navigiere zu einer Anzeige → „Bearbeiten“
- Unten rechts erscheint eine Toolbar mit:
  - **Duplizieren:** Kopie erstellen, Original bleibt
  - **Smart neu einstellen:** Original löschen, neue Anzeige erstellen

### Über Meine-Anzeigen (Inline)

- Neben jedem „Bearbeiten“-Link erscheint **„Smart neu“**
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
| Status | Aktueller Status des Bots |

## Technische Details

### Berechtigungen

Das Script verwendet `@grant GM_getValue` und `@grant GM_setValue` für die Speicherung der Einstellungen und `@grant none` für andere erweiterte Tampermonkey-Berechtigungen.

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
    → Ja: 10s Countdown-Banner erscheint (mit Abbrechen-Option)
    → Nicht abgebrochen: Navigiert zu Meine Anzeigen
    → Anzeigen werden nacheinander neu eingestellt (mit Batch-Pausen)
    → Nach Abschluss: Zurück zur Übersicht
```

## Fehlerbehebung

**Panel erscheint nicht**
- Prüfe ob Tampermonkey aktiviert ist
- Seite neu laden (`F5`)

**Script startet nicht automatisch**
- „Auto-Start“ Checkbox im Panel aktivieren
- „Einstellungen speichern“ klicken
- Prüfe ob „Nächster Run“ ein Datum anzeigt
- Stelle sicher, dass das aktuelle Datum das „Nächster Run“-Datum erreicht oder überschritten hat.

**Anzeigen werden nicht gefunden**
- Stelle sicher, dass du auf `m-meine-anzeigen.html` bist
- Seite vollständig laden lassen, dann „▶ Starten“ klicken

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