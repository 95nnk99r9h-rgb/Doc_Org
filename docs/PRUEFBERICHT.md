# Prüfbericht – Doc-Org Light 0.3

Erstellt am 08.09.2026.

## Automatisierte Prüfung

39 Tests unter Node.js 22 (`npm test`):

- Überschneidungen Gebäude/Versicherung, Auto/Versicherung und Rechnung/Gesundheit.
- Gesundheit statt Krankenversicherung; vollständige Namen, reine Vornamen, Familie und mehrere Personen.
- Keine Punktevervielfachung durch bloße Wiederholung eines Wortes.
- Anleitungen werden als eigene Kategorie erkannt; eigene Kategorien lassen sich zur Laufzeit anlegen, wirken sofort in der Zuordnung und lassen sich wieder entfernen. Standardkategorien sind gegen Löschen geschützt.
- Zahlungsziel getrennt vom Rechnungsdatum; keine Verwechslung eines Datums mit einer Uhrzeit.
- Betragserkennung: beschriftete Felder, Tausenderpunkte, nachgestellte Währung, netto/brutto sowie unbeschriftete Beträge nur bei Rechnungen und mit Prüfhinweis.
- Erkannte Rechnungen erhalten immer ein Zahlungsziel: aus dem Text gelesen, aus einer Frist berechnet oder als 14 Tage ab Rechnungsdatum bzw. Eingang geschätzt und entsprechend markiert.
- Ungültige oder unlesbare Datumsangaben werden nicht geraten; Fristen ab Erhalt bleiben ohne Rechnungsdatum manuell.
- Lastschrift- und Absagehinweise.
- ICS ohne Bestätigungsschritt, aber mit Datumsprüfung; stabile UID, exklusives Enddatum, Erinnerungen, Rechnungsbetrag in der Beschreibung, Text-Escaping und UTF-8-Zeilenfaltung.
- Titelfindung: Betreffzeile hat Vorrang, sonst Dokumentart plus Absender; Anreden, Seitenzahlen und Kontaktzeilen ergeben keinen Titel.
- Zuschnitt: Otsu-Schwelle, konvexe Hülle und kleinstes umschließendes Rechteck auf synthetischen Aufnahmen. Gerade und schräge Blätter werden mit Größe und Winkel erkannt (Abweichung unter 0,03 rad), auch mit Bildrauschen. Gleichmäßige Flächen, bildfüllende gerade Blätter, kleine helle Flecken und extreme Schräglagen werden abgelehnt statt falsch beschnitten.
- Mitgeliefertes PDF.js liest das zweiseitige Muster-PDF tatsächlich und liefert Zahlungsziel und Termin.

JavaScript-Syntax, HTML-Einstieg, lokale Asset-Verweise, Manifest-Symbole und Offline-Dateiliste werden mit `python3 scripts/check-project.py` statisch geprüft. Originalbibliotheken liegen mit Lizenzen und Prüfsummen bei.

## Browserlauf (Chromium, headless)

Vollständiger Durchlauf gegen den lokalen Server, Desktop (1280 px) und iPhone-Format (390 px):

