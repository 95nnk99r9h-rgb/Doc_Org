# Technische Entscheidungen

Doc-Org ist eine statische HTML-/CSS-/JavaScript-Anwendung. Es gibt keine Datenbank, keinen Dokument-Upload-Endpunkt und keine Remote-OCR. Alle Bibliotheken und das deutsche Sprachmodell werden vom gleichen statischen App-Ursprung geladen und liegen im Paket. Python wird ausschließlich als optionaler Entwicklungs-Webserver verwendet.

## Verarbeitung

Dateiauswahl → sequenziell PDF-Seiten extrahieren / Scans auf maximal 2200 Pixel Kantenlänge rendern → deutscher Tesseract-Worker → Text zusammenführen → Wortlisten und Fristenanalyse → manuelle Prüfung mit Seitenvorschau → Originaldateien in OPFS schreiben → Metadatenindex in LocalStorage aktualisieren.

Mitgeliefert werden nur die beiden LSTM-Kerne von Tesseract; die Erkennung läuft mit OEM 1, sodass die Legacy-Kerne nie angefordert werden. Das halbiert die Paketgröße auf rund 18 MB. Der OCR-Worker wird nach jedem Import beendet. Die Sprachmodell-Zwischenspeicherung von Tesseract über IndexedDB ist mit `cacheMethod: 'none'` deaktiviert. Statische Dateien übernimmt stattdessen der Service Worker. PDF.js ist mit `isEvalSupported: false` konfiguriert.

## Zuschnitt fotografierter Blätter

`docs/js/crop.js` arbeitet ohne zusätzliche Bibliothek und ohne Netzzugriff. Auf einer auf 720 Pixel verkleinerten Graustufenkopie wird über eine Otsu-Schwelle eine Hell-Dunkel-Maske gebildet, daraus die größte zusammenhängende helle Fläche bestimmt und über konvexe Hülle und rotierende Auflagelinien das kleinste umschließende Rechteck berechnet. Der Drehwinkel wird auf ±45 Grad normalisiert.

Zugeschnitten wird nur, wenn das Ergebnis belastbar ist: Flächenanteil zwischen 10 und 99,5 Prozent, Füllgrad der erkannten Fläche über 70 Prozent und Drehung unter 25 Grad. Ein nahezu bildfüllendes, gerades Blatt wird bewusst nicht neu berechnet. In allen Zweifelsfällen bleibt die Aufnahme unverändert – ein falscher Zuschnitt wäre schlimmer als keiner. Perspektivische Verzerrung wird nicht korrigiert, weil dafür eine verlässliche Eckpunkterkennung nötig wäre.

Das Ergebnis wird als JPEG mit maximal 2200 Pixel Kantenlänge gespeichert und ist zugleich die Vorlage für die Texterkennung. Bis zum Speichern liegen Original und Zuschnitt nebeneinander vor; der Schalter im Prüfschritt entscheidet, welche Fassung abgelegt wird.

## Titel aus dem Text

`titleFrom` in `docs/js/analysis.js` prüft in dieser Reihenfolge: ausdrückliche Betreffzeile, dann Dokumentart aus einer Liste typischer deutscher Schriftstücke verbunden mit der ersten absenderartigen Zeile, dann die erste brauchbare Überschrift. Anreden, Seitenzahlen, Telefon-, IBAN- und Kundennummernzeilen werden übersprungen. Ohne Treffer bleibt der Dateiname stehen.

## Vorschau

`docs/js/preview.js` baut aus den Originalen eine flache Seitenliste: Bilder als Object-URL, PDF-Seiten über dasselbe mitgelieferte PDF.js. Gerendert wird immer nur die sichtbare Seite, passend zur Breite der Vorschaufläche und zum Zoomfaktor. Object-URLs werden beim Seitenwechsel und beim Schließen des Dialogs freigegeben, PDF-Dokumente werden zerstört. Ein Zählertoken verwirft Ergebnisse abgebrochener Ladevorgänge, damit ein schnell wieder geschlossener Dialog nichts nachträglich einblendet.

Es gibt genau einen Vorschau-Controller. Er bedient einen Vollbild-Dialog, der aus der Übersicht (Datei-Symbol) und aus dem Bearbeitungsfenster („Dokument ansehen“) geöffnet wird. Gerendert wird erst auf Klick – der Prüfschritt kostet dadurch keine Rechenzeit für Seiten, die niemand ansieht. Bei Zoomfaktor 1 wird die Seite so skaliert, dass sie vollständig in die Fläche passt; die Lupe vergrößert von dort aus.

