/*
 * Arbeitsblatt zur Wortarten-Fabrik.
 * Nutzt dieselbe Datendatei wie das Spiel. Jedes Blatt hat eine Nummer:
 * dieselbe Nummer ergibt immer dasselbe Blatt, so passt das Lösungsblatt dazu.
 */
(async function () {
  "use strict";

  const K = window.Knobelkiste;
  const $ = function (id) { return document.getElementById(id); };
  const klasse = Number(K.parameter("klasse", "4"));
  $("zurueck-link").href = "index.html?klasse=" + klasse;

  let daten;
  try {
    daten = await K.ladeJSON("inhalte/deutsch/klasse-" + klasse + "/wortarten.json");
  } catch (e) {
    $("blatt").textContent = "Für Klasse " + klasse + " gibt es dieses Arbeitsblatt noch nicht.";
    return;
  }

  const wortarten = daten.wortarten;
  const einstellung = daten.arbeitsblatt;
  let farben = K.farbenLesen(K.standardFarben(wortarten));

  // Auswahl, aus welchen Stufen die Wörter kommen
  const stufeAuswahl = $("stufe");
  const optionen = einstellung.woerterAusStufen.map(function (n) {
    const stufe = daten.stufen.find(function (s) { return s.nummer === n; });
    return { wert: String(n), text: "Stufe " + n + " (" + stufe.name + ")", stufen: [n] };
  });
  if (einstellung.woerterAusStufen.length > 1) {
    optionen.push({ wert: "gemischt", text: "allen Stufen gemischt", stufen: einstellung.woerterAusStufen });
  }
  optionen.forEach(function (o) {
    const opt = document.createElement("option");
    opt.value = o.wert;
    opt.textContent = o.text;
    stufeAuswahl.appendChild(opt);
  });

  function neueNummer() { return 1000 + Math.floor(Math.random() * 9000); }

  stufeAuswahl.value = K.parameter("stufe", optionen[0].wert);
  if (!stufeAuswahl.value) stufeAuswahl.value = optionen[0].wert;
  $("nummer").value = K.parameter("nr", String(neueNummer()));
  $("loesung").checked = K.parameter("loesung", "0") === "1";

  function escape(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function zeichnen() {
    const nummer = Math.max(1000, Math.min(9999, Number($("nummer").value) || 1000));
    const loesung = $("loesung").checked;
    const option = optionen.find(function (o) { return o.wert === stufeAuswahl.value; }) || optionen[0];
    const zufall = K.zufallMitStartwert(nummer * 10 + optionen.indexOf(option));

    // Adresse aktualisieren, damit man das Blatt als Lesezeichen speichern kann
    const adresse = "?klasse=" + klasse + "&stufe=" + option.wert + "&nr=" + nummer + (loesung ? "&loesung=1" : "");
    history.replaceState(null, "", adresse);

    // ---- Aufgabe 1: Wörter sortieren ----
    const ersteStufe = daten.stufen.find(function (s) { return s.nummer === option.stufen[0]; });
    const kisten = ersteStufe.kisten;
    const proSpalte = einstellung.woerterJeWortart;
    const spalten = {};
    kisten.forEach(function (art) {
      let pool = [];
      option.stufen.forEach(function (n) {
        const stufe = daten.stufen.find(function (s) { return s.nummer === n; });
        if (stufe.woerter && stufe.woerter[art]) pool = pool.concat(stufe.woerter[art]);
      });
      spalten[art] = K.mischen(pool, zufall).slice(0, proSpalte);
    });
    let alleWoerter = [];
    kisten.forEach(function (art) { alleWoerter = alleWoerter.concat(spalten[art]); });
    alleWoerter = K.mischen(alleWoerter, zufall);

    let tabelle = '<table class="tabelle"><thead><tr>';
    kisten.forEach(function (art) {
      tabelle += '<th><span class="farbe" style="background:' + farben[art] + '"></span>' + wortarten[art].name + "</th>";
    });
    tabelle += "</tr></thead><tbody>";
    for (let zeile = 0; zeile < proSpalte + 1; zeile++) {
      tabelle += "<tr>";
      kisten.forEach(function (art) {
        const wort = loesung && spalten[art][zeile] ? '<span class="loesung-text">' + escape(spalten[art][zeile]) + "</span>" : "";
        tabelle += "<td>" + wort + "</td>";
      });
      tabelle += "</tr>";
    }
    tabelle += "</tbody></table>";

    // ---- Aufgabe 2: Wortart im Satz ----
    const satzStufe = daten.stufen.find(function (s) { return s.nummer === einstellung.saetzeAusStufe; });
    const saetze = K.mischen(satzStufe.saetze, zufall).slice(0, einstellung.anzahlSaetze);
    const kuerzel = {};
    satzStufe.kisten.forEach(function (art) { kuerzel[art] = wortarten[art].name.charAt(0).toUpperCase(); });
    const legende = satzStufe.kisten.map(function (art) { return kuerzel[art] + " = " + wortarten[art].name; }).join(" · ");

    let liste = '<ol class="saetze">';
    saetze.forEach(function (s) {
      const satzHtml = escape(s.satz).replace(/\[(.+?)\]/, "<u>$1</u>");
      liste += '<li><span class="satz">' + satzHtml + '</span><span class="auswahl">';
      satzStufe.kisten.forEach(function (art) {
        liste += "<span" + (loesung && art === s.wortart ? ' class="kreis"' : "") + ">" + kuerzel[art] + "</span>";
      });
      liste += "</span></li>";
    });
    liste += "</ol>";

    $("blatt").innerHTML =
      '<header class="blatt-kopf"><div><h1>Wortarten</h1>' +
      (loesung ? '<span class="loesung-stempel">Lösung</span>' : "") + "</div>" +
      '<div class="klein">Knobelkiste · Deutsch Klasse ' + klasse + "<br>Blatt-Nr. " + nummer + "</div></header>" +
      (loesung ? "" : '<div class="name-zeile"><span>Name:</span><span>Datum:</span></div>') +

      '<section class="aufgabe"><h2><span class="nr">1</span>Sortiere die Wörter in die Tabelle.</h2>' +
      '<div class="wortkasten">' + alleWoerter.map(escape).map(function (w) { return "<span>" + w + "</span>"; }).join("") + "</div>" +
      tabelle + "</section>" +

      '<section class="aufgabe"><h2><span class="nr">2</span>Welche Wortart hat das unterstrichene Wort? Kreise ein.</h2>' +
      '<p class="legende">' + legende + "</p>" + liste + "</section>" +

      '<p class="fusszeile-blatt">Tipp: Nomen – kann ich der, die, das davor setzen? · Verb – kann ich ich, du, er davor setzen? · Adjektiv – kann ich es steigern?</p>';
  }

  $("neu").addEventListener("click", function () {
    $("nummer").value = neueNummer();
    $("loesung").checked = false;
    zeichnen();
  });
  stufeAuswahl.addEventListener("change", zeichnen);
  $("nummer").addEventListener("change", zeichnen);
  $("loesung").addEventListener("change", zeichnen);
  $("drucken").addEventListener("click", function () { window.print(); });

  const dialog = K.farbDialog(wortarten, function () {
    farben = K.farbenLesen(K.standardFarben(wortarten));
    zeichnen();
  });
  $("farben-knopf").addEventListener("click", dialog.oeffnen);

  zeichnen();
})();
