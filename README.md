# Die longitudinale emoji-basierte Defäkationsstudie

Ein statischer, deutschsprachiger Privatbericht. Ohne Build-Schritt, Backend,
Konten, Datenbank, Laufzeit-KI, Telemetrie oder CDN-Anfragen zur Laufzeit.

## Bericht öffnen

Diesen Ordner mit einem beliebigen statischen HTTP-Server bereitstellen und
`index.html` über localhost öffnen. Über eine `file:`-Adresse lassen sich
CSV und JSON nicht zuverlässig nachladen. Beispiel bei installiertem Python:

```powershell
Set-Location 'C:\azure\notes\AI\dataanalyze'
python -m http.server 8000 --bind 127.0.0.1
```

Anschließend `http://localhost:8000` öffnen. Den Server nicht öffentlich
bereitstellen: Die Daten sind privat.

## Dateien und Daten

- `index.html`: Berichtsstruktur, Überschriften und statische Diskussion.
- `css/style.css`: responsives Berichtslayout und A5-Druckregeln.
- `js/data.js`: einmaliges, zwischengespeichertes Laden von Statistik und
  Tages-CSV; Ableitung der kumulierten Reihen.
- `js/story.js`: Kennzahlen, Rekordkarten, persönliche Profile, Statistiktabellen
  und datenbezogene Begleittexte.
- `js/charts.js`: dreizehn Plotly-Diagramme, SVG-Downloads und Druckabbildungen.
- `js/main.js`: Initialisierung sowie Export- und Druckschaltflächen.
- `data/`: feste Datensatzkopien für den Bericht. Die Originale im Hauptordner
  bleiben erhalten.
- `js/vendor/`: lokale Versionen von Plotly 2.35.2 und PapaParse 5.4.1
  unter MIT-Lizenz; ursprüngliche Lizenzhinweise bleiben erhalten.

Die Seite lädt `data/stats.json` und `data/daily_summary.csv` jeweils einmal.
Vorhandene Summen, Prozentwerte, Zeitkennzahlen und Rekorde werden direkt
übernommen. Nur kumulierte Kurven und Kalenderzellen verwenden Tageszeilen.
`data/events.csv` steht zum Download bereit, wird aber nicht automatisch geladen.

Quellschlüssel und Rohdaten bleiben unverändert. Oberfläche, Diagramme,
Datums- und Zahlenformatierung sind deutsch. Kalenderdaten werden ohne
Zeitzonenverschiebung dargestellt. Beobachtete Tage ohne Ereignis bleiben
sichtbar; nicht existierende Tage und Tage außerhalb des Zeitraums bleiben leer.

## Beschriftungen selbst ändern

Statische Texte stehen in `index.html`, dynamische Karten und Begleittexte
in `js/story.js`, Achsen, Legenden und Diagrammhinweise in `js/charts.js`.
Interne IDs, Datenschlüssel und CSV-Spaltennamen nicht übersetzen.

## Druck und Abbildungsexport

Jede Abbildung besitzt die Schaltfläche **SVG exportieren**. **Bericht drucken**
bereitet zunächst vektorbasierte SVG-Abbildungen in festen Berichtsmaßen vor
und öffnet danach den Druckdialog. A5 und 100 % Skalierung wählen,
Browser-Kopf-/Fußzeilen ausschalten und Hintergrundgrafiken aktivieren.
Der normale Browser-Druckbefehl funktioniert ebenfalls; die Berichtsschaltfläche
liefert jedoch vorhersehbarere Diagrammgrößen. Einzelne SVGs lassen sich direkt
in ein späteres Broschürenlayout übernehmen.

## Welche Statistiken werden verwendet?

Der Bericht deckt die ursprünglich gewünschten Ansichten ab, zeigt aber
**nicht jedes Feld** der Statistikdatei:

- Enthalten: Gesamtzahl, Beobachtungsdauer, Personensummen und Anteile,
  Durchschnitt je Kalendertag, monatliche und jährliche Beiträge, gemeinsame
  Wochen-, Saison- und Stundenverteilung, produktivster Tag, Spitzenstunde,
  kürzester personenübergreifender Abstand, längste Sendepause, längste
  gemeinsame Aktivitätsserie im Sinne von mindestens einer aktiven Person,
  Synchronisationsschwellen und Archivdatum.
- Zusätzlich aus Tagesdaten: kumulierter Verlauf, Vorsprung und Kalender-Farbmatrix.
- Der statistische Anhang ergänzt aktive und inaktive Tage, Tage mit beiden
  Personen, den Durchschnitt je aktivem Tag sowie persönliche Profile mit
  Aktivitätstagen, Durchschnitten, erster/letzter Meldung und Spitzenstunde.
  Drei weitere Diagramme zeigen persönliche Stunden-, Wochen- und
  Saisonverteilungen. Tabellen enthalten Anzahl, Mittelwert, Median, Minimum
  und Maximum der allgemeinen und persönlichen Ereignisabstände sowie der
  gerichteten Wartezeiten bis zum nächsten Ereignis der anderen Person.
  Persönliche Abstandsrekorde enthalten die genauen Zeitpunkte. Alle vier
  Serienkriterien zeigen längste Dauer, Zeitraum und Gesamtzahl der Serien.
- Dauern werden aus den vorhandenen Sekundenwerten in Tage, Stunden, Minuten
  und Sekunden umformatiert, ohne Kennzahlen neu zu berechnen. Bis zu drei
  Nachkommastellen bleiben erhalten; persönliche Durchschnitte werden mit
  bis zu vier Nachkommastellen angezeigt.
- Weiterhin nicht vollständig dargestellt: genaue erste und letzte
  Ereigniszeitpunkte des Gesamtarchivs, Detailzeitpunkte und Personenangaben
  einzelner allgemeiner Rekorde,
  Parserdiagnostik, Nachrichtenmengen und nicht passende Nachrichten.
  Manche Gesamtwerte liegen mehrfach in der Quelldatei vor und werden nur
  an einer Stelle verwendet.

## Einordnung

Ereignisse sind passende Emoji-Nachrichten, keine verifizierten körperlichen
Vorgänge. Teiljahre und -monate, unterschiedliche saisonale Beobachtungsdauern,
Selbstauskunft und eine Stichprobe von zwei Personen begrenzen Vergleiche.
Synchronisationsschwellen sind ineinander enthaltene Anzahlen benachbarter
Personenwechsel, keine unabhängigen Paare und kein Kausalnachweis.

Die Übersetzung der Ereignisdefinition ist als deutscher Berichtstext
hinterlegt; die englische Originaldefinition in der Statistik bleibt unverändert.
