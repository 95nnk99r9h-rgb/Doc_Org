# Doc-Org in GitHub verwalten

Der Projektordner ist das Repository-Stammverzeichnis. Dort liegen `README.md`, `package.json`, `.gitignore` und die Ordner `docs/`, `scripts/` und `tests/` direkt nebeneinander. Der Ordner `docs/` enthält sowohl die App als auch die Projektdokumentation.

Beim Übertragen in ein anderes Repository den **Inhalt** des Projektordners übernehmen, nicht nur die ZIP-Datei und nicht einen zusätzlichen äußeren Ordner. Versteckte Dateien wie `.gitignore`, `.gitattributes` und `.editorconfig` müssen ebenfalls mitkommen.

## Was gehört ins Repository?

| Pfad | Zweck |
| --- | --- |
| `README.md` | Einstieg, Funktionsübersicht und Startanleitung |
| `.gitignore` | Schließt lokale Abhängigkeiten, private Exporte und temporäre Dateien aus |
| `.gitattributes` | Einheitliche Zeilenenden, unveränderte Binärdateien und Kennzeichnung fremder Bibliotheken |
| `.editorconfig` | Gemeinsame Formatierungseinstellungen für Editoren |
| `package.json` | Projektmetadaten und Start-/Testbefehle |
| `docs/` | Vollständige statische PWA plus Projektdokumentation; zugleich die Quelle für GitHub Pages |
| `scripts/` | Hilfsprogramme für Start und Prüfung |
| `tests/` | Funktionstests und erfundene Musterunterlagen |
| `docs/.nojekyll` | Verhindert die Jekyll-Verarbeitung der App-Dateien |
| `.openai/hosting.json` | Optionale vorbereitete Hosting-Konfiguration; keine Zugangsdaten |

`docs/` ist bei diesem Projekt bewusst der versionierte App-Ordner und heißt so, weil GitHub Pages genau diesen Namen ohne Build-Schritt veröffentlichen kann. Es gibt keinen Build, der seinen Inhalt neu erzeugt; er darf deshalb nicht ausgeschlossen werden. Auch `docs/vendor/` gehört ins Repository: Darin liegen die für den Offlinebetrieb benötigten Bibliotheken und Sprachmodelle samt Lizenzen und Herkunftsnachweisen. Git LFS ist für dieses Paket nicht nötig.

## Mit Git hochladen

Ein leeres GitHub-Repository anlegen und ein Terminal im Projektordner öffnen:

```sh
git init -b main
git add .
git status
git commit -m "Initiale Doc-Org PWA"
git remote add origin https://github.com/DEIN-BENUTZERNAME/doc-org.git
git push -u origin main
```

Die Beispieladresse durch die Adresse deines eigenen Repositorys ersetzen. Zugangsdaten nicht in Dateien oder in die Repository-Adresse eintragen. Git verwendet die auf deinem Computer eingerichtete Anmeldung. Die Befehle sind eine Anleitung und wurden nicht für dich ausgeführt.

Vor dem Commit zeigt `git status`, welche Dateien hochgeladen werden. Der Quellcode enthält keine echten Personennamen: Die Personenliste wird in der App gepflegt und bleibt im Browserspeicher des Geräts. Die Musterunterlagen unter `tests/fixtures/` sind erfunden. Echte Unterlagen und Sicherungen gehören nicht ins Repository; dafür sind beispielsweise `personal-data/`, `backups/` und `Doc-Org-Sicherung-*.json` ausgeschlossen. `.gitignore` schützt keine Dateien, die bereits zuvor versioniert wurden.

Bei einem **öffentlichen** Repository zusätzlich daran denken: Sicherungsdateien, Screenshots und Beispieldokumente können persönliche Angaben enthalten und gehören dann nicht in Commits.

## Spätere Änderungen

```sh
git add .
git commit -m "Doc-Org aktualisieren"
git push
```

Vor einer Veröffentlichung lassen sich die vorhandenen Prüfungen ausführen:

```sh
npm test
python3 scripts/check-project.py
```

Für Windows kann `python3` durch `py -3` ersetzt werden. Node.js 22 oder neuer und Python 3 werden für diese Prüfungen benötigt; `npm install` ist nicht erforderlich.

## Repository und laufende App

Ein Upload des Codes startet noch keine Website. Für die PWA wird statisches HTTPS-Hosting des Inhalts von `docs/` benötigt. Die Anwendung ist für relative Pfade vorbereitet und läuft auch unter einem Unterpfad.

### GitHub Pages einrichten

*Settings → Pages → Build and deployment*: **Deploy from a branch**, Branch `main`, Ordner **`/docs`**. Mehr ist nicht nötig – kein Build, keine Action.

Die Adresse lautet danach `https://<benutzername>.github.io/<repository>/`. Service Worker, Manifest und Offline-Cache sind korrekt auf den Unterpfad bezogen und unter einer solchen Adresse geprüft. Steht die Quelle stattdessen auf `/ (root)`, erscheint „Page not found“, weil im Stammverzeichnis keine `index.html` liegt.

Die persönlichen Dokumentdaten bleiben im Browser des jeweiligen Geräts. GitHub versioniert ausschließlich den App-Code, die mitgelieferten Ressourcen und die erfundenen Testunterlagen. Beim Wechsel der Webadresse zuerst eine Doc-Org-Sicherung erstellen, weil der lokale Browser-Speicher an die ursprüngliche Webadresse gebunden ist.