- Import des Muster-PDF und des Muster-PNG, echte OCR mit dem lokalen deutschen Sprachmodell.
- Rechnungsbetrag automatisch gelesen: 123,45. Zahlungsziel 22.09.2026, Termin 25.09.2026 um 09:30 Uhr.
- Titel des Zahlungsziels „Zahlungstermin muster-arztrechnung“, nach Umbenennen des Dokuments automatisch „Zahlungstermin Stromrechnung September“.
- Vorschau: beide PDF-Seiten gerendert, Blättern, Zoom und Vollbild funktionsfähig.
- Kein Bestätigungshaken mehr; Exportschaltfläche sofort aktiv.
- Eigene Kategorie „Schule“ angelegt, erscheint in Navigation, Filterleiste und Auswahl; Person hinzugefügt.
- Dokument öffnen und ohne Änderung schließen: keine Rückfrage. Nach einer Änderung: Rückfrage erscheint.
- „Bezahlt“ in der Übersicht markiert das Dokument und entfernt es aus der Fristenansicht.
- iPhone-Format: `scrollWidth` gleich `clientWidth` (390 px), kein Element ragt über den Darstellungsbereich hinaus, auch der Bearbeitungsdialog nicht.
- Foto eines um sieben Grad gedrehten Blattes auf dunklem Untergrund (1500 × 1700 Pixel): automatisch auf das Blatt beschnitten und gerade gerückt (914 × 1269 Pixel), gespeichert als `…-zugeschnitten.jpg`. Abwählen des Zuschnitts stellt die Originalaufnahme wieder her.
- Titel aus demselben Foto gelesen: „Jahresabrechnung Strom 2026“ aus der Betreffzeile; Betrag 1.234,56 erkannt.
- Anleitung: Titel „Bedienungsanleitung – Muster Haustechnik GmbH“, Kategorie Anleitungen, Stand automatisch „Erledigt“. Nachträgliches Ankreuzen der Kategorie bei einem offenen Dokument setzt den Stand ebenfalls auf erledigt.
- Klick auf das Datei-Symbol öffnet die reine Dateivorschau ohne Bearbeitungsfenster; die Schaltfläche „Bearbeiten“ wechselt in den Editor. Auf dem iPhone-Format misst die Trefferfläche 44 × 50 Punkt.
- Nach dem Entfernen der Legacy-OCR-Kerne fordert die App im Import ausschließlich `tesseract-core-simd-lstm.wasm.js` an; keine einzige Anfrage endet mit 404, die Texterkennung liefert unverändert Titel, Kategorie und Betrag. Der Fallback ohne SIMD-Unterstützung ist als Datei vorhanden, ließ sich in dieser Umgebung aber nicht erzwingen und bleibt ungeprüft.
- Übersicht mit drei Dokumenten: die Spaltenkanten aller Zeilen sind pixelgenau identisch (321, 379, 591, 738, 863, 1007) und stimmen mit der Kopfzeile überein – auch bei einem erledigten Dokument ohne Schaltfläche.
- Im Bearbeitungsfenster wird keine Vorschau automatisch geöffnet; „Dokument ansehen“ zeigt sie im Vollbild (1280 × 900 bzw. 390 × 844) und kehrt beim Schließen ins Bearbeitungsfenster zurück.
- Das Datei-Symbol in der Übersicht öffnet die Vorschau unmittelbar im Vollbild, ohne Bearbeitungsfenster.
- Keine JavaScript-Fehler und keine Konsolenfehler im gesamten Durchlauf.

## Noch nicht praktisch geprüft

Der Chromium-Lauf ersetzt keinen Test auf echter Apple-Hardware. Vor dem Alltagseinsatz am Zielgerät prüfen:

1. HTTPS-Adresse in Safari öffnen und PWA installieren.
2. Offline-Vorbereitung abwarten; im Flugmodus ein Foto erkennen.
3. Kamera, Fotomediathek, mehrseitiges PDF und ggf. HEIC probieren.
4. Dokument speichern, App schließen, wieder öffnen und Original exportieren.
5. Einstellungen → Sicherung exportieren, importieren und Originale vergleichen.
6. Arzttermin und Zahlungsziel über „Zum iPhone-Kalender hinzufügen“ in Apple Kalender übernehmen; Datum, lokale Uhrzeit und Erinnerung kontrollieren.
7. Auf dem kleinen Display Kategorienfilter, Eingangszeitraum, Dokumentenvorschau und vergrößerte Schrift prüfen.
8. Mit der iPhone-Kamera echte Briefe auf verschiedenen Untergründen fotografieren und den automatischen Zuschnitt beurteilen. Der Prüflauf verwendet erzeugte Aufnahmen; Beleuchtung, Schattenwurf und Kamerawinkel realer Fotos sind damit nicht abgedeckt.

Die Muster-Unterlagen unter `tests/fixtures/` enthalten ausschließlich erfundene Angaben und lassen sich mit `python3 scripts/make-fixtures.py` neu erzeugen.
