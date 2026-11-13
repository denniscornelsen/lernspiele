/*
 * Arbeitsblatt zur Lese-Expedition: Text einer Station mit Fragen.
 * Nutzt dieselbe Datendatei wie das Spiel.
 */
(async function () {
  "use strict";

  const K = window.Knobelkiste;
  const $ = function (id) { return document.getElementById(id); };
  const klasse = Number(K.parameter("klasse", "4"));
  $("zurueck-link").href = "index.html?klasse=" + klasse;

  let daten;
  try {
    daten = await K.ladeJSON("inhalte/deutsch/klasse-" + klasse + "/lese-expedition.json");
  } catch (e) {
    $("blatt").textContent = "Für Klasse " + klasse + " gibt es dieses Arbeitsblatt noch nicht.";
    return;
  }

  function escape(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  daten.stationen.forEach(function (st) {
    const opt = document.createElement("option");
    opt.value = st.nummer;
    opt.textContent = st.nummer + ". " + st.titel + " (" + st.ort + ")";
    $("station").appendChild(opt);
  });
  $("station").value = K.parameter("station", String(daten.stationen[0].nummer));
  if (!$("station").value) $("station").value = String(daten.stationen[0].nummer);
  $("loesung").checked = K.parameter("loesung", "0") === "1";

  function kaestchen(optionen, richtig, loesung) {
    return '<ul class="kaestchen-liste">' + optionen.map(function (t, i) {
      return "<li" + (loesung && i === richtig ? ' class="angekreuzt"' : "") + ">" + escape(t) + "</li>";
    }).join("") + "</ul>";
  }

  function zeichnen() {
    const nummer = Number($("station").value);
    const loesung = $("loesung").checked;
    const st = daten.stationen.find(function (s) { return s.nummer === nummer; });
    history.replaceState(null, "", "?klasse=" + klasse + "&station=" + nummer + (loesung ? "&loesung=1" : ""));

    // Lösungssätze für "finden"-Fragen
    const loesungsTexte = st.fragen.filter(function (f) { return f.typ === "finden"; }).map(function (f) { return f.loesung; });

    let text = "";
    st.absaetze.forEach(function (absatz, a) {
      const saetze = window.LeseText.saetze(absatz).map(function (satz) {
        const markieren = loesung && loesungsTexte.some(function (l) { return satz.indexOf(l) >= 0; });
        return markieren ? '<span class="loesung-satz">' + escape(satz) + "</span>" : escape(satz);
      });
      text += '<p><span class="zeilen-nr">' + (a + 1) + "</span><span>" + saetze.join(" ") + "</span></p>";
    });

    let fragen = '<ol class="fragen-liste">';
    st.fragen.forEach(function (f) {
      fragen += "<li>";
      if (f.typ === "auswahl") {
        fragen += '<div class="frage-text">' + escape(f.frage) + " Kreuze an.</div>" + kaestchen(f.antworten, f.richtig, loesung);
      } else if (f.typ === "richtigfalsch") {
        fragen += '<div class="frage-text">Stimmt das? „' + escape(f.aussage) + "“</div>" +
          kaestchen(["richtig", "falsch"], f.richtig ? 0 : 1, loesung);
      } else if (f.typ === "finden") {
        fragen += '<div class="frage-text">' + escape(f.auftrag) + " Unterstreiche ihn im Text.</div>";
      }
      fragen += "</li>";
    });
    if (st.schreibaufgabe) {
      fragen += '<li><div class="frage-text">' + escape(st.schreibaufgabe) + "</div>" +
        (loesung ? '<p class="loesung-text">Eigene Antwort. Achte auf ganze Sätze und Großschreibung.</p>'
          : '<div class="schreib-linien"><div></div><div></div><div></div><div></div></div>') + "</li>";
    }
    fragen += "</ol>";

    $("blatt").innerHTML =
      '<header class="blatt-kopf"><div><h1>Lese-Expedition</h1>' +
      (loesung ? '<span class="loesung-stempel">Lösung</span>' : "") + "</div>" +
      '<div class="klein">Knobelkiste · Deutsch Klasse ' + klasse + "<br>Station " + st.nummer + ": " + escape(st.ort) + "</div></header>" +
      (loesung ? "" : '<div class="name-zeile"><span>Name:</span><span>Datum:</span></div>') +
      '<section class="lese-text"><span class="art-text">' + escape(st.art) + "</span><h2>" + escape(st.titel) + "</h2>" + text + "</section>" +
      '<section class="aufgabe"><h2>Lies den Text genau und beantworte die Fragen.</h2>' + fragen + "</section>";
  }

  $("station").addEventListener("change", zeichnen);
  $("loesung").addEventListener("change", zeichnen);
  $("drucken").addEventListener("click", function () { window.print(); });
  zeichnen();
})();
