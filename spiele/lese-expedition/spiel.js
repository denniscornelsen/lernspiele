/*
 * Lese-Expedition
 * Texte und Fragen kommen aus inhalte/deutsch/klasse-N/lese-expedition.json.
 * Fragetypen: "auswahl" (eine richtige Antwort), "richtigfalsch",
 * "finden" (den passenden Satz im Text anklicken).
 */
(async function () {
  "use strict";

  const K = window.Knobelkiste;
  const SPIEL_ID = "lese-expedition";
  const klasse = Number(K.parameter("klasse", "4"));
  const $ = function (id) { return document.getElementById(id); };

  $("start-link").href = "../../index.html#klasse-" + klasse;
  $("arbeitsblatt-link").href = "arbeitsblatt.html?klasse=" + klasse;

  let daten;
  try {
    daten = await K.ladeJSON("inhalte/deutsch/klasse-" + klasse + "/lese-expedition.json");
  } catch (e) {
    $("karte").classList.add("versteckt");
    $("fehlermeldung").textContent = "Für Klasse " + klasse + " gibt es dieses Spiel noch nicht.";
    $("fehlermeldung").classList.remove("versteckt");
    return;
  }
  const stationen = daten.stationen;

  K.vorlesenPruefen(function (ok) { $("vorlesen").classList.toggle("versteckt", !ok); });

  function escape(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ---------- Landkarte ----------

  const ORTE = {
    Wald: "#2e8b3e", Fluss: "#2f6fd6", Dorf: "#b85a17",
    Berge: "#6b6b75", Meer: "#169c9c", Stadt: "#8a4fbf"
  };

  function positionen(anzahl) {
    const liste = [];
    for (let i = 0; i < anzahl; i++) {
      const x = 70 + i * (660 / Math.max(1, anzahl - 1));
      const y = i % 2 === 0 ? 205 : 105;
      liste.push({ x: x, y: y });
    }
    return liste;
  }

  function naechsteOffene() {
    const s = stationen.find(function (st) { return K.sterneLesen(SPIEL_ID, klasse, st.nummer) === 0; });
    return s || null;
  }

  function karteZeigen() {
    zustand = null;
    $("station").classList.add("versteckt");
    $("ergebnis").classList.add("versteckt");
    $("karte").classList.remove("versteckt");

    const pos = positionen(stationen.length);
    const ziel = naechsteOffene();
    let weg = "M " + pos[0].x + " " + pos[0].y;
    for (let i = 1; i < pos.length; i++) {
      const mx = (pos[i - 1].x + pos[i].x) / 2;
      weg += " C " + mx + " " + pos[i - 1].y + ", " + mx + " " + pos[i].y + ", " + pos[i].x + " " + pos[i].y;
    }

    let svg = '<svg viewBox="0 0 800 300" role="group" aria-label="Landkarte der Expedition">' +
      '<path d="' + weg + '" fill="none" stroke="#c9b48a" stroke-width="14" stroke-linecap="round"/>' +
      '<path d="' + weg + '" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="10 10" stroke-linecap="round"/>';

    stationen.forEach(function (st, i) {
      const p = pos[i];
      const sterne = K.sterneLesen(SPIEL_ID, klasse, st.nummer);
      const farbe = ORTE[st.ort] || "#e07a2f";
      const geschafft = sterne > 0;
      svg += '<g class="station" tabindex="0" role="button" data-nummer="' + st.nummer + '" aria-label="Station ' +
        st.nummer + ": " + escape(st.titel) + (geschafft ? ", " + sterne + " Sterne" : "") + '">' +
        '<circle class="punkt" cx="' + p.x + '" cy="' + p.y + '" r="30" fill="' + (geschafft ? farbe : "#fff") +
        '" stroke="' + farbe + '" stroke-width="5"/>' +
        '<text x="' + p.x + '" y="' + (p.y + 9) + '" text-anchor="middle" font-size="26" font-weight="700" fill="' +
        (geschafft ? "#fff" : farbe) + '">' + (geschafft ? "✓" : st.nummer) + "</text>" +
        '<text x="' + p.x + '" y="' + (p.y + 56) + '" text-anchor="middle" font-size="18" font-weight="700" fill="#2b2b33">' +
        escape(st.ort) + "</text>";
      if (geschafft) {
        let s = "";
        for (let k = 0; k < 3; k++) s += k < sterne ? "★" : "☆";
        svg += '<text x="' + p.x + '" y="' + (p.y - 40) + '" text-anchor="middle" font-size="18" fill="#f2b705">' + s + "</text>";
      }
      if (ziel && ziel.nummer === st.nummer) {
        svg += '<g aria-hidden="true"><line x1="' + (p.x + 22) + '" y1="' + (p.y - 22) + '" x2="' + (p.x + 22) + '" y2="' + (p.y - 72) +
          '" stroke="#5d4037" stroke-width="4"/><path class="fahne" d="M ' + (p.x + 24) + " " + (p.y - 72) + " l 30 10 l -30 10 z\" fill=\"#d33a2c\"/></g>";
      }
      svg += "</g>";
    });
    svg += "</svg>";
    $("landkarte").innerHTML = svg;

    $("landkarte").querySelectorAll(".station").forEach(function (g) {
      const start = function () { stationStarten(Number(g.dataset.nummer)); };
      g.addEventListener("click", start);
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); start(); } });
    });

    // Kacheln als zweite, gut lesbare Auswahl
    const kacheln = $("stationen");
    kacheln.innerHTML = "";
    stationen.forEach(function (st) {
      const k = document.createElement("button");
      k.type = "button";
      k.className = "kachel stations-kachel";
      k.innerHTML = K.sterneHtml(K.sterneLesen(SPIEL_ID, klasse, st.nummer)) +
        '<span class="titel">' + st.nummer + ". " + escape(st.titel) + "</span>" +
        '<span class="info">' + escape(st.art) + " · " + escape(st.ort) + "</span>";
      k.addEventListener("click", function () { stationStarten(st.nummer); });
      kacheln.appendChild(k);
    });
  }

  // ---------- Station ----------

  let zustand = null;

  function stationStarten(nummer) {
    const st = stationen.find(function (s) { return s.nummer === nummer; });
    zustand = { station: st, frage: 0, fehlerGesamt: 0, fehlerAktuell: 0, fertig: false };

    $("karte").classList.add("versteckt");
    $("ergebnis").classList.add("versteckt");
    $("station").classList.remove("versteckt");
    $("station-name").textContent = "Station " + st.nummer + " · " + st.ort;
    $("text-titel").textContent = st.titel;
    $("text-art").textContent = st.art;
    $("text-art").className = "art" + (st.art === "Geschichte" ? " geschichte" : "");

    // Text in Absätze und anklickbare Sätze zerlegen
    let html = "";
    st.absaetze.forEach(function (absatz, a) {
      html += '<p data-absatz="' + a + '">';
      window.LeseText.saetze(absatz).forEach(function (satz) {
        html += '<span class="satz">' + escape(satz) + "</span> ";
      });
      html += "</p>";
    });
    $("text-absaetze").innerHTML = html;
    $("text-absaetze").querySelectorAll(".satz").forEach(function (span) {
      span.addEventListener("click", function () { satzGeklickt(span); });
    });

    frageZeigen();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function aktuelleFrage() { return zustand.station.fragen[zustand.frage]; }

  function frageText(f) {
    if (f.typ === "richtigfalsch") return "Stimmt das? „" + f.aussage + "“";
    if (f.typ === "finden") return f.auftrag;
    return f.frage;
  }

  function markierungenLoeschen() {
    document.querySelectorAll(".lesetext p.markiert").forEach(function (p) { p.classList.remove("markiert"); });
    document.querySelectorAll(".satz.falsch, .satz.richtig").forEach(function (s) { s.classList.remove("falsch", "richtig"); });
  }

  function frageZeigen() {
    const f = aktuelleFrage();
    zustand.fehlerAktuell = 0;
    zustand.fertig = false;
    markierungenLoeschen();
    $("hinweis").classList.add("versteckt");
    $("weiter").classList.add("versteckt");
    $("fragen-fortschritt").textContent = "Frage " + (zustand.frage + 1) + " von " + zustand.station.fragen.length;
    $("frage").textContent = frageText(f);

    const antworten = $("antworten");
    antworten.innerHTML = "";
    antworten.className = "antworten";
    $("lesetext").classList.toggle("finden-modus", f.typ === "finden");

    if (f.typ === "finden") {
      antworten.innerHTML = '<p class="finden-info">Klicke im Text auf den richtigen Satz.</p>';
      return;
    }
    let optionen;
    if (f.typ === "richtigfalsch") {
      antworten.classList.add("zwei");
      optionen = [{ text: "Richtig", wert: true }, { text: "Falsch", wert: false }];
    } else {
      optionen = f.antworten.map(function (t, i) { return { text: t, wert: i }; });
    }
    optionen.forEach(function (o) {
      const knopf = document.createElement("button");
      knopf.type = "button";
      knopf.className = "antwort";
      knopf.textContent = o.text;
      knopf.addEventListener("click", function () { antworten_(o.wert, knopf); });
      antworten.appendChild(knopf);
    });
  }

  function istRichtig(f, wert) {
    return wert === f.richtig;
  }

  function richtigeAntwortText(f) {
    if (f.typ === "richtigfalsch") return f.richtig ? "Die Aussage stimmt." : "Die Aussage stimmt nicht.";
    if (f.typ === "auswahl") return "Richtig ist: „" + f.antworten[f.richtig] + "“";
    return "Der richtige Satz ist jetzt grün markiert.";
  }

  function absatzMarkieren(f) {
    const p = document.querySelector('.lesetext p[data-absatz="' + f.absatz + '"]');
    if (p) {
      p.classList.add("markiert");
      p.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function richtigerSatz(f) {
    const p = document.querySelector('.lesetext p[data-absatz="' + f.absatz + '"]');
    const saetze = p ? p.querySelectorAll(".satz") : [];
    for (let i = 0; i < saetze.length; i++) {
      if (saetze[i].textContent.indexOf(f.loesung) >= 0) return saetze[i];
    }
    return null;
  }

  function erfolg(text) {
    zustand.fertig = true;
    $("lesetext").classList.remove("finden-modus");
    const hinweis = $("hinweis");
    hinweis.className = "hinweis erklaerung";
    hinweis.textContent = text;
    $("weiter").classList.remove("versteckt");
    $("weiter").textContent = zustand.frage + 1 < zustand.station.fragen.length ? "Nächste Frage" : "Station abschließen";
    $("weiter").focus({ preventScroll: true });
  }

  function fehler(f) {
    zustand.fehlerAktuell++;
    zustand.fehlerGesamt++;
    const hinweis = $("hinweis");
    if (zustand.fehlerAktuell === 1) {
      hinweis.className = "hinweis";
      hinweis.textContent = "Noch nicht. Lies den gelb markierten Absatz noch einmal genau.";
      absatzMarkieren(f);
      return false;
    }
    // Zweiter Fehler: Lösung zeigen
    if (f.typ === "finden") {
      const s = richtigerSatz(f);
      if (s) s.classList.add("richtig");
    } else {
      document.querySelectorAll(".antwort").forEach(function (b, i) {
        const wert = f.typ === "richtigfalsch" ? i === 0 : i;
        if (istRichtig(f, wert)) b.classList.add("richtig");
        b.disabled = true;
      });
    }
    erfolg(richtigeAntwortText(f) + " Beim nächsten Mal klappt es bestimmt.");
    return true;
  }

  function antworten_(wert, knopf) {
    if (!zustand || zustand.fertig) return;
    const f = aktuelleFrage();
    if (istRichtig(f, wert)) {
      knopf.classList.add("richtig");
      document.querySelectorAll(".antwort").forEach(function (b) { b.disabled = true; });
      erfolg(zustand.fehlerAktuell === 0 ? "Super, richtig!" : "Richtig! Gut nachgelesen.");
      return;
    }
    knopf.classList.remove("falsch");
    void knopf.offsetWidth;
    knopf.classList.add("falsch");
    knopf.disabled = true;
    fehler(f);
  }

  function satzGeklickt(span) {
    if (!zustand || zustand.fertig) return;
    const f = aktuelleFrage();
    if (f.typ !== "finden") return;
    if (span === richtigerSatz(f)) {
      markierungenLoeschen();
      span.classList.add("richtig");
      erfolg(zustand.fehlerAktuell === 0 ? "Super, genau dieser Satz!" : "Richtig! Gut gesucht.");
      return;
    }
    span.classList.add("falsch");
    fehler(f);
  }

  $("weiter").addEventListener("click", function () {
    zustand.frage++;
    if (zustand.frage >= zustand.station.fragen.length) stationBeenden();
    else frageZeigen();
  });

  function stationBeenden() {
    const st = zustand.station;
    const f = zustand.fehlerGesamt;
    const sterne = f === 0 ? 3 : f <= 2 ? 2 : 1;
    const vorher = K.sterneLesen(SPIEL_ID, klasse, st.nummer);
    K.sterneSpeichern(SPIEL_ID, klasse, st.nummer, sterne);

    $("station").classList.add("versteckt");
    $("ergebnis").classList.remove("versteckt");
    $("ergebnis-sterne").innerHTML = K.sterneHtml(sterne);
    $("ergebnis-titel").textContent = "Station " + st.ort + " geschafft!";
    let text = f === 0 ? "Alle Fragen gleich beim ersten Mal richtig. Du bist ein Lese-Profi!"
      : "Du hast alle Fragen gelöst. Fehlversuche: " + f + ".";
    if (vorher > 0 && sterne > vorher) text += " Neuer Rekord!";
    $("ergebnis-text").textContent = text;

    const naechste = stationen.find(function (s) { return s.nummer === st.nummer + 1; });
    $("naechste").classList.toggle("versteckt", !naechste);
    $("naechste").onclick = naechste ? function () { stationStarten(naechste.nummer); } : null;
    (naechste ? $("naechste") : $("zurueck-karte")).focus();
  }

  $("zur-karte").addEventListener("click", karteZeigen);
  $("zurueck-karte").addEventListener("click", karteZeigen);
  $("vorlesen").addEventListener("click", function () {
    if (zustand) K.vorlesen($("frage").textContent);
  });

  karteZeigen();
})();
