# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden hier dokumentiert.

---

## [6.11.1] — April 2026

- **Bugfix Batch-Pause:** Behebt einen logischen Fehler, bei dem nach der ersten erfolgreich durchgeführten Pause die Anzahl der verbleibenden Anzeigen fehlerhaft berechnet wurde, sodass das Skript fälschlicherweise bei jeder weiteren Anzeige erneut in die Zwangspause ging.

## [6.11.0] — April 2026

- **Batch-Pause Logik Fix:** Die Pausen-Wartezeit nutzt nun die echte Serverzeit (`Date.now()`) statt einer simplen Code-Pause. Dies löst das Problem, dass Hintergrund-Tabs von Chrome im "Schlafmodus" die Pause dauerhaft einfrieren ließen und das Script stehen blieb.
- **UI-Update Batch-Pause:** Während der Batch-Pause wird der Lade-Spinner unten links nun als aktiver Live-Countdown aktualisiert (z. B. *"Batch-Pause: 4m 30s verbleibend..."*). So weißt du genau, was das Script tut und wie lange es noch dauert. Der Abbruch-Button bleibt dabei aktiv.

## [6.10.0] — April 2026

- **Abbruch-Funktion:** Während des automatischen Durchlaufs kann der Prozess nun jederzeit über einen roten "Abbrechen"-Button im Lade-Spinner (unten links) gestoppt werden. Dies leert die Queue sofort und navigiert sicher zur Übersicht zurück. Die manuellen Funktionen (Smart, Duplizieren) arbeiten weiterhin als reibungslose Einzelaktionen ohne Abbruch-Button.
- **UI Bugfix:** Der `pointer-events: none` Wert des Spinner wurde entfernt, sodass der neue Abbruch-Button anklickbar ist. 

## [6.9.5] — April 2026

- **Bugfix "Alle erneuern":** Checkbox-Stati werden nun automatisch vor jedem Start ausgelesen. Zuvor wurden diese ignoriert, wenn der Nutzer vor dem Starten nicht manuell auf "Einstellungen speichern" geklickt hat.
- **Link-Filter Optimierung:** Es werden nun ausschließlich echte "Bearbeiten"-Links in die Queue gepusht (ignoriert Statistik-Links, die ebenfalls `adId=` enthalten).
- **Auto-Start Bugfix:** Der Auto-Start leitet nicht mehr nur auf die "Meine Anzeigen"-Seite um und bleibt dort stehen, sondern beginnt nach Erreichen der Seite automatisch mit der Abarbeitung der Queue.

## [6.9.4] — April 2026

- **UI Verbesserung:** Wenn die Checkbox "Alle erneuern" angehakt ist, wird das Eingabefeld für die "Gesamtanzahl" automatisch ausgegraut (deaktiviert), um visuell klarzumachen, dass die spezifische Zahl ignoriert wird.

## [6.9.3] — April 2026

- **UI Klarheit:** Beschriftungen im Panel verständlicher formuliert, um Verwechslungen auszuschließen.
  - "Anzahl Anzeigen" wurde zu "Gesamtanzahl"
  - "Batch-Größe" wurde zu "Pause nach (Stk)"
- README.md entsprechend mit aktualisierter Tabelle angepasst.

## [6.9.0] — April 2026

- **Architektur-Update:** "Copy First, Delete After" Logik (Datenverlustschutz).
- **Popup-Blocker:** Aggressive Schließung von Promo-Popups ("Ohne Hochschieben weiter") vor dem Speichern.
- **Non-Blocking UI:** Der Lade-Spinner blockiert keine Klicks mehr, manuelle Eingriffe bleiben jederzeit möglich.

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

- Edit-Page-Toolbar mit „Duplizieren“ und „Smart“-Button wiederhergestellt
- Toolbar erscheint auf `p-anzeige-bearbeiten.html`

## [6.2.1] — April 2026

- Autostart-Countdown-Banner implementiert
- 10-Sekunden-Countdown auf jeder Kleinanzeigen-Seite beim Erreichen des Zieldatums
- Abbrechen-Button deaktiviert Autostart für den Tag
- Navigiert automatisch zu Meine Anzeigen nach Countdown

## [6.2.0] — April 2026

- Autostart-Logik neu implementiert
- `lastAutostartRun` Tracking für einmalige Ausführung pro Tag
- „Smart neu einstellen“-Button in Meine-Anzeigen-Übersicht

## [6.1.0] — April 2026

- Batch-Pause-Funktion eingeführt (konfigurierbar: Batch-Größe & Pausenzeit)
- „Alle erneuern“-Checkbox hinzugefügt
- Inline „Smart neu einstellen“-Button in Meine Anzeigen

## [6.0.2] — April 2026

- Syntax-Fehler behoben
- Löschlogik integriert

## [6.0.1] — April 2026

- Auto-Reset für „stuck“-Zustand implementiert
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

- „Warte (Tage)“-Logik: Next-Run-Datum = Heute + N Tage
- Unnötiger Code und Dateien bereinigt
- Speicher-Keys vereinheitlicht

## [5.1.0] — März 2026

- 5-Strategie Button-Erkennung für „Anzeige speichern“
- Retry-Mechanismus mit Exponential Backoff

## [5.0.0] — März 2026

- Script nur aktiv auf Meine-Anzeigen und Bearbeitungsseite
- Globaler Browser-Start-Check für Autostart

## [4.9.x] — März 2026

- Login-Seiten-Schutz
- Tab-Lock Mechanismus gegen Browser-Abstürze
- Erhöhte Wartezeiten gegen Fehler 500
- „Alle erneuern“-Checkbox erste Version

## [4.8.x] — Februar/März 2026

- Einmaliger Auto-Run-Check beim Browser-Start
- Auto-Start Toggle Checkbox
- „Nächster Run“-Anzeige im Panel
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