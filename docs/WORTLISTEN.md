# Doc-Org – Wortlisten und Zuordnungsregeln

Die bearbeitbare Quelle liegt in `docs/js/rules.js`. Jeder Begriff zählt pro Dokument einmal. Groß-/Kleinschreibung, Satzzeichen und ß/ss werden normalisiert. Treffer gelten an Wortgrenzen, damit etwa „Theo“ nicht in „Theorie“ gefunden wird. Ab 4 Punkten wird eine Kategorie vorgeschlagen. Punktzahlen sind keine statistischen Wahrscheinlichkeiten. Mehrfachkategorien sind ausdrücklich erlaubt.

## Termine

| Wort / Wortgruppe | Gewicht |
| --- | ---: |
| terminbestätigung | 7 |
| terminvereinbarung | 6 |
| ihr termin | 6 |
| nächster termin | 6 |
| kontrolltermin | 6 |
| untersuchungstermin | 7 |
| impftermin | 7 |
| einladung | 3 |
| sprechstunde | 2 |
| um uhr | 1 |
| bitte erscheinen | 5 |
| wiedervorstellung | 4 |
| besichtigungstermin | 6 |
| am um | 1 |

## Rechnungen

| Wort / Wortgruppe | Gewicht |
| --- | ---: |
| rechnung | 5 |
| rechnungsnummer | 7 |
| rechnungsbetrag | 7 |
| zahlungsziel | 6 |
| zahlbar bis | 6 |
| fällig am | 4 |
| zu zahlen | 5 |
| gesamtbetrag | 3 |
| überweisen sie | 5 |
| mahnung | 6 |
| zahlungserinnerung | 7 |
| offener betrag | 5 |
| gutschrift | 3 |
| iban | 1 |
| umsatzsteuer | 2 |
| lastschrift | 2 |

## Versicherung

| Wort / Wortgruppe | Gewicht |
| --- | ---: |
| versicherungsschein | 7 |
| versicherungspolice | 7 |
| versicherungsnummer | 5 |
| versicherung | 4 |
| versicherungsbeitrag | 6 |
| haftpflicht | 6 |
| rechtsschutz | 6 |
| hausrat | 6 |
| wohngebäudeversicherung | 7 |
| gebäudeversicherung | 7 |
| kfz versicherung | 7 |
| kaskoversicherung | 7 |
| schadennummer | 5 |
| schadenmeldung | 5 |
| deckungszusage | 4 |
| lebensversicherung | 6 |
| berufsunfähigkeit | 6 |
| unfallversicherung | 6 |

## Gesundheit

| Wort / Wortgruppe | Gewicht |
| --- | ---: |
| arzt | 4 |
| ärztlich | 3 |
| arztpraxis | 6 |
| praxis | 2 |
| krankenhaus | 6 |
| klinik | 5 |
| patient | 4 |
| patientin | 4 |
| befund | 6 |
| diagnose | 6 |
| rezept | 6 |
| verordnung | 4 |
| heilmittel | 5 |
| physiotherapie | 6 |
| ergotherapie | 6 |
| impfung | 6 |
| kinderarzt | 6 |
| zahnarzt | 6 |
| vorsorgeuntersuchung | 6 |
| krankenversicherung | 7 |
| krankenkasse | 7 |
| pflegeversicherung | 6 |
| gesundheitskasse | 6 |
| behandlungsplan | 6 |
| heil und kostenplan | 6 |
| entlassungsbericht | 7 |
| laborbericht | 6 |
| aok | 3 |
| barmer | 3 |
| techniker krankenkasse | 7 |
| tk | 1 |
| beihilfe | 3 |
| gebührenordnung für ärzte | 6 |
| goä | 5 |

## Auto

