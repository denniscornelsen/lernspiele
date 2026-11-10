/*
 * Wortarten-Fabrik
 * Inhalte (Wörter, Sätze, Stufen) kommen aus inhalte/deutsch/klasse-N/wortarten.json.
 * Für eine neue Klasse genügt eine neue Datendatei, der Spielcode bleibt gleich.
 */
(async function () {
  "use strict";

  const K = window.Knobelkiste;
  const SPIEL_ID = "wortarten-fabrik";
  const WOERTER_PRO_RUNDE = 10;

  const klasse = Number(K.parameter("klasse", "4"));
  const $ = function (id) { return document.getElementById(id); };

  $("start-link").href = "../../index.html#klasse-" + klasse;
  $("arbeitsblatt-link").href = "arbeitsblatt.html?klasse=" + klasse;

  let daten;
  try {
    daten = await K.ladeJSON("inhalte/deutsch/klasse-" + klasse + "/wortarten.json");
  } catch (e) {
    $("stufenwahl").classList.add("versteckt");
    $("fehlermeldung").textContent = "Für Klasse " + klasse + " gibt es dieses Spiel noch nicht.";
    $("fehlermeldung").classList.remove("versteckt");
    return;
  }

  const wortarten = daten.wortarten;
  let farben = K.farbenLesen(K.standardFarben(wortarten));

  const dialog = K.farbDialog(wortarten, function () {
    farben = K.farbenLesen(K.standardFarben(wortarten));
    if (zustand) kistenZeichnen();
  });
  $("farben-knopf").addEventListener("click", dialog.oeffnen);

  K.vorlesenPruefen(function (ok) {
    $("vorlesen").classList.toggle("versteckt", !ok);
  });

  // ---------- Fabrikhalle und Stufenwahl ----------

  function maschineSvg(farbe) {
    // Zahnrad: gestrichelter dicker Rand ergibt die Zähne
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="34" fill="none" stroke="' + farbe + '" stroke-width="16" stroke-dasharray="13 9"/>' +
      '<circle cx="50" cy="50" r="28" fill="' + farbe + '"/>' +
      '<circle cx="50" cy="50" r="10" fill="#fdf6e9"/></svg>';
  }

  const maschinenFarben = ["#e07a2f", "#2f6fd6", "#2e8b3e", "#8a4fbf", "#d33a2c", "#169c9c"];

  function stufenwahlZeigen() {
    zustand = null;
    $("spiel").classList.add("versteckt");
    $("ergebnis").classList.add("versteckt");
    $("stufenwahl").classList.remove("versteckt");

    const halle = $("maschinen");
    const stufenEl = $("stufen");
    halle.innerHTML = "";
    stufenEl.innerHTML = "";

    daten.stufen.forEach(function (stufe, i) {
      const sterne = K.sterneLesen(SPIEL_ID, klasse, stufe.nummer);

      const maschine = document.createElement("div");
      maschine.className = "maschine " + (sterne > 0 ? "an" : "aus");
      maschine.innerHTML = maschineSvg(maschinenFarben[i % maschinenFarben.length]) +
        (sterne > 0 ? "Maschine " + stufe.nummer + " läuft!" : "Maschine " + stufe.nummer);
      halle.appendChild(maschine);

      const kachel = document.createElement("button");
      kachel.type = "button";
      kachel.className = "kachel stufe-kachel";
      kachel.innerHTML = K.sterneHtml(sterne) +
        '<span class="titel">Stufe ' + stufe.nummer + ": " + stufe.name + "</span>" +
        '<span class="info">' + stufe.beschreibung + "<br><em>" + stufe.beispiel + "</em></span>";
      kachel.addEventListener("click", function () { rundeStarten(stufe); });
      stufenEl.appendChild(kachel);
    });
  }

  // ---------- Runde ----------

  let zustand = null;

  function aufgabenFuer(stufe) {
    let alle = [];
    if (stufe.saetze) {
      alle = stufe.saetze.map(function (s) { return { satz: s.satz, wortart: s.wortart }; });
    } else {
      Object.keys(stufe.woerter).forEach(function (art) {
        stufe.woerter[art].forEach(function (w) { alle.push({ wort: w, wortart: art }); });
      });
    }
    // Ausgewogen mischen: möglichst jede Kiste kommt vor
    const nachArt = {};
    K.mischen(alle).forEach(function (a) { (nachArt[a.wortart] = nachArt[a.wortart] || []).push(a); });
    const auswahl = [];
    let runde = 0;
    while (auswahl.length < WOERTER_PRO_RUNDE && runde < 50) {
      Object.keys(nachArt).forEach(function (art) {
        if (auswahl.length < WOERTER_PRO_RUNDE && nachArt[art][runde]) auswahl.push(nachArt[art][runde]);
      });
      runde++;
    }
    return K.mischen(auswahl);
  }

  function rundeStarten(stufe) {
    zustand = {
      stufe: stufe,
      aufgaben: aufgabenFuer(stufe),
      index: 0,
      fehlerGesamt: 0,
      fehlerAktuell: 0,
      gesperrt: false
    };
    $("stufenwahl").classList.add("versteckt");
    $("ergebnis").classList.add("versteckt");
    $("spiel").classList.remove("versteckt");
    kistenZeichnen();
    aufgabeZeigen();
  }

  function kistenZeichnen() {
    const el = $("kisten");
    el.innerHTML = "";
    zustand.stufe.kisten.forEach(function (art, i) {
      const knopf = document.createElement("button");
      knopf.type = "button";
      knopf.className = "kiste";
      knopf.dataset.wortart = art;
      knopf.style.background = farben[art];
      knopf.innerHTML = wortarten[art].name + '<span class="taste">Taste ' + (i + 1) + "</span>";
      knopf.addEventListener("click", function () { antworten(art, knopf); });
      el.appendChild(knopf);
    });
  }

  function textMitMarkierung(satz) {
    const div = document.createElement("div");
    div.textContent = satz;
    return div.innerHTML.replace(/\[(.+?)\]/, "<mark>$1</mark>");
  }

  function aufgabeZeigen() {
    const a = zustand.aufgaben[zustand.index];
    const karte = $("karte");
    zustand.fehlerAktuell = 0;
    zustand.gesperrt = false;

    $("hinweis").classList.add("versteckt");
    $("fortschritt").textContent = "Wort " + (zustand.index + 1) + " von " + zustand.aufgaben.length;
    $("punkte").innerHTML = "";

    if (a.satz) {
      karte.className = "karte satz";
      $("karte-text").innerHTML = textMitMarkierung(a.satz);
      $("frage").textContent = "Welche Wortart hat das markierte Wort in diesem Satz?";
    } else {
      karte.className = "karte";
      $("karte-text").textContent = a.wort;
      $("frage").textContent = "Welche Wortart ist das?";
    }

    // Band läuft, Karte fährt herein
    void karte.offsetWidth;
    karte.classList.add("kommt");
    $("band").classList.add("laeuft");
    setTimeout(function () { $("band").classList.remove("laeuft"); }, 900);

    if (zustand.index === 0) {
      const erste = document.querySelector(".kiste");
      if (erste) erste.focus({ preventScroll: true });
    }
  }

  function antworten(art, knopf) {
    if (!zustand || zustand.gesperrt) return;
    const a = zustand.aufgaben[zustand.index];
    const karte = $("karte");
    const hinweis = $("hinweis");

    if (art === a.wortart) {
      zustand.gesperrt = true;
      knopf.classList.remove("richtig");
      void knopf.offsetWidth;
      knopf.classList.add("richtig");
      karte.classList.remove("kommt", "wackelt");
      karte.classList.add("faellt");
      $("punkte").textContent = zustand.fehlerAktuell === 0 ? "Super!" : "Richtig!";
      setTimeout(function () {
        knopf.classList.remove("richtig");
        zustand.index++;
        if (zustand.index >= zustand.aufgaben.length) rundeBeenden();
        else aufgabeZeigen();
      }, zustand.fehlerAktuell === 0 ? 650 : 1200);
      return;
    }

    // Falsch: Hinweis zeigen, nochmal versuchen lassen
    zustand.fehlerAktuell++;
    zustand.fehlerGesamt++;
    knopf.classList.remove("falsch");
    void knopf.offsetWidth;
    knopf.classList.add("falsch");
    karte.classList.remove("kommt", "wackelt");
    void karte.offsetWidth;
    karte.classList.add("wackelt");

    const info = wortarten[a.wortart];
    hinweis.classList.remove("versteckt");
    if (zustand.fehlerAktuell === 1) {
      hinweis.className = "hinweis";
      hinweis.textContent = "Noch nicht. " + info.tipp;
    } else {
      hinweis.className = "hinweis erklaerung";
      hinweis.textContent = info.erklaerung;
    }
  }

  function rundeBeenden() {
    const fehler = zustand.fehlerGesamt;
    const sterne = fehler === 0 ? 3 : fehler <= 2 ? 2 : 1;
    const vorher = K.sterneLesen(SPIEL_ID, klasse, zustand.stufe.nummer);
    K.sterneSpeichern(SPIEL_ID, klasse, zustand.stufe.nummer, sterne);

    $("spiel").classList.add("versteckt");
    $("ergebnis").classList.remove("versteckt");
    $("ergebnis-sterne").innerHTML = K.sterneHtml(sterne);
    $("ergebnis-titel").textContent =
      sterne === 3 ? "Fehlerfrei! Großartig!" : sterne === 2 ? "Sehr gut gemacht!" : "Geschafft!";
    let text = fehler === 0
      ? "Alle Wörter gleich beim ersten Mal richtig sortiert."
      : "Du hast alle Wörter sortiert. Fehlversuche: " + fehler + ".";
    if (vorher === 0) text += " Maschine " + zustand.stufe.nummer + " in deiner Fabrik läuft jetzt!";
    else if (sterne > vorher) text += " Neuer Rekord für diese Stufe!";
    $("ergebnis-text").textContent = text;
    $("nochmal").focus();
  }

  // ---------- Bedienung ----------

  $("nochmal").addEventListener("click", function () { rundeStarten(zustand.stufe); });
  $("andere-stufe").addEventListener("click", stufenwahlZeigen);
  $("abbrechen").addEventListener("click", stufenwahlZeigen);
  $("vorlesen").addEventListener("click", function () {
    if (!zustand) return;
    const a = zustand.aufgaben[zustand.index];
    K.vorlesen(a.satz ? a.satz.replace(/[\[\]]/g, "") : a.wort);
  });

  document.addEventListener("keydown", function (e) {
    if (!zustand || $("spiel").classList.contains("versteckt")) return;
    if (document.querySelector("dialog[open]")) return;
    const nr = Number(e.key);
    if (nr >= 1 && nr <= zustand.stufe.kisten.length) {
      const knopf = document.querySelectorAll(".kiste")[nr - 1];
      antworten(knopf.dataset.wortart, knopf);
    }
  });

  stufenwahlZeigen();
})();