## Kategorien und Personen

`RULES` behält seine Objektidentität und wird beim Laden sowie bei jeder Änderung neu befüllt: zuerst die Standardkategorien aus dem Quellcode, danach die eigenen aus `doc-org-categories-v1`. So sehen alle Module dieselbe Liste, ohne dass die App neu geladen werden muss. Die Personenliste steht in `doc-org-people-v1` und ist bewusst nicht Teil des Quellcodes. Beide Listen liegen in der Sicherung und werden beim Import ergänzend übernommen; vorhandene Einträge werden nicht überschrieben. Beim Löschen einer eigenen Kategorie wird sie aus allen betroffenen Dokumenten entfernt.

## Speicherung

Originale werden vor den Metadaten geschrieben. Schlägt die erstmalige Speicherung fehl, wird das neu angelegte Originalverzeichnis entfernt. Ein neuer Dokumenteintrag ist erst nach erfolgreichem Schreiben verfügbar. Bestehende Originale werden bei Metadatenänderungen nicht neu geschrieben.

Sicherungen enthalten einen Format- und Versionsindikator, das Metadatenverzeichnis und Originaldateien als Base64. Der Import legt neue IDs an und überschreibt bestehende Dokumente nicht. Ein Import kann wegen seiner Größe viel Arbeitsspeicher benötigen. Gleichzeitig geöffnete App-Instanzen aktualisieren ihre Liste bei LocalStorage-Ereignissen; gleichzeitiges Bearbeiten desselben Dokuments wird in dieser Light-Version nicht konfliktfrei zusammengeführt.

## Oberfläche

Die Dokumentübersicht ist eine Tabelle: Kopfzeile und Zeilen verwenden dieselbe Spaltenrechnung, und die Aktionsspalte hat eine feste Breite, damit Stand und Schaltfläche in allen Zeilen an derselben Stelle stehen – auch wenn bei erledigten Dokumenten keine Schaltfläche erscheint. Unterhalb von 900 Pixeln entfällt die Kopfzeile und die Zeile bricht um.

Ein einziges helles Farbschema; es gibt keinen Dunkelmodus und keine Darstellungsauswahl mehr. Die Farbmarken (blau, orange, violett, rosé, grün, türkis, indigo, rot, bernstein, schiefer) sind gemeinsame Klassen für Kategoriesymbole und Etiketten. Auf Schmalgeräten wird seitliches Scrollen ausgeschlossen: `overflow-x: clip` auf Wurzel und Body, ausschließlich `minmax(0, …)`-Rasterspalten und umbrechende statt scrollender Kategorieleiste.

Beim Schließen des Bearbeitungsdialogs wird der aktuelle Formularzustand mit einem beim Öffnen erstellten Abbild verglichen. Nur bei tatsächlichen Unterschieden erscheint die Rückfrage.

## Datenschutzgrenzen

Keine Telemetrie, keine Analyseanbieter, kein Cloudkonto. Der Webserver kann Abrufe der App-Ressourcen protokollieren, erhält aber weder Dokumentdateien noch OCR-Text. Der eigentliche Speicher ist der gerätegebundene Browserbereich, kein frei sichtbarer Ordner in der iOS-Dateien-App. Originale und Sicherungen lassen sich über das Teilen-Menü bzw. Downloads ausgeben.

## Kalender

ICS verwendet CRLF, UTF-8-Zeilenfaltung bis maximal 75 Bytes, Escape-Regeln für Textfelder, stabile UID pro Ereignis sowie exklusives Enddatum für ganztägige Einträge. Uhrzeitgebundene Einträge verwenden lokale Kalenderzeit ohne behauptete Zeitzonenerkennung. Der Standard ist 30 Minuten. Erinnerungen werden als VALARM eingebettet. Der Export benötigt keinen zusätzlichen Bestätigungsschritt, aber ein gültiges Datum. Auf iOS wird die Datei über `navigator.share` an das Teilen-Menü übergeben, sonst als Download ausgegeben. Geschätzte Zahlungsziele sind in der Beschreibung des Kalendereintrags als solche vermerkt.

## Primärquellen

- [Tesseract.js: lokale Installation](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md)
- [Mozilla PDF.js: Beispiele](https://mozilla.github.io/pdf.js/examples/)
- [WebKit: Origin Private File System](https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/)
- [MDN: createWritable](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createWritable)