| Wort / Wortgruppe | Gewicht |
| --- | ---: |
| fahrzeug | 4 |
| kfz | 5 |
| pkw | 5 |
| kennzeichen | 4 |
| fahrgestellnummer | 6 |
| fahrzeug identifizierungsnummer | 7 |
| zulassungsbescheinigung | 7 |
| hauptuntersuchung | 6 |
| abgasuntersuchung | 6 |
| tüv | 4 |
| werkstatt | 3 |
| inspektion | 3 |
| reifenwechsel | 6 |
| kraftfahrzeugsteuer | 7 |
| kfz versicherung | 7 |
| kaskoversicherung | 7 |
| vollkasko | 6 |
| teilkasko | 6 |
| kilometerstand | 4 |
| leasing | 3 |
| id buzz | 6 |
| volkswagen | 3 |
| vw | 2 |

## Gebäude

| Wort / Wortgruppe | Gewicht |
| --- | ---: |
| immobilie | 5 |
| gebäude | 4 |
| wohngebäudeversicherung | 7 |
| gebäudeversicherung | 7 |
| hausrat | 4 |
| miete | 4 |
| mietvertrag | 7 |
| nebenkosten | 6 |
| betriebskostenabrechnung | 7 |
| nebenkostenabrechnung | 7 |
| hausgeld | 6 |
| grundsteuer | 7 |
| grundstück | 4 |
| grundbuch | 6 |
| strom | 4 |
| stromrechnung | 7 |
| gasrechnung | 7 |
| wasserrechnung | 7 |
| energieversorger | 5 |
| abschlagszahlung | 3 |
| zählernummer | 4 |
| zählerstand | 4 |
| handwerker | 4 |
| heizung | 5 |
| sanitär | 4 |
| schornsteinfeger | 6 |
| dachdecker | 6 |
| abwasser | 5 |
| müllgebühren | 6 |
| wohnfläche | 4 |
| hausverwaltung | 6 |
| eigentümergemeinschaft | 6 |
| modernisierung | 3 |
| renovierung | 4 |
| baufinanzierung | 6 |

## Anleitungen

| Wort / Wortgruppe | Gewicht |
| --- | ---: |
| bedienungsanleitung | 7 |
| gebrauchsanweisung | 7 |
| gebrauchsanleitung | 7 |
| betriebsanleitung | 7 |
| montageanleitung | 7 |
| aufbauanleitung | 7 |
| installationsanleitung | 7 |
| benutzerhandbuch | 7 |
| bedienungshandbuch | 7 |
| kurzanleitung | 6 |
| schnellstartanleitung | 6 |
| anwenderhandbuch | 7 |
| handbuch | 5 |
| anleitung | 4 |
| inbetriebnahme | 5 |
| erste schritte | 4 |
| sicherheitshinweise | 4 |
| pflegehinweise | 5 |
| wartungsplan | 5 |
| ersatzteile | 4 |
| ersatzteilliste | 6 |
| garantiebedingungen | 4 |
| konformitätserklärung | 5 |
| lieferumfang | 5 |
| technische daten | 3 |
| modellnummer | 3 |
| typenschild | 4 |
| fehlerbehebung | 5 |
| störungsbehebung | 5 |

## Eigene Kategorien

In der App lassen sich unter „Kategorien verwalten“ zusätzliche Kategorien mit Name, Farbe, Symbol und Stichwörtern anlegen. Jedes eingegebene Stichwort erhält das Gewicht 5 und wirkt wie ein Eintrag der obigen Listen. Eigene Kategorien liegen ausschließlich im LocalStorage-Schlüssel `doc-org-categories-v1` dieses Geräts und sind Teil der Sicherung. Standardkategorien lassen sich nicht löschen.

## Personen

Die Personenliste steht nicht im Quellcode, sondern wird in der App unter „Kategorien & Personen“ gepflegt und im LocalStorage-Schlüssel `doc-org-people-v1` gespeichert. „Familie / gemeinsam“ und „Unklar“ stehen immer zur Verfügung.

Vollständiger Vor- und Nachname → Person vorschlagen. Nur Vorname → Hinweis zur manuellen Bestätigung. Nachname allein → Unklar. „Familie <Nachname>“ (Nachname aus der eigenen Personenliste) → Familie / gemeinsam. Mehrere vollständige Namen → mehrere Personen; die Zuordnung muss geprüft werden, da ein Name auch in einer Signatur vorkommen kann. Kein Adressblock- oder Rollenmodell.

