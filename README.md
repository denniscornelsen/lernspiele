# Knobelkiste

Lernspiele für die Grundschule, direkt im Browser. Ohne Installation, ohne Anmeldung, ohne Werbung.
Gedacht für die Hausaufgabenhilfe der Arche Bielefeld. Wir starten mit Deutsch Klasse 4 (Kernlehrplan NRW).

## Spiele

| Spiel | Fach | Bereich | Klassen | Arbeitsblatt |
| --- | --- | --- | --- | --- |
| Wortarten-Fabrik | Deutsch | Sprache untersuchen | 4 | ja, mit Lösungsblatt |

## So ist das Projekt aufgebaut

```
index.html                 Startseite: Klasse wählen, dann Spiel
katalog.json               Liste aller Spiele (Klasse, Fach, Bereich)
sw.js                      Offline-Speicher, damit die Spiele auch bei schwachem WLAN laufen
gemeinsam/                 Design, Schrift (Andika), Sterne, Vorlesen, Farbeinstellungen
spiele/<spiel>/            Spielcode und Arbeitsblatt, gleich für alle Klassen
inhalte/<fach>/klasse-N/   Wörter, Sätze und Stufen für eine Klasse
```

Spielcode und Inhalte sind getrennt. Für eine neue Klasse reicht meist eine neue Datei unter
`inhalte/deutsch/klasse-N/` und ein Eintrag der Klasse bei `klassen` in `katalog.json`.

## Wörter ändern oder ergänzen

Die Wörter der Wortarten-Fabrik stehen in `inhalte/deutsch/klasse-4/wortarten.json`.

- Einzelne Wörter: einfach in die passende Liste schreiben, zum Beispiel bei `"nomen": [...]`.
- Sätze (Stufe 3): Das gesuchte Wort steht in eckigen Klammern, zum Beispiel
  `{ "satz": "Das [Laufen] macht mir Spaß.", "wortart": "nomen" }`.
- Die Standardfarben der Wortarten stehen bei `"farbe"`. Im Spiel kann man sie über den Knopf „Farben“
  an die Farben der eigenen Schule anpassen.

Nach einer Änderung bitte in `sw.js` die Zahl bei `VERSION` um eins erhöhen, damit die Laptops die neue Version laden.

## Arbeitsblätter

Jedes Spiel hat ein Arbeitsblatt (Knopf „Arbeitsblatt“). Jedes Blatt hat eine Blatt-Nr.
Gibt man diese Nummer später wieder ein und schaltet „Lösungen zeigen“ an, erscheint das passende Lösungsblatt.
Gedruckt wird über den Knopf „Drucken“ (DIN A4, auch als PDF speicherbar).

## Veröffentlichen mit GitHub Pages

Einmalig in GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
Branch `main`, Ordner `/ (root)`, speichern. Nach ein bis zwei Minuten ist die Seite erreichbar unter
https://denniscornelsen.github.io/lernspiele/

## Lokal ausprobieren

Die Seiten laden ihre Daten nach, deshalb braucht man einen kleinen Webserver:

```
python3 -m http.server 8000
```

Dann im Browser http://localhost:8000 öffnen.

## Lizenzen

Die Schrift Andika steht unter der SIL Open Font License (siehe `gemeinsam/schrift/OFL.txt`).
