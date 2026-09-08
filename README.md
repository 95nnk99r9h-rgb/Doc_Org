# Doc-Org

Responsive PWA im Apple-inspirierten Stil: Dokumente fotografieren, Bilder und PDFs importieren, lokal Text erkennen und nach Kategorien ablegen. Light-Version ohne Datenbank und ohne Dokumentserver. Deutsche Oberfläche, durchgehend helles Design und iPhone-Layout ohne seitliches Scrollen.

## Keine persönlichen Daten im Repository

Dieses Repository enthält bewusst keine echten Namen, Dokumente oder Sicherungen. Die Personenliste wird ausschließlich in der App gepflegt und bleibt auf dem Gerät; die Musterunterlagen unter `tests/fixtures/` sind erfunden und als Muster gekennzeichnet. Sicherungsdateien und persönliche Unterlagen sind über `.gitignore` ausgeschlossen. Bitte vor jedem Commit prüfen, dass keine echten Dokumente mitwandern.

`.gitignore`, `.gitattributes` und `.editorconfig` sind enthalten. `docs/` und die Offline-Bibliotheken werden bewusst versioniert. Schritt-für-Schritt-Anleitung zum Klonen und Veröffentlichen: [docs/GITHUB.md](docs/GITHUB.md).

## Schnell starten

1. Repository klonen oder als ZIP herunterladen und vollständig entpacken.
2. Auf einem Computer mit Python 3 `start-windows.bat` öffnen; unter macOS/Linux `python3 scripts/serve.py` ausführen.
3. Im Browser http://localhost:8080 öffnen.
4. „Dokument hinzufügen“ wählen. Unter `tests/fixtures/` liegen ausdrücklich als Muster gekennzeichnete PNG- und PDF-Unterlagen zum Ausprobieren.

Alternativ: `npm start` (Python 3 muss installiert sein). Es ist kein npm-Installationsschritt nötig. Die verwendeten Bibliotheken und das deutsche OCR-Sprachmodell sind bereits enthalten.

**Nicht einfach `docs/index.html` doppelklicken.** JavaScript-Module, Web Worker, Dateispeicherung und PWA-Funktionen benötigen einen Webserver bzw. einen sicheren Browserkontext.

Python dient hier ausschließlich zum Ausliefern der statischen App-Dateien. Es verarbeitet oder speichert keine hochgeladenen Dokumente. OCR läuft vollständig im Browser.

## Auf GitHub Pages veröffentlichen

Die App liegt im Ordner `docs/`, weil GitHub Pages genau diesen Ordner ohne Umwege veröffentlichen kann. Nötig ist eine einzige Einstellung:

*Settings → Pages → Build and deployment*: **Deploy from a branch**, Branch `main`, Ordner **`/docs`**.

Die Website liegt danach unter `https://<benutzername>.github.io/<repository>/`. Es braucht keinen Build-Schritt und keine Action. Die Datei `docs/.nojekyll` sorgt dafür, dass GitHub die Dateien unverändert ausliefert. Die vier Markdown-Dateien in `docs/` werden mit hochgeladen, aber von der App nicht verwendet und nicht in den Offline-Cache aufgenommen.

GitHub Pages liefert über HTTPS aus, damit funktionieren Kamera, lokale Dateispeicherung und die Installation als iPhone-App. Der Betrieb unter einem Unterpfad ist getestet. Achtung: Der Browserspeicher hängt an der Webadresse – wird die Adresse später geändert, vorher eine Sicherung exportieren.

## Auf dem iPhone

Den Inhalt des Ordners `docs/` auf einem statischen HTTPS-Webserver bereitstellen. Doc-Org in Safari öffnen und über „Teilen → Zum Home-Bildschirm“ installieren. Der lokale Computer-Link ist auf dem iPhone nicht erreichbar; eine gewöhnliche HTTP-LAN-Adresse reicht für die PWA-Funktionen nicht aus.