## Dokumenttitel

Reihenfolge der Titelfindung aus dem erkannten Text: Zeile mit „Betreff“, „Betrifft“ oder „Thema“; sonst Dokumentart („Rechnung“, „Mahnung“, „Bedienungsanleitung“, „Versicherungsschein“, „Terminbestätigung“ und weitere) verbunden mit der ersten absenderartigen Zeile (erkannt an GmbH, AG, e. V., Stadtwerke, Praxis, Klinik, Sparkasse und ähnlichen Kennzeichen); sonst die erste brauchbare Überschrift. Anreden, Grußformeln, Seitenzahlen sowie Telefon-, E-Mail-, IBAN- und Kundennummernzeilen werden übersprungen. Findet sich nichts, bleibt der Dateiname als Titel stehen. Der Vorschlag ist im Prüfschritt frei änderbar.

## Bearbeitungsstand

Enthält ein Dokument die Kategorie Anleitungen, wird der Stand automatisch auf „Erledigt“ gesetzt – beim Zuordnungsvorschlag und beim späteren Ankreuzen der Kategorie. Anleitungen sind Nachschlagewerke und kein offener Vorgang. Der Stand lässt sich im selben Fenster wieder auf „Offen“ ändern.

## Fristen und Termine

Datum im Kontext von „zahlbar bis“, „Zahlungsziel“, „fällig am“, „spätestens bis“ und ähnlichen Formulierungen → Zahlungsziel. Terminbezogene Datumsangaben → Terminvorschlag. Explizite Absageformulierungen werden unterdrückt. Rein allgemeine Terminhinweise erzeugen kein Datum.

Unterstützt: numerische Datumsangaben TT.MM.JJJJ bzw. TT/MM/JJJJ, zweistellige Jahre als 20xx, Uhrzeiten HH:MM, HH.MM Uhr und „um H Uhr“. Ausgeschriebene Monate, Handschrift und komplexe Tabellen werden nicht zuverlässig interpretiert.

Zahlungsfristen als Zeitraum werden umgerechnet: „innerhalb von 14 Tagen nach Rechnungsdatum“, „binnen 30 Tagen“, „Zahlungsziel: 14 Tage“ und „14 Tage netto“. Grundlage ist das im Dokument genannte Rechnungsdatum; fehlt es, wird das Eingangsdatum verwendet und der Eintrag als geschätzt markiert. Fristen ab Erhalt/Zugang ohne Rechnungsdatum bleiben manuell.

Wird ein Dokument als Rechnung erkannt und nennt es überhaupt kein Zahlungsziel, legt Doc-Org eines an: 14 Tage ab Rechnungsdatum, ersatzweise ab Eingang. Solche Einträge sind sichtbar als „Frist geschätzt“ gekennzeichnet und erzeugen einen Prüfhinweis. Nennt das Dokument ein Zahlungsziel, dessen Datum aber unlesbar oder ungültig ist, wird nichts geraten.

Der Rechnungsbetrag wird aus beschrifteten Feldern gelesen (Rechnungsbetrag, Gesamtbetrag, zu zahlender Betrag und weitere). Stehen mehrere beschriftete Beträge im Text, gilt der höchste als Zahlbetrag (netto/brutto). Ohne Beschriftung wird nur bei Rechnungen der höchste ausdrücklich als Euro gekennzeichnete Betrag übernommen und ein Prüfhinweis gesetzt.

Der Titel eines Zahlungsziels lautet immer „Zahlungstermin “ gefolgt vom Dokumenttitel und wird bei Titeländerungen automatisch nachgeführt. Kalendereinträge lassen sich ohne zusätzlichen Bestätigungsschritt exportieren; auf dem iPhone öffnet der Export das Teilen-Menü mit „Zu Kalender hinzufügen“. Betrag und Ort sind editierbar; der Ort wird derzeit manuell ergänzt. Lastschriftformulierungen erzeugen einen Prüfhinweis.
