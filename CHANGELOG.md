# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden hier dokumentiert.

---

## [6.3.1] — April 2026

- Komprimierung rückgängig gemacht (Script-Fehler behoben)
- Alle Features wiederhergestellt: Minimize, Autostart-Countdown, Smart-Buttons, Batch-Pause
- Syntaxfehler bereinigt

## [6.3.0] — April 2026

- Code optimiert und komprimiert
- Redundante Logik zusammengeführt
- DOM-Operationen effizienter gestaltet

## [6.2.4] — April 2026

- Syntaxfehler und Formatierungsfehler behoben
- Vollständige Funktionalität wiederhergestellt

## [6.2.3] — April 2026

- Minimize-Button für Control Panel integriert
- Minimierter Zustand zeigt nächsten Run-Termin
- Panel-Zustand (minimiert/offen) wird gespeichert

## [6.2.2] — April 2026

- Edit-Page-Toolbar mit „Duplizieren" und „Smart"-Button wiederhergestellt
- Toolbar erscheint auf `p-anzeige-bearbeiten.html`

## [6.2.1] — April 2026

- Autostart-Countdown-Banner implementiert
- 10-Sekunden-Countdown auf jeder Kleinanzeigen-Seite beim Erreichen des Zieldatums
- Abbrechen-Button deaktiviert Autostart für den Tag
- Navigiert automatisch zu Meine Anzeigen nach Countdown

## [6.2.0] — April 2026

- Autostart-Logik neu implementiert
- `lastAutostartRun` Tracking für einmalige Ausführung pro Tag
- „Smart neu einstellen"-Button in Meine-Anzeigen-Übersicht

## [6.1.0] — April 2026

- Batch-Pause-Funktion eingeführt (konfigurierbar: Batch-Größe & Pausenzeit)
- „Alle erneuern"-Checkbox hinzugefügt
- Inline „Smart neu einstellen"-Button in Meine Anzeigen

## [6.0.2] — April 2026

- Syntax-Fehler behoben
- Löschlogik integriert

## [6.0.1] — April 2026

- Auto-Reset für „stuck"-Zustand implementiert
- Stop-Button-Funktion verbessert

## [6.0.0] — April 2026

- Vollständige Code-Überarbeitung
- Robuste Multi-Strategie Seitenerkennung
- Resilient gegen zukünftige Website-Änderungen

## [5.3.0] — April 2026

- AbortController für Queue-Steuerung
- Exponential Backoff bei Fehlern
- 5-Strategie Submit-Button-Erkennung

## [5.2.0] — April 2026

- „Warte (Tage)"-Logik: Next-Run-Datum = Heute + N Tage
- Unnötiger Code und Dateien bereinigt
- Speicher-Keys vereinheitlicht

## [5.1.0] — März 2026

- 5-Strategie Button-Erkennung für „Anzeige speichern"
- Retry-Mechanismus mit Exponential Backoff

## [5.0.0] — März 2026

- Script nur aktiv auf Meine-Anzeigen und Bearbeitungsseite
- Globaler Browser-Start-Check für Autostart

## [4.9.x] — März 2026

- Login-Seiten-Schutz
- Tab-Lock Mechanismus gegen Browser-Abstürze
- Erhöhte Wartezeiten gegen Fehler 500
- „Alle erneuern"-Checkbox erste Version

## [4.8.x] — Februar/März 2026

- Einmaliger Auto-Run-Check beim Browser-Start
- Auto-Start Toggle Checkbox
- „Nächster Run"-Anzeige im Panel
- Stop-Button implementiert und entfernt
- Minimier-Button erste Version

## [4.7.0] — Februar 2026

- Globaler 10s Browser-Open-Check auf jeder Seite
- Automatische Navigation zu Meine Anzeigen

## [4.6.0] — Februar 2026

- 10-Sekunden Browser-Open-Prüfung vor Auto-Start

## [4.5.0] — Februar 2026

- Konfigurationspanel (Warte-Tage, Anzahl Anzeigen, Auto-Start-Delay)
- Einstellungen persistent gespeichert

## [4.0.0] — Januar 2026

- Unified Control Panel (ein Panel statt zwei)
- Minimier-Funktion erste Konzeption

---

*Credits: Original-Script von J05HI · Helper-Idee von panzli · Erweiterte Version von OldRon1977*