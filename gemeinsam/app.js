/*
 * Knobelkiste – gemeinsame Bausteine für alle Spiele.
 * Wird von jeder Seite als <script src=".../gemeinsam/app.js"></script> geladen
 * und stellt alles unter window.Knobelkiste bereit.
 */
(function () {
  "use strict";

  // Basis-Adresse der Sammlung (Ordner über "gemeinsam/"), damit Pfade
  // unabhängig davon funktionieren, wie tief eine Seite im Ordnerbaum liegt.
  const skript = document.currentScript;
  const BASE = new URL("../", skript.src).href;

  const SPEICHER_PREFIX = "knobelkiste.";

  function speicherLesen(schluessel, standard) {
    try {
      const wert = localStorage.getItem(SPEICHER_PREFIX + schluessel);
      return wert === null ? standard : JSON.parse(wert);
    } catch (e) {
      return standard;
    }
  }

  function speicherSchreiben(schluessel, wert) {
    try {
      localStorage.setItem(SPEICHER_PREFIX + schluessel, JSON.stringify(wert));
    } catch (e) {
      /* Speichern nicht möglich (z. B. privates Fenster) – Spiel läuft trotzdem. */
    }
  }

  // ---------- Daten laden ----------

  async function ladeJSON(pfad) {
    const antwort = await fetch(new URL(pfad, BASE));
    if (!antwort.ok) throw new Error("Konnte " + pfad + " nicht laden (" + antwort.status + ")");
    return antwort.json();
  }

  function parameter(name, standard) {
    const wert = new URLSearchParams(location.search).get(name);
    return wert === null ? standard : wert;
  }

  // ---------- Zufall ----------

  // Zufallszahlen mit Startwert, damit ein Arbeitsblatt mit derselben
  // Nummer immer gleich aussieht (wichtig für das Lösungsblatt).
  function zufallMitStartwert(startwert) {
    let a = startwert >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mischen(liste, zufall) {
    const r = zufall || Math.random;
    const kopie = liste.slice();
    for (let i = kopie.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
    }
    return kopie;
  }

  // ---------- Sterne ----------

  function sterneSchluessel(spiel, klasse, stufe) {
    return "sterne." + spiel + ".k" + klasse + ".s" + stufe;
  }

  function sterneLesen(spiel, klasse, stufe) {
    return speicherLesen(sterneSchluessel(spiel, klasse, stufe), 0);
  }

  function sterneSpeichern(spiel, klasse, stufe, anzahl) {
    const bisher = sterneLesen(spiel, klasse, stufe);
    if (anzahl > bisher) speicherSchreiben(sterneSchluessel(spiel, klasse, stufe), anzahl);
  }

  function sterneHtml(anzahl, maximal) {
    const max = maximal || 3;
    let html = '<span class="sterne" aria-label="' + anzahl + " von " + max + ' Sternen">';
    for (let i = 0; i < max; i++) {
      html += i < anzahl ? "★" : '<span class="leer">★</span>';
    }
    return html + "</span>";
  }

  // ---------- Farben der Wortarten (je Schule verschieden, daher einstellbar) ----------

  const FARBPALETTE = [
    { name: "Blau", wert: "#2f6fd6" },
    { name: "Rot", wert: "#d33a2c" },
    { name: "Grün", wert: "#2e8b3e" },
    { name: "Gelb", wert: "#e0a800" },
    { name: "Orange", wert: "#e07a2f" },
    { name: "Lila", wert: "#8a4fbf" },
    { name: "Braun", wert: "#8b5a2b" },
    { name: "Grau", wert: "#6b6b75" },
    { name: "Pink", wert: "#d6458f" },
    { name: "Türkis", wert: "#169c9c" }
  ];

  function farbenLesen(standard) {
    return Object.assign({}, standard, speicherLesen("farben", {}));
  }

  function farbeSpeichern(wortart, farbe) {
    const farben = speicherLesen("farben", {});
    farben[wortart] = farbe;
    speicherSchreiben("farben", farben);
  }

  function farbenZuruecksetzen() {
    speicherSchreiben("farben", {});
  }

  function farbName(wert) {
    const eintrag = FARBPALETTE.find(function (f) { return f.wert === wert; });
    return eintrag ? eintrag.name : "";
  }

  // Baut einen Einstellungsdialog für die Farben der übergebenen Wortarten.
  // wortarten: { nomen: { name: "Nomen", farbe: "#..." }, ... }
  function farbDialog(wortarten, beiAenderung) {
    const dialog = document.createElement("dialog");
    dialog.className = "einstellungen";
    document.body.appendChild(dialog);

    function zeichnen() {
      const farben = farbenLesen(standardFarben(wortarten));
      let html = "<h2>Farben der Wortarten</h2>" +
        "<p>Stellt die Farben so ein, wie ihr sie in der Schule benutzt.</p>";
      Object.keys(wortarten).forEach(function (id) {
        html += "<div><strong>" + wortarten[id].name + "</strong></div>" +
          '<div class="farbwahl" role="group" aria-label="Farbe für ' + wortarten[id].name + '">';
        FARBPALETTE.forEach(function (f) {
          html += '<button type="button" data-wortart="' + id + '" data-farbe="' + f.wert + '"' +
            ' aria-pressed="' + (farben[id] === f.wert) + '" title="' + f.name + '"' +
            ' aria-label="' + f.name + '" style="background:' + f.wert + '"></button>';
        });
        html += "</div>";
      });
      html += '<p><button type="button" class="knopf klein" data-aktion="zuruecksetzen">Zurücksetzen</button> ' +
        '<button type="button" class="knopf haupt" data-aktion="schliessen">Fertig</button></p>';
      dialog.innerHTML = html;
    }

    dialog.addEventListener("click", function (e) {
      const ziel = e.target.closest("button");
      if (!ziel) return;
      if (ziel.dataset.farbe) {
        farbeSpeichern(ziel.dataset.wortart, ziel.dataset.farbe);
      } else if (ziel.dataset.aktion === "zuruecksetzen") {
        farbenZuruecksetzen();
      } else if (ziel.dataset.aktion === "schliessen") {
        dialog.close();
        return;
      }
      zeichnen();
      if (beiAenderung) beiAenderung();
    });

    return {
      oeffnen: function () { zeichnen(); dialog.showModal(); }
    };
  }

  function standardFarben(wortarten) {
    const ergebnis = {};
    Object.keys(wortarten).forEach(function (id) { ergebnis[id] = wortarten[id].farbe; });
    return ergebnis;
  }

  // ---------- Vorlesen (Sprachausgabe des Browsers) ----------

  let deutscheStimme = null;

  function stimmeSuchen() {
    if (!("speechSynthesis" in window)) return null;
    const stimmen = speechSynthesis.getVoices();
    deutscheStimme =
      stimmen.find(function (s) { return s.lang === "de-DE"; }) ||
      stimmen.find(function (s) { return s.lang && s.lang.toLowerCase().indexOf("de") === 0; }) ||
      null;
    return deutscheStimme;
  }

  // Ruft beiVerfuegbar(true/false) auf, sobald klar ist, ob eine deutsche Stimme da ist.
  function vorlesenPruefen(beiVerfuegbar) {
    if (!("speechSynthesis" in window)) { beiVerfuegbar(false); return; }
    if (stimmeSuchen()) { beiVerfuegbar(true); return; }
    let erledigt = false;
    speechSynthesis.addEventListener("voiceschanged", function () {
      if (erledigt) return;
      if (stimmeSuchen()) { erledigt = true; beiVerfuegbar(true); }
    });
    setTimeout(function () {
      if (!erledigt) { erledigt = true; beiVerfuegbar(!!stimmeSuchen()); }
    }, 1500);
  }

  function vorlesen(text) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const aeusserung = new SpeechSynthesisUtterance(text);
    aeusserung.lang = "de-DE";
    if (deutscheStimme || stimmeSuchen()) aeusserung.voice = deutscheStimme;
    aeusserung.rate = 0.9;
    speechSynthesis.speak(aeusserung);
  }

  // ---------- Offline-Betrieb ----------

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register(BASE + "sw.js", { scope: BASE }).catch(function () {});
  }

  window.Knobelkiste = {
    BASE: BASE,
    ladeJSON: ladeJSON,
    parameter: parameter,
    zufallMitStartwert: zufallMitStartwert,
    mischen: mischen,
    sterneLesen: sterneLesen,
    sterneSpeichern: sterneSpeichern,
    sterneHtml: sterneHtml,
    farbenLesen: farbenLesen,
    farbName: farbName,
    standardFarben: standardFarben,
    farbDialog: farbDialog,
    vorlesenPruefen: vorlesenPruefen,
    vorlesen: vorlesen
  };
})();