Die erste Online-Sitzung lädt App-Dateien und OCR-Modelle (ca. 18 MB unkomprimiert). Unter Einstellungen erscheint „Offline-Dateien sind vollständig verfügbar“, sobald die Vorbereitung beendet ist. Anschließend kann die App einschließlich OCR ohne Internet genutzt werden. Browser können bei Speicherknappheit Daten löschen; regelmäßig sichern.

Die Anwendung ist für aktuelle Safari-/iOS-Versionen entwickelt. Ein zusätzlicher Dateischreibpfad unterstützt ältere Safari-Versionen mit synchronem OPFS-Zugriff. Ein echter iPhone-/Safari-Praxistest wurde in dieser Umgebung nicht durchgeführt. Insbesondere Kamera, HEIC-Unterstützung, Offline-Installation und das iOS-Teilen-Menü müssen am Zielgerät erprobt werden. Wenn ein Bildformat nicht lesbar ist, JPEG oder PNG verwenden.

## Enthaltene Funktionen

- Kamera, Fotomediathek, Datei-Upload und Drag-and-drop.
- Fotografierte Dokumente werden automatisch auf das Blatt zugeschnitten und gerade gerückt. Ist die Lage nicht eindeutig, bleibt die Aufnahme unverändert; der Zuschnitt lässt sich vor dem Speichern mit einem Klick abwählen.
- Der Dokumenttitel wird nach Möglichkeit aus dem Text gelesen: „Betreff“-Zeile, sonst Dokumentart und Absender. Der Dateiname ist die Rückfallebene.
- Mehrere Bilder/PDFs bilden ein Dokument; Reihenfolge vor der Analyse änderbar.
- PDF-Text direkt auslesen; bildbasierte Seiten über OCR erkennen.
- Standardkategorien: Termine, Rechnungen, Versicherung, Gesundheit, Auto, Gebäude, Anleitungen. Dokumente der Kategorie Anleitungen werden automatisch als erledigt abgelegt, weil sie Nachschlagewerke und kein offener Vorgang sind.
- Eigene Kategorien direkt in der App anlegen: Name, Farbe, Symbol und Stichwörter. Sie wirken sofort in Filter, Ablage und automatischer Zuordnung.
- Gewichtete Wortlisten, sichtbare Treffer und Mehrfachkategorien.
- Personen werden in der App gepflegt und bleiben auf dem Gerät; „Familie / gemeinsam“ und „Unklar“ stehen immer zur Verfügung.
- Dateivorschau im Vollbild: Bilder und PDF-Seiten direkt in der App, mit Blättern und Zoom. Bei einer Seite ist zunächst alles sichtbar; vergrößert wird nach Bedarf.
- Klick auf das Datei-Symbol in der Übersicht öffnet die Vorschau sofort im Vollbild, ohne Bearbeitungsfenster; von dort führt eine Schaltfläche ins Bearbeiten.
- Im Bearbeitungsfenster wird nichts ungefragt gerendert: „Dokument ansehen“ öffnet dieselbe Vollbildvorschau.
- Übersicht als Tabelle mit Kopfzeile; Titel, Kategorien, Eingang, Frist und Stand stehen spaltenweise untereinander.
- Rechnungen: Rechnungsbetrag wird automatisch gelesen; ein Zahlungsziel wird immer gesetzt – aus dem Text, aus einer Zahlungsfrist berechnet oder als 14-Tage-Schätzung, die sichtbar als „Frist geschätzt“ markiert ist.
- Zahlungsziele heißen immer „Zahlungstermin“ gefolgt vom Dokumenttitel und werden bei Umbenennungen automatisch nachgeführt.
- Vorschläge prüfen und korrigieren; Originaldateien aufbewahren und exportieren. Wird nichts geändert, fragt die App beim Schließen nicht nach.
- Kategorie als Hauptfilter, Eingangszeitraum, Volltextsuche, Status, Person und Sortierung nach Eingang oder nächster Frist.
- „Erledigt“ bzw. „Bezahlt“ direkt in der Übersicht; erledigte Dokumente verschwinden aus der Fristenansicht.
- Kalenderexport ohne Bestätigungsschritt: „Zum iPhone-Kalender hinzufügen“ öffnet auf iOS das Teilen-Menü, sonst wird die .ics-Datei geladen. Termine ohne Uhrzeit ganztägig, ansonsten 30 Minuten in lokaler Kalenderzeit. Erinnerungen standardmäßig drei Tage vor Zahlungszielen und einen Tag vor Terminen.
- Gesamtsicherung und Import als zusätzliche Kopien; eigene Kategorien und Personen sind Teil der Sicherung.

