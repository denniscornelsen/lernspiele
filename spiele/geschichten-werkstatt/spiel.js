/*
 * Geschichten-Werkstatt
 * Drei Räume aus inhalte/deutsch/klasse-N/geschichten-werkstatt.json:
 *  - "reihenfolge": Sätze einer Geschichte ordnen (Einleitung, Hauptteil, Schluss)
 *  - "rede": Satzzeichen der wörtlichen Rede setzen
 *  - "woerter": langweilige Wörter durch treffende ersetzen
 */
(async function () {
  "use strict";

  const K = window.Knobelkiste;
  const SPIEL_ID = "geschichten-werkstatt";
  const klasse = Number(K.parameter("klasse", "4"));
  const $ = function (id) { return document.getElementById(id); };

  $("start-link").href = "../../index.html#klasse-" + klasse;
  $("arbeitsblatt-link").href = "arbeitsblatt.html?klasse=" + klasse;

  let daten;
  try {
    daten = await K.ladeJSON("inhalte/deutsch/klasse-" + klasse + "/geschichten-werkstatt.json");
  } catch (e) {
    $("raumwahl").classList.add("versteckt");
    $("fehlermeldung").textContent = "Für Klasse " + klasse + " gibt es dieses Spiel noch nicht.";
    $("fehlermeldung").classList.remove("versteckt");
    return;
  }

  function escape(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  const SYMBOLE = { reihenfolge: "1 · 2 · 3", rede: "„ … “", woerter: "sagen → rufen" };

  // ---------- Raumwahl ----------

  function raumwahlZeigen() {
    zustand = null;
    $("aufgabe").classList.add("versteckt");
    $("ergebnis").classList.add("versteckt");
    $("raumwahl").classList.remove("versteckt");
    const el = $("raeume");
    el.innerHTML = "";
    daten.raeume.forEach(function (raum) {
      const k = document.createElement("button");
      k.type = "button";
      k.className = "kachel raum-kachel";
      k.innerHTML = K.sterneHtml(K.sterneLesen(SPIEL_ID, klasse, raum.nummer)) +
        '<span class="symbol">' + escape(SYMBOLE[raum.typ] || "") + "</span>" +
        '<span class="titel">Raum ' + raum.nummer + ": " + escape(raum.name) + "</span>" +
        '<span class="info">' + escape(raum.beschreibung) + "</span>";
      k.addEventListener("click", function () { raumStarten(raum); });
      el.appendChild(k);
    });
  }

  // ---------- Runde ----------

  let zustand = null;

  function raumStarten(raum) {
    zustand = {
      raum: raum,
      aufgaben: K.mischen(raum.aufgaben).slice(0, raum.proRunde),
      index: 0,
      fehlerGesamt: 0,
      fehlerAktuell: 0
    };
    $("raumwahl").classList.add("versteckt");
    $("ergebnis").classList.add("versteckt");
    $("aufgabe").classList.remove("versteckt");
    aufgabeZeigen();
  }

  function hinweis(text, art) {
    const h = $("hinweis");
    h.className = "hinweis" + (art ? " " + art : "");
    h.textContent = text;
  }

  function aufgabeZeigen() {
    zustand.fehlerAktuell = 0;
    $("hinweis").classList.add("versteckt");
    $("weiter").classList.add("versteckt");
    $("pruefen").classList.add("versteckt");
    $("fortschritt").textContent = zustand.raum.name + " · Aufgabe " + (zustand.index + 1) + " von " + zustand.aufgaben.length;
    const a = zustand.aufgaben[zustand.index];
    const typ = zustand.raum.typ;
    if (typ === "reihenfolge") ordnenZeigen(a);
    else if (typ === "rede") redeZeigen(a);
    else woerterZeigen(a);
  }

  function geschafft(text) {
    hinweis(text, "gut");
    $("pruefen").classList.add("versteckt");
    $("weiter").classList.remove("versteckt");
    $("weiter").textContent = zustand.index + 1 < zustand.aufgaben.length ? "Nächste Aufgabe" : "Fertig";
    $("weiter").focus({ preventScroll: true });
  }

  function fehlerZaehlen() {
    zustand.fehlerAktuell++;
    zustand.fehlerGesamt++;
  }

  // ---------- Raum 1: Geschichten ordnen ----------

  function ordnenZeigen(a) {
    $("aufgabe-titel").textContent = a.titel;
    $("auftrag").textContent = "Klicke die Sätze in der richtigen Reihenfolge an. Ein Klick auf einen eingesetzten Satz legt ihn zurück.";
    const n = a.saetze.length;
    zustand.plaetze = new Array(n).fill(null); // Index des Satzes je Platz
    zustand.gesperrt = new Array(n).fill(false);
    zustand.markierung = new Array(n).fill(null); // false = nach dem Prüfen falsch
    zustand.stapel = K.mischen(a.saetze.map(function (_, i) { return i; }));
    // Nicht schon richtig gemischt anzeigen
    if (zustand.stapel.every(function (v, i) { return v === i; })) zustand.stapel.reverse();
    ordnenZeichnen();
  }

  function etikett(i, n) {
    if (i === 0) return "Einleitung";
    if (i === n - 1) return "Schluss";
    return "Hauptteil";
  }

  function ordnenZeichnen() {
    const markierung = zustand.markierung;
    const a = zustand.aufgaben[zustand.index];
    const n = a.saetze.length;
    let html = '<div class="ordnen"><div><h3>Satzkarten</h3><div class="stapel" id="stapel"></div></div>' +
      '<div><h3>Deine Geschichte</h3><div class="plaetze" id="plaetze"></div></div></div>';
    $("inhalt").innerHTML = html;

    zustand.stapel.forEach(function (satzIndex) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "satzkarte";
      b.textContent = a.saetze[satzIndex];
      b.addEventListener("click", function () {
        const frei = zustand.plaetze.indexOf(null);
        if (frei < 0) return;
        zustand.plaetze[frei] = satzIndex;
        zustand.markierung[frei] = null;
        zustand.stapel = zustand.stapel.filter(function (v) { return v !== satzIndex; });
        ordnenZeichnen();
      });
      $("stapel").appendChild(b);
    });

    for (let i = 0; i < n; i++) {
      const platz = document.createElement("div");
      platz.className = "platz";
      platz.innerHTML = '<span class="etikett">' + (i + 1) + ". " + etikett(i, n) + "</span>";
      const satzIndex = zustand.plaetze[i];
      if (satzIndex === null) {
        const leer = document.createElement("div");
        leer.className = "leer";
        leer.textContent = "Satz " + (i + 1);
        platz.appendChild(leer);
      } else {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "satzkarte";
        b.textContent = a.saetze[satzIndex];
        if (zustand.gesperrt[i]) {
          b.classList.add("richtig");
          b.disabled = true;
        } else {
          if (markierung && markierung[i] === false) b.classList.add("falsch");
          b.addEventListener("click", function () {
            zustand.plaetze[i] = null;
            zustand.markierung[i] = null;
            zustand.stapel.push(satzIndex);
            ordnenZeichnen();
          });
        }
        platz.appendChild(b);
      }
      $("plaetze").appendChild(platz);
    }
    const voll = zustand.plaetze.indexOf(null) < 0;
    const fertig = zustand.gesperrt.every(Boolean);
    $("pruefen").classList.toggle("versteckt", !voll || fertig);
  }

  function ordnenPruefen() {
    const markierung = zustand.plaetze.map(function (satzIndex, i) { return satzIndex === i; });
    if (markierung.every(Boolean)) {
      zustand.gesperrt = zustand.gesperrt.map(function () { return true; });
      ordnenZeichnen();
      geschafft(zustand.fehlerAktuell === 0 ? "Perfekt! Die Geschichte stimmt." : "Geschafft! Jetzt ist die Reihenfolge richtig.");
      return;
    }
    fehlerZaehlen();
    // Richtige Plätze festhalten, falsche bleiben rot zum Ändern
    markierung.forEach(function (ok, i) { if (ok) zustand.gesperrt[i] = true; });
    zustand.markierung = markierung;
    ordnenZeichnen();
    const anzahl = markierung.filter(function (ok) { return !ok; }).length;
    hinweis(anzahl + (anzahl === 1 ? " Satz steht" : " Sätze stehen") + " noch nicht richtig (rot). Klicke sie an und setze sie neu ein." +
      (zustand.fehlerAktuell >= 2 ? " " + zustand.raum.tipp : ""));
  }

  // ---------- Raum 2: Wörtliche Rede ----------

  function redeTeile(satz) {
    // "Mia sagt{:} {„}Hallo{.}{“}" -> [{text:"Mia sagt"}, {luecke:":"}, ...]
    const teile = [];
    satz.split(/(\{[^}]*\})/).forEach(function (t) {
      if (!t) return;
      if (t.charAt(0) === "{") teile.push({ luecke: t.slice(1, -1) });
      else teile.push({ text: t });
    });
    return teile;
  }

  function redeZeigen(a) {
    $("aufgabe-titel").textContent = "Satzzeichen setzen";
    $("auftrag").textContent = "Klicke auf ein leeres Kästchen und wähle unten das passende Satzzeichen.";
    zustand.teile = redeTeile(a.satz);
    zustand.eingaben = [];
    zustand.aktiv = 0;
    zustand.richtigeLuecken = [];
    let html = '<p class="rede-satz">';
    let nr = 0;
    zustand.teile.forEach(function (t) {
      if (t.text !== undefined) html += escape(t.text);
      else {
        html += '<button type="button" class="luecke" data-nr="' + nr + '" aria-label="Lücke ' + (nr + 1) + '"></button>';
        zustand.eingaben.push("");
        nr++;
      }
    });
    html += '</p><div class="zeichen-leiste" role="group" aria-label="Satzzeichen">';
    zustand.raum.zeichen.forEach(function (z) {
      html += '<button type="button" class="zeichen-knopf" data-zeichen="' + escape(z) + '">' + escape(z) + "</button>";
    });
    html += "</div>";
    $("inhalt").innerHTML = html;

    $("inhalt").querySelectorAll(".luecke").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.classList.contains("richtig")) return;
        zustand.aktiv = Number(b.dataset.nr);
        redeAktualisieren();
      });
    });
    $("inhalt").querySelectorAll(".zeichen-knopf").forEach(function (b) {
      b.addEventListener("click", function () { zeichenSetzen(b.dataset.zeichen); });
    });
    redeAktualisieren();
  }

  function luecken() { return Array.prototype.slice.call(document.querySelectorAll(".luecke")); }

  function redeAktualisieren() {
    luecken().forEach(function (b, i) {
      b.textContent = zustand.eingaben[i];
      b.classList.toggle("aktiv", i === zustand.aktiv);
    });
    $("pruefen").classList.toggle("versteckt", zustand.eingaben.indexOf("") >= 0);
  }

  function zeichenSetzen(z) {
    if (zustand.aktiv < 0) return;
    const b = luecken()[zustand.aktiv];
    b.classList.remove("falsch");
    zustand.eingaben[zustand.aktiv] = z;
    // zur nächsten offenen Lücke springen
    const alle = luecken();
    let naechste = -1;
    for (let k = 1; k <= alle.length; k++) {
      const i = (zustand.aktiv + k) % alle.length;
      if (!alle[i].classList.contains("richtig") && zustand.eingaben[i] === "") { naechste = i; break; }
    }
    zustand.aktiv = naechste;
    redeAktualisieren();
  }

  function redePruefen() {
    const soll = zustand.teile.filter(function (t) { return t.luecke !== undefined; }).map(function (t) { return t.luecke; });
    let alleRichtig = true;
    luecken().forEach(function (b, i) {
      if (zustand.eingaben[i] === soll[i]) {
        b.classList.add("richtig");
        b.classList.remove("falsch", "aktiv");
      } else {
        alleRichtig = false;
        b.classList.add("falsch");
        zustand.eingaben[i] = "";
      }
    });
    if (alleRichtig) {
      zustand.aktiv = -1;
      document.querySelectorAll(".zeichen-knopf").forEach(function (b) { b.disabled = true; });
      geschafft(zustand.fehlerAktuell === 0 ? "Super, alle Zeichen stimmen!" : "Richtig! Jetzt stimmt der Satz.");
      return;
    }
    fehlerZaehlen();
    zustand.aktiv = zustand.eingaben.indexOf("");
    redeAktualisieren();
    luecken().forEach(function (b, i) { if (zustand.eingaben[i] === "" && !b.classList.contains("richtig")) b.classList.add("falsch"); });
    if (zustand.fehlerAktuell === 1) hinweis("Die roten Kästchen stimmen noch nicht. Tipp: " + zustand.raum.tipp);
    else {
      // Lösung zeigen
      luecken().forEach(function (b, i) {
        zustand.eingaben[i] = soll[i];
        b.textContent = soll[i];
        b.classList.remove("falsch", "aktiv");
        b.classList.add("richtig");
      });
      zustand.aktiv = -1;
      document.querySelectorAll(".zeichen-knopf").forEach(function (b) { b.disabled = true; });
      $("pruefen").classList.add("versteckt");
      geschafft("So ist es richtig. Schau dir die Satzzeichen genau an.");
      $("hinweis").className = "hinweis erklaerung";
    }
  }

  // ---------- Raum 3: Treffende Wörter ----------

  function woerterZeigen(a) {
    $("aufgabe-titel").textContent = "Welches Wort passt besser?";
    $("auftrag").textContent = "Das durchgestrichene Wort ist langweilig. Wähle ein Wort, das genau passt.";
    const treffer = a.satz.match(/^(.*)\[(.+?)\](.*)$/);
    const vor = treffer[1], alt = treffer[2], nach = treffer[3];
    const richtig = a.optionen[0];
    let html = '<p class="wort-satz">' + escape(vor) + '<span class="alt">' + escape(alt) + '</span> <span class="neu" id="neu">?</span>' +
      escape(nach) + '</p><div class="optionen">';
    K.mischen(a.optionen).forEach(function (o) {
      html += '<button type="button" class="option" data-wort="' + escape(o) + '">' + escape(o) + "</button>";
    });
    html += "</div>";
    $("inhalt").innerHTML = html;
    $("inhalt").querySelectorAll(".option").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.wort === richtig) {
          b.classList.add("richtig");
          $("neu").textContent = richtig;
          document.querySelectorAll(".option").forEach(function (x) { x.disabled = true; });
          geschafft(zustand.fehlerAktuell === 0 ? "Genau! Das Wort passt perfekt." : "Richtig! Jetzt passt der Satz.");
          return;
        }
        fehlerZaehlen();
        b.classList.add("falsch");
        b.disabled = true;
        hinweis("„" + b.dataset.wort + "“ passt hier nicht. " + zustand.raum.tipp);
      });
    });
  }

  // ---------- Ablauf ----------

  $("pruefen").addEventListener("click", function () {
    if (zustand.raum.typ === "reihenfolge") ordnenPruefen();
    else if (zustand.raum.typ === "rede") redePruefen();
  });

  $("weiter").addEventListener("click", function () {
    zustand.index++;
    if (zustand.index >= zustand.aufgaben.length) rundeBeenden();
    else aufgabeZeigen();
  });

  $("tipp-knopf").addEventListener("click", function () {
    if (zustand) hinweis(zustand.raum.tipp, "erklaerung");
  });

  function rundeBeenden() {
    const f = zustand.fehlerGesamt;
    const sterne = f === 0 ? 3 : f <= 2 ? 2 : 1;
    const vorher = K.sterneLesen(SPIEL_ID, klasse, zustand.raum.nummer);
    K.sterneSpeichern(SPIEL_ID, klasse, zustand.raum.nummer, sterne);
    $("aufgabe").classList.add("versteckt");
    $("ergebnis").classList.remove("versteckt");
    $("ergebnis-sterne").innerHTML = K.sterneHtml(sterne);
    $("ergebnis-titel").textContent = sterne === 3 ? "Meisterhaft!" : sterne === 2 ? "Sehr gut gemacht!" : "Geschafft!";
    let text = f === 0 ? "Alles beim ersten Versuch richtig." : "Du hast alle Aufgaben gelöst. Fehlversuche: " + f + ".";
    if (vorher > 0 && sterne > vorher) text += " Neuer Rekord!";
    $("ergebnis-text").textContent = text;
    $("nochmal").focus();
  }

  $("nochmal").addEventListener("click", function () { raumStarten(zustand.raum); });
  $("andere").addEventListener("click", raumwahlZeigen);
  $("zur-wahl").addEventListener("click", raumwahlZeigen);

  raumwahlZeigen();
})();
