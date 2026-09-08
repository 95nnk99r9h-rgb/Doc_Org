# Änderungen: Vorschau und iPhone-Kalender

## Einspielen
Den Inhalt von `docs` im bestehenden Repository durch den Inhalt dieses `docs`-Ordners ersetzen und wie bisher über GitHub Pages veröffentlichen. Danach die App bei bestehender Internetverbindung öffnen, kurz warten und erneut öffnen. Der Service-Worker-Cache wurde auf v4 erhöht. Browserdaten nicht löschen: Darin liegen die Dokumente.

## Vorschau
Nur das Dokumentensymbol in der Übersicht öffnet die Vorschau. Geschlossene Dialoge sind vollständig ausgeblendet. Beim Schließen werden gerenderte Inhalte entfernt und verspätete Ladeergebnisse verworfen. Die Vorschau-Schaltfläche im Bearbeitungsfenster wurde entfernt.

## iPhone-Kalender ohne Datei
Beim Kalenderbutton öffnet sich die Terminübergabe mit der ausklappbaren Anleitung „Kurzbefehl einmalig einrichten“. Den dort beschriebenen Kurzbefehl `Doc-Org Kalender` einmal auf dem iPhone erstellen. Anschließend übergibt „Termin auf dem iPhone übernehmen“ die Daten an diesen Kurzbefehl. Im Kalenderdialog prüfen und bestätigen.

Übergeben werden Titel, Beginn, Ende, ganztägig, Ort und Notizen. Ohne Uhrzeit gilt der Termin ganztägig, mit Uhrzeit dauert er 30 Minuten. Die gewünschte Erinnerung steht in den Notizen und muss im Kalenderdialog eingestellt werden. Ein erneutes Hinzufügen kann Duplikate erzeugen.

Die reine Web-App kann Apple Kalender nicht selbst beschreiben. Die Lösung benötigt den lokal eingerichteten Kurzbefehl; ein installierbarer, signierter Apple-Kurzbefehl ist nicht enthalten. Als Alternative bleibt ein ausdrücklich ausgewählter Kalenderdatei-Export verfügbar.

Apple-Dokumentation: https://support.apple.com/de-de/guide/shortcuts/apd624386f42/ios

## Prüfung
39 vorhandene Tests erfolgreich. Zusätzlich Kalenderdaten mit Sonderzeichen, Jahreswechsel, Schaltjahr, ganztägigen Terminen und ungültigen Daten geprüft. JavaScript-Syntax geprüft. Kein echter iPhone-Test durchgeführt; die Einrichtung und Bestätigung auf dem Gerät bleiben erforderlich.