## Ordnerstruktur

| Pfad | Inhalt |
| --- | --- |
| `docs/index.html` | Einstieg und barrierearme HTML-Struktur |
| `docs/css/app.css` | Responsive Gestaltung, Apple-Systemschrift, helles Farbschema |
| `docs/js/app.js` | Oberfläche, Importablauf, Filter, Dokumentverwaltung |
| `docs/js/rules.js` | Kategorien, eigene Kategorien, Personen, gewichtete Wortlisten |
| `docs/js/analysis.js` | Titel, Datum, Uhrzeit, Betrag, Fristen und Prüfhinweise |
| `docs/js/ocr.js` | Lokale OCR und mehrseitige PDF-Verarbeitung |
| `docs/js/crop.js` | Automatischer Zuschnitt und Geraderücken fotografierter Blätter |
| `docs/js/preview.js` | Seitenvorschau für Bilder und PDF-Seiten |
| `docs/js/storage.js` | Dateispeicherung, Metadaten, Sicherung/Import |
| `docs/js/file-worker.js` | Zusätzlicher Dateischreibpfad für Safari |
| `docs/js/calendar.js` | ICS-Erstellung, iOS-Teilen und Downloads |
| `docs/assets/icons/` | App-Symbole |
| `docs/vendor/` | Mitgelieferte Bibliotheken, OCR-Modell und Lizenzen |
| `docs/manifest.webmanifest` | PWA-Installation und App-Metadaten |
| `docs/sw.js` | Offline-Cache der App-Dateien |
| `docs/.nojekyll` | Liefert die Dateien bei GitHub Pages unverändert aus |
| `docs/*.md` | Architektur, Wortlisten, GitHub-Anleitung und Prüfbericht |
| `scripts/` | Lokaler Start, Abhängigkeiten und Offline-Dateiliste |
| `tests/` | Automatisierte Funktionsprüfungen und Musterdateien |
| `.openai/hosting.json` | Vorbereitete statische Hosting-Konfiguration, keine Site registriert |

## Dokumentdaten auf dem Gerät

Dokumente werden nicht in den Quellcodeordner geschrieben. Jeder Browser bzw. jede installierte PWA hat einen eigenen privaten Speicherbereich:

- OPFS-Verzeichnis `doc-org/<Dokument-ID>/original-0`, `original-1`, …: Originaldateien.
- LocalStorage-Schlüssel `doc-org-index-v1`: Titel, Text, Kategorien, Personen, Eingangsdatum, Status und Ereignisse.
- LocalStorage-Schlüssel `doc-org-categories-v1`: eigene Kategorien.
- LocalStorage-Schlüssel `doc-org-people-v1`: Personenliste.
- CacheStorage `doc-org-v3`: ausschließlich App-Dateien und OCR-Bibliotheken, keine Dokumente.

Diese Bereiche sind geräte- und ursprungsgebunden. Andere Geräte oder ein Wechsel der Webadresse sehen die Dokumente nicht automatisch. Sicherung vorher exportieren und am neuen Ort importieren. Das Metadatenverzeichnis einschließlich OCR-Text ist durch das LocalStorage-Limit begrenzt; bei großen Archiven meldet die App Speicherfehler und lässt neue Originale nicht als erfolgreich gespeichert erscheinen. Diese Light-Version ist für ein kleines persönliches Archiv und die Nutzung in einer aktiven App-Instanz gedacht.

## Bekannte Grenzen

- Maximal 40 MB und 60 Seiten pro analysiertem Dokument; Verarbeitung großer Scans kann auf dem iPhone langsam sein.
- Maschinenschrift auf gut belichteten Fotos funktioniert am besten. Handschrift, unscharfe Fotos, Stempel und komplexe Tabellen bleiben unsicher.
- Der automatische Zuschnitt setzt helles Papier vor dunklerem Untergrund voraus und gleicht nur die Drehung aus, keine perspektivische Verzerrung. Bei weißem Papier auf weißem Tisch, starker Schräglage über etwa 25 Grad oder angeschnittenen Blättern bleibt die Aufnahme unverändert.
- Der ausgelesene Titel ist ein Vorschlag und im Bearbeitungsfenster jederzeit änderbar.
- Ein PDF mit wenig Text wird als Scan behandelt. Bei gemischten Seiten mit reichlich Text und zusätzlichen eingescannten Textbereichen werden diese Bildbereiche noch nicht separat analysiert.
- Datumserkennung unterstützt derzeit numerische deutsche Datumsformate. Ausgeschriebene Monate und Terminverlegungen benötigen manuelle Prüfung.
- Geschätzte Zahlungsziele sind ausdrücklich Annahmen und keine Rechtsauskunft. Maßgeblich ist immer das Dokument selbst.
- Absender und Veranstaltungsort werden nicht zuverlässig automatisch extrahiert; Kalendertitel und Ort lassen sich manuell ergänzen.
- Die lokale Speicherung ist nicht separat verschlüsselt. Der Gerätezugang schützt das Archiv. Sicherungen enthalten Originale und Texte unverschlüsselt.
- Kein automatischer Kalenderimport und keine Hintergrundbenachrichtigungen. Der Kalendereintrag muss bewusst exportiert und in einer Kalender-App übernommen werden; deren Erinnerungsverhalten kann variieren.
- Kein geräteübergreifender Abgleich, kein Benutzerkonto und keine echte Safari-Ende-zu-Ende-Abnahme.

## Weiterentwickeln

Wortlisten in `docs/js/rules.js` bearbeiten. Die vollständige Übersicht steht in `docs/WORTLISTEN.md`. Zusätzliche Kategorien lassen sich stattdessen ohne Codeänderung in der App anlegen. Für Änderungen an Offline-Dateien `python3 scripts/update-offline.py` ausführen. Bei einer neuen Veröffentlichung den Cache-Namen in diesem Skript und in `app.js` gemeinsam hochzählen, damit installierte Apps die neue Version erhalten. Die Musterunterlagen unter `tests/fixtures/` erzeugt `python3 scripts/make-fixtures.py` neu.

Tests mit Node.js 22 oder neuer: `npm test`. Details und manuell noch ausstehende Prüfungen siehe `docs/PRUEFBERICHT.md`.

Abhängigkeiten sind fest versioniert. `docs/vendor/sources.json` enthält Herkunft und SHA-256-Prüfsummen; `scripts/fetch-vendor.py` lädt fehlende Dateien nach. Vor einer produktiven Veröffentlichung Abhängigkeiten auf Sicherheitsupdates prüfen.

Von Tesseract sind nur die beiden LSTM-Kerne enthalten (`tesseract-core-lstm` und `tesseract-core-simd-lstm`). Die App startet die Texterkennung mit OEM 1, also ausschließlich mit dem LSTM-Modell; die Legacy-Kerne würden nie geladen und sparen rund 16 MB. Wer die Erkennungsart auf OEM 0, 2 oder 3 umstellt, muss sie mit `python3 scripts/fetch-vendor.py` und einer erweiterten Variantenliste nachladen.
